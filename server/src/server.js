import dotenv from 'dotenv';
import net from 'node:net';
import app from './app.js';
import './db/init.js';

dotenv.config();

async function isPortFree(port) {
	return new Promise((resolve) => {
		const srv = net.createServer();
		srv.once('error', () => resolve(false));
		srv.once('listening', () => srv.close(() => resolve(true)));
		srv.listen(port);
	});
}

async function findAvailablePort(preferred, attempts = 15) {
	let p = Number(preferred) || 4000;
	for (let i = 0; i < attempts; i++, p++) {
		// eslint-disable-next-line no-await-in-loop
		const free = await isPortFree(p);
		if (free) return p;
	}
	throw new Error('No available port found');
}

const desired = Number(process.env.PORT) || 4000;
const port = await findAvailablePort(desired).catch(() => desired);
if (port !== desired) {
	console.warn(`[Server] Port ${desired} in use. Switched to ${port}.`);
}
app.listen(port, () => console.log(`API listening on :${port}`));
