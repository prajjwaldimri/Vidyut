import swarm from "discovery-swarm";
import getPort from "get-port";

let swarmConnect = async () => {
  let sw = swarm();
  sw.listen(await getPort({ port: getPort.makeRange(30000, 50000) }));
  sw.join("Vidyut");

  sw.on("connection", (connection) => {
    console.log("found");
    console.log(sw.connected);
  });
};
