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

// New interface for dungeon work-in-progress projects
export interface DungeonProject {
  id: string;
  name: string;
  description?: string;
  shapes: any[]; // The shapes array from DungeonEditor
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number;
  backgroundColor: string; // Background color for the canvas
  underlayerColor: string; // Color for the stone layer
  lastModified: Date;
  thumbnail?: Blob; // Optional thumbnail
}

interface MapGalleryDB extends DBSchema {
  maps: {
    key: string;
    value: MapRecord;
  };
  dungeonProjects: {
    key: string;
    value: DungeonProject;
  };
}

const DB_NAME = "map-gallery-db";
const STORE = "maps";
const DUNGEON_STORE = "dungeonProjects";

async function getDB() {
  return openDB<MapGalleryDB>(DB_NAME, 2, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
      if (oldVersion < 2 && !db.objectStoreNames.contains(DUNGEON_STORE)) {
        db.createObjectStore(DUNGEON_STORE);
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

export async function updateMapMeta(
  id: string,
  name: string,
  description?: string
) {
  const db = await getDB();
  const rec = await db.get(STORE, id);
  if (!rec) throw new Error(`No map record found for id=${id}`);
  rec.name = name;
  rec.description = description;
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

// ===== DUNGEON PROJECT FUNCTIONS =====

export async function saveDungeonProject(project: DungeonProject) {
  const db = await getDB();
  project.lastModified = new Date();
  await db.put(DUNGEON_STORE, project, project.id);
}

export async function getDungeonProject(id: string): Promise<DungeonProject | undefined> {
  const db = await getDB();
  return db.get(DUNGEON_STORE, id);
}

export async function getAllDungeonProjects(): Promise<DungeonProject[]> {
  const db = await getDB();
  const projects = await db.getAll(DUNGEON_STORE);
  return projects.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
}

export async function deleteDungeonProject(id: string) {
  const db = await getDB();
  await db.delete(DUNGEON_STORE, id);
}

export async function exportDungeonToGallery(
  projectId: string,
  mapBlob: Blob,
  mapName: string,
  mapDescription?: string
) {
  // Save the dungeon as a regular map in the gallery
  // Use projectId as part of the map ID to maintain some connection
  const mapId = projectId ? `dungeon-${projectId}` : `dungeon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await saveMap(mapId, mapBlob, mapName, mapDescription);
  return mapId;
}
