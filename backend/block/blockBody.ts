enum BlockBodyType {
  REPUTATION = "REPUTATION",
  CONTRACT = "CONTRACT",
}

export default class BlockBody {
  public type: BlockBodyType;
  public contract?: BlockBodyContract;
  public reputation?: BlockBodyReputation;

  constructor(contract?: BlockBodyContract, reputation?: BlockBodyReputation) {
    if (contract) {
      this.type = BlockBodyType.CONTRACT;
      this.contract = contract;
    } else {
      this.type = BlockBodyType.REPUTATION;
      this.reputation = reputation;
    }
  }
}

class BlockBodyContract {
  constructor(
    public producer: string,
    public consumer: string,
    public id: string,
    public amount: Number,
    public fulfilled: boolean
  ) {}
}

class BlockBodyReputation {
  constructor(
    public change: number,
    public peer: string,
    public contract: string,
    public isNegative: boolean
  ) {}
}
