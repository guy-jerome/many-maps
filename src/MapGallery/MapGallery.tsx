// src/MapGallery/MapGallery.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface MapEntry {
  id: string;
  title: string;
  thumbnail: string;
}

const maps: MapEntry[] = [
  {
    id: 'mentzer-dungeon',
    title: 'Mentzer Dungeon',
    thumbnail: '/images/mentzer-dungeon-thumb.png',
  },
  {
    id: 'other-map',
    title: 'Other Map',
    thumbnail: '/images/other-map-thumb.png',
  },
  // Add more entries for each image in public/images
];

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: '16px',
  padding: '24px',
};

const cardStyle: React.CSSProperties = {
  cursor: 'pointer',
  border: '1px solid #ccc',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

const thumbnailStyle: React.CSSProperties = {
  width: '100%',
  height: '150px',
  objectFit: 'cover',
};

const titleStyle: React.CSSProperties = {
  padding: '8px',
  fontSize: '16px',
  textAlign: 'center',
};

const MapGallery: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1 style={{ textAlign: 'center', margin: '16px 0' }}>Select a Map</h1>
      <div style={gridStyle}>
        {maps.map((map) => (
          <div
            key={map.id}
            style={cardStyle}
            onClick={() => navigate(`/map/${map.id}`)}
          >
            <img
              src={map.thumbnail}
              alt={map.title}
              style={thumbnailStyle}
            />
            <div style={titleStyle}>{map.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapGallery;