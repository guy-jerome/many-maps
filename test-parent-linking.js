// Test script to verify parent map linking functionality
console.log("Testing parent map linking...");

// This script can be run in the browser console to test the parent map linking

// Function to create test maps with linked pins
async function createTestMaps() {
  console.log("Creating test maps...");
  
  // Import the DB service functions
  const { saveMap, updateMapPins, getAllMaps, getMapRecord } = window;
  
  if (!saveMap) {
    console.error("DB service functions not available. Make sure to run this in the browser console while the app is loaded.");
    return;
  }
  
  try {
    // Create a simple test image (1x1 pixel PNG)
    const createTestBlob = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = '#000';
      ctx.fillText('Test Map', 10, 20);
      return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    };
    
    const testBlob = await createTestBlob();
    
    // Create first map (parent)
    const parentMapId = await saveMap(testBlob, "Parent Map", "This is the parent map");
    console.log("Created parent map:", parentMapId);
    
    // Create second map (child)
    const childMapId = await saveMap(testBlob, "Child Map", "This is the child map");
    console.log("Created child map:", childMapId);
    
    // Add a pin to the parent map that links to the child map
    const parentMapPins = [
      {
        id: "pin1",
        x: 100,
        y: 100,
        label: "Portal to Child Map",
        info: "This pin links to the child map",
        areaName: "Portal Area",
        extraSections: [],
        linkedMapId: childMapId,
        tags: ["portal", "link"],
        pinType: {
          id: "portal",
          name: "Portal",
          icon: "🚪",
          color: "#0066cc",
          category: "location"
        }
      }
    ];
    
    await updateMapPins(parentMapId, parentMapPins);
    console.log("Added linking pin to parent map");
    
    // Add a regular pin to the child map
    const childMapPins = [
      {
        id: "pin2",
        x: 150,
        y: 150,
        label: "Child Map Pin",
        info: "This is a regular pin in the child map",
        areaName: "Test Area",
        extraSections: [],
        tags: ["test"],
        pinType: {
          id: "location",
          name: "Location",
          icon: "📍",
          color: "#ff0000",
          category: "location"
        }
      }
    ];
    
    await updateMapPins(childMapId, childMapPins);
    console.log("Added regular pin to child map");
    
    // Test: Check if parent map relationship is detected
    const allMaps = await getAllMaps();
    console.log("All maps:", allMaps.map(m => ({id: m.id, name: m.name})));
    
    // Check parent map logic
    const parentMapRecord = await getMapRecord(parentMapId);
    console.log("Parent map pins:", parentMapRecord.pins);
    
    // Verify the linking pin
    const linkingPin = parentMapRecord.pins.find(p => p.linkedMapId === childMapId);
    console.log("Linking pin found:", linkingPin);
    
    console.log("✅ Test maps created successfully!");
    console.log("Now navigate to the child map to see if the parent map appears in the sidebar");
    console.log("Child map URL:", `http://localhost:5177/map/${childMapId}`);
    console.log("Parent map URL:", `http://localhost:5177/map/${parentMapId}`);
    
    return { parentMapId, childMapId };
  } catch (error) {
    console.error("Error creating test maps:", error);
  }
}

// Function to verify parent map detection
async function verifyParentMapDetection(childMapId) {
  const { getAllMaps, getMapRecord } = window;
  
  try {
    const allMaps = await getAllMaps();
    const mapList = allMaps.map(m => ({ id: m.id, name: m.name }));
    
    console.log("Verifying parent map detection for child map:", childMapId);
    
    const parents = [];
    for (const { id, name } of mapList) {
      if (id === childMapId) continue;
      const rec = await getMapRecord(id);
      if (rec?.pins.some(p => p.linkedMapId === childMapId)) {
        parents.push({ id, name });
      }
    }
    
    console.log("Parents found:", parents);
    return parents;
  } catch (error) {
    console.error("Error verifying parent map detection:", error);
  }
}

// Export functions for manual testing
window.createTestMaps = createTestMaps;
window.verifyParentMapDetection = verifyParentMapDetection;

console.log("Test functions loaded. Run:");
console.log("- createTestMaps() to create test maps with linking");
console.log("- verifyParentMapDetection(childMapId) to verify parent detection");
