import hyperswarm from "hyperswarm";
import crypto from "crypto";
import { Socket } from "net";

import { CLI } from "cliffy";
import Table from "cli-table3";

import { MessageReceiver, MessageSender, MessageType, Peer } from "./comm";
import { Chain } from "./chain";
import Wallet from "./wallet";

let chain: Chain = new Chain();
let wallet: Wallet;

import Conf from "conf";
import db from "./db";
const configName = process.argv.slice(2)[0];
const config = new Conf({ configName });

if (config.has("privateKey")) {
  wallet = new Wallet(config.get("privateKey") as string);
} else {
  wallet = new Wallet();
  config.set("privateKey", wallet.getSecret());
}

(async () => {
  const peers: { string: Peer } | {} = {};

  let myPeerId = wallet.publicKey;

  // chain.validatorAddress = myPeerId;

  try {
    let valueBlocks = await db.get("blocks");
    chain.blocks = JSON.parse(valueBlocks.toString());

    let valueValidators = await db.get("validators");
    chain.validators = JSON.parse(valueValidators.toString());
  } catch (err) {
    await db.put("blocks", JSON.stringify(chain.blocks));
    await db.put("validators", JSON.stringify(chain.validators));
  }

  const messageSender = new MessageSender(peers, myPeerId, chain, wallet);
  const messageReceiver = new MessageReceiver(
    peers,
    myPeerId,
    chain,
    wallet,
    messageSender
  );

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
      options: [
        { label: "peers", description: "Lists all the peers" },
        { label: "validators", description: "Lists all the validators" },
      ],
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
        } else if (options.validators) {
          const validatorTable = new Table({
            head: ["Address", "Energy Capacity", "Energy Rate", "Approved by"],
          });
          for (const validator of chain.validators) {
            validatorTable.push([
              `${validator.address}`,
              `${validator.energyCapacity}`,
              `${validator.energyRate}`,
              `${validator.approvedBy}`,
            ]);
          }
          console.log(validatorTable.toString());
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
          const blockTable = new Table();
          const block = chain.blocks[chain.blocks.length - 1];

          blockTable.push(
            { Index: block.index },
            { Creator: block.creator },
            { Validator: block.validator },
            { Type: block.body.type },
            { Hash: block.hash },
            { BodyHash: block.header.bodyHash },
            { PrevBlockHash: block.header.prevBlockHash }
          );

          console.log(blockTable.toString());
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
            let foundPeer: any = findPeerId(params.seq);

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
        validatorApproval: {
          description: "Sends a request to become validator",
          action: () => {
            messageSender.sendReputationInfoToValidator();
          },
        },
        buyRequest: {
          description: "Request to buy electricity from a seller.",
          parameters: ["seq", "amount", "rate"],
          action: (params) => {
            let foundPeer: any = findPeerId(params.seq);

            if (foundPeer) {
              messageSender.sendBuyElectricityRequest(
                foundPeer,
                Number.parseFloat(params.amount),
                Number.parseFloat(params.rate)
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
    .addCommand("sync", {
      description: "Syncs chains and validators",
      action: () => {
        messageSender.sendSyncToPeer(chain.validators[0].address);
      },
    })
    .show();

  function findPeerId(seq: string) {
    for (const peer in peers) {
      if (peers[peer].seq == seq) {
        return peer;
      }
    }
    return null;
  }
})();

process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception", err.stack);
});
