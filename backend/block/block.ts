import { hashBlock, hashBlockBodyContract, hasher } from "../util/hasher";
import Wallet from "../wallet";
import { BlockBody, BlockBodyContract, BlockBodyReputation } from "./blockBody";
import BlockHeader from "./blockHeader";

export default class Block {
  constructor(
    public header: BlockHeader,
    public body: BlockBody,
    public index: number,
    public creator: string,
    public creatorSign: string,
    public hash: string,
    public validator: string,
    public validatorSign: string
  ) {}

  static createContractBlock(
    prevBlock: Block,
    contract: BlockBodyContract,
    wallet: Wallet,
    contractId?: string
  ): Block {
    const blockBody = new BlockBody(contract);
    const header = new BlockHeader(
      prevBlock.hash,
      hashBlockBodyContract(contract)
    );
    const block = new Block(
      header,
      blockBody,
      prevBlock.index + 1,
      wallet.publicKey,
      "",
      "",
      "",
      ""
    );

    block.hash = hashBlock(block);
    block.creatorSign = wallet.sign(hashBlock(block));

    return block;
  }

  static createEmptyContractBlock(
    prevBlock: Block,
    producer: string,
    consumer: string,
    amount: number,
    rate: number
  ): Block {
    const blockBody = new BlockBody(
      new BlockBodyContract(producer, "", consumer, "", amount, rate, false),
      undefined
    );

    return new Block(
      new BlockHeader(prevBlock.hash, hasher(JSON.stringify(blockBody))),
      blockBody,
      prevBlock.index + 1,
      "--Creator Address--",
      "--Creator Sign--",
      "--Empty Hash--",
      "**Validator Address**",
      "**Validator Sign**"
    );
  }

  static createEmptyReputationBlock(
    prevBlock: Block,
    relatedToBlock: Block
  ): Block {
    // Check if the relatedToBlock has a contract in it.
    if (!relatedToBlock.body.contract) {
      throw new Error(
        "relatedToBlock can only contain a block with a contract in the body"
      );
    }

    const blockBody = new BlockBody(
      undefined,
      new BlockBodyReputation(
        relatedToBlock.body.contract.amount,
        relatedToBlock.body.contract.producer,
        relatedToBlock.body.contract.id,
        !relatedToBlock.body.contract.fulfilled
      )
    );

    return new Block(
      new BlockHeader(prevBlock.hash, hasher(JSON.stringify(blockBody))),
      blockBody,
      prevBlock.index + 1,
      "--Creator Address--",
      "--Creator Sign--",
      "--Empty Hash--",
      "**Validator Address**",
      "**Validator Sign**"
    );
  }
}
