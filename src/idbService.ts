// src/idbService.ts
import { openDB, DBSchema } from 'idb';

interface MapGalleryDB extends DBSchema {
  maps: {
    key: string;           // our map ID
    value: Blob;           // the map image
  };
}

const DB_NAME = 'map-gallery-db';
const STORE = 'maps';

async function getDB() {
  return openDB<MapGalleryDB>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE);
    },
  });
}

export async function saveMap(id: string, blob: Blob) {
  const db = await getDB();
  await db.put(STORE, blob, id);
}

export async function getMap(id: string): Promise<Blob | undefined> {
  const db = await getDB();
  return db.get(STORE, id);
}

export async function getAllMaps(): Promise<{ id: string; blob: Blob }[]> {
  const db = await getDB();
  const tx = db.transaction(STORE, 'readonly');
  const store = tx.objectStore(STORE);
  const allKeys = await store.getAllKeys();
  const result: { id: string; blob: Blob }[] = [];
  for (const key of allKeys) {
    const blob = await store.get(key as string);
    if (blob) result.push({ id: key as string, blob });
  }
  return result;
}
