import { Socket } from "net";
import { Message, MessageSender, MessageType, Peer } from ".";
import { Chain, Validator } from "../chain";
import hasher from "../util/hasher";
import Wallet from "../wallet";

let seq = 0;

export default class MessageReceiver {
  constructor(
    public peers: { string: Peer } | {},
    private myId: string,
    private chain: Chain,
    private wallet: Wallet,
    private messageSender: MessageSender
  ) {}

  process(message: Message, socket?: Socket) {
    switch (message.type) {
      case MessageType.TESTING:
        console.log("Message: ", message.data);
        break;

      case MessageType.HANDSHAKE:
        let data = JSON.parse(message.data);
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
        const validator = JSON.parse(message.data) as Validator;
        this.chain.addValidator(validator);
        break;

      // Approving a validator
      case MessageType.VALIDATOR_APPROVAL:
        data = JSON.parse(message.data);

        // Simulates a real working 3rd party API like UIDAI
        setTimeout(() => {
          const isValidatorAccepted = !Math.round(Math.random());

          if (isValidatorAccepted) {
            const validator = new Validator(
              message.from,
              this.wallet.publicKey,
              "",
              0,
              Math.random() * 20,
              Math.random() * 10,
              ""
            );
            const sign = this.wallet.sign(validator);

            validator.hash = hasher(JSON.stringify(validator));
            validator.approvedBySign = sign;

            this.messageSender.broadcast(
              MessageType.VALIDATOR_ADDITION,
              JSON.stringify(validator)
            );
          }
        }, Math.floor(Math.random() * 1000));
        break;

      default:
        console.log("Message: ", message.data);
        break;
    }
  }
}
