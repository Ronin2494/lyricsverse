import { createServer } from 'node:http';
import { createHandler } from './handler.mjs';
import { checkDatabase } from './db.mjs';
const port = Number(process.env.PORT || 10000);
const server = createServer(createHandler({ checkDb: checkDatabase }));
server.listen(port, '0.0.0.0', () => console.log(`LyricVerse API listening on ${port}`));
const stop = () => server.close(() => process.exit(0));
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
