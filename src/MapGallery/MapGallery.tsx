// src/MapGallery/MapGallery.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllMaps, saveMap, deleteMap } from '../idbService';
import { v4 as uuidv4 } from 'uuid';

interface MapEntry {
  id: string;
  blob: Blob;
  name: string;
  description?: string;
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

export const MapGallery: React.FC = () => {
  const navigate = useNavigate();
  const [maps, setMaps] = useState<MapEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Load on mount
  useEffect(() => {
    getAllMaps().then(setMaps);
  }, []);

  const openForm = () => {
    setShowForm(true);
    setFile(null);
    setName('');
    setDescription('');
  };

  const handleSave = async () => {
    if (!file) {
      alert('Please choose an image file.');
      return;
    }
    if (!name.trim()) {
      alert('Please enter a name for your map.');
      return;
    }
    const id = uuidv4();
    await saveMap(id, file, name.trim(), description.trim() || undefined);
    setMaps(await getAllMaps());
    setShowForm(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this map? This cannot be undone.')) {
      await deleteMap(id);
      setMaps(await getAllMaps());
    }
  };

  return (
    <div>
      <h1 style={{ textAlign: 'center', margin: '16px 0' }}>Select a Map</h1>

    <div className="mg-add-container">
        <button className="mg-add-btn" onClick={openForm}>
        <span className="mg-add-icon">＋</span>
        Add New Map
        </button>
    </div>

      {showForm && (
        <div
          style={{
            maxWidth: 400,
            margin: '0 auto 24px',
            padding: 16,
            border: '1px solid #ccc',
            borderRadius: 8,
            background: '#f8f9fa',
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <label>
              Image file:{' '}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>
              Name:{' '}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%' }}
              />
            </label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>
              Description:{' '}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: '100%', minHeight: 60 }}
              />
            </label>
          </div>
          <div style={{ textAlign: 'right' }}>
            <button onClick={() => setShowForm(false)} style={{ marginRight: 8 }}>
              Cancel
            </button>
            <button onClick={handleSave}>Save Map</button>
          </div>
        </div>
      )}

      <div style={gridStyle}>
        {maps.map(({ id, blob, name, description }) => {
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
                alt={name}
                style={{ width: '100%', height: '150px', objectFit: 'cover' }}
              />
              <div style={{ padding: '8px' }}>
                <strong>{name}</strong>
                {description && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.9em', color: '#555' }}>
                    {description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MapGallery;