// src/MapGallery/MapCard.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

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
    return (
      <div className="mg-card" onClick={() => navigate(`/map/${id}`)}>
        {loading && (
          <div className="mg-spinner-overlay">
            <div className="mg-spinner" />
          </div>
        )}
        <button className="mg-delete-btn" onClick={onDelete}>
          ×
        </button>
        <img
          src={url}
          alt={name}
          className="mg-thumb"
          onLoad={onLoad}
          onError={onLoad}
        />
        <div className="mg-info">
          <strong>{name}</strong>
          {description && <p className="mg-desc">{description}</p>}
        </div>
      </div>
    );
  }
);
