import { eddsa } from "elliptic";
import crypto from "crypto";
import hasher from "../util/hasher";
import { Block } from "../block";

const elliptic = new eddsa("ed25519");

export default class Wallet {
  public publicKey: string;
  public balance: number;
  private keyPair: eddsa.KeyPair;

  constructor() {
    this.keyPair = elliptic.keyFromSecret(crypto.randomBytes(32));

    this.publicKey = this.keyPair.getPublic("hex");
    this.balance = 0;
  }

  sign(data: object): string {
    return this.keyPair.sign(hasher(JSON.stringify(data))).toHex();
  }

  signBlockAsCreator(block: Block): Block {
    block.creator = this.publicKey;
    block.creatorSign = this.sign({ header: block.header, body: block.body });

    return block;
  }

  signBlockAsValidator(block: Block): Block {
    block.validator = this.publicKey;
    block.validatorSign = this.sign({ header: block.header, body: block.body });

    return block;
  }
}
