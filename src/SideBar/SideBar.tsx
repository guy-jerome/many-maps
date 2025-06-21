// src/SideBar/SideBar.tsx
import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
} from 'react';
import { ChevronDown, ChevronUp, Plus, Tag } from 'lucide-react';
import { useNavigate, useParams  } from 'react-router-dom';
import { ExtraSection, getAllMaps, getMapRecord, PinData } from '../idbService';

interface SelectedLabelType {
  label: string;
  info: string;
  areaName?: string;
  extraSections: ExtraSection[];
  linkedMapId?: string;
  tags?: string[];
}

interface SideBarProps {
  selectedLabel: SelectedLabelType | null;
  updateInfo: (
    label: string,
    newInfo: string,
    newArea?: string,
    newExtraSections?: ExtraSection[],
    newLinkedMapId?: string,
    newTags?: string[],
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
  const { mapId } = useParams<{ mapId: string }>();

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [extraSections, setExtraSections] = useState<ExtraSection[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<boolean[]>([]); 
  const [editLinkedMapId, setEditLinkedMapId] = useState<string>('');
  const [mapList, setMapList] = useState<{ id: string; name: string }[]>([]);
  const [parentMaps, setParentMaps] = useState<{ id: string; name: string }[]>(
    []
  );

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

    // Compute parent maps when mapId or mapList change
  useEffect(() => {
    if (!mapId) {
      setParentMaps([]);
      return;
    }
    (async () => {
      const parents: { id: string; name: string }[] = [];
      for (const { id, name } of mapList) {
        if (id === mapId) continue;
        const rec = await getMapRecord(id);
        if (rec?.pins.some((p: PinData) => p.linkedMapId === mapId)) {
          parents.push({ id, name });
        }
      }
      setParentMaps(parents);
    })();
  }, [mapId, mapList]);


  // Pull selected pin data into local state
  useEffect(() => {
    if (selectedLabel) {
      setEditText(selectedLabel.info);
      setEditArea(selectedLabel.areaName || '');
      setEditTags(selectedLabel.tags || [])
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
      setEditTags([]);
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


  // Reset collapse state whenever sections change or edit mode toggles
  useEffect(() => {
    setCollapsedSections(extraSections.map(() => false));
  }, [extraSections, isEditing])

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
        editLinkedMapId || undefined,
        editTags,
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

  const toggleSection = (idx: number) => {
    setCollapsedSections((prev) =>
      prev.map((c, i) => (i === idx ? !c : c))
    );
  };

  // tag helpers
  const addTag = () => {
    const t = newTagInput.trim();
    if (t && !editTags.includes(t)) {
      setEditTags(prev => [...prev, t]);
    }
    setNewTagInput('');
  };
  const removeTag = (tag: string) => {
    setEditTags(prev => prev.filter(t => t !== tag));
  };

  return (
    <div
      ref={sidebarRef}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100%',
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
        transition: 'max-height 0.2s ease',
      }}
    >
      <div style={resizerStyle} onMouseDown={handleMouseDown} />
      <div style={{flex: 1, overflowY:'auto'}}>
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

                    {/* Parent Maps - always shown */}
                <div style={{ marginTop: '12px', color: '#e9ecef' }}>
                    <h3>Parent Maps</h3>
                    {parentMaps.length > 0 ? (
                    parentMaps.map((m) => (
                        <button
                        key={m.id}
                        onClick={() => navigate(`/map/${m.id}`)}
                        style={{
                            display: 'block',
                            background: 'none',
                            border: 'none',
                            color: '#0d6efd',
                            cursor: 'pointer',
                            padding: '4px 0',
                            textAlign: 'left',
                        }}
                        >
                        {m.name}
                        </button>
                    ))
                    ) : (
                    <p style={emptyStyle}>No parent maps.</p>
                    )}
                </div>
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
                            <button onClick={handleSave} style={{ marginRight: 8, cursor: 'pointer'}}>
                            Save
                            </button>
                            <button onClick={() => setIsEditing(false) } style={{ cursor: 'pointer'}}>Cancel</button>
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
                    {/* ─── Tags Section ─────────────────────────── */}
                    <div style={{ marginTop: 20 }}>
                    <h3 style={{ margin: 0, marginBottom: 8 }}>Tags:</h3>

                    {/* Add Tag Input - only when editing */}
                    {isEditing && (
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                        <input
                            type="text"
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            placeholder="New tag"
                            style={{ padding: '4px 8px', flexGrow: 1, marginRight: 6 }}
                            onKeyDown={(e) => {
                            if (e.key === 'Enter') addTag();
                            }}
                        />
                        <button
                            onClick={addTag}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <Plus size={16} />
                        </button>
                        </div>
                    )}

                    {/* Tag Chips or "No tags" */}
                    <div
                        style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        paddingBottom: 8,
                        cursor: !isEditing ? 'pointer' : 'default',
                        }}
                        onClick={() => {
                        if (!isEditing) setIsEditing(true);
                        }}
                    >
                        {(isEditing ? editTags : selectedLabel?.tags || []).length > 0 ? (
                        (isEditing ? editTags : selectedLabel?.tags || []).map((tag) => (
                            <span
                            key={tag}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: '#495057',
                                color: '#e9ecef',
                                padding: '4px 8px',
                                borderRadius: 12,
                                maxWidth: '100%',
                                wordBreak: 'break-word',
                            }}
                            >
                            <Tag size={12} style={{ marginRight: 4 }} />
                            <span>{tag}</span>
                            {isEditing && (
                                <button
                                onClick={(e) => {
                                    e.stopPropagation(); // prevent triggering setIsEditing again
                                    removeTag(tag);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#e55353',
                                    marginLeft: 4,
                                    cursor: 'pointer',
                                }}
                                >
                                ×
                                </button>
                            )}
                            </span>
                        ))
                        ) : !isEditing ? (
                        <span
                            style={{
                            fontStyle: 'italic',
                            color: '#adb5bd',
                            }}
                        >
                            No tags. Click to add.
                        </span>
                        ) : null}
                    </div>
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

                  {/* VIEW MODE: collapsible details */}
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
                        <div
                          onClick={() => toggleSection(idx)}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <h4 style={{ margin: 0, color: '#e9ecef' }}>
                            {sec.title || <em>(No title)</em>}
                          </h4>
                          {collapsedSections[idx] ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronUp size={16} />
                          )}
                        </div>
                        {!collapsedSections[idx] && (
                          <p style={{ marginTop: '8px', color: '#e9ecef' }}>
                            {sec.content || <em>(No content)</em>}
                          </p>
                        )}
                      </div>
                    ))}

                  {/* EDIT MODE: fully expanded with delete buttons */}
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
                            color: '#e9ecef',
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
                            color: '#e9ecef',
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
    </div>
  );
};

export default SideBar;