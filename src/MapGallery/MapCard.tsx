// src/MapGallery/MapCard.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateMapMeta } from "../idbService";

interface Props {
  id: string;
  url: string;
  name: string;
  description?: string;
  loading: boolean;
  onLoad: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const MapCard: React.FC<Props> = React.memo(
  ({ id, url, name, description, loading, onLoad, onDelete }) => {
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState(name);
    const [editDesc, setEditDesc] = useState(description || "");
    const [saving, setSaving] = useState(false);

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditing(true);
    };
    const handleCancel = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditing(false);
      setEditName(name);
      setEditDesc(description || "");
    };
    const handleSave = async (e: React.MouseEvent) => {
      e.stopPropagation();
      setSaving(true);
      await updateMapMeta(id, editName, editDesc);
      setSaving(false);
      setEditing(false);
      // Optionally, reload page or trigger parent refresh
      window.location.reload();
    };

    return (
      <div className="mg-card" onClick={() => navigate(`/map/${id}`)}>
        {loading && (
          <div className="mg-spinner-overlay">
            <div className="mg-spinner" />
          </div>
        )}
        <button
          className="mg-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(e);
          }}
        >
          ×
        </button>
        <button
          className="mg-edit-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(e);
          }}
          title="Edit map info"
        >
          ✎
        </button>
        <img
          src={url}
          alt={name}
          className="mg-thumb"
          onLoad={onLoad}
          onError={onLoad}
        />
        <div
          className="mg-info"
          onClick={(e) => editing && e.stopPropagation()}
        >
          {editing ? (
            <div className="mg-edit-form" onClick={(e) => e.stopPropagation()}>
              <input
                className="mg-edit-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={saving}
              />
              <textarea
                className="mg-edit-textarea"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={2}
                disabled={saving}
              />
              <div className="mg-edit-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave(e);
                  }}
                  disabled={saving}
                  className="mg-edit-save"
                >
                  Save
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancel(e);
                  }}
                  disabled={saving}
                  className="mg-edit-cancel"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <strong>{name}</strong>
              {description && <p className="mg-desc">{description}</p>}
            </>
          )}
        </div>
      </div>
    );
  }
);
