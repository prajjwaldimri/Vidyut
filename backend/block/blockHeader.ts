export default class BlockHeader {
  public prevBlockHash: string;
  public bodyHash: string;
  public created: string;
  public version: string;

  constructor(prevBlockHash: string, bodyHash: string) {
    this.prevBlockHash = prevBlockHash;
    this.bodyHash = bodyHash;
    this.created = Date.now().toString();
    this.version = "0.1.0";
  }
}
