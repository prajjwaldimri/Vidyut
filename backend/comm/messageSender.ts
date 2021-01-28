import { Socket } from "net";
import { Message, MessageType, Peer } from ".";
import { Chain } from "../chain";
import Wallet from "../wallet";

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
    const { address: validatorAddress } = this.chain.validators[
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
  }
}
