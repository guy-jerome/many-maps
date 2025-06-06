// src/SideBar/SideBar.tsx
import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
} from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';

interface ExtraSection {
  title: string;
  content: string;
}

interface SelectedLabelType {
  label: string;
  info: string;
  areaName?: string;
  extraSections: ExtraSection[];
}

interface SideBarProps {
  selectedLabel: SelectedLabelType | null;
  updateInfo: (
    label: string,
    newInfo: string,
    newArea?: string,
    newExtraSections?: ExtraSection[]
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
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [editArea, setEditArea] = useState('');
  const [extraSections, setExtraSections] = useState<ExtraSection[]>([]);
  const [width, setWidth] = useState(300);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // Whenever a new pin is selected, pull its data into local state
  useEffect(() => {
    if (selectedLabel) {
      setEditText(selectedLabel.info);
      setEditArea(selectedLabel.areaName || '');
      // Copy over existing extraSections
      setExtraSections(
        selectedLabel.extraSections.map((sec) => ({
          title: sec.title,
          content: sec.content,
        }))
      );
      setIsEditing(false);
    } else {
      // If no pin is selected, clear everything
      setEditText('');
      setEditArea('');
      setExtraSections([]);
      setIsEditing(false);
    }
  }, [selectedLabel]);

  // Measure the header’s height (including its border and padding bottom)
  useLayoutEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.clientHeight);
    }
  });

  // Horizontal‐resize logic (unchanged)
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

  // When you click "Save", update everything—including extraSections—and exit editing mode.
  const handleSave = () => {
    if (selectedLabel) {
      updateInfo(
        selectedLabel.label,
        editText,
        editArea,
        extraSections
      );
    }
    setIsEditing(false);
  };

  // Add a new (empty) extra section and switch to edit mode
  const addSection = () => {
    setExtraSections((prev) => [
      ...prev,
      { title: '', content: '' },
    ]);
    setIsEditing(true);
  };

  // Update a particular extra section’s title or content
  const updateSection = (
    idx: number,
    field: 'title' | 'content',
    value: string
  ) => {
    setExtraSections((prev) =>
      prev.map((sec, i) =>
        i === idx ? { ...sec, [field]: value } : sec
      )
    );
  };

  // DELETE functionality for extra sections
  const deleteSection = (idx: number) => {
    setExtraSections((prev) =>
      prev.filter((_, i) => i !== idx)
    );
  };

  return (
    <div
      ref={sidebarRef}
      className="sidebar" // for scrollbar styling in App.css
      style={{
        position: 'relative',
        width,
        backgroundColor: '#343a40',
        color: '#fff',
        borderLeft: '1px solid #495057',
        boxSizing: 'border-box',
        padding: '16px', // 16px top & bottom
        display: 'flex',
        flexDirection: 'column',

        // Collapse/expand via maxHeight + overflowY
        maxHeight: isCollapsed
          ? `${headerHeight + 32}px` // headerHeight + (16px top) + (16px bottom)
          : '100%',
        overflowX: 'hidden',
        overflowY: isCollapsed ? 'hidden' : 'auto',
        transition: 'max-height 0.2s ease',
      }}
    >
      {/* Left‐edge resizer handle */}
      <div style={resizerStyle} onMouseDown={handleMouseDown} />

      {/* Header row (title + chevron) */}
      <div ref={headerRef} style={headerContainerStyle}>
        <h2 style={headerStyle}>Pin Details</h2>
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label={
            isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
          }
        >
          {isCollapsed ? (
            <ChevronDown size={20} />
          ) : (
            <ChevronUp size={20} />
          )}
        </button>
      </div>

      {/* Only show the rest when not collapsed */}
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
                    fontSize: '14px',
                    marginBottom: '12px',
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <p
                  onClick={() => setIsEditing(true)}
                  style={{ cursor: 'pointer' }}
                >
                  {selectedLabel.areaName || (
                    <em>Click to add area name</em>
                  )}
                </p>
              )}

              <h3>Description:</h3>
              {isEditing ? (
                <>
                  <textarea
                    value={editText}
                    onChange={(e) =>
                      setEditText(e.target.value)
                    }
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '8px',
                      fontSize: '14px',
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ marginTop: '8px' }}>
                    <button
                      onClick={handleSave}
                      style={{ marginRight: '8px' }}
                    >
                      Save
                    </button>
                    <button onClick={() => setIsEditing(false)}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <p
                  onClick={() => setIsEditing(true)}
                  style={{ cursor: 'pointer' }}
                >
                  {selectedLabel.info || (
                    <em>Click to add description</em>
                  )}
                </p>
              )}

              {/* ─── Extra Sections ─────────────────────────────────────────────── */}
              <div style={{ marginTop: '20px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <h3 style={{ margin: 0 }}>Extra Sections:</h3>
                  {/* Always‐visible “＋ Add Section” */}
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
                    aria-label="Add new extra section"
                  >
                    <Plus size={16} style={{ marginRight: '4px' }} /> Add
                    Section
                  </button>
                </div>

                {/* If no extra sections and not editing, show placeholder */}
                {extraSections.length === 0 && !isEditing && (
                  <p
                    style={{
                      fontStyle: 'italic',
                      color: '#adb5bd',
                      marginTop: '8px',
                    }}
                  >
                    No extra sections yet.
                  </p>
                )}

                {/* Static view: show each saved section when not editing */}
                {!isEditing &&
                  extraSections.map((sec, idx) => (
                    <div
                      key={idx}
                      style={{
                        marginTop: '12px',
                        padding: '8px',
                        backgroundColor: '#495057',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <h4 style={{ margin: '0 0 4px 0' }}>
                        {sec.title || <em>(No title)</em>}
                      </h4>
                      <p style={{ margin: 0 }}>
                        {sec.content || <em>(No content)</em>}
                      </p>
                    </div>
                  ))}

                {/* Edit mode: show inputs + delete button for each section */}
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
                        boxSizing: 'border-box',
                      }}
                    >
                      {/* Delete button in top‐right corner */}
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
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#e9ecef',
                        }}
                      >
                        Title:
                      </label>
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) =>
                          updateSection(
                            idx,
                            'title',
                            e.target.value
                          )
                        }
                        style={{
                          width: '100%',
                          padding: '6px',
                          marginBottom: '8px',
                          fontSize: '14px',
                          backgroundColor: '#fff',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          boxSizing: 'border-box',
                        }}
                      />

                      <label
                        style={{
                          display: 'block',
                          marginBottom: '4px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#e9ecef',
                        }}
                      >
                        Content:
                      </label>
                      <textarea
                        value={sec.content}
                        onChange={(e) =>
                          updateSection(
                            idx,
                            'content',
                            e.target.value
                          )
                        }
                        style={{
                          width: '100%',
                          minHeight: '80px',
                          padding: '6px',
                          fontSize: '14px',
                          backgroundColor: '#fff',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
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
