import React, { useState, useEffect, useRef } from 'react';

interface SideBarProps {
  selectedLabel: { label: string; info: string; areaName?: string } | null;
  updateInfo: (label: string, newInfo: string, newArea?: string) => void;
}

const resizerStyle: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: '5px',
  cursor: 'col-resize',
  backgroundColor: '#6c757d',
  zIndex: 10,
};

const headerStyle: React.CSSProperties = {
  margin: 0,
  paddingBottom: '8px',
  borderBottom: '1px solid #495057',
  color: '#fff',
};

const infoStyle: React.CSSProperties = {
  marginTop: '12px',
  lineHeight: '1.5',
  color: '#e9ecef',
};

const emptyStyle: React.CSSProperties = {
  marginTop: '16px',
  fontStyle: 'italic',
  color: '#adb5bd',
};

export const SideBar: React.FC<SideBarProps> = ({ selectedLabel, updateInfo }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [editArea, setEditArea] = useState('');
  const [width, setWidth] = useState(300); // default sidebar width
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  useEffect(() => {
    if (selectedLabel) {
      setEditText(selectedLabel.info);
      setEditArea(selectedLabel.areaName || '');
      setIsEditing(false);
    }
  }, [selectedLabel]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const dx = startX.current - e.clientX;
      const newWidth = Math.max(200, startWidth.current + dx); // Min width = 200px
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
  };

  const handleSave = () => {
    if (selectedLabel) {
      updateInfo(selectedLabel.label, editText, editArea);
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={sidebarRef}
      style={{
        position: 'relative',
        width,
        padding: '16px',
        backgroundColor: '#343a40',
        color: '#fff',
        borderLeft: '1px solid #495057',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div style={resizerStyle} onMouseDown={handleMouseDown} />
      <h2 style={headerStyle}>Pin Details</h2>
      {selectedLabel ? (
        <div style={infoStyle}>
          <p><strong>Pin:</strong> {selectedLabel.label}</p>

          <h3>Area Name:</h3>
          {isEditing ? (
            <input
              type="text"
              value={editArea}
              onChange={e => setEditArea(e.target.value)}
              style={{ width: '100%', padding: '8px', fontSize: '14px', marginBottom: '12px' }}
            />
          ) : (
            <p onClick={() => setIsEditing(true)} style={{ cursor: 'pointer' }}>
              {selectedLabel.areaName || <em>Click to add area name</em>}
            </p>
          )}

          <h3>Description:</h3>
          {isEditing ? (
            <>
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                style={{ width: '100%', minHeight: '100px', padding: '8px', fontSize: '14px' }}
              />
              <div style={{ marginTop: '8px' }}>
                <button onClick={handleSave} style={{ marginRight: '8px' }}>
                  Save
                </button>
                <button onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </>
          ) : (
            <p onClick={() => setIsEditing(true)} style={{ cursor: 'pointer' }}>
              {selectedLabel.info || <em>Click to add description</em>}
            </p>
          )}
        </div>
      ) : (
        <p style={emptyStyle}>Click a pin to see details</p>
      )}
    </div>
  );
};

export default SideBar;
