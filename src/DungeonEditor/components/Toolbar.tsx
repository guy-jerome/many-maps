import React from 'react';

interface ToolbarProps {
  mode: 'wall' | 'room' | 'pan';
  setMode: (mode: 'wall' | 'room' | 'pan') => void;
  cellSize: number;
  setCellSize: (size: number) => void;
  onUndo: () => void;
  onClear: () => void;
  onSave: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  mode,
  setMode,
  cellSize,
  setCellSize,
  onUndo,
  onClear,
  onSave,
}) => {
  return (
    <div style={{ marginBottom: 10 }}>
      <button
        onClick={() => setMode('wall')}
        style={{ backgroundColor: mode === 'wall' ? '#ddd' : undefined }}
      >
        Wall
      </button>
      <button
        onClick={() => setMode('room')}
        style={{ backgroundColor: mode === 'room' ? '#ddd' : undefined }}
      >
        Room
      </button>
      <button
        onClick={() => setMode('pan')}
        style={{ backgroundColor: mode === 'pan' ? '#ddd' : undefined }}
      >
        Pan
      </button>
      <button onClick={onUndo}>Undo</button>
      <button onClick={onClear}>Clear</button>
      <button onClick={onSave}>Save</button>
      <label style={{ marginLeft: 10 }}>
        Cell Size:
        <input
          type="number"
          value={cellSize}
          onChange={(e) => setCellSize(Number(e.target.value))}
          style={{ width: 60, marginLeft: 5 }}
        />
      </label>
    </div>
  );
};

export default Toolbar;
