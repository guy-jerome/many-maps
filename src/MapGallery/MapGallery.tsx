// src/MapGallery/MapGallery.tsx
import React, { useEffect, useState, useCallback } from "react";
import { deleteMap, getMapsForUser } from "../idbService";
import { NewMapForm } from "./NewMapForm";
import { MapCard } from "./MapCard";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./MapGallery.css";

interface MapEntry {
  id: string;
  fullUrl: string;
  thumbUrl: string;
  name: string;
  description?: string;
  loading: boolean;
}

export const MapGallery: React.FC = () => {
  const [maps, setMaps] = useState<MapEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load maps (full + thumb URLs) from IndexedDB
  const loadMaps = useCallback(async () => {
    // Clean up old object URLs
    maps.forEach(({ fullUrl, thumbUrl }) => {
      URL.revokeObjectURL(fullUrl);
      URL.revokeObjectURL(thumbUrl);
    });

    // Get user-specific maps only
    if (!user) {
      setMaps([]);
      return;
    }

    const raws = await getMapsForUser(user.id);
    const entries: MapEntry[] = raws.map((r) => {
      const fullUrl = URL.createObjectURL(r.blob);
      const thumbBlob = (r as any).thumb ?? r.blob;
      const thumbUrl = URL.createObjectURL(thumbBlob);
      return {
        id: r.id,
        fullUrl,
        thumbUrl,
        name: r.name,
        description: r.description,
        loading: true,
      };
    });
    setMaps(entries);
  }, [maps, user]);

  // On mount, load maps once
  useEffect(() => {
    loadMaps();
    return () => {
      // cleanup when unmounting
      maps.forEach(({ fullUrl, thumbUrl }) => {
        URL.revokeObjectURL(fullUrl);
        URL.revokeObjectURL(thumbUrl);
      });
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageEvent = (id: string) => {
    setMaps((prev) =>
      prev.map((m) => (m.id === id ? { ...m, loading: false } : m))
    );
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this map?")) return;
    await deleteMap(id);
    setMaps((prev) => {
      const gone = prev.find((m) => m.id === id);
      if (gone) {
        URL.revokeObjectURL(gone.fullUrl);
        URL.revokeObjectURL(gone.thumbUrl);
      }
      return prev.filter((m) => m.id !== id);
    });
  };

  return (
    <div className="mg-container">
      <button className="mg-back-btn" onClick={() => navigate("/")}>
        ⟵ Back to Home
      </button>
      <h1>My Maps</h1>
      
      <div className="mg-add-container">
        {user ? (
          <button className="mg-add-btn" onClick={() => setShowForm(true)}>
            <span className="mg-add-icon">＋</span>
            Add New Map
          </button>
        ) : (
          <p className="mg-auth-prompt">
            Please log in to create and view your maps.
          </p>
        )}
      </div>

      {showForm && (
        <NewMapForm
          onCancel={() => setShowForm(false)}
          onSaved={async () => {
            setShowForm(false);
            await loadMaps();
          }}
        />
      )}

      <div className="mg-grid">
        {maps.map((m) => (
          <MapCard
            key={m.id}
            id={m.id}
            url={m.thumbUrl}
            name={m.name}
            description={m.description}
            loading={m.loading}
            onLoad={() => handleImageEvent(m.id)}
            onDelete={(e) => handleDelete(m.id, e)}
          />
        ))}
      </div>
    </div>
  );
};

export default MapGallery;
