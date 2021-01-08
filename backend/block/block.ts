import BlockBody from "./blockBody";
import BlockHeader from "./blockHeader";

export default class Block {
  constructor(
    public header: BlockHeader,
    public body: BlockBody,
    public index: Number,
    public creator: string,
    public creatorSign: string,
    public hash: string,
    public validator: string,
    public validatorSign: string
  ) {}
}
