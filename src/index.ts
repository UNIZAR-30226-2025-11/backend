import { server } from "./app.js";
import { db } from "./db/db.js";

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => console.log(`Server up: http://localhost:${PORT}`));

// Check if DB is reachable
db.query("SELECT version()")
  .then((_result) => {
    console.log(
      `DB connection: postgres://${db.options.host}:${db.options.port}`,
    );
  })
  .catch(() => console.log(`Failed to connect to DB`));
