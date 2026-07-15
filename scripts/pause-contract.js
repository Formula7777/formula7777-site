import { runPauseAdmin } from "./contract-pause-admin.js";

runPauseAdmin("pause").catch((error) => {
  process.stderr.write(`${error?.shortMessage || error?.message || String(error)}\n`);
  process.exit(1);
});
