const pathToEntry = "./apps/web/dist/server.js";

import(pathToEntry).catch((error) => {
  console.error("Failed to start web server from", pathToEntry);
  console.error(error);
  process.exit(1);
});
