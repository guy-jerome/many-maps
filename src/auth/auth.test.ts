// src/auth/auth.test.ts
import { createUser, validateUser, getMapsForUser, getDungeonProjectsForUser } from "../idbService";

/**
 * Test suite for authentication functionality
 */
export async function runAuthTests() {
  const results = {
    createUser: false,
    validateUser: false,
    getMapsForUser: false,
    getDungeonProjectsForUser: false,
    errors: [] as string[]
  };

  try {
    // Test 1: Create a user
    const testUser = await createUser("testuser", "test@example.com", "testpassword");
    if (testUser) {
      results.createUser = true;
      console.log("✅ User creation test passed");
    } else {
      results.errors.push("Failed to create user");
    }

    // Test 2: Validate user
    const validatedUser = await validateUser("testuser", "testpassword");
    if (validatedUser && validatedUser.username === "testuser") {
      results.validateUser = true;
      console.log("✅ User validation test passed");
    } else {
      results.errors.push("Failed to validate user");
    }

    // Test 3: Get user maps (should return empty array)
    if (testUser) {
      const userMaps = await getMapsForUser(testUser.id);
      if (Array.isArray(userMaps)) {
        results.getMapsForUser = true;
        console.log("✅ Get user maps test passed");
      } else {
        results.errors.push("Failed to get user maps");
      }
    }

    // Test 4: Get user dungeon projects (should return empty array)
    if (testUser) {
      const userProjects = await getDungeonProjectsForUser(testUser.id);
      if (Array.isArray(userProjects)) {
        results.getDungeonProjectsForUser = true;
        console.log("✅ Get user dungeon projects test passed");
      } else {
        results.errors.push("Failed to get user dungeon projects");
      }
    }

  } catch (error) {
    results.errors.push(`Test suite error: ${error}`);
  }

  return results;
}

/**
 * Run tests in development mode
 */
if (import.meta.env.DEV) {
  console.log("Running authentication tests...");
  runAuthTests().then(results => {
    console.log("Test results:", results);
  });
}
