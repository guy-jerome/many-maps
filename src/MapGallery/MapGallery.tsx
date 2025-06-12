import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllMaps, deleteMap } from '../idbService';
import './MapGallery.css';

interface RawMapEntry {
  id: string;
  blob: Blob;
  name: string;
  description?: string;
}

interface MapEntry extends RawMapEntry {
  url: string;
  loading: boolean;
}

const MapGallery: React.FC = () => {
  const navigate = useNavigate();
  const [maps, setMaps] = useState<MapEntry[]>([]);

  // Load all maps and create object URLs
  useEffect(() => {
    let isCancelled = false;
    getAllMaps().then((raw) => {
      if (isCancelled) return;
      const entries = raw.map((r) => ({
        ...r,
        url: URL.createObjectURL(r.blob),
        loading: true,
      }));
      setMaps(entries);
    });
    // cleanup: revoke all object URLs on unmount
    return () => {
      isCancelled = true;
      maps.forEach((m) => URL.revokeObjectURL(m.url));
    };
  }, []);

  // When the <img> loads (or errors), hide that spinner
  const handleImageEvent = (id: string) => {
    setMaps((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              loading: false,
            }
          : m
      )
    );
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this map? This cannot be undone.')) {
      await deleteMap(id);
      setMaps((prev) => prev.filter((m) => m.id !== id));
      URL.revokeObjectURL(maps.find((m) => m.id === id)!.url);
    }
  };

  return (
    <div className="mg-container">
      <h1>Select a Map</h1>
      <div className="mg-grid">
        {maps.map((m) => (
          <div
            key={m.id}
            className="mg-card"
            onClick={() => navigate(`/map/${m.id}`)}
          >
            {m.loading && (
              <div className="mg-spinner-overlay">
                <div className="mg-spinner" />
              </div>
            )}
            <button
              className="mg-delete-btn"
              onClick={(e) => handleDelete(m.id, e)}
              title="Delete map"
            >
              ×
            </button>
            <img
              src={m.url}
              alt={m.name}
              className="mg-thumb"
              onLoad={() => handleImageEvent(m.id)}
              onError={() => handleImageEvent(m.id)}
            />
            <div className="mg-info">
              <strong>{m.name}</strong>
              {m.description && (
                <p className="mg-desc">{m.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapGallery;
