import hyperswarm from "hyperswarm";
import crypto from "crypto";
import { Socket } from "net";

import { CLI } from "cliffy";
import Table from "cli-table3";

import generate from "nanoid-generate/nolookalikes";

import { MessageReceiver, MessageSender, MessageType } from "./comm";
import { Chain } from "./chain";
import Wallet from "./wallet";
import Peer from "./comm/peer";

const chain = new Chain();
const wallet = new Wallet();

(async () => {
  const peers: { string: Peer } | {} = {};

  const myPeerId = generate(21);

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

  swarm.on("disconnection", (socket: Socket, info) => {});

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
