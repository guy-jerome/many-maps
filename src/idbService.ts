// src/idbService.ts
import { openDB, DBSchema } from "idb";
import { makeThumbnail } from "./utils/makeThumbnail";
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
  linkedMapId?: string;
  tags: string[];
}

export interface MapRecord {
  blob: Blob;
  thumb?: Blob;
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

const DB_NAME = "map-gallery-db";
const STORE = "maps";

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
  description?: string,
  pins: PinData[] = []
) {
  const thumb = await makeThumbnail(blob, 200, 200); // create thumbnail once here
  const db = await getDB();
  await db.put(STORE, { blob, name, description, pins, thumb }, id);
}

export async function getMapRecord(id: string): Promise<MapRecord | undefined> {
  const db = await getDB();
  return db.get(STORE, id);
}

export async function getAllMaps(): Promise<
  { id: string; blob: Blob; thumb?: Blob; name: string; description?: string }[]
> {
  const db = await getDB();
  const tx = db.transaction(STORE, "readonly");
  const store = tx.objectStore(STORE);
  const keys = await store.getAllKeys();
  const out: {
    id: string;
    blob: Blob;
    thumb?: Blob;
    name: string;
    description?: string;
  }[] = [];
  for (const key of keys) {
    const rec = await store.get(key as string);
    if (rec) {
      out.push({
        id: key as string,
        blob: rec.blob,
        thumb: rec.thumb,
        name: rec.name,
        description: rec.description,
      });
    }
  }
  return out;
}

export async function updateMapPins(id: string, pins: PinData[]) {
  const db = await getDB();
  const rec = await db.get(STORE, id);
  if (!rec) throw new Error(`No map record found for id=${id}`);
  rec.pins = pins;
  await db.put(STORE, rec, id);
}

/**
 * Delete a map *and* clear any references to it from other maps’ pins.
 */
export async function deleteMap(id: string) {
  const db = await getDB();
  // 1) Remove the map itself
  await db.delete(STORE, id);

  // 2) Fetch all remaining records
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  const keys = await store.getAllKeys();

  for (const key of keys as string[]) {
    const rec = await store.get(key);
    if (!rec) continue;

    // Filter out any linkedMapId references to the deleted id
    let dirty = false;
    const newPins = rec.pins.map((pin) => {
      if (pin.linkedMapId === id) {
        dirty = true;
        const { linkedMapId, ...rest } = pin;
        return rest; // drop the property
      }
      return pin;
    });

    if (dirty) {
      rec.pins = newPins;
      await store.put(rec, key);
    }
  }

  await tx.done;
}
