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
  pinType: PinType; // Add pin type
  linkedWikiSections?: string[]; // Array of wiki section IDs
}

export interface PinType {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: "location" | "encounter" | "treasure" | "npc" | "hazard" | "custom";
}

// New interface for user accounts
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  lastLoginAt?: Date;
  profilePicture?: Blob;
}

// Update MapRecord to include user ownership and wiki
export interface MapRecord {
  id: string;
  blob: Blob;
  thumb?: Blob;
  name: string;
  description?: string;
  pins: PinData[];
  wiki?: MapWiki; // Add wiki support
  userId?: string; // Add user ownership
  createdAt?: Date;
  isPublic?: boolean; // Allow maps to be public or private
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
  backgroundPattern?: string; // Pattern overlay type (stone, brick, lines, etc.)
  patternOpacity?: number; // Opacity of the pattern overlay
  underlayerColor: string; // Color for the stone layer
  lastModified: Date;
  thumbnail?: Blob; // Optional thumbnail
  userId?: string; // Add user ownership
  isPublic?: boolean; // Allow dungeons to be public or private
}

// Wiki Section Interfaces
export interface WikiSection {
  id: string;
  title: string;
  content: string;
  category: WikiCategory;
  order: number;
  tags?: string[];
  linkedPinIds?: string[]; // Pin labels that reference this section
  createdAt: Date;
  lastModified: Date;
}

export interface WikiCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

// Predefined wiki categories for D&D campaigns
export const DEFAULT_WIKI_CATEGORIES: WikiCategory[] = [
  {
    id: "monsters",
    name: "Monsters & Enemies",
    icon: "👹",
    color: "#DC143C",
    description: "Creatures, enemies, and combat encounters",
  },
  {
    id: "npcs",
    name: "NPCs & Characters",
    icon: "👤",
    color: "#4682B4",
    description: "Non-player characters and important figures",
  },
  {
    id: "locations",
    name: "Locations & Places",
    icon: "🏰",
    color: "#8B4513",
    description: "Towns, dungeons, landmarks, and geographical features",
  },
  {
    id: "treasure",
    name: "Treasure & Items",
    icon: "💎",
    color: "#FFD700",
    description: "Magic items, treasure, loot, and equipment",
  },
  {
    id: "quests",
    name: "Quests & Plot Hooks",
    icon: "📜",
    color: "#9370DB",
    description: "Storylines, missions, and adventure hooks",
  },
  {
    id: "lore",
    name: "Lore & History",
    icon: "📚",
    color: "#2F4F4F",
    description: "Background information, history, and world-building",
  },
  {
    id: "tables",
    name: "Random Tables",
    icon: "🎲",
    color: "#FF6347",
    description: "Wandering monsters, random encounters, and lookup tables",
  },
  {
    id: "mechanics",
    name: "Rules & Mechanics",
    icon: "⚙️",
    color: "#708090",
    description: "House rules, special mechanics, and custom content",
  },
];

export interface MapWiki {
  sections: WikiSection[];
  categories: WikiCategory[];
  lastModified: Date;
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
  users: {
    key: string;
    value: User;
    indexes: {
      username: string;
      email: string;
    };
  };
}

const DB_NAME = "map-gallery-db";
const STORE = "maps";
const DUNGEON_STORE = "dungeonProjects";
const USER_STORE = "users";

async function getDB() {
  return openDB<MapGalleryDB>(DB_NAME, 3, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
      if (oldVersion < 2 && !db.objectStoreNames.contains(DUNGEON_STORE)) {
        db.createObjectStore(DUNGEON_STORE);
      }
      if (oldVersion < 3 && !db.objectStoreNames.contains(USER_STORE)) {
        const userStore = db.createObjectStore(USER_STORE);
        userStore.createIndex("username", "username", { unique: true });
        userStore.createIndex("email", "email", { unique: true });
      }
    },
  });
}

export async function saveMap(
  id: string,
  blob: Blob,
  name: string,
  description?: string,
  pins: PinData[] = [],
  userId?: string,
  isPublic: boolean = false
) {
  const thumb = await makeThumbnail(blob, 200, 200); // create thumbnail once here
  const db = await getDB();
  const mapRecord: MapRecord = {
    id,
    blob,
    name,
    description,
    pins,
    thumb,
    userId,
    createdAt: new Date(),
    isPublic,
  };
  await db.put(STORE, mapRecord, id);
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

export async function getDungeonProject(
  id: string
): Promise<DungeonProject | undefined> {
  const db = await getDB();
  return db.get(DUNGEON_STORE, id);
}

export async function getAllDungeonProjects(): Promise<DungeonProject[]> {
  const db = await getDB();
  const projects = await db.getAll(DUNGEON_STORE);
  return projects.sort(
    (a, b) => b.lastModified.getTime() - a.lastModified.getTime()
  );
}

export async function deleteDungeonProject(id: string) {
  const db = await getDB();
  await db.delete(DUNGEON_STORE, id);
}

export async function exportDungeonToGallery(
  projectId: string,
  mapBlob: Blob,
  mapName: string,
  mapDescription?: string,
  userId?: string
) {
  // Save the dungeon as a regular map in the gallery
  // Use projectId as part of the map ID to maintain some connection
  const mapId = projectId
    ? `dungeon-${projectId}`
    : `dungeon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await saveMap(mapId, mapBlob, mapName, mapDescription, [], userId);
  return mapId;
}

// ===== USER AUTHENTICATION FUNCTIONS =====

// Simple password hashing (in production, use bcrypt or similar)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createUser(
  username: string,
  email: string,
  password: string
): Promise<User | null> {
  try {
    const db = await getDB();

    // Check if username or email already exists
    const existingByUsername = await db.getFromIndex(
      USER_STORE,
      "username",
      username
    );
    const existingByEmail = await db.getFromIndex(USER_STORE, "email", email);

    if (existingByUsername || existingByEmail) {
      return null; // User already exists
    }

    const passwordHash = await hashPassword(password);
    const user: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username,
      email,
      passwordHash,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    await db.put(USER_STORE, user, user.id);
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
}

export async function validateUser(
  username: string,
  password: string
): Promise<User | null> {
  try {
    const db = await getDB();
    const user = await db.getFromIndex(USER_STORE, "username", username);

    if (!user) {
      return null;
    }

    const passwordHash = await hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      return null;
    }

    // Update last login time
    user.lastLoginAt = new Date();
    await db.put(USER_STORE, user, user.id);

    return user;
  } catch (error) {
    console.error("Error validating user:", error);
    return null;
  }
}

export async function getUserById(id: string): Promise<User | undefined> {
  const db = await getDB();
  return db.get(USER_STORE, id);
}

export async function getUserByUsername(
  username: string
): Promise<User | undefined> {
  const db = await getDB();
  return db.getFromIndex(USER_STORE, "username", username);
}

export async function updateUser(user: User): Promise<void> {
  const db = await getDB();
  await db.put(USER_STORE, user, user.id);
}

// ===== UPDATED MAP FUNCTIONS WITH USER SUPPORT =====

export async function getMapsForUser(userId: string): Promise<MapRecord[]> {
  const db = await getDB();
  const allMaps = await db.getAll(STORE);
  return allMaps.filter((map) => map.userId === userId);
}

export async function getPublicMaps(): Promise<MapRecord[]> {
  const db = await getDB();
  const allMaps = await db.getAll(STORE);
  return allMaps.filter((map) => map.isPublic === true);
}

// ===== UPDATED DUNGEON FUNCTIONS WITH USER SUPPORT =====

export async function getDungeonProjectsForUser(
  userId: string
): Promise<DungeonProject[]> {
  const db = await getDB();
  const allProjects = await db.getAll(DUNGEON_STORE);
  return allProjects.filter((project) => project.userId === userId);
}

export async function getPublicDungeonProjects(): Promise<DungeonProject[]> {
  const db = await getDB();
  const allProjects = await db.getAll(DUNGEON_STORE);
  return allProjects.filter((project) => project.isPublic === true);
}

// ===== WIKI FUNCTIONS =====

export async function updateMapWiki(id: string, wiki: MapWiki) {
  const db = await getDB();
  const rec = await db.get(STORE, id);
  if (!rec) throw new Error(`No map record found for id=${id}`);
  rec.wiki = wiki;
  await db.put(STORE, rec, id);
}

export async function getMapWiki(id: string): Promise<MapWiki | undefined> {
  const rec = await getMapRecord(id);
  return rec?.wiki;
}

export async function createWikiSection(
  mapId: string,
  title: string,
  content: string,
  category: WikiCategory,
  tags?: string[],
  linkedPinIds?: string[]
): Promise<WikiSection> {
  const wiki = await getMapWiki(mapId);
  const sections = wiki?.sections || [];

  const newSection: WikiSection = {
    id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    content,
    category,
    order: sections.length,
    tags,
    linkedPinIds,
    createdAt: new Date(),
    lastModified: new Date(),
  };

  const updatedWiki: MapWiki = {
    sections: [...sections, newSection],
    categories: wiki?.categories || DEFAULT_WIKI_CATEGORIES,
    lastModified: new Date(),
  };

  await updateMapWiki(mapId, updatedWiki);
  return newSection;
}

export async function updateWikiSection(
  mapId: string,
  sectionId: string,
  updates: Partial<Omit<WikiSection, "id" | "createdAt">>
): Promise<void> {
  const wiki = await getMapWiki(mapId);
  if (!wiki) throw new Error(`No wiki found for map ${mapId}`);

  const updatedSections = wiki.sections.map((section) =>
    section.id === sectionId
      ? { ...section, ...updates, lastModified: new Date() }
      : section
  );

  const updatedWiki: MapWiki = {
    ...wiki,
    sections: updatedSections,
    lastModified: new Date(),
  };

  await updateMapWiki(mapId, updatedWiki);
}

export async function deleteWikiSection(
  mapId: string,
  sectionId: string
): Promise<void> {
  const wiki = await getMapWiki(mapId);
  if (!wiki) return;

  const updatedSections = wiki.sections.filter(
    (section) => section.id !== sectionId
  );

  const updatedWiki: MapWiki = {
    ...wiki,
    sections: updatedSections,
    lastModified: new Date(),
  };

  await updateMapWiki(mapId, updatedWiki);
}

export async function linkPinToWikiSection(
  mapId: string,
  pinLabel: string,
  sectionId: string
): Promise<void> {
  const wiki = await getMapWiki(mapId);
  if (!wiki) throw new Error(`No wiki found for map ${mapId}`);

  const updatedSections = wiki.sections.map((section) =>
    section.id === sectionId
      ? {
          ...section,
          linkedPinIds: [...(section.linkedPinIds || []), pinLabel],
          lastModified: new Date(),
        }
      : section
  );

  const updatedWiki: MapWiki = {
    ...wiki,
    sections: updatedSections,
    lastModified: new Date(),
  };

  await updateMapWiki(mapId, updatedWiki);
}

export async function unlinkPinFromWikiSection(
  mapId: string,
  pinLabel: string,
  sectionId: string
): Promise<void> {
  const wiki = await getMapWiki(mapId);
  if (!wiki) return;

  const updatedSections = wiki.sections.map((section) =>
    section.id === sectionId
      ? {
          ...section,
          linkedPinIds: (section.linkedPinIds || []).filter(
            (id) => id !== pinLabel
          ),
          lastModified: new Date(),
        }
      : section
  );

  const updatedWiki: MapWiki = {
    ...wiki,
    sections: updatedSections,
    lastModified: new Date(),
  };

  await updateMapWiki(mapId, updatedWiki);
}
