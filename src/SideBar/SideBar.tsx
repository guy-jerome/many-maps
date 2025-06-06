import React, { useState, useEffect } from 'react';

interface SideBarProps {
  selectedLabel: { label: string; info: string } | null;
  /**
   * Called to update a pin’s info.
   * @param label   the pin’s label to identify which one to update
   * @param newInfo the new info string to set
   */
  updateInfo: (label: string, newInfo: string) => void;
}

const sidebarStyle: React.CSSProperties = {
  width: '300px',
  padding: '16px',
  backgroundColor: '#343a40',
  color: '#fff',
  borderLeft: '1px solid #495057',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
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

  useEffect(() => {
    if (selectedLabel) {
      setEditText(selectedLabel.info);
      setIsEditing(false);
    }
  }, [selectedLabel]);

  const handleSave = () => {
    if (selectedLabel) {
      updateInfo(selectedLabel.label, editText);
    }
    setIsEditing(false);
  };

  return (
    <div style={sidebarStyle}>
      <h2 style={headerStyle}>Pin Details</h2>
      {selectedLabel ? (
        <div style={infoStyle}>
          <p><strong>Pin:</strong> {selectedLabel.label}</p>
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
                <button onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
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
