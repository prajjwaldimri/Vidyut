import { Message, MessageType } from ".";
import { Chain } from "../chain";
import Wallet from "../wallet";

export default class MessageReceiver {
  constructor(public peers: object, private myId: string, chain: Chain, wallet: Wallet) { }

  process(data: Message) {
    switch (data.type) { }
  }
}