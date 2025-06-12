// src/MapGallery/MapGallery.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllMaps, saveMap, deleteMap } from '../idbService';
import { v4 as uuidv4 } from 'uuid';

interface MapEntry {
  id: string;
  blob: Blob;
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: '16px',
  padding: '24px',
};

const cardStyle: React.CSSProperties = {
  position: 'relative',
  cursor: 'pointer',
  border: '1px solid #ccc',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

const deleteBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  right: '8px',
  background: 'rgba(0,0,0,0.6)',
  border: 'none',
  color: '#fff',
  borderRadius: '50%',
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  zIndex: 10,
};

const titleStyle: React.CSSProperties = {
  padding: '8px',
  fontSize: '14px',
  textAlign: 'center',
};

const MapGallery: React.FC = () => {
  const navigate = useNavigate();
  const [maps, setMaps] = useState<MapEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved maps on mount
  useEffect(() => {
    getAllMaps().then(setMaps);
  }, []);

  // Trigger file picker
  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  // Save new map
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const id = uuidv4();
    await saveMap(id, file);
    setMaps(await getAllMaps());
    e.target.value = '';
  };

  // Delete an existing map
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();           // prevent navigating to map
    if (window.confirm('Delete this map forever?')) {
      await deleteMap(id);
      setMaps(await getAllMaps());
    }
  };

  return (
    <div>
      <h1 style={{ textAlign: 'center', margin: '16px 0' }}>Select a Map</h1>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <button onClick={handleAddClick}>＋ Add New Map</button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      <div style={gridStyle}>
        {maps.map(({ id, blob }) => {
          const url = URL.createObjectURL(blob);
          return (
            <div
              key={id}
              style={cardStyle}
              onClick={() => navigate(`/map/${id}`)}
            >
              <button
                style={deleteBtnStyle}
                onClick={(e) => handleDelete(id, e)}
                title="Delete map"
              >
                ×
              </button>
              <img
                src={url}
                alt={`Map ${id}`}
                style={{ width: '100%', height: '150px', objectFit: 'cover' }}
              />
              <div style={titleStyle}>{id}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MapGallery;
