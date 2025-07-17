// Constants for CenteredImage component
import { PinType } from "../idbService";

export const IMAGE_W = 10200;
export const IMAGE_H = 6600;
export const EXTENT: [number, number, number, number] = [0, 0, IMAGE_W, IMAGE_H];

// D&D Pin Types Configuration
export const DND_PIN_TYPES: PinType[] = [
  // Basic Numbered Pin
  {
    id: "numbered",
    name: "Numbered Pin",
    icon: "1",
    color: "#4169E1",
    category: "custom",
  },

  // Locations
  {
    id: "town",
    name: "Town/Village",
    icon: "🏘️",
    color: "#8B4513",
    category: "location",
  },
  {
    id: "city",
    name: "City",
    icon: "🏙️",
    color: "#4B0082",
    category: "location",
  },
  {
    id: "dungeon",
    name: "Dungeon",
    icon: "🏰",
    color: "#2F4F4F",
    category: "location",
  },
  {
    id: "forest",
    name: "Forest",
    icon: "🌲",
    color: "#228B22",
    category: "location",
  },
  {
    id: "mountain",
    name: "Mountain",
    icon: "⛰️",
    color: "#8B7355",
    category: "location",
  },
  {
    id: "water",
    name: "Water/River",
    icon: "🌊",
    color: "#1E90FF",
    category: "location",
  },
  {
    id: "desert",
    name: "Desert",
    icon: "🏜️",
    color: "#DEB887",
    category: "location",
  },
  {
    id: "ruins",
    name: "Ruins",
    icon: "🏛️",
    color: "#A0522D",
    category: "location",
  },

  // Encounters
  {
    id: "combat",
    name: "Combat Encounter",
    icon: "⚔️",
    color: "#DC143C",
    category: "encounter",
  },
  {
    id: "puzzle",
    name: "Puzzle/Riddle",
    icon: "🧩",
    color: "#FF8C00",
    category: "encounter",
  },
  {
    id: "social",
    name: "Social Encounter",
    icon: "💬",
    color: "#FFB6C1",
    category: "encounter",
  },
  {
    id: "stealth",
    name: "Stealth Challenge",
    icon: "🥷",
    color: "#696969",
    category: "encounter",
  },
  {
    id: "exploration",
    name: "Exploration",
    icon: "🧭",
    color: "#DAA520",
    category: "encounter",
  },

  // NPCs
  {
    id: "friendly_npc",
    name: "Friendly NPC",
    icon: "😊",
    color: "#00CED1",
    category: "npc",
  },
  {
    id: "neutral_npc",
    name: "Neutral NPC",
    icon: "😐",
    color: "#B8860B",
    category: "npc",
  },
  {
    id: "hostile_npc",
    name: "Hostile NPC",
    icon: "😠",
    color: "#B22222",
    category: "npc",
  },
  {
    id: "merchant",
    name: "Merchant/Trader",
    icon: "💰",
    color: "#FFD700",
    category: "npc",
  },
  {
    id: "quest_giver",
    name: "Quest Giver",
    icon: "❗",
    color: "#FF4500",
    category: "npc",
  },
  {
    id: "boss",
    name: "Boss/Important Enemy",
    icon: "👑",
    color: "#8B0000",
    category: "npc",
  },
  {
    id: "ally",
    name: "Ally/Helper",
    icon: "🤝",
    color: "#32CD32",
    category: "npc",
  },

  // Treasure & Items
  {
    id: "treasure",
    name: "Treasure",
    icon: "💎",
    color: "#FFD700",
    category: "treasure",
  },
  {
    id: "loot",
    name: "Loot Cache",
    icon: "📦",
    color: "#CD853F",
    category: "treasure",
  },
  {
    id: "magic_item",
    name: "Magic Item",
    icon: "✨",
    color: "#9932CC",
    category: "treasure",
  },
  {
    id: "secret",
    name: "Secret/Hidden",
    icon: "🔍",
    color: "#2F4F4F",
    category: "treasure",
  },

  // Hazards & Traps
  {
    id: "trap",
    name: "Trap",
    icon: "🪤",
    color: "#FF6347",
    category: "hazard",
  },
  {
    id: "hazard",
    name: "Environmental Hazard",
    icon: "⚠️",
    color: "#FF8C00",
    category: "hazard",
  },
  {
    id: "poison",
    name: "Poison/Disease",
    icon: "☠️",
    color: "#9ACD32",
    category: "hazard",
  },
  {
    id: "magic_zone",
    name: "Magic Zone",
    icon: "🌟",
    color: "#FF69B4",
    category: "hazard",
  },

  // Custom/Misc
  {
    id: "objective",
    name: "Objective",
    icon: "🎯",
    color: "#20B2AA",
    category: "custom",
  },
  {
    id: "rest_area",
    name: "Rest Area",
    icon: "🛡️",
    color: "#6B8E23",
    category: "custom",
  },
  {
    id: "portal",
    name: "Portal/Teleporter",
    icon: "🌀",
    color: "#8A2BE2",
    category: "custom",
  },
  {
    id: "note",
    name: "General Note",
    icon: "📝",
    color: "#4682B4",
    category: "custom",
  },
];
