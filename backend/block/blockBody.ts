import { nanoid } from "nanoid";

enum BlockBodyType {
  REPUTATION = "REPUTATION",
  CONTRACT = "CONTRACT",
}

class BlockBody {
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
  public id: string;

  constructor(
    public producer: string,
    public consumer: string,
    public amount: number,
    public fulfilled: boolean
  ) {
    this.id = nanoid();
  }
}

class BlockBodyReputation {
  constructor(
    public change: number,
    public peer: string,
    public contract: string,
    public isNegative: boolean
  ) {}
}

export { BlockBody, BlockBodyContract, BlockBodyReputation };
