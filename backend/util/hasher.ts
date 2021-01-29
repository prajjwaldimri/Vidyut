import { SHA3 } from "sha3";
import { Block } from "../block";
import { BlockBodyContract } from "../block/blockBody";
import { Validator } from "../chain";

const hash = new SHA3(256);

export function hasher(data: string): string {
  hash.reset();
  hash.update(data);

  return hash.digest("hex");
}

export function hashBlockBodyContract(contract: BlockBodyContract): string {
  let clonedContract = { ...contract };
  clonedContract.consumerSign = "";
  clonedContract.producerSign = "";

  return hasher(JSON.stringify(clonedContract));
}

export function hashValidator(validator: Validator): string {
  let clonedValidator = { ...validator };
  clonedValidator.approvedBySign = "";
  clonedValidator.hash = "";

  return hasher(JSON.stringify(clonedValidator));
}

export function hashBlock(block: Block): string {
  let clonedBlock = { ...block };

  clonedBlock.hash = "";
  clonedBlock.creatorSign = "";
  clonedBlock.validator = "";
  clonedBlock.validatorSign = "";

  return hasher(JSON.stringify(clonedBlock));
}
