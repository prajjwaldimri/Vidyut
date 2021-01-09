import { SHA3 } from "sha3";

export default function hasher(data: string): string {
  const hash = new SHA3(256);
  hash.update(data);

  return hash.digest("hex");
}
