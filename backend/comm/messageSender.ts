import { Socket } from "net";
import chalk from "chalk";

import { Message, MessageType, Peer } from ".";
import { BlockBodyContract } from "../block/blockBody";
import { Chain } from "../chain";
import { hashBlockBodyContract } from "../util/hasher";
import Wallet from "../wallet";

import bus from "../eventBus";

export default class MessageSender {
  constructor(
    public peers: { string: Peer } | {},
    private myId: string,
    private chain: Chain,
    private wallet: Wallet
  ) {}

  broadcast(type: MessageType, data: string) {
    for (let id in this.peers) {
      this.sendMessageToPeer(id, type, data);
    }
  }

  sendMessageToPeer(toId: string, type: MessageType, data: string) {
    let message: Message = { to: toId, from: this.myId, type, data };
    this.peers[toId].socket.write(JSON.stringify(message));
    console.log(chalk.green(`Message sent to peer at ${Date.now()}`));
  }

  sendHandshakeToSocket(socket: Socket) {
    let message: Message = {
      to: "",
      from: this.myId,
      type: MessageType.HANDSHAKE,
      data: JSON.stringify({
        localAddress: socket.localAddress,
        localPort: socket.localPort,
        publicKey: this.wallet.publicKey,
      }),
    };
    socket.write(JSON.stringify(message));
  }

  sendReputationInfoToValidator() {
    // Choose a random validator
    const { address: validatorAddress } =
      this.chain.validators[
        Math.floor(Math.random() * this.chain.validators.length)
      ];

    // Send information
    this.sendMessageToPeer(
      validatorAddress,
      MessageType.VALIDATOR_APPROVAL,
      JSON.stringify({
        message: "Replace this data with personally identifiable information",
      })
    );
    console.log(
      chalk.yellowBright(`Validator approval request sent at ${Date.now()}`)
    );
    bus.emit("ValidationRequestSent");
  }

  sendBuyElectricityRequest(toId: string, amount: number, rate: number) {
    const data = new BlockBodyContract(
      toId,
      "",
      this.myId,
      "",
      amount,
      rate,
      false
    );

    data.consumerSign = this.wallet.sign(hashBlockBodyContract(data));

    this.sendMessageToPeer(
      toId,
      MessageType.BUY_ELECTRICITY,
      JSON.stringify(data)
    );
    console.log(chalk.magentaBright(`Buy request sent at ${Date.now()}`));
    bus.emit("BuyRequestSent");
  }

  sendSyncToPeer(toId: string) {
    this.sendMessageToPeer(toId, MessageType.SYNC_REQUEST, "");
    console.log(chalk.blueBright(`Sync request sent at ${Date.now()}`));
    bus.emit("SyncSent");
  }
}
