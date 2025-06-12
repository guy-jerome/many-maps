// src/idbService.ts
import { openDB, DBSchema } from 'idb';

interface MapRecord {
  blob: Blob;
  name: string;
  description?: string;
}

interface MapGalleryDB extends DBSchema {
  maps: {
    key: string;      // internal UUID
    value: MapRecord;
  };
}

const DB_NAME = 'map-gallery-db';
const STORE = 'maps';

async function getDB() {
  return openDB<MapGalleryDB>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    },
  });
}

export async function saveMap(
  id: string,
  blob: Blob,
  name: string,
  description?: string
) {
  const db = await getDB();
  await db.put(STORE, { blob, name, description }, id);
}

export async function getMapBlob(id: string): Promise<Blob | undefined> {
  const db = await getDB();
  const rec = await db.get(STORE, id);
  return rec?.blob;
}

export async function getAllMaps(): Promise<
  { id: string; blob: Blob; name: string; description?: string }[]
> {
  const db = await getDB();
  const tx = db.transaction(STORE, 'readonly');
  const store = tx.objectStore(STORE);
  const keys = await store.getAllKeys();
  const out: { id: string; blob: Blob; name: string; description?: string }[] =
    [];
  for (const key of keys) {
    const rec = await store.get(key as string);
    if (rec) {
      out.push({ id: key as string, blob: rec.blob, name: rec.name, description: rec.description });
    }
  }
  return out;
}

export async function deleteMap(id: string) {
  const db = await getDB();
  await db.delete(STORE, id);
}
