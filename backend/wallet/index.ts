import { eddsa } from "elliptic";
import crypto from "crypto";
import hasher from "../util/hasher";

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

  sign(data: object) {
    return this.keyPair.sign(hasher(JSON.stringify(data)));
  }
}
