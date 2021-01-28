export default class Validator {
  constructor(
    public address: string,
    public approvedBy: string,
    public approvedBySign: string,
    public reputation: number,
    public energyCapacity: number,
    public energyRate: number,
    public hash: string
  ) {}
}
