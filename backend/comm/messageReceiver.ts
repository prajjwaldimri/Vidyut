import { Socket } from "net";
import { Message, MessageType, Peer } from ".";
import { Chain, Validator } from "../chain";
import Wallet from "../wallet";

let seq = 0;

export default class MessageReceiver {
  constructor(
    public peers: { string: Peer } | {},
    private myId: string,
    private chain: Chain,
    private wallet: Wallet
  ) {}

  process(message: Message, socket?: Socket) {
    switch (message.type) {
      case MessageType.TESTING:
        console.log("Message: ", message.data);
        break;

      case MessageType.HANDSHAKE:
        const data = JSON.parse(message.data);
        if (!this.peers[message.from])
          this.peers[message.from] = {
            seq,
            port: data.localPort,
            host: data.localAddress,
            publicKey: data.publicKey,
            socket: socket,
          };
        seq++;
        break;

      // Adds a validator to local chain
      case MessageType.VALIDATOR_ADDITION:
        if (JSON.parse(message.data) instanceof Validator)
          this.chain.addValidator(JSON.parse(message.data));
        break;

      // Approving a validator
      case MessageType.VALIDATOR_APPROVAL:
        break;

      default:
        console.log("Message: ", message.data);
        break;
    }
  }
}
