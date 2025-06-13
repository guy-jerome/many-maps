// src/MapGallery/MapGallery.tsx
import React, { useEffect, useState } from 'react';
import { getAllMaps, deleteMap } from '../idbService';
import { NewMapForm } from './NewMapForm';
import { MapCard } from './MapCard';
import './MapGallery.css';

interface MapEntry {
  id: string;
  fullUrl: string;   // object URL for full-res
  thumbUrl: string;  // object URL for thumbnail
  name: string;
  description?: string;
  loading: boolean;
}

// helper to downscale a Blob into a smaller JPEG blob
async function makeThumbnail(
  blob: Blob,
  maxW: number,
  maxH: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(maxW / img.width, maxH / img.height);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('2D context failed'));
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (tb) => {
          if (tb) resolve(tb);
          else reject(new Error('Thumbnail blob failed'));
        },
        'image/jpeg',
        0.7
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load error'));
    };
    img.src = url;
  });
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
