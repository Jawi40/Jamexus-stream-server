import express from 'express';
import { getOrCreateMount, broadcastChunk } from './mounts.js';

const app = express();
app.use(express.json());

// SOURCE endpoint
app.post('/source/:mount', (req, res) => {
  const mount = getOrCreateMount(req.params.mount);
  mount.source = req;

  req.on('data', (chunk) => {
    mount.buffer.push(chunk);
    if (mount.buffer.length > 100) mount.buffer.shift();
    broadcastChunk(mount.name, chunk);
  });

  req.on('end', () => {
    mount.source = null;
  });

  res.status(200).end();
});

// LISTENER endpoint
app.get('/stream/:mount', (req, res) => {
  const mount = getOrCreateMount(req.params.mount);

  res.writeHead(200, {
    'Content-Type': 'audio/mpeg',
    'Cache-Control': 'no-cache',
    'Connection': 'close',
  });

  mount.listeners.add(res);

  for (const chunk of mount.buffer) res.write(chunk);

  req.on('close', () => mount.listeners.delete(res));
});

// METADATA endpoint
app.post('/metadata/:mount', (req, res) => {
  const mount = getOrCreateMount(req.params.mount);
  mount.metadata = req.body;
  res.status(200).json({ ok: true });
});

// STATUS endpoint
app.get('/status/:mount', (req, res) => {
  const mount = getOrCreateMount(req.params.mount);
  res.json({
    mount: mount.name,
    listeners: mount.listeners.size,
    metadata: mount.metadata,
    hasSource: !!mount.source,
  });
});

app.listen(8000, () => console.log('Server running on port 8000'));

