import Swarm from 'discovery-swarm';
import defaults from 'dat-swarm-defaults';
import crypto from 'crypto';

import express from "express";
import cors from "cors";
import getPort from 'get-port';
const app = express();

app.use(cors());


app.get("/", (req, res) => {
  res.send("Hello");
});

(async () => {
  // const peer = new SimplePeerJs({ id: "Vidyut-Initiator", wrtc, fetch, WebSocket });

  // peer.on('connect', conn => {
  //   console.log('Peer connected:', conn.peerId);

  //   conn.peer.on('data', data => {
  //     console.log(data.toString());
  //   });
  // });

  const peers = {};
  let connSeq = 0;
  let channel = 'Vidyut';

  const myPeerId = crypto.randomBytes(32);
  console.log('MyPeerId: ' + myPeerId.toString('hex'));

  const config = defaults({ id: myPeerId });
  const swarm = Swarm(config);
  const port = await getPort();

  swarm.listen(port);
  console.log(`Listening on ${port}`);
  swarm.join(channel, { announce: true });
  swarm.on('connection', (conn, info) => {
    console.log(info);
    const seq = connSeq;
    const peerId = info.id.toString('hex');
    if (info.initiator) {
      try {
        conn.setKeepAlive(true, 600);
      } catch (exception) {
        console.log("Error", exception);
      }
    }

    conn.on('close', () => {
      console.log(`Connection ${seq} closed`);
    });
  });

  swarm.on("peer-banned", () => {
    console.log("Banned");
  });

  swarm.on("peer-rejected", () => {
    console.log("Rejected");
  });


  // app.listen(3333, () => {
  //   console.log("Express listening at 3333");
  // });
})();

