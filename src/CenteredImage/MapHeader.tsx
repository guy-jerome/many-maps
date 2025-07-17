// Map header component for name, description, and metadata
import React from "react";
import { updateMapMeta } from "../idbService";

interface MapHeaderProps {
  mapId: string;
  mapName: string;
  mapDescription: string;
  editingMeta: boolean;
  editName: string;
  editDesc: string;
  metaSaving: boolean;
  descOpen: boolean;
  setMapName: (name: string) => void;
  setMapDescription: (desc: string) => void;
  setEditingMeta: (editing: boolean) => void;
  setEditName: (name: string) => void;
  setEditDesc: (desc: string) => void;
  setMetaSaving: (saving: boolean) => void;
  setDescOpen: (open: boolean) => void;
}

const MapHeader: React.FC<MapHeaderProps> = ({
  mapId,
  mapName,
  mapDescription,
  editingMeta,
  editName,
  editDesc,
  metaSaving,
  descOpen,
  setMapName,
  setMapDescription,
  setEditingMeta,
  setEditName,
  setEditDesc,
  setMetaSaving,
  setDescOpen,
}) => {
  const handleMetaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMetaSaving(true);
    await updateMapMeta(mapId, editName, editDesc);
    setMapName(editName);
    setMapDescription(editDesc);
    setEditingMeta(false);
    setMetaSaving(false);
  };

  return (
    <>
      <div className="ci-map-name-block">
        {editingMeta ? (
          <form className="ci-meta-edit-form" onSubmit={handleMetaSubmit}>
            <input
              className="ci-meta-edit-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={metaSaving}
              maxLength={80}
              required
            />
            <textarea
              className="ci-meta-edit-textarea"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={2}
              disabled={metaSaving}
              maxLength={400}
              placeholder="Description (optional)"
            />
            <div className="ci-meta-edit-actions">
              <button
                type="submit"
                className="ci-meta-edit-save"
                disabled={metaSaving}
              >
                Save
              </button>
              <button
                type="button"
                className="ci-meta-edit-cancel"
                disabled={metaSaving}
                onClick={() => setEditingMeta(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <span className="ci-map-name">{mapName}</span>
            {mapDescription && (
              <button
                className="ci-map-desc-btn"
                onClick={() => setDescOpen(true)}
                title="Show map description"
              >
                ℹ️
              </button>
            )}
            <button
              className="ci-map-meta-edit-btn"
              onClick={() => setEditingMeta(true)}
              title="Edit map name/description"
            >
              ✎
            </button>
          </>
        )}
      </div>

      {descOpen && (
        <div className="ci-desc-modal-bg" onClick={() => setDescOpen(false)}>
          <div className="ci-desc-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Description</h2>
            <div className="ci-desc-content">{mapDescription}</div>
            <button
              className="ci-desc-close"
              onClick={() => setDescOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MapHeader;
