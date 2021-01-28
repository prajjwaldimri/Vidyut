import { Block, BlockBodyType } from "../block";
import hasher from "../util/hasher";
import Wallet from "../wallet";
import Validator from "./validator";

export default class Chain {
  public blocks: Block[];
  public validators: Validator[];
  private index: number;

  constructor() {
    this.index = 0;
    this.blocks = [];
    this.validators = [];
    // Chain starts with a validator which is the initiator of the network. In an app this would be added using methods like QR scan or manual address entry.
    const validator = new Validator(
      "744f8a46a845b268a2f46dc636e4ac323030348dfb72957bb657bcc8012c8ab4",
      "--Initiator--",
      "--Initiator--",
      10,
      10,
      4,
      ""
    );

    validator.hash = hasher(JSON.stringify(validator));
    this.validators.push(validator);
  }

  isBlockValid(block: Block): boolean {
    // Check if the validator is present on the chain or not
    let validator: Validator | undefined = undefined;
    for (const currentValidator of this.validators) {
      if (currentValidator.address === block.validator) {
        validator = currentValidator;
      }
    }

    if (!validator) {
      console.error("Validator not present on the local chain");
      return false;
    }

    // Check if the validator has a positive reputation
    if (validator.reputation <= 0) {
      console.error("Validator's reputation is not positive");
      return false;
    }

    // Check digital sign of creator
    if (
      !Wallet.isSignatureValid(block.creator, block.creatorSign, block.hash)
    ) {
      console.error("Wrong signature of creator");
      return false;
    }

    // Check digital sign of validator
    if (
      !Wallet.isSignatureValid(block.validator, block.validatorSign, block.hash)
    ) {
      console.error("Wrong signature of validator");
      return false;
    }

    // If block is of contract type check digital signs of seller and buyer
    if (block.body.type === BlockBodyType.CONTRACT && block.body.contract) {
      let contract = block.body.contract;
      if (
        !Wallet.isSignatureValid(
          contract.consumer,
          contract.consumerSign,
          block.header.bodyHash
        )
      ) {
        console.error("Wrong signature of buyer");
        return false;
      }

      if (
        !Wallet.isSignatureValid(
          contract.producer,
          contract.producerSign,
          block.header.bodyHash
        )
      ) {
        console.error("Wrong signature of seller");
        return false;
      }
    }

    // Check if the validator has not been assigned to previous (N/2) + 1 blocks
    let numberOfBlocksToGoBack = Math.floor(this.validators.length / 2 + 1);

    for (let i = this.index; i > numberOfBlocksToGoBack; i--) {
      if (this.blocks[i].validator === block.validator) {
        console.error(
          "Validator has already validated a block which is not (N/2)+1 blocks before"
        );
        return false;
      }
    }

    return true;
  }

  addBlock(block: Block) {
    // Check if the current block has index greater than previous block on the local chain
    if (this.index >= block.index) {
      throw new Error(
        "The last block on the chain has an higher or equal index number than the block to be added"
      );
    }

    // Check the prevHash on the block being added.
    if (block.header.prevBlockHash !== this.blocks[this.index].hash) {
      throw new Error(
        "The current block doesn't have the correct hash of the previous block"
      );
    }

    // Check if the block is valid
    if (!this.isBlockValid(block)) {
      throw new Error("Block is not valid! Check the debug logs.");
    }

    this.blocks.push(block);

    this.index += 1;
  }

  addValidator(validator: Validator) {
    if (
      Wallet.isSignatureValid(
        validator.approvedBy,
        validator.approvedBySign,
        validator.hash
      )
    ) {
      this.validators.push(validator);
    }
  }
}
