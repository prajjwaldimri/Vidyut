import swarm from "discovery-swarm";

let sw = swarm();
sw.listen(55555);
sw.join("Vidyut");

sw.on("connection", (connection) => {
  console.log("found");
  console.log("connection");
});

sw.on("peer", (peer) => {
  console.log(peer);
});
