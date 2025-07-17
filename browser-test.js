// Simple test script to verify parent map linking
// Copy and paste this into the browser console

async function testParentMapLinking() {
  console.log("🚀 Starting parent map linking test...");
  
  // Check if database service is available
  if (typeof window.dbService === 'undefined') {
    console.error("❌ Database service not available. Make sure the app is loaded.");
    return;
  }
  
  const { saveMap, getAllMaps, getMapRecord, updateMapPins } = window.dbService;
  
  try {
    // Create a simple test image blob
    const createTestImage = (text) => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      
      // Background
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, 300, 200);
      
      // Border
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 300, 200);
      
      // Text
      ctx.fillStyle = '#333';
      ctx.font = '16px Arial';
      ctx.fillText(text, 10, 30);
      
      return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    };
    
    // Create test maps
    const parentBlob = await createTestImage('Parent Map Test');
    const childBlob = await createTestImage('Child Map Test');
    
    console.log("🗺️ Creating parent map...");
    const parentMapId = await saveMap(parentBlob, "Test Parent Map", "This is a test parent map");
    
    console.log("🗺️ Creating child map...");
    const childMapId = await saveMap(childBlob, "Test Child Map", "This is a test child map");
    
    console.log("📍 Adding linking pin to parent map...");
    // Add a pin to the parent map that links to the child
    const parentPins = [{
      id: `pin-${Date.now()}`,
      x: 150,
      y: 100,
      label: "Portal to Child Map",
      info: "This pin links to the child map",
      areaName: "Portal Area",
      extraSections: [],
      linkedMapId: childMapId,
      tags: ["portal", "test"],
      pinType: {
        id: "portal",
        name: "Portal",
        icon: "🚪",
        color: "#0066cc",
        category: "location"
      }
    }];
    
    await updateMapPins(parentMapId, parentPins);
    
    console.log("✅ Test setup complete!");
    console.log("🔗 Parent map ID:", parentMapId);
    console.log("🔗 Child map ID:", childMapId);
    console.log("💡 Navigate to the child map to see if the parent appears in the sidebar");
    
    // Navigate to the child map
    const childMapUrl = `/map/${childMapId}`;
    window.location.hash = childMapUrl;
    
    console.log("📱 Navigated to child map. Check the sidebar for 'Parent Maps' section!");
    
    return { parentMapId, childMapId };
    
  } catch (error) {
    console.error("❌ Error during test:", error);
  }
}

// Run the test
testParentMapLinking();
