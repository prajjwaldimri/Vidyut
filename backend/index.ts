import Swarm from "discovery-swarm";
import defaults from "dat-swarm-defaults";
import getPort from "get-port";

import { CLI } from "cliffy";
import Table from "cli-table3";

import { MessageReceiver, MessageSender, MessageType } from "./comm";
import { Chain } from "./chain";
import Wallet from "./wallet";

const chain = new Chain();
const wallet = new Wallet();

(async () => {
  const peers = {};
  let connSeq = 0;
  let channel = "Vidyut";

  const myPeerId = wallet.publicKey;

  const messageSender = new MessageSender(peers, myPeerId);
  const messageReceiver = new MessageReceiver(peers, myPeerId, chain, wallet);

  const config = defaults({ id: myPeerId });
  const swarm = Swarm(config);
  const port = await getPort();

  swarm.listen(port);

  swarm.join(channel, { announce: true });

  swarm.on("connection", (conn, info) => {
    const seq = connSeq;
    const peerId = info.id;
    if (info.initiator) {
      try {
        conn.setKeepAlive(true, 600);
      } catch (exception) {
        console.log("Error", exception);
      }
    }

    if (!peers[peerId]) {
      peers[peerId] = { conn, seq, isActive: true };
      connSeq++;
    }

    conn.on("data", (data: string) => {
      messageReceiver.process(JSON.parse(data));
    });

    conn.on("close", () => {
      if (peers[peerId] && peers[peerId].seq === seq) {
        peers[peerId].isActive = false;
      }
    });
  });

  swarm.on("peer-banned", () => {
    console.log("Banned");
  });

  swarm.on("peer-rejected", () => {
    console.log("Rejected");
  });

  const cli = new CLI()
    .setDelimiter(">")
    .addCommand("list", {
      options: [{ label: "peers", description: "Lists all the peers" }],
      action: (params, options) => {
        if (options.peers) {
          const peerTable = new Table({
            head: ["Sequence Number", "Address", "Is Peer Active?"],
          });
          for (const peer in peers) {
            peerTable.push([
              `${peers[peer].seq}`,
              `${peer}`,
              `${peers[peer].isActive}`,
            ]);
          }
          console.log(peerTable.toString());
          return;
        }

        console.log("Use list --help to get all the options");
      },
    })
    .addCommand("show", {
      options: [
        { label: "walletKey", description: "Your public key / wallet address" },
        {
          label: "latestBlock",
          description: "The last/latest block in the local chain",
        },
      ],
      action: (params, options) => {
        if (options.walletKey) {
          console.log(wallet.publicKey);
          return;
        } else if (options.latestBlock) {
          console.log(chain.blocks[chain.blocks.length - 1]);
          return;
        }

        console.log("Use show --help to get all the options");
      },
      subcommands: {
        block: {
          description: "Shows a block with a provided index number",
          parameters: ["index"],
          action: (params) => console.log(chain.blocks[params.index]),
        },
      },
    })
    .show();
})();
