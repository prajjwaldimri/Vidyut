import { Socket } from "net";

export default interface Peer {
  seq: number;
  port: number;
  host: string;
  publicKey: string;
  socket: Socket;
}
