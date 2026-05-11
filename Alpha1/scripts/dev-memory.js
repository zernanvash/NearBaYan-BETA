const { MongoMemoryServer } = require("mongodb-memory-server");

async function start() {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri("nearBaYan");

  console.log(`Using in-memory MongoDB at ${process.env.MONGO_URI}`);

  process.once("SIGINT", async () => {
    await mongo.stop();
    process.exit(0);
  });

  process.once("SIGTERM", async () => {
    await mongo.stop();
    process.exit(0);
  });

  require("../server");
}

start().catch((error) => {
  console.error("Failed to start in-memory MongoDB:", error);
  process.exit(1);
});
