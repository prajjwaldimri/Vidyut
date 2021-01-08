import { Block } from "../block";
import Validator from "./validator";

class Chain {
  public blocks: Block[];
  public validators: Validator[];

  constructor() {
    this.blocks = [];
    this.validators = [];
  }
}
