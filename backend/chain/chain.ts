import { Block } from "../block";
import Validator from "./validator";

export default class Chain {
  public blocks: Block[];
  public validators: Validator[];
  private index: number;

  constructor() {
    this.blocks = [];
    this.validators = [];
    this.index = 1;
  }

  isBlockValid(block: Block): boolean {
    // Check if the validator is present on the chain or not
    let isValidatorOnChain = false;
    let validator: Validator = null;
    for (const currentValidator of this.validators) {
      if (currentValidator.address === block.validator) {
        isValidatorOnChain = true;
        validator = currentValidator;
      }
    }

    if (!isValidatorOnChain) return false;

    // Check if the validator has a positive reputation
    if (validator.reputation <= 0) {
      return false;
    }

    // Check digital sign of creator

    // Check digital sign of validator

    // If block is of contract type check digital signs of seller and buyer

    // Check if the validator has not been assigned to previous (N/2) + 1 blocks

    return true;
  }

  addBlock(block: Block) {
    // Check if the current block has index greater than previous block on the local chain

    // Check the prevHash on the block being added.

    this.blocks.push(block);

    this.index += 1;
  }

  addValidator() {
    // Check the signature of the approving validator
  }
}
