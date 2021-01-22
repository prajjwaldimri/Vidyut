import Swarm from 'discovery-swarm';
import defaults from 'dat-swarm-defaults';
import crypto from 'crypto';
import getPort from 'get-port';

import { MessageHandler, MessageType } from "./messageHandler";

(async () => {

  const peers = {};
  let connSeq = 0;
  let channel = 'Vidyut';

  const myPeerId = crypto.randomBytes(32).toString('hex');

  const messageHandler = new MessageHandler(peers, myPeerId);

  const config = defaults({ id: myPeerId });
  const swarm = Swarm(config);
  const port = await getPort();

  swarm.listen(port);
  console.log(`Listening on ${port}`);
  swarm.join(channel, { announce: true });
  swarm.on('connection', (conn, info) => {
    const seq = connSeq;
    const peerId = info.id.toString('hex');
    if (info.initiator) {
      try {
        conn.setKeepAlive(true, 600);
      } catch (exception) {
        console.log("Error", exception);
      }
    }

    if (!peers[peerId]) {
      peers[peerId] = { conn, seq };
      connSeq++;
    }

    conn.on('data', (data) => {
      let message = JSON.parse(data);
      console.log(message);
    });

    conn.on('close', () => {
      console.log(`Connection ${seq} closed`);
      if (peers[peerId].seq === seq) {
        delete peers[peerId];
      }
    });

  });

  swarm.on("peer-banned", () => {
    console.log("Banned");
  });

  swarm.on("peer-rejected", () => {
    console.log("Rejected");
  });

})();

