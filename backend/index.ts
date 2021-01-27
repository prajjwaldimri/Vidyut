import hyperswarm from "hyperswarm";
import crypto from "crypto";
import { Socket } from "net";

import { CLI } from "cliffy";
import Table from "cli-table3";

import generate from "nanoid-generate/nolookalikes";

import Conf from "conf";
const config = new Conf();

import { MessageReceiver, MessageSender, MessageType, Peer } from "./comm";
import { Chain } from "./chain";
import Wallet from "./wallet";

const chain = new Chain();
let wallet: Wallet;

if (config.has("privateKey")) {
  wallet = new Wallet(config.get("privateKey") as string);
} else {
  wallet = new Wallet();
  config.set("privateKey", wallet.getSecret());
}

(async () => {
  const peers: { string: Peer } | {} = {};

  let myPeerId: string;
  if (config.has("myPeerId")) {
    myPeerId = config.get("myPeerId") as string;
  } else {
    myPeerId = generate(21);
    config.set("myPeerId", myPeerId);
  }

  const messageSender = new MessageSender(peers, myPeerId, wallet);
  const messageReceiver = new MessageReceiver(peers, myPeerId, chain, wallet);

  const swarm = hyperswarm({ maxPeers: 1000 });
  const topic = crypto.createHash("sha256").update("Vidyut").digest();

  swarm.join(topic, { lookup: true, announce: true });

  swarm.on("connection", (socket: Socket, info) => {
    messageSender.sendHandshakeToSocket(socket);

    socket.on("data", (data) => {
      messageReceiver.process(JSON.parse(data.toString()), socket);
    });
  });

  swarm.on("peer-rejected", (peer) => {
    console.log("Rejected");
  });

  swarm.on("disconnection", (socket: Socket, info) => {
    console.log("Disconnected");
  });

  const cli = new CLI()
    .setName("Vidyut CLI")
    .setVersion("0.1")
    .setDelimiter(">")
    .addCommand("list", {
      options: [{ label: "peers", description: "Lists all the peers" }],
      action: (params, options) => {
        if (options.peers) {
          const peerTable = new Table({
            head: ["Sequence Number", "Peer ID", "IP Address : PORT"],
          });
          for (const peer in peers) {
            peerTable.push([
              `${peers[peer].seq}`,
              `${peer}`,
              `${peers[peer].host} : ${peers[peer].port}`,
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
        {
          label: "peerId",
          description: "Shows your own peer id",
        },
      ],
      action: (params, options) => {
        if (options.walletKey) {
          console.log(wallet.publicKey);
          return;
        } else if (options.latestBlock) {
          console.log(chain.blocks[chain.blocks.length - 1]);
          return;
        } else if (options.peerId) {
          console.log(myPeerId);
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
    .addCommand("send", {
      action: () => console.log("Use send --help to get all the options"),
      subcommands: {
        message: {
          description: "Sends a message to a peer",
          parameters: ["seq", "msg"],
          action: (params) => {
            let foundPeer: any = null;
            for (const peer in peers) {
              if (peers[peer].seq == params.seq) {
                foundPeer = peer;
              }
            }
            if (foundPeer) {
              messageSender.sendMessageToPeer(
                foundPeer,
                MessageType.TESTING,
                params.msg
              );
            } else {
              console.log(
                "No peer with that sequence number found. Use list @peers to get the list of peers"
              );
            }
          },
        },
      },
    })
    .show();
})();
