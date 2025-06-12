// src/SideBar/SideBar.tsx
import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
} from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ExtraSection, getAllMaps } from '../idbService';

interface SelectedLabelType {
  label: string;
  info: string;
  areaName?: string;
  extraSections: ExtraSection[];
  linkedMapId?: string;
}

interface SideBarProps {
  selectedLabel: SelectedLabelType | null;
  updateInfo: (
    label: string,
    newInfo: string,
    newArea?: string,
    newExtraSections?: ExtraSection[],
    newLinkedMapId?: string
  ) => void;
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

const headerContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
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

export const SideBar: React.FC<SideBarProps> = ({
  selectedLabel,
  updateInfo,
}) => {
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [editArea, setEditArea] = useState('');
  const [extraSections, setExtraSections] = useState<ExtraSection[]>([]);
  const [editLinkedMapId, setEditLinkedMapId] = useState<string>('');
  const [mapList, setMapList] = useState<{ id: string; name: string }[]>([]);

  const [width, setWidth] = useState(300);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // Load map names for linking
  useEffect(() => {
    getAllMaps().then((all) =>
      setMapList(all.map((m) => ({ id: m.id, name: m.name })))
    );
  }, []);

  // Pull selected pin data into local state
  useEffect(() => {
    if (selectedLabel) {
      setEditText(selectedLabel.info);
      setEditArea(selectedLabel.areaName || '');
      setExtraSections(
        selectedLabel.extraSections.map((sec) => ({
          title: sec.title,
          content: sec.content,
        }))
      );
      setEditLinkedMapId(selectedLabel.linkedMapId || '');
      setIsEditing(false);
    } else {
      setEditText('');
      setEditArea('');
      setExtraSections([]);
      setEditLinkedMapId('');
      setIsEditing(false);
    }
  }, [selectedLabel]);

  // Measure header height
  useLayoutEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.clientHeight);
    }
  });

  // Resizing logic
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const dx = startX.current - e.clientX;
      setWidth(Math.max(200, startWidth.current + dx));
    };
    const onUp = () => {
      isResizing.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
  };

  const handleSave = () => {
    if (selectedLabel) {
      updateInfo(
        selectedLabel.label,
        editText,
        editArea,
        extraSections,
        editLinkedMapId || undefined
      );
    }
    setIsEditing(false);
  };

  const addSection = () => {
    setExtraSections((prev) => [...prev, { title: '', content: '' }]);
    setIsEditing(true);
  };

  const updateSection = (
    idx: number,
    field: 'title' | 'content',
    value: string
  ) => {
    setExtraSections((prev) =>
      prev.map((sec, i) => (i === idx ? { ...sec, [field]: value } : sec))
    );
  };

  const deleteSection = (idx: number) => {
    setExtraSections((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div
      ref={sidebarRef}
      style={{
        position: 'relative',
        width,
        backgroundColor: '#343a40',
        color: '#fff',
        borderLeft: '1px solid #495057',
        boxSizing: 'border-box',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: isCollapsed
          ? `${headerHeight + 32}px`
          : '100%',
        overflowX: 'hidden',
        overflowY: isCollapsed ? 'hidden' : 'auto',
        transition: 'max-height 0.2s ease',
      }}
    >
      <div style={resizerStyle} onMouseDown={handleMouseDown} />

      <div ref={headerRef} style={headerContainerStyle}>
        <h2 style={headerStyle}>Pin Details</h2>
        <button
          onClick={() => setIsCollapsed((p) => !p)}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {selectedLabel ? (
            <div style={infoStyle}>
              <p>
                <strong>Pin:</strong> {selectedLabel.label}
              </p>

              <h3>Area Name:</h3>
              {isEditing ? (
                <input
                  type="text"
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginBottom: '12px',
                    boxSizing: 'border-box',
                  }}
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
                    onChange={(e) => setEditText(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '8px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ marginTop: '8px' }}>
                    <button onClick={handleSave} style={{ marginRight: 8 }}>
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

              {/* ─── Linked Map ─────────────────────────────────────────── */}
              <div style={{ marginTop: '20px' }}>
                <h3>Linked Map:</h3>
                {isEditing ? (
                  <select
                    value={editLinkedMapId}
                    onChange={(e) => setEditLinkedMapId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      boxSizing: 'border-box',
                      marginBottom: '12px',
                    }}
                  >
                    <option value="">— No link —</option>
                    {mapList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                ) : selectedLabel.linkedMapId ? (
                  <button
                    onClick={() => navigate(`/map/${selectedLabel.linkedMapId}`)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0d6efd',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '14px',
                    }}
                  >
                    Go to “{
                      mapList.find((m) => m.id === selectedLabel.linkedMapId)
                        ?.name || selectedLabel.linkedMapId
                    }”
                  </button>
                ) : (
                  <p onClick={() => setIsEditing(true)} style={{ fontStyle: 'italic', color: '#adb5bd', cursor: 'pointer' }}>
                    No linked map.
                  </p>
                )
                }
              </div>

              {/* ─── Extra Sections ───────────────────────────────────── */}
              <div style={{ marginTop: '20px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <h3 style={{ margin: 0 }}>Extra Sections:</h3>
                  <button
                    onClick={addSection}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0d6efd',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Plus size={16} style={{ marginRight: '4px' }} /> Add Section
                  </button>
                </div>

                {extraSections.length === 0 && !isEditing && (
                  <p style={{ fontStyle: 'italic', color: '#adb5bd' }}>
                    No extra sections yet.
                  </p>
                )}

                {/* Static view */}
                {!isEditing &&
                  extraSections.map((sec, idx) => (
                    <div
                      key={idx}
                      style={{
                        marginTop: '12px',
                        padding: '8px',
                        backgroundColor: '#495057',
                        borderRadius: '4px',
                      }}
                    >
                      <h4 style={{ margin: '0 0 4px' }}>
                        {sec.title || <em>(No title)</em>}
                      </h4>
                      <p style={{ margin: 0 }}>
                        {sec.content || <em>(No content)</em>}
                      </p>
                    </div>
                  ))}

                {/* Edit view */}
                {isEditing &&
                  extraSections.map((sec, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        marginTop: '12px',
                        padding: '8px',
                        backgroundColor: '#495057',
                        borderRadius: '4px',
                      }}
                    >
                      <button
                        onClick={() => deleteSection(idx)}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'none',
                          border: 'none',
                          color: '#e55353',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                        aria-label={`Delete section ${idx + 1}`}
                      >
                        ×
                      </button>

                      <label
                        style={{
                          display: 'block',
                          marginBottom: '4px',
                          fontWeight: 'bold',
                        }}
                      >
                        Title:
                      </label>
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) =>
                          updateSection(idx, 'title', e.target.value)
                        }
                        style={{
                          width: '100%',
                          padding: '6px',
                          marginBottom: '8px',
                          boxSizing: 'border-box',
                        }}
                      />

                      <label
                        style={{
                          display: 'block',
                          marginBottom: '4px',
                          fontWeight: 'bold',
                        }}
                      >
                        Content:
                      </label>
                      <textarea
                        value={sec.content}
                        onChange={(e) =>
                          updateSection(idx, 'content', e.target.value)
                        }
                        style={{
                          width: '100%',
                          minHeight: '80px',
                          padding: '6px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <p style={emptyStyle}>Click a pin to see details</p>
          )}
        </>
      )}
    </div>
  );
};

export default SideBar;