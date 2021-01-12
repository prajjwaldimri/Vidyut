import swarm from "discovery-swarm";
import getPort from "get-port";

import express from "express";
const app = express();

app.get("/", (req, res) => {
  res.send("Hello");
});

(async () => {
  let sw = swarm();
  sw.listen(await getPort({ port: getPort.makeRange(30000, 50000) }));
  sw.join("Vidyut");

  sw.on("connection", (connection) => {
    console.log("found");
    console.log(sw.connected);
  });

  app.listen(3333, () => {
    console.log("Express listening at 3333");
  });
})();
