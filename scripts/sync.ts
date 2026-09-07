// Manual sync from the command line: npm run sync
import "dotenv/config";
import { syncAllItems } from "../src/lib/sync";

syncAllItems()
  .then((r) => { console.table(r); process.exit(0); })
  .catch((e) => { console.error(e); process.exit(1); });
