export enum MessageType {
  BLOCK = "BLOCK"
}

export class MessageHandler {

  constructor(public peers, private myId: string) {

  }

  broadcast(type: MessageType, data: string) {
    for (let id in this.peers) {
      this.sendMessageToPeer(id, type, data);
    }
  }
  sendMessageToPeer(toId: string, type: MessageType, data: string) {
    this.peers[toId].conn.write(JSON.stringify({ to: toId, from: this.myId, type, data }));
  }
}


