import { Message, MessageType } from ".";
import { Chain } from "../chain";
import Wallet from "../wallet";

export default class MessageReceiver {
  constructor(
    public peers: object,
    private myId: string,
    chain: Chain,
    wallet: Wallet
  ) {}

  process(message: Message) {
    switch (message.type) {
      case MessageType.TESTING:
        console.log(message.data);
        break;

      default:
        console.log(message.data);
        break;
    }
  }
}
