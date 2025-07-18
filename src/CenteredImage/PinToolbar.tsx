// Pin toolbar component
import React from "react";
import { PinData, PinType } from "../idbService";
import { filterPinTypes, calculatePinCounts } from "./mapHelpers";

interface PinToolbarProps {
  isAdding: boolean;
  isDeleting: boolean;
  showPinPanel: boolean;
  onAddToggle: () => void;
  onDeleteToggle: () => void;
  onPinPanelToggle: () => void;
  pins: PinData[];
  selectedPinType: PinType;
  onPinTypeSelect: (pinType: PinType) => void;
  pinCategory: string;
  onPinCategoryChange: (category: string) => void;
  pinSearch: string;
  onPinSearchChange: (search: string) => void;
}

const PinToolbar: React.FC<PinToolbarProps> = ({
  isAdding,
  isDeleting,
  showPinPanel,
  onAddToggle,
  onDeleteToggle,
  onPinPanelToggle,
  pins,
  selectedPinType,
  onPinTypeSelect,
  pinCategory,
  onPinCategoryChange,
  pinSearch,
  onPinSearchChange,
}) => {
  const pinCounts = calculatePinCounts(pins);
  const filteredPinTypes = filterPinTypes(pinCategory, pinSearch);

  return (
    <div
      className={`ci-pin-toolbar ${showPinPanel ? "panel-open" : ""}`}
    >
      {/* Mode Toggle Buttons */}
      <div className="ci-mode-section">
        <button
          className={`ci-mode-btn ${isAdding ? "active" : ""}`}
          onClick={onAddToggle}
          title="Add pins to the map"
        >
          📍 Add Pin
        </button>

        <button
          className={`ci-mode-btn ${isDeleting ? "active" : ""}`}
          onClick={onDeleteToggle}
          title="Delete pins from the map"
        >
          🗑️ Delete
        </button>

        <button
          className="ci-mode-btn"
          onClick={onPinPanelToggle}
          title="Show/hide pin types panel"
        >
          ⚙️ Pin Types
        </button>
      </div>

      {/* Pin Types Panel */}
      {showPinPanel && (
        <div className="ci-pin-panel">
          <div className="ci-pin-panel-header">
            <h3>Select Pin Type ({pins.length} pins total)</h3>
            <select
              value={pinCategory}
              onChange={(e) => onPinCategoryChange(e.target.value)}
              className="ci-category-filter"
            >
              <option value="all">All Categories</option>
              <option value="location">Locations</option>
              <option value="encounter">Encounters</option>
              <option value="npc">NPCs</option>
              <option value="treasure">Treasure</option>
              <option value="hazard">Hazards</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="ci-pin-search">
            <input
              type="text"
              placeholder="Search pin types..."
              value={pinSearch}
              onChange={(e) => onPinSearchChange(e.target.value)}
              className="ci-search-input"
            />
          </div>

          <div className="ci-pin-grid">
            {filteredPinTypes.map((pinType) => {
              const pinCount = pinCounts[pinType.id] || 0;
              return (
                <button
                  key={pinType.id}
                  className={`ci-pin-type-btn ${
                    selectedPinType.id === pinType.id ? "selected" : ""
                  }`}
                  onClick={() => onPinTypeSelect(pinType)}
                  style={{
                    backgroundColor: pinType.color,
                    border:
                      selectedPinType.id === pinType.id
                        ? "3px solid #ffffff"
                        : "1px solid #666",
                  }}
                  title={`${pinType.name} (${pinCount} on map)`}
                >
                  <span className="ci-pin-icon">{pinType.icon}</span>
                  <span className="ci-pin-name">{pinType.name}</span>
                  {pinCount > 0 && (
                    <span className="ci-pin-count">{pinCount}</span>
                  )}
                </button>
              );
            })}
          </div>

          {isAdding && (
            <div className="ci-pin-instructions">
              <p>
                📍 <strong>Selected:</strong> {selectedPinType.name}
              </p>
              <p>Click anywhere on the map to place this pin type</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PinToolbar;
