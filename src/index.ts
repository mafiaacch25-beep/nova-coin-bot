import app from "./app";
import { logger } from "./lib/logger";
import { startBot } from "./bot/index";
import { ensureTables } from "./bot/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  if (process.env.DATABASE_URL) {
    try {
      await ensureTables();
      logger.info("Nova Coin tables ready");
    } catch (e) {
      logger.error({ err: e }, "Failed to create bot tables");
    }
  }

  startBot().catch((e) => {
    logger.error({ err: e }, "Bot startup failed");
  });
});
