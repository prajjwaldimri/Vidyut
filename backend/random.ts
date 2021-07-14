import hyperswarm from "hyperswarm";
import crypto from "crypto";
import { Socket } from "net";
import getPort from "get-port";

import Koa from "koa";
import serve from "koa-static";
import Router from "@koa/router";
const app = new Koa();
const router = new Router();

import { MessageReceiver, MessageSender, MessageType, Peer } from "./comm";
import { Chain } from "./chain";
import Wallet from "./wallet";
import bus from "./eventBus";

let chain: Chain = new Chain();
let wallet: Wallet;

import Conf from "conf";
import db from "./db";
import { BlockBodyContract } from "./block/blockBody";
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
    if (configName === "peer1") {
      chain.validators = chain.validators.slice(0, 1);
      chain.blocks = chain.blocks.slice(0, 1);
      console.log(
        `Master peer starting with ${chain.blocks.length} block and ${chain.validators.length} validator`
      );
    }
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

  const labels = [
    "Average Sync Time",
    "Average Block Validation Time",
    "Average Block Addition Time",
  ];

  let data = [0, 0, 0];

  let timeStartSync: number;
  let timeStartValidation: number | null;
  let timeStartAddition: number | null;
  let syncTimes: number[] = [];
  let validationTimes: number[] = [];
  let additionTimes: number[] = [];
  let hasAlreadyBecomeAValidator: boolean = false;
  let isAlreadyEngagedInTask: boolean = false;
  let alreadyEngagedCount: number = 0;
  let isInvalidBuyRequest: boolean = false;

  bus.on("SyncSent", () => {
    timeStartSync = Date.now();
  });

  bus.on("SyncComplete", () => {
    syncTimes.push(Date.now() - timeStartSync);
    data[0] = Number.parseFloat(
      (syncTimes.reduce((a, b) => a + b) / syncTimes.length).toFixed(3)
    );
  });

  bus.on("ValidationRequestSent", () => {
    timeStartValidation = Date.now();
  });

  bus.on("ValidationRequestComplete", () => {
    if (!timeStartValidation) return;
    if (hasAlreadyBecomeAValidator) return;
    validationTimes.push(Date.now() - timeStartValidation);
    data[1] = Number.parseFloat(
      (
        validationTimes.reduce((a, b) => a + b) / validationTimes.length
      ).toFixed(3)
    );
    hasAlreadyBecomeAValidator = true;
    isAlreadyEngagedInTask = false;
    timeStartValidation = null;
  });

  bus.on("BuyRequestSent", () => {
    if (isInvalidBuyRequest) {
      isInvalidBuyRequest = false;
      return;
    }
    timeStartAddition = Date.now();
    isAlreadyEngagedInTask = true;
  });

  bus.on("BuyRequestInvalid", () => {
    isAlreadyEngagedInTask = false;
    timeStartAddition = null;
    isInvalidBuyRequest = false;
  });

  bus.on("BuyRequestComplete", (contract: BlockBodyContract) => {
    if (!timeStartAddition) {
      isInvalidBuyRequest = false;
      return;
    }

    if (contract && contract.consumer !== wallet.publicKey) {
      isInvalidBuyRequest = false;
      timeStartAddition = null;
      isAlreadyEngagedInTask = false;
      return;
    }

    additionTimes.push(Date.now() - timeStartAddition);
    data[2] = Number.parseFloat(
      (additionTimes.reduce((a, b) => a + b) / additionTimes.length).toFixed(3)
    );
    timeStartAddition = null;
    isAlreadyEngagedInTask = false;
  });

  setInterval(() => {
    console.log(data);
    if (isAlreadyEngagedInTask) {
      alreadyEngagedCount += 1;
      console.log("Already engaged in other task");
      if (alreadyEngagedCount > 10) {
        isAlreadyEngagedInTask = false;
        timeStartAddition = null;
        isInvalidBuyRequest = false;
        alreadyEngagedCount = 0;
      }
      return;
    }

    const random = Math.random() * (100 - 1) + 1;

    if (chain.validators.length < 1) {
      console.log("Validators less than 1.");
      return;
    }

    if (random < 50) {
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
    } else if (random < 75) {
      // Send a validation request
      if (
        chain.validators.some((validator) => validator.address === myPeerId)
      ) {
        console.log("Already a validator");
        return;
      }
      console.log(`Sent a validation request`);
      messageSender.sendReputationInfoToValidator();
    } else if (random < 100 && chain.validators.length > 1) {
      // Send a buy Request
      const randomProducerIndex = Math.floor(
        Math.random() * chain.validators.length
      );
      const selectedValidator = chain.validators[randomProducerIndex];
      if (myPeerId === chain.validators[randomProducerIndex].address) {
        console.log("Buy request not sent to itself");
        return;
      }

      const isRequestValid = Math.floor(Math.random() * 10);
      // Rolls less than 5 then valid
      if (isRequestValid < 5) {
        isInvalidBuyRequest = false;
        console.log(`Sent a valid buy request to ${selectedValidator.address}`);
        messageSender.sendBuyElectricityRequest(
          selectedValidator.address,
          selectedValidator.energyCapacity - 1,
          selectedValidator.energyRate + 1
        );
      } else {
        isInvalidBuyRequest = true;
        console.log(
          `Sent an invalid buy request to ${selectedValidator.address}`
        );
        messageSender.sendBuyElectricityRequest(
          selectedValidator.address,
          selectedValidator.energyCapacity + 1,
          selectedValidator.energyRate - 1
        );
      }
    } else {
      console.log("Waiting this cycle.");
    }
  }, 8000);

  app.use(serve("public"));

  router.get("/data", (ctx, next) => {
    ctx.body = { labels, data };
  });

  app.use(router.routes()).use(router.allowedMethods());
  const port = await getPort();
  console.log(`Listening on ${port}`);
  app.listen(port);
})();

process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception", err);
});
