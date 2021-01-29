export default class BlockHeader {
  public prevBlockHash: string;
  public bodyHash: string;
  public created: string;
  public version: string;

  constructor(prevBlockHash: string, bodyHash: string, created?: string) {
    this.prevBlockHash = prevBlockHash;
    this.bodyHash = bodyHash;
    this.created = created ? created : Date.now().toString();
    this.version = "0.1.0";
  }
}
