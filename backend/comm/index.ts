import { Socket } from "net";

import MessageSender from "./messageSender";
import MessageReceiver from "./messageReceiver";

interface Peer {
  seq: number;
  port: number;
  host: string;
  publicKey: string;
  socket: Socket;
}

enum MessageType {
  BLOCK_ADDITION_REPUTATION = "BLOCK_ADDITION_REPUTATION",
  BLOCK_ADDITION_CONTRACT = "BLOCK_ADDITION_CONTRACT",
  CHAIN_REQUEST = "CHAIN_REQUEST",
  BUY_ELECTRICITY = "BUY_ELECTRICITY",
  HANDSHAKE = "HANDSHAKE",
  TESTING = "TESTING",
  VALIDATOR_ADDITION = "VALIDATOR_ADDITION",
  VALIDATOR_APPROVAL = "VALIDATOR_APPROVAL",
}

interface Message {
  to: string;
  from: string;
  type: MessageType;
  data: string;
}

export { MessageReceiver, MessageSender, MessageType, Message, Peer };
