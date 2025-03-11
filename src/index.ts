import { PORT } from "./config.js";
import { server } from "./app.js";
import { db } from "./db.js";

server.listen(PORT, () => console.log(`Server up: http://localhost:${PORT}`));

// Check if DB is reachable
(async () => {
  let success = false;
  let tries = 3;

  while (!success && tries > 0) {
    try {
      await db.query("SELECT version()");

      console.log(
        `DB connection: postgres://${db.options.host}:${db.options.port}`,
      );
      success = true;
      continue;
    } catch (_) {
      tries--;
      console.log(`Failed to connect, ${tries} tries remaining`);
      if (!tries) continue;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  if (!success)
    console.log(
      "Couldn't connect to DB. If setup correctly, the DB may just be not up yet.",
    );
})();
