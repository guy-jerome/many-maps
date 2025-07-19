import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Plus, Tag, Menu, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ExtraSection,
  getAllMaps,
  getMapRecord,
  PinData,
  PinType,
} from "../idbService";

interface SelectedLabelType {
  label: string;
  info: string;
  areaName?: string;
  extraSections: ExtraSection[];
  linkedMapId?: string;
  tags?: string[];
  pinType?: PinType;
}

interface SideBarProps {
  selectedLabel: SelectedLabelType | null;
  allPins?: PinData[]; // Add all pins for search functionality
  onSelectPin?: (pinLabel: string) => void; // Callback to select a pin from search
  onCenterPin?: (pinLabel: string) => void; // Callback to center map on pin
  onSidebarStateChange?: (isOpen: boolean) => void; // Callback when sidebar opens/closes
  onSidebarWidthChange?: (width: number) => void; // Callback when sidebar width changes
  updateInfo: (
    label: string,
    newInfo: string,
    newArea?: string,
    newExtraSections?: ExtraSection[],
    newLinkedMapId?: string,
    newTags?: string[]
  ) => void;
}

const resizerStyle: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  bottom: 0,
  width: "5px",
  cursor: "col-resize",
  backgroundColor: "var(--pixel-border-secondary)",
  zIndex: 10,
  display: "block", // Will be hidden on mobile via inline style
};

const headerContainerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const headerStyle: React.CSSProperties = {
  margin: 0,
  paddingBottom: "var(--pixel-space-sm)",
  borderBottom: "3px solid var(--pixel-border-primary)",
  color: "var(--pixel-text-primary)",
  fontFamily: "var(--pixel-font-primary)",
  textTransform: "uppercase",
  letterSpacing: "2px",
  textShadow: "var(--pixel-shadow-sharp)",
};

const infoStyle: React.CSSProperties = {
  marginTop: "var(--pixel-space-md)",
  lineHeight: "1.4",
  color: "var(--pixel-text-primary)",
  fontFamily: "var(--pixel-font-primary)",
};

const emptyStyle: React.CSSProperties = {
  marginTop: "var(--pixel-space-lg)",
  fontStyle: "normal",
  color: "var(--pixel-text-muted)",
  fontFamily: "var(--pixel-font-primary)",
  textTransform: "uppercase",
  fontSize: "12px",
  letterSpacing: "1px",
};

const SideBar: React.FC<SideBarProps> = ({
  selectedLabel,
  allPins = [],
  onSelectPin,
  onCenterPin,
  onSidebarStateChange,
  onSidebarWidthChange,
  updateInfo,
}) => {
  const navigate = useNavigate();
  const { mapId } = useParams<{ mapId: string }>();

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [editArea, setEditArea] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [extraSections, setExtraSections] = useState<ExtraSection[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<boolean[]>([]);
  const [editLinkedMapId, setEditLinkedMapId] = useState<string>("");
  const [mapList, setMapList] = useState<{ id: string; name: string }[]>([]);
  const [parentMaps, setParentMaps] = useState<{ id: string; name: string }[]>(
    []
  );

  // Pin search functionality
  const [pinSearchQuery, setPinSearchQuery] = useState<string>("");
  const [showPinSearch, setShowPinSearch] = useState(false);

  // Map statistics functionality
  const [showMapStats, setShowMapStats] = useState(false);

  // Parent maps functionality
  const [showParentMaps, setShowParentMaps] = useState(false);

  // Pin information functionality
  const [showPinInfo, setShowPinInfo] = useState(true);

  const [width, setWidth] = useState(300);

  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // Check screen size for responsive behavior
  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width > 768 && width <= 1200);

      // On mobile, start closed but don't force collapse
      if (width <= 768) {
        setIsSidebarOpen(false);
        // Don't force collapse - let user control it
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // Handle clicks outside sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobile &&
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile, isSidebarOpen]);

  // Load map names for linking
  useEffect(() => {
    getAllMaps().then((all) =>
      setMapList(all.map((m) => ({ id: m.id, name: m.name })))
    );
  }, []);

  // Compute parent maps when mapId or mapList change
  useEffect(() => {
    if (!mapId || mapList.length === 0) {
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
      setEditArea(selectedLabel.areaName || "");
      setEditTags(selectedLabel.tags || []);
      setExtraSections(
        selectedLabel.extraSections.map((sec) => ({
          title: sec.title,
          content: sec.content,
        }))
      );
      setEditLinkedMapId(selectedLabel.linkedMapId || "");
      setIsEditing(false);
    } else {
      setEditText("");
      setEditArea("");
      setEditTags([]);
      setExtraSections([]);
      setEditLinkedMapId("");
      setIsEditing(false);
    }
  }, [selectedLabel]);

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
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // Reset collapse state whenever sections change or edit mode toggles
  useEffect(() => {
    setCollapsedSections(extraSections.map(() => false));
  }, [extraSections, isEditing]);

  // Notify parent when sidebar state changes
  useEffect(() => {
    if (onSidebarStateChange) {
      onSidebarStateChange(isSidebarOpen);
    }
  }, [isSidebarOpen, onSidebarStateChange]);

  // Notify parent when sidebar width changes
  useEffect(() => {
    if (onSidebarWidthChange && isSidebarOpen) {
      onSidebarWidthChange(width);
    }
  }, [width, isSidebarOpen, onSidebarWidthChange]);

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
        editLinkedMapId || undefined, // Convert empty string to undefined
        editTags
      );
    }
    setIsEditing(false);
  };

  const addSection = () => {
    setExtraSections((prev) => [...prev, { title: "", content: "" }]);
    setIsEditing(true);
  };

  const updateSection = (
    idx: number,
    field: "title" | "content",
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
    setCollapsedSections((prev) => prev.map((c, i) => (i === idx ? !c : c)));
  };

  // tag helpers
  const addTag = () => {
    const t = newTagInput.trim();
    if (t && !editTags.includes(t)) {
      setEditTags((prev) => [...prev, t]);
    }
    setNewTagInput("");
  };
  const removeTag = (tag: string) => {
    setEditTags((prev) => prev.filter((t) => t !== tag));
  };

  // Filter pins based on search query
  const filteredPins = allPins.filter((pin) => {
    if (!pinSearchQuery.trim()) return false;
    const query = pinSearchQuery.toLowerCase();
    return (
      pin.label.toLowerCase().includes(query) ||
      (pin.areaName && pin.areaName.toLowerCase().includes(query)) ||
      pin.info.toLowerCase().includes(query) ||
      (pin.tags && pin.tags.some((tag) => tag.toLowerCase().includes(query))) ||
      (pin.pinType && pin.pinType.name.toLowerCase().includes(query))
    );
  });

  // Helper function to get display name for selectedLabel
  const getSelectedLabelDisplayName = (
    selectedLabel: SelectedLabelType
  ): string => {
    // First try to use areaName if it exists and is not empty
    if (selectedLabel.areaName && selectedLabel.areaName.trim()) {
      return selectedLabel.areaName.trim();
    }

    // Fall back to pin type name
    if (selectedLabel.pinType && selectedLabel.pinType.name) {
      return selectedLabel.pinType.name;
    }

    // Last resort - use the label (numeric)
    return selectedLabel.label;
  };

  // Helper function to get display name for search results
  const getSearchDisplayName = (pin: PinData): string => {
    // For all pins, use area name if available, otherwise pin type name
    if (pin.areaName && pin.areaName.trim()) {
      return pin.areaName.trim();
    }

    return pin.pinType?.name || pin.label;
  };

  // Helper function to get subtitle for search results
  const getSearchSubtitle = (pin: PinData): string | null => {
    // For numbered pins, show "Pin {number}" as subtitle
    if (pin.pinType?.id === "numbered") {
      const numberedPins = allPins
        .filter((p) => p.pinType.id === "numbered")
        .sort((a, b) => parseInt(a.label) - parseInt(b.label));
      const pinIndex = numberedPins.findIndex((p) => p.label === pin.label);
      const displayNumber = pinIndex + 1;
      return `Pin ${displayNumber}`;
    }

    // For other pins, show pin type name as subtitle if area name is present
    if (pin.areaName && pin.areaName.trim() && pin.pinType) {
      return pin.pinType.name;
    }

    return null;
  };

  // Responsive styling function
  const getResponsiveStyle = () => {
    const baseStyle = {
      position: "fixed" as const,
      top: 0,
      right: 0,
      height: "100%",
      backgroundColor: "var(--pixel-bg-secondary)",
      color: "var(--pixel-text-primary)",
      borderLeft: "4px solid var(--pixel-border-primary)",
      boxSizing: "border-box" as const,
      padding: "var(--pixel-space-lg)",
      display: "flex",
      flexDirection: "column" as const,
      maxHeight: "100%",
      overflowX: "hidden" as const,
      transition: "transform 0.3s ease",
      zIndex: 2001, // Higher than wiki
      fontFamily: "var(--pixel-font-primary)",
      boxShadow: "var(--pixel-shadow-brutal)",
      // Pixel grid pattern
      backgroundImage: `
        linear-gradient(90deg, var(--pixel-gray-dark) 1px, transparent 1px),
        linear-gradient(var(--pixel-gray-dark) 1px, transparent 1px)
      `,
      backgroundSize: "8px 8px",
    };

    if (isMobile) {
      return {
        ...baseStyle,
        width: "100%",
        maxWidth: "320px",
        transform: isSidebarOpen ? "translateX(0)" : "translateX(100%)",
      };
    }

    if (isTablet) {
      return {
        ...baseStyle,
        width: Math.min(width, 280),
        transform: "translateX(0)",
      };
    }

    return {
      ...baseStyle,
      width,
      transform: "translateX(0)",
    };
  };

  // Mobile-friendly input styling
  const getInputStyle = (baseStyle: React.CSSProperties = {}) => ({
    ...baseStyle,
    fontSize: isMobile ? "16px" : "14px", // Prevent zoom on mobile
    padding: isMobile ? "var(--pixel-space-md)" : "var(--pixel-space-sm)",
    borderRadius: "var(--pixel-radius)",
    border: "3px solid var(--pixel-border-secondary)",
    backgroundColor: "var(--pixel-bg-tertiary)",
    color: "var(--pixel-text-primary)",
    width: "100%",
    boxSizing: "border-box" as const,
    fontFamily: "var(--pixel-font-primary)",
    transition: "var(--pixel-transition-fast)",
    boxShadow: "var(--pixel-shadow-sharp)",
  });

  // Mobile-friendly button styling
  const getButtonStyle = (baseStyle: React.CSSProperties = {}) => ({
    ...baseStyle,
    padding: isMobile
      ? "var(--pixel-space-md) var(--pixel-space-lg)"
      : "var(--pixel-space-sm) var(--pixel-space-md)",
    fontSize: isMobile ? "16px" : "14px",
    minHeight: isMobile ? "44px" : "auto", // Touch target size
    cursor: "pointer",
    borderRadius: "var(--pixel-radius)",
    border: "3px solid var(--pixel-border-primary)",
    backgroundColor: "var(--pixel-bg-secondary)",
    color: "var(--pixel-text-primary)",
    fontFamily: "var(--pixel-font-primary)",
    fontWeight: "bold",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    transition: "var(--pixel-transition-fast)",
    boxShadow: "var(--pixel-shadow-sharp)",
  });

  return (
    <>
      {/* Desktop Toggle Button - show when sidebar is closed */}
      {!isMobile && !isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          style={{
            position: "fixed",
            top: "50%",
            right: "var(--pixel-space-xl)",
            transform: "translateY(-50%)",
            background: "var(--pixel-bg-secondary)",
            border: "3px solid var(--pixel-border-primary)",
            borderRadius: "var(--pixel-radius)",
            color: "var(--pixel-text-primary)",
            padding: "var(--pixel-space-md) var(--pixel-space-sm)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--pixel-space-xs)",
            fontSize: "0.8rem",
            fontWeight: "bold",
            fontFamily: "var(--pixel-font-primary)",
            zIndex: 1999,
            transition: "var(--pixel-transition-fast)",
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            textShadow: "var(--pixel-shadow-sharp)",
            boxShadow: "var(--pixel-shadow-sharp)",
            textTransform: "uppercase",
            letterSpacing: "1px",
            backgroundImage: `
              linear-gradient(90deg, var(--pixel-gray-dark) 1px, transparent 1px),
              linear-gradient(var(--pixel-gray-dark) 1px, transparent 1px)
            `,
            backgroundSize: "8px 8px",
          }}
          title="Open Pin Details"
        >
          📍 Pin Details
        </button>
      )}

      {/* Mobile Toggle Button */}
      {isMobile && (
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{
            position: "fixed",
            top: "var(--pixel-space-lg)",
            right: "var(--pixel-space-lg)",
            zIndex: 2100,
            background: "var(--pixel-bg-secondary)",
            border: "3px solid var(--pixel-border-primary)",
            borderRadius: "var(--pixel-radius)",
            color: "var(--pixel-text-primary)",
            padding: "var(--pixel-space-md)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--pixel-shadow-harsh)",
            backdropFilter: "none",
            fontFamily: "var(--pixel-font-primary)",
            transition: "var(--pixel-transition-fast)",
          }}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "var(--pixel-bg-overlay)",
            zIndex: 1999,
          }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - only render when open */}
      {isSidebarOpen && (
        <div ref={sidebarRef} style={getResponsiveStyle()}>
          {/* Hide resizer on mobile */}
          <div
            style={{
              ...resizerStyle,
              display: isMobile ? "none" : "block",
            }}
            onMouseDown={handleMouseDown}
          />
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div ref={headerRef} style={headerContainerStyle}>
              <h2 style={headerStyle}>Pin Details</h2>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                {/* Close button */}
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--pixel-text-primary)",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label="Close sidebar"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content always visible when sidebar is open */}
            <>
              {/* Pin Search Section */}
              <div
                style={{
                  marginTop: "var(--pixel-space-md)",
                  color: "var(--pixel-text-primary)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "var(--pixel-space-sm)",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "var(--pixel-font-primary)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Pin Search
                  </h3>
                  <button
                    onClick={() => setShowPinSearch(!showPinSearch)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                    aria-label={showPinSearch ? "Hide search" : "Show search"}
                  >
                    {showPinSearch ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                </div>

                {showPinSearch && (
                  <div style={{ marginBottom: "12px" }}>
                    <input
                      type="text"
                      placeholder="Search pins by name, area, description, or tags..."
                      value={pinSearchQuery}
                      onChange={(e) => setPinSearchQuery(e.target.value)}
                      style={getInputStyle({
                        marginBottom: "8px",
                      })}
                    />

                    {pinSearchQuery.trim() && (
                      <div
                        style={{
                          maxHeight: "200px",
                          overflowY: "auto",
                          border: "1px solid #495057",
                          borderRadius: "4px",
                          backgroundColor: "#495057",
                        }}
                      >
                        <div
                          style={{
                            padding: "8px",
                            borderBottom: "1px solid #6c757d",
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "#adb5bd",
                          }}
                        >
                          {filteredPins.length} pin
                          {filteredPins.length !== 1 ? "s" : ""} found
                        </div>

                        {filteredPins.length > 0 ? (
                          filteredPins.map((pin, index) => (
                            <div
                              key={`${pin.label}-${index}`}
                              onClick={() => onSelectPin?.(pin.label)}
                              style={{
                                padding: "8px",
                                borderBottom:
                                  index < filteredPins.length - 1
                                    ? "1px solid #6c757d"
                                    : "none",
                                cursor: "pointer",
                                transition: "background-color 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#6c757d";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                {pin.pinType && (
                                  <span
                                    style={{
                                      fontSize: "14px",
                                      color: pin.pinType.color,
                                    }}
                                  >
                                    {pin.pinType.id === "numbered"
                                      ? (() => {
                                          const numberedPins = allPins
                                            .filter(
                                              (p) => p.pinType.id === "numbered"
                                            )
                                            .sort(
                                              (a, b) =>
                                                parseInt(a.label) -
                                                parseInt(b.label)
                                            );
                                          const pinIndex =
                                            numberedPins.findIndex(
                                              (p) => p.label === pin.label
                                            );
                                          return (pinIndex + 1).toString();
                                        })()
                                      : pin.pinType.icon}
                                  </span>
                                )}
                                <div style={{ flex: 1 }}>
                                  <div
                                    style={{
                                      fontWeight: "bold",
                                      fontSize: "14px",
                                    }}
                                  >
                                    {getSearchDisplayName(pin)}
                                  </div>
                                  {getSearchSubtitle(pin) && (
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        color: "#adb5bd",
                                      }}
                                    >
                                      {getSearchSubtitle(pin)}
                                    </div>
                                  )}
                                  {pin.info && (
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        color: "#adb5bd",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {pin.info}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div
                            style={{
                              padding: "16px",
                              textAlign: "center",
                              color: "#adb5bd",
                              fontStyle: "italic",
                            }}
                          >
                            No pins match your search
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Map Statistics */}
              <div style={{ marginTop: "12px", color: "#e9ecef" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <h3 style={{ margin: 0 }}>Map Statistics</h3>
                  <button
                    onClick={() => setShowMapStats(!showMapStats)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                    aria-label={
                      showMapStats ? "Hide statistics" : "Show statistics"
                    }
                  >
                    {showMapStats ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                </div>

                {showMapStats && (
                  <div
                    style={{
                      background: "rgba(52, 58, 64, 0.6)",
                      borderRadius: "6px",
                      padding: "12px",
                      fontSize: "13px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                      }}
                    >
                      <span>📍 Total Pins:</span>
                      <strong>{allPins.length}</strong>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                      }}
                    >
                      <span>📝 With Descriptions:</span>
                      <strong>
                        {allPins.filter((p) => p.info?.trim()).length}
                      </strong>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                      }}
                    >
                      <span>🏷️ With Tags:</span>
                      <strong>
                        {
                          allPins.filter((p) => p.tags && p.tags.length > 0)
                            .length
                        }
                      </strong>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                      }}
                    >
                      <span>🔗 Linked Maps:</span>
                      <strong>
                        {allPins.filter((p) => p.linkedMapId).length}
                      </strong>
                    </div>

                    {/* Pin type breakdown */}
                    {(() => {
                      const typeStats = allPins.reduce((acc, pin) => {
                        const category = pin.pinType?.category || "custom";
                        acc[category] = (acc[category] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);

                      const categoryIcons = {
                        location: "🏰",
                        encounter: "⚔️",
                        npc: "👤",
                        treasure: "💎",
                        hazard: "⚠️",
                        custom: "📌",
                      };

                      return (
                        Object.entries(typeStats).length > 0 && (
                          <div
                            style={{
                              marginTop: "8px",
                              paddingTop: "8px",
                              borderTop: "1px solid #6c757d",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: "bold",
                                marginBottom: "4px",
                                color: "#adb5bd",
                              }}
                            >
                              By Category:
                            </div>
                            {Object.entries(typeStats).map(
                              ([category, count]) => (
                                <div
                                  key={category}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "12px",
                                    marginBottom: "2px",
                                  }}
                                >
                                  <span>
                                    {
                                      categoryIcons[
                                        category as keyof typeof categoryIcons
                                      ]
                                    }{" "}
                                    {category.charAt(0).toUpperCase() +
                                      category.slice(1)}
                                    :
                                  </span>
                                  <strong>{count}</strong>
                                </div>
                              )
                            )}
                          </div>
                        )
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Parent Maps */}
              <div style={{ marginTop: "12px", color: "#e9ecef" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <h3 style={{ margin: 0 }}>Parent Maps</h3>
                  <button
                    onClick={() => setShowParentMaps(!showParentMaps)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                    aria-label={
                      showParentMaps ? "Hide parent maps" : "Show parent maps"
                    }
                  >
                    {showParentMaps ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                </div>

                {showParentMaps && (
                  <div style={{ marginBottom: "12px" }}>
                    {parentMaps.length > 0 ? (
                      parentMaps.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => navigate(`/map/${m.id}`)}
                          style={{
                            display: "block",
                            background: "none",
                            border: "none",
                            color: "#0d6efd",
                            cursor: "pointer",
                            padding: "4px 0",
                            textAlign: "left",
                          }}
                        >
                          {m.name}
                        </button>
                      ))
                    ) : (
                      <p style={emptyStyle}>No parent maps.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Pin Information */}
              {selectedLabel ? (
                <div style={{ marginTop: "12px", color: "#e9ecef" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <h3 style={{ margin: 0 }}>Pin Information</h3>
                    <button
                      onClick={() => setShowPinInfo(!showPinInfo)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#fff",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                      aria-label={
                        showPinInfo
                          ? "Hide pin information"
                          : "Show pin information"
                      }
                    >
                      {showPinInfo ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  </div>

                  {showPinInfo && (
                    <div style={infoStyle}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "12px",
                        }}
                      >
                        <p style={{ margin: 0 }}>
                          <strong>Pin:</strong>{" "}
                          {getSelectedLabelDisplayName(selectedLabel)}
                        </p>
                        {onCenterPin && (
                          <button
                            onClick={() => onCenterPin(selectedLabel.label)}
                            style={{
                              background: "#28a745",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              padding: "6px 12px",
                              fontSize: "12px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#218838";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#28a745";
                            }}
                            title="Center map on this pin"
                          >
                            🎯 Center Map
                          </button>
                        )}
                      </div>

                      {/* Pin Type Display */}
                      {selectedLabel.pinType && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "12px",
                            padding: "8px",
                            backgroundColor: selectedLabel.pinType.color,
                            borderRadius: "6px",
                            color: "#fff",
                          }}
                        >
                          <span style={{ fontSize: "18px" }}>
                            {selectedLabel.pinType.icon}
                          </span>
                          <div>
                            <strong>{selectedLabel.pinType.name}</strong>
                            <div
                              style={{
                                fontSize: "12px",
                                opacity: 0.8,
                                textTransform: "capitalize",
                              }}
                            >
                              {selectedLabel.pinType.category}
                            </div>
                          </div>
                        </div>
                      )}

                      <h3>Area Name:</h3>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editArea}
                          onChange={(e) => setEditArea(e.target.value)}
                          style={getInputStyle({
                            marginBottom: "12px",
                          })}
                        />
                      ) : (
                        <p
                          onClick={() => setIsEditing(true)}
                          style={{ cursor: "pointer" }}
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
                            onChange={(e) => setEditText(e.target.value)}
                            style={getInputStyle({
                              minHeight: "100px",
                            })}
                          />
                          <div style={{ marginTop: "8px" }}>
                            <button
                              onClick={handleSave}
                              style={getButtonStyle({
                                marginRight: 8,
                                backgroundColor: "#28a745",
                                borderColor: "#28a745",
                              })}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setIsEditing(false)}
                              style={getButtonStyle({
                                backgroundColor: "#6c757d",
                                borderColor: "#6c757d",
                              })}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <p
                          onClick={() => setIsEditing(true)}
                          style={{ cursor: "pointer" }}
                        >
                          {selectedLabel.info || (
                            <em>Click to add description</em>
                          )}
                        </p>
                      )}

                      {/* Linked Map */}
                      <div style={{ marginTop: "20px" }}>
                        <h3>Linked Map:</h3>
                        {isEditing ? (
                          <select
                            value={editLinkedMapId}
                            onChange={(e) => setEditLinkedMapId(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "8px",
                              boxSizing: "border-box",
                              marginBottom: "12px",
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
                            onClick={() =>
                              navigate(`/map/${selectedLabel.linkedMapId}`)
                            }
                            style={{
                              background: "none",
                              border: "none",
                              color: "#0d6efd",
                              cursor: "pointer",
                              padding: 0,
                              fontSize: "14px",
                            }}
                          >
                            Go to "
                            {mapList.find(
                              (m) => m.id === selectedLabel.linkedMapId
                            )?.name || selectedLabel.linkedMapId}
                            "
                          </button>
                        ) : (
                          <p
                            onClick={() => setIsEditing(true)}
                            style={{
                              fontStyle: "italic",
                              color: "#adb5bd",
                              cursor: "pointer",
                            }}
                          >
                            No linked map.
                          </p>
                        )}
                      </div>

                      {/* Tags Section */}
                      <div style={{ marginTop: 20 }}>
                        <h3 style={{ margin: 0, marginBottom: 8 }}>Tags:</h3>

                        {/* Add Tag Input - only when editing */}
                        {isEditing && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              marginBottom: 12,
                            }}
                          >
                            <input
                              type="text"
                              value={newTagInput}
                              onChange={(e) => setNewTagInput(e.target.value)}
                              placeholder="New tag"
                              style={getInputStyle({
                                padding: isMobile ? "8px" : "4px 8px",
                                flexGrow: 1,
                                marginRight: 6,
                              })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") addTag();
                              }}
                            />
                            <button
                              onClick={addTag}
                              style={getButtonStyle({
                                background: "#28a745",
                                border: "1px solid #28a745",
                                padding: isMobile ? "8px" : "4px 8px",
                                minHeight: isMobile ? "44px" : "32px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              })}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        )}

                        {/* Tag Chips or "No tags" */}
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "6px",
                            paddingBottom: 8,
                            cursor: !isEditing ? "pointer" : "default",
                          }}
                          onClick={() => {
                            if (!isEditing) setIsEditing(true);
                          }}
                        >
                          {(isEditing ? editTags : selectedLabel?.tags || [])
                            .length > 0 ? (
                            (isEditing
                              ? editTags
                              : selectedLabel?.tags || []
                            ).map((tag) => (
                              <span
                                key={tag}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  backgroundColor: "#495057",
                                  color: "#e9ecef",
                                  padding: "4px 8px",
                                  borderRadius: 12,
                                  maxWidth: "100%",
                                  wordBreak: "break-word",
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
                                      background: "none",
                                      border: "none",
                                      color: "#e55353",
                                      marginLeft: 4,
                                      cursor: "pointer",
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
                                fontStyle: "italic",
                                color: "#adb5bd",
                              }}
                            >
                              No tags. Click to add.
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Extra Sections */}
                      <div style={{ marginTop: "20px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <h3 style={{ margin: 0 }}>Extra Sections:</h3>
                          <button
                            onClick={addSection}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#0d6efd",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <Plus size={16} style={{ marginRight: "4px" }} />{" "}
                            Add Section
                          </button>
                        </div>

                        {extraSections.length === 0 && !isEditing && (
                          <p style={{ fontStyle: "italic", color: "#adb5bd" }}>
                            No extra sections yet.
                          </p>
                        )}

                        {/* VIEW MODE: collapsible details */}
                        {!isEditing &&
                          extraSections.map((sec, idx) => (
                            <div
                              key={idx}
                              style={{
                                marginTop: "12px",
                                padding: "8px",
                                backgroundColor: "#495057",
                                borderRadius: "4px",
                              }}
                            >
                              <div
                                onClick={() => toggleSection(idx)}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  cursor: "pointer",
                                }}
                              >
                                <h4 style={{ margin: 0, color: "#e9ecef" }}>
                                  {sec.title || <em>(No title)</em>}
                                </h4>
                                {collapsedSections[idx] ? (
                                  <ChevronDown size={16} />
                                ) : (
                                  <ChevronUp size={16} />
                                )}
                              </div>
                              {!collapsedSections[idx] && (
                                <p
                                  style={{ marginTop: "8px", color: "#e9ecef" }}
                                >
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
                                position: "relative",
                                marginTop: "12px",
                                padding: "8px",
                                backgroundColor: "#495057",
                                borderRadius: "4px",
                              }}
                            >
                              <button
                                onClick={() => deleteSection(idx)}
                                style={{
                                  position: "absolute",
                                  top: "8px",
                                  right: "8px",
                                  background: "none",
                                  border: "none",
                                  color: "#e55353",
                                  cursor: "pointer",
                                  fontWeight: "bold",
                                }}
                                aria-label={`Delete section ${idx + 1}`}
                              >
                                ×
                              </button>

                              <label
                                style={{
                                  display: "block",
                                  marginBottom: "4px",
                                  fontWeight: "bold",
                                  color: "#e9ecef",
                                }}
                              >
                                Title:
                              </label>
                              <input
                                type="text"
                                value={sec.title}
                                onChange={(e) =>
                                  updateSection(idx, "title", e.target.value)
                                }
                                style={getInputStyle({
                                  padding: "6px",
                                  marginBottom: "8px",
                                })}
                              />

                              <label
                                style={{
                                  display: "block",
                                  marginBottom: "4px",
                                  fontWeight: "bold",
                                  color: "#e9ecef",
                                }}
                              >
                                Content:
                              </label>
                              <textarea
                                value={sec.content}
                                onChange={(e) =>
                                  updateSection(idx, "content", e.target.value)
                                }
                                style={getInputStyle({
                                  minHeight: "80px",
                                  padding: "6px",
                                })}
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p style={emptyStyle}>Click a pin to see details</p>
              )}
            </>
          </div>
        </div>
      )}
    </>
  );
};

export default SideBar;
