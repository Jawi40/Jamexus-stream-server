export class Mount {
  constructor(name) {
    this.name = name;
    this.source = null;
    this.listeners = new Set();
    this.buffer = [];
    this.metadata = {};
  }
}

const mounts = new Map();

export function getOrCreateMount(name) {
  if (!mounts.has(name)) mounts.set(name, new Mount(name));
  return mounts.get(name);
}

export function broadcastChunk(mountName, chunk) {
  const mount = mounts.get(mountName);
  if (!mount) return;
  for (const res of mount.listeners) {
    res.write(chunk);
  }
}

