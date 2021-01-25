import { Socket } from "net";
import { Message, MessageType, Peer } from ".";
import Wallet from "../wallet";

export default class MessageSender {
  constructor(
    public peers: { string: Peer } | {},
    private myId: string,
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
}
