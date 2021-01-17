
import wrtc from "wrtc";
import fetch from "node-fetch";
import WebSocket from "ws";
import SimplePeerJs from "simple-peerjs";

import express from "express";
import cors from "cors";
const app = express();

app.use(cors());


app.get("/", (req, res) => {
  res.send("Hello");
});

(async () => {
  const peer = new SimplePeerJs({ id: "Vidyut-Initiator", wrtc, fetch, WebSocket });

  peer.on('connect', conn => {
    console.log('Peer connected:', conn.peerId);

    conn.peer.on('data', data => {
      console.log(data.toString());
    });
  });


  app.listen(3333, () => {
    console.log("Express listening at 3333");
  });
})();

