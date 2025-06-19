// src/MapGallery/MapGallery.tsx
import React, { useEffect, useState } from 'react';
import { getAllMaps, deleteMap } from '../idbService';
import { NewMapForm } from './NewMapForm';
import { MapCard } from './MapCard';
import { makeThumbnail } from '../utils/makeThumbnail';
import './MapGallery.css';

interface MapEntry {
  id: string;
  fullUrl: string;   // object URL for full-res
  thumbUrl: string;  // object URL for thumbnail
  name: string;
  description?: string;
  loading: boolean;
}


export const MapGallery: React.FC = () => {
  const [maps, setMaps] = useState<MapEntry[]>([]);
  const [showForm, setShowForm] = useState(false);

  // On mount: load all maps, build full- and thumb-URLs
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const raws = await getAllMaps();
      const entries: MapEntry[] = await Promise.all(
        raws.map(async (r) => {
          const fullUrl = URL.createObjectURL(r.blob);
          // make a 200×200 thumbnail
          let thumbBlob: Blob;
          try {
            thumbBlob = await makeThumbnail(r.blob, 200, 200);
          } catch {
            thumbBlob = r.blob; // fallback to original
          }
          const thumbUrl = URL.createObjectURL(thumbBlob);
          return {
            id: r.id,
            fullUrl,
            thumbUrl,
            name: r.name,
            description: r.description,
            loading: true,
          };
        })
      );
      if (!cancelled) setMaps(entries);
    })();
    return () => {
      cancelled = true;
      maps.forEach((m) => {
        URL.revokeObjectURL(m.fullUrl);
        URL.revokeObjectURL(m.thumbUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageEvent = (id: string) => {
    setMaps((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, loading: false } : m
      )
    );
  };

  const handleDelete = async (
    id: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!window.confirm('Delete this map?')) return;
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

  const reload = async () => {
    // revoke old
    maps.forEach((m) => {
      URL.revokeObjectURL(m.fullUrl);
      URL.revokeObjectURL(m.thumbUrl);
    });
    // repeat the load logic
    const raws = await getAllMaps();
    const entries: MapEntry[] = await Promise.all(
      raws.map(async (r) => {
        const fullUrl = URL.createObjectURL(r.blob);
        let thumbBlob: Blob;
        try {
          thumbBlob = await makeThumbnail(r.blob, 200, 200);
        } catch {
          thumbBlob = r.blob;
        }
        const thumbUrl = URL.createObjectURL(thumbBlob);
        return {
          id: r.id,
          fullUrl,
          thumbUrl,
          name: r.name,
          description: r.description,
          loading: true,
        };
      })
    );
    setMaps(entries);
  };

  return (
    <div className="mg-container">
      <h1>Select a Map</h1>

      <div className="mg-add-container">
        <button
          className="mg-add-btn"
          onClick={() => setShowForm(true)}
        >
          <span className="mg-add-icon">＋</span>
          Add New Map
        </button>
      </div>

      {showForm && (
        <NewMapForm
          onCancel={() => setShowForm(false)}
          onSaved={async () => {
            setShowForm(false);
            await reload();
          }}
        />
      )}

      <div className="mg-grid">
        {maps.map((m) => (
          <MapCard
            key={m.id}
            id={m.id}
            url={m.thumbUrl}         // use the low-res thumb
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
