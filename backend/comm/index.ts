import MessageSender from "./messageSender";
import MessageReceiver from "./messageReceiver";

enum MessageType {
  BLOCK_ADDITION_REPUTATION = "BLOCK_ADDITION_REPUTATION",
  BLOCK_ADDITION_CONTRACT = "BLOCK_ADDITION_CONTRACT",
  VALIDATOR_ADDITION = "VALIDATOR_ADDITION",
  VALIDATOR_APPROVAL = "VALIDATOR_APPROVAL",
  CHAIN_REQUEST = "CHAIN_REQUEST",
  HANDSHAKE = "HANDSHAKE",
  TESTING = "TESTING",
}

interface Message {
  to: string;
  from: string;
  type: MessageType;
  data: string;
}

export { MessageReceiver, MessageSender, MessageType, Message };
