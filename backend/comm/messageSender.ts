import { Message, MessageType } from ".";

export default class MessageSender {

  constructor(public peers: object, private myId: string) { }

  broadcast(type: MessageType, data: string) {
    for (let id in this.peers) {
      this.sendMessageToPeer(id, type, data);
    }
  }

  sendMessageToPeer(toId: string, type: MessageType, data: string) {
    let message: Message = { to: toId, from: this.myId, type, data };
    this.peers[toId].conn.write(JSON.stringify(message));
  }
}


