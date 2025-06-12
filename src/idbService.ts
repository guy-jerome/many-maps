// src/idbService.ts
import { openDB, DBSchema } from 'idb';

export interface ExtraSection {
  title: string;
  content: string;
}

export interface PinData {
  label: string;
  areaName: string;
  info: string;
  x: number;
  y: number;
  extraSections: ExtraSection[];
  linkedMapId?: string;        // ← new
}

export interface MapRecord {
  blob: Blob;
  name: string;
  description?: string;
  pins: PinData[];
}

interface MapGalleryDB extends DBSchema {
  maps: {
    key: string;
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

/** Create or overwrite a full map record (image + metadata + pins). */
export async function saveMap(
  id: string,
  blob: Blob,
  name: string,
  description?: string,
  pins: PinData[] = []
) {
  const db = await getDB();
  await db.put(STORE, { blob, name, description, pins }, id);
}

/** Get the full record (image + metadata + pins). */
export async function getMapRecord(id: string): Promise<MapRecord | undefined> {
  const db = await getDB();
  return db.get(STORE, id);
}

/** List all maps (excluding their pin arrays). */
export async function getAllMaps(): Promise<
  { id: string; blob: Blob; name: string; description?: string }[]
> {
  const db = await getDB();
  const tx = db.transaction(STORE, 'readonly');
  const store = tx.objectStore(STORE);
  const keys = await store.getAllKeys();
  const out: { id: string; blob: Blob; name: string; description?: string }[] = [];
  for (const key of keys) {
    const rec = await store.get(key as string);
    if (rec) {
      out.push({
        id: key as string,
        blob: rec.blob,
        name: rec.name,
        description: rec.description,
      });
    }
  }
  return out;
}

/** Delete a map entirely. */
export async function deleteMap(id: string) {
  const db = await getDB();
  await db.delete(STORE, id);
}

/** Overwrite just the pins array on a map record. */
export async function updateMapPins(id: string, pins: PinData[]) {
  const db = await getDB();
  const rec = await db.get(STORE, id);
  if (!rec) throw new Error(`No map record found for id=${id}`);
  rec.pins = pins;
  await db.put(STORE, rec, id);
}
