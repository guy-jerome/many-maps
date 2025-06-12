// src/MapGallery/MapGallery.tsx
import React, { useEffect, useState } from 'react';
import { getAllMaps, deleteMap } from '../idbService';
import { NewMapForm } from './NewMapForm';
import { MapCard } from './MapCard';
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

export const MapGallery: React.FC = () => {
  const [maps, setMaps] = useState<MapEntry[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Load all maps and create object URLs
  useEffect(() => {
    let cancelled = false;
    getAllMaps().then(raw => {
      if (cancelled) return;
      const entries = raw.map(r => ({
        ...r,
        url: URL.createObjectURL(r.blob),
        loading: true,
      }));
      setMaps(entries);
    });
    return () => {
      cancelled = true;
      maps.forEach(m => URL.revokeObjectURL(m.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When an image loads (or errors), mark loading false
  const handleImageEvent = (id: string) => {
    setMaps(prev =>
      prev.map(m =>
        m.id === id ? { ...m, loading: false } : m
      )
    );
  };

  // Delete a map (and revoke its URL)
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this map? This cannot be undone.')) return;

    // Perform deletion (also cleans up any linkedMapId references)
    await deleteMap(id);

    setMaps(prev => {
      const filtered = prev.filter(m => m.id !== id);
      const gone = prev.find(m => m.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return filtered;
    });
  };

  // Reload maps after a new one is saved
  const reloadMaps = async () => {
    const raw = await getAllMaps();
    const entries = raw.map(r => ({
      ...r,
      url: URL.createObjectURL(r.blob),
      loading: true,
    }));
    setMaps(entries);
  };

  return (
    <div className="mg-container">
      <h1>Select a Map</h1>

      <div className="mg-add-container">
        <button className="mg-add-btn" onClick={() => setShowForm(true)}>
          <span className="mg-add-icon">＋</span>
          Add New Map
        </button>
      </div>

      {showForm && (
        <NewMapForm
          onCancel={() => setShowForm(false)}
          onSaved={async () => {
            setShowForm(false);
            // revoke old URLs
            maps.forEach(m => URL.revokeObjectURL(m.url));
            await reloadMaps();
          }}
        />
      )}

      <div className="mg-grid">
        {maps.map(m => (
          <MapCard
            key={m.id}
            id={m.id}
            url={m.url}
            name={m.name}
            description={m.description}
            loading={m.loading}
            onLoad={() => handleImageEvent(m.id)}
            onDelete={e => handleDelete(m.id, e)}
          />
        ))}
      </div>
    </div>
  );
};

export default MapGallery;
