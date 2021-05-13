import hyperswarm from "hyperswarm";
import crypto from "crypto";
import { Socket } from "net";

import Koa from "koa";
import serve from "koa-static";
const app = new Koa();

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

  setInterval(() => {
    const random = Math.random() * (100 - 1) + 1;

    if (chain.validators.length < 1) {
      console.log("Validators less than 1.");
      return;
    }

    if (random < 10) {
      // Sync with other blockchains
      const randomValidatorIndex = Math.floor(
        Math.random() * chain.validators.length
      );
      if (myPeerId === chain.validators[randomValidatorIndex].address) {
        console.log("Sync encountered same destination and source address");
        return;
      }
      console.log(
        `Syncing chain with ${chain.validators[randomValidatorIndex].address}`
      );
      messageSender.sendSyncToPeer(
        chain.validators[randomValidatorIndex].address
      );
    } else if (random < 20) {
      // Send a validation request
    } else if (random < 30) {
      // Send a buy Request
    } else {
      console.log("Waiting this cycle.");
    }
  }, 5000);

  app.use(serve("public"));

  app.listen(3000);
})();

process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception", err.stack);
});
