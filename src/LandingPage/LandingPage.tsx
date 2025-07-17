import React from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  // Auto-login with default username
  const [username] = React.useState("DM");

  return (
    <div className="landing-bg">
      <div className="landing-container">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="hero-icon">🏰</span>
              D&D Map Assistant
            </h1>
            <p className="hero-subtitle">
              Your Ultimate Tool for Creating Interactive D&D Maps and Dungeons
            </p>
            <p className="hero-description">
              Welcome, {username}! Transform your tabletop adventures with powerful 
              map creation tools, pin management, and dungeon building features.
            </p>
            
            <div className="hero-actions">
              <button className="primary-btn" onClick={() => navigate("/gallery")}>
                <span className="btn-icon">🗺️</span>
                Browse Maps
              </button>
              <button className="secondary-btn" onClick={() => navigate("/dungeon")}>
                <span className="btn-icon">⚒️</span>
                Create Dungeon
              </button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="features-section">
          <h2 className="section-title">Powerful Features for DMs</h2>
          
          <div className="features-grid">
            {/* Interactive Maps */}
            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h3>Interactive Maps</h3>
              <p>Upload and manage your campaign maps with intuitive zoom, pan, and navigation controls.</p>
              <ul className="feature-list">
                <li>High-resolution map support</li>
                <li>Smooth zoom and pan controls</li>
                <li>Responsive design for all devices</li>
                <li>Map gallery with thumbnails</li>
              </ul>
            </div>

            {/* Pin Management */}
            <div className="feature-card">
              <div className="feature-icon">📍</div>
              <h3>Smart Pin System</h3>
              <p>Add detailed pins to mark important locations, encounters, NPCs, and more.</p>
              <ul className="feature-list">
                <li>12+ pin types (towns, dungeons, encounters)</li>
                <li>Rich text descriptions with sections</li>
                <li>Search and filter functionality</li>
                <li>Custom numbered pins</li>
              </ul>
            </div>

            {/* Dungeon Editor */}
            <div className="feature-card">
              <div className="feature-icon">🏰</div>
              <h3>Advanced Dungeon Editor</h3>
              <p>Create detailed dungeon maps with professional drawing tools and D&D-specific features.</p>
              <ul className="feature-list">
                <li>Multiple drawing tools (walls, doors, shapes)</li>
                <li>100+ D&D icons and symbols</li>
                <li>Layers and masking system</li>
                <li>Grid snapping and alignment</li>
              </ul>
            </div>

            {/* Project Management */}
            <div className="feature-card">
              <div className="feature-icon">💾</div>
              <h3>Project Management</h3>
              <p>Save, load, and organize your dungeon projects with comprehensive project tracking.</p>
              <ul className="feature-list">
                <li>Save/load dungeon projects</li>
                <li>Project thumbnails and metadata</li>
                <li>Export to map gallery</li>
                <li>JPEG export for sharing</li>
              </ul>
            </div>

            {/* Drawing Tools */}
            <div className="feature-card">
              <div className="feature-icon">✏️</div>
              <h3>Professional Drawing Tools</h3>
              <p>Complete set of drawing tools designed specifically for dungeon mapping.</p>
              <ul className="feature-list">
                <li>Lines, rectangles, circles, polygons</li>
                <li>Freehand drawing with smoothing</li>
                <li>Eraser and selection tools</li>
                <li>Rotation and resize handles</li>
              </ul>
            </div>

            {/* D&D Assets */}
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>D&D Symbol Library</h3>
              <p>Extensive collection of classic D&D symbols and icons for authentic dungeon mapping.</p>
              <ul className="feature-list">
                <li>Furniture and room features</li>
                <li>Traps and hazards</li>
                <li>Treasures and magical items</li>
                <li>Creatures and environmental elements</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Pin Types Preview */}
        <div className="pin-types-section">
          <h2 className="section-title">Pin Types Available</h2>
          <div className="pin-types-grid">
            <div className="pin-type-category">
              <h4>📍 Locations</h4>
              <div className="pin-type-list">
                <span className="pin-type">🏘️ Towns</span>
                <span className="pin-type">🏙️ Cities</span>
                <span className="pin-type">🏰 Dungeons</span>
                <span className="pin-type">🌲 Forests</span>
                <span className="pin-type">⛰️ Mountains</span>
                <span className="pin-type">🌊 Waters</span>
              </div>
            </div>
            <div className="pin-type-category">
              <h4>⚔️ Encounters</h4>
              <div className="pin-type-list">
                <span className="pin-type">⚔️ Combat</span>
                <span className="pin-type">🧩 Puzzles</span>
                <span className="pin-type">💬 Social</span>
                <span className="pin-type">🔍 Stealth</span>
                <span className="pin-type">🎲 Random</span>
              </div>
            </div>
            <div className="pin-type-category">
              <h4>👤 Characters</h4>
              <div className="pin-type-list">
                <span className="pin-type">👑 Important NPCs</span>
                <span className="pin-type">🛡️ Allies</span>
                <span className="pin-type">👹 Enemies</span>
                <span className="pin-type">🏪 Merchants</span>
                <span className="pin-type">📚 Quest Givers</span>
              </div>
            </div>
            <div className="pin-type-category">
              <h4>💎 Items & Hazards</h4>
              <div className="pin-type-list">
                <span className="pin-type">💰 Treasures</span>
                <span className="pin-type">🏺 Artifacts</span>
                <span className="pin-type">⚠️ Traps</span>
                <span className="pin-type">☠️ Hazards</span>
                <span className="pin-type">🔮 Secrets</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="quickstart-section">
          <h2 className="section-title">Quick Start Guide</h2>
          <div className="quickstart-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Upload Your Map</h4>
                <p>Start by uploading your campaign map image to the gallery</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Add Pins</h4>
                <p>Click anywhere on your map to add pins with detailed descriptions</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Create Dungeons</h4>
                <p>Use the dungeon editor to draw custom dungeon layouts</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Run Your Game</h4>
                <p>Navigate your maps during gameplay with smooth zoom and search</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <p>Ready to enhance your D&D campaigns? Start exploring your maps or create new dungeons!</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
