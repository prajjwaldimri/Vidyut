import levelup from "levelup";
import leveldown from "leveldown";

const configName = process.argv.slice(2)[0];

const db = levelup(leveldown(`./tmp/db-${configName}`));

export default db;
