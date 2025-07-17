// src/utils/dataMigration.ts
import { getAllMaps, getAllDungeonProjects, saveMap, saveDungeonProject } from "../idbService";

export interface MigrationResult {
  success: boolean;
  migratedMaps: number;
  migratedProjects: number;
  errors: string[];
}

/**
 * Migrates existing maps and projects to be owned by the current user
 */
export async function migrateUserData(userId: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migratedMaps: 0,
    migratedProjects: 0,
    errors: []
  };

  try {
    // Get all existing maps
    const maps = await getAllMaps();
    for (const map of maps) {
      try {
        // Check if map already has an owner
        const mapRecord = await import("../idbService").then(m => m.getMapRecord(map.id));
        if (mapRecord && !mapRecord.userId) {
          // Migrate this map to the current user
          await saveMap(
            map.id,
            map.blob,
            map.name,
            map.description,
            mapRecord.pins || [],
            userId,
            false // Default to private
          );
          result.migratedMaps++;
        }
      } catch (error) {
        result.errors.push(`Failed to migrate map ${map.name}: ${error}`);
      }
    }

    // Get all existing dungeon projects
    const projects = await getAllDungeonProjects();
    for (const project of projects) {
      try {
        // Check if project already has an owner
        if (!project.userId) {
          // Migrate this project to the current user
          const updatedProject = {
            ...project,
            userId,
            isPublic: false // Default to private
          };
          await saveDungeonProject(updatedProject);
          result.migratedProjects++;
        }
      } catch (error) {
        result.errors.push(`Failed to migrate project ${project.name}: ${error}`);
      }
    }

    result.success = result.errors.length === 0;
    return result;

  } catch (error) {
    result.errors.push(`Migration failed: ${error}`);
    return result;
  }
}

/**
 * Checks if data migration is needed
 */
export async function needsMigration(): Promise<boolean> {
  try {
    const maps = await getAllMaps();
    const projects = await getAllDungeonProjects();
    
    // Check if any maps or projects exist without user ownership
    const hasUnownedMaps = maps.some(async (map) => {
      const mapRecord = await import("../idbService").then(m => m.getMapRecord(map.id));
      return mapRecord && !mapRecord.userId;
    });
    
    const hasUnownedProjects = projects.some(project => !project.userId);
    
    return hasUnownedMaps || hasUnownedProjects;
  } catch (error) {
    console.error("Error checking migration status:", error);
    return false;
  }
}
