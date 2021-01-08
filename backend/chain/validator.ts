export default class Validator {
  constructor(
    public address: string,
    public approvedBy: string,
    public reputation: Number,
    public energyCapacity: Number,
    public energyRate: Number
  ) {}
}
