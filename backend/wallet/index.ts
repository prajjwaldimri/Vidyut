import { eddsa } from "elliptic";
import crypto from "crypto";
import { hasher } from "../util/hasher";
import { Block } from "../block";

const elliptic = new eddsa("ed25519");

export default class Wallet {
  public publicKey: string;
  public balance: number;
  private keyPair: eddsa.KeyPair;

  constructor(secret?: string) {
    if (secret && secret?.trim().length > 0) {
      this.keyPair = elliptic.keyFromSecret(secret);
    } else {
      this.keyPair = elliptic.keyFromSecret(crypto.randomBytes(32));
    }

    this.publicKey = this.keyPair.getPublic("hex");
    this.balance = 0;
  }

  sign(hash: string): string {
    return this.keyPair.sign(hash).toHex();
  }

  getSecret(): string {
    return this.keyPair.getSecret("hex");
  }

  signBlockAsCreator(block: Block): Block {
    block.creator = this.publicKey;
    block.creatorSign = this.sign(
      JSON.stringify({ header: block.header, body: block.body })
    );

    return block;
  }

  signBlockAsValidator(block: Block): Block {
    block.validator = this.publicKey;
    block.validatorSign = this.sign(
      JSON.stringify({ header: block.header, body: block.body })
    );

    return block;
  }

  static isSignatureValid(
    publicKey: string,
    signature: string,
    msgHash: string
  ) {
    const key = elliptic.keyFromPublic(publicKey);
    return key.verify(msgHash, signature);
  }
}
