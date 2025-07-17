// src/CenteredImage/CenteredImage.tsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Map from "ol/Map";
import View from "ol/View";
import ImageLayer from "ol/layer/Image";
import Static from "ol/source/ImageStatic";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import Projection from "ol/proj/Projection";
import { getCenter } from "ol/extent";
import Translate from "ol/interaction/Translate";
import Collection from "ol/Collection";
import { Style, Circle as CircleStyle, Fill, Stroke, Text } from "ol/style";
import { Point } from "ol/geom";

import PinFeature from "../PinFeature/PinFeature";
import SideBar from "../SideBar/SideBar";

import {
  getMapRecord,
  updateMapPins,
  updateMapMeta,
  PinData,
  PinType,
} from "../idbService";

import "./CenteredImage.css";

// D&D Pin Types Configuration
const DND_PIN_TYPES: PinType[] = [
  // Basic Numbered Pin
  {
    id: "numbered",
    name: "Numbered Pin",
    icon: "1",
    color: "#4169E1",
    category: "custom",
  },

  // Locations
  {
    id: "town",
    name: "Town/Village",
    icon: "🏘️",
    color: "#8B4513",
    category: "location",
  },
  {
    id: "city",
    name: "City",
    icon: "🏰",
    color: "#4169E1",
    category: "location",
  },
  {
    id: "dungeon",
    name: "Dungeon",
    icon: "🕳️",
    color: "#2F4F4F",
    category: "location",
  },
  {
    id: "cave",
    name: "Cave",
    icon: "🕳️",
    color: "#696969",
    category: "location",
  },
  {
    id: "temple",
    name: "Temple",
    icon: "⛪",
    color: "#FFD700",
    category: "location",
  },
  {
    id: "tower",
    name: "Tower",
    icon: "🗼",
    color: "#708090",
    category: "location",
  },
  {
    id: "ruins",
    name: "Ruins",
    icon: "🏛️",
    color: "#A0522D",
    category: "location",
  },
  {
    id: "camp",
    name: "Camp",
    icon: "🏕️",
    color: "#228B22",
    category: "location",
  },

  // Encounters
  {
    id: "monster",
    name: "Monster/Enemy",
    icon: "👹",
    color: "#DC143C",
    category: "encounter",
  },
  {
    id: "boss",
    name: "Boss/BBEG",
    icon: "💀",
    color: "#8B0000",
    category: "encounter",
  },
  {
    id: "ambush",
    name: "Ambush Site",
    icon: "⚔️",
    color: "#B22222",
    category: "encounter",
  },
  {
    id: "patrol",
    name: "Patrol Route",
    icon: "👮",
    color: "#FF4500",
    category: "encounter",
  },

  // NPCs
  {
    id: "npc",
    name: "Important NPC",
    icon: "👤",
    color: "#4682B4",
    category: "npc",
  },
  {
    id: "merchant",
    name: "Merchant",
    icon: "💰",
    color: "#DAA520",
    category: "npc",
  },
  {
    id: "quest_giver",
    name: "Quest Giver",
    icon: "📜",
    color: "#9370DB",
    category: "npc",
  },
  {
    id: "ally",
    name: "Ally/Helper",
    icon: "🤝",
    color: "#32CD32",
    category: "npc",
  },

  // Treasure & Items
  {
    id: "treasure",
    name: "Treasure",
    icon: "💎",
    color: "#FFD700",
    category: "treasure",
  },
  {
    id: "loot",
    name: "Loot Cache",
    icon: "📦",
    color: "#CD853F",
    category: "treasure",
  },
  {
    id: "magic_item",
    name: "Magic Item",
    icon: "✨",
    color: "#9932CC",
    category: "treasure",
  },
  {
    id: "secret",
    name: "Secret/Hidden",
    icon: "🔍",
    color: "#2F4F4F",
    category: "treasure",
  },

  // Hazards & Traps
  {
    id: "trap",
    name: "Trap",
    icon: "🪤",
    color: "#FF6347",
    category: "hazard",
  },
  {
    id: "hazard",
    name: "Environmental Hazard",
    icon: "⚠️",
    color: "#FF8C00",
    category: "hazard",
  },
  {
    id: "poison",
    name: "Poison/Disease",
    icon: "☠️",
    color: "#9ACD32",
    category: "hazard",
  },
  {
    id: "magic_zone",
    name: "Magic Zone",
    icon: "🌟",
    color: "#FF69B4",
    category: "hazard",
  },

  // Custom/Misc
  {
    id: "objective",
    name: "Objective",
    icon: "🎯",
    color: "#20B2AA",
    category: "custom",
  },
  {
    id: "rest_area",
    name: "Rest Area",
    icon: "🛡️",
    color: "#6B8E23",
    category: "custom",
  },
  {
    id: "portal",
    name: "Portal/Teleporter",
    icon: "🌀",
    color: "#8A2BE2",
    category: "custom",
  },
  {
    id: "note",
    name: "General Note",
    icon: "📝",
    color: "#4682B4",
    category: "custom",
  },
];

const IMAGE_W = 10200;
const IMAGE_H = 6600;
const EXTENT: [number, number, number, number] = [0, 0, IMAGE_W, IMAGE_H];
const PIXEL_PROJ = new Projection({
  code: "pixel",
  units: "pixels",
  extent: EXTENT,
});

const CenteredImage: React.FC = () => {
  const navigate = useNavigate();
  const { mapId } = useParams<{ mapId: string }>();

  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapObject = useRef<Map | null>(null);
  const [vectorSource] = useState(() => new VectorSource());
  const vectorLayerRef = useRef<VectorLayer<any> | null>(null);

  const [pins, setPins] = useState<PinData[]>([]);
  const [mapName, setMapName] = useState<string | null>("");
  const [nextLabel, setNextLabel] = useState(1);
  const [selectedPinLabel, setSelectedPinLabel] = useState<string | null>(null);
  const selectedPinLabelRef = useRef<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPinType, setSelectedPinType] = useState<PinType>(
    DND_PIN_TYPES[0]
  );
  const [showPinPanel, setShowPinPanel] = useState(false);
  const [pinCategory, setPinCategory] = useState<string>("all");
  const [pinSearch, setPinSearch] = useState<string>("");

  const [mapDescription, setMapDescription] = useState<string | null>("");
  const [descOpen, setDescOpen] = useState(false);

  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({ visible: false, x: 0, y: 0, content: "" });

  // Hover state for visual feedback
  const [hoveredPinLabel, setHoveredPinLabel] = useState<string | null>(null);

  const [editingMeta, setEditingMeta] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [metaSaving, setMetaSaving] = useState(false);
  
  // Auto-save indicator state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // ─── keyboard shortcuts ──────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (evt: KeyboardEvent) => {
      // Ignore key events when typing in inputs
      if (evt.target instanceof HTMLInputElement || evt.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (evt.key) {
        case 'Delete':
        case 'Backspace':
          // Delete selected pin with confirmation
          if (selectedPinLabel) {
            evt.preventDefault();
            const pin = pins.find(p => p.label === selectedPinLabel);
            const pinDescription = pin?.areaName || `Pin ${selectedPinLabel}`;
            
            if (window.confirm(`Are you sure you want to delete "${pinDescription}"?\n\nThis action cannot be undone.`)) {
              const updatedPins = pins.filter((p) => p.label !== selectedPinLabel);
              // Renumber remaining pins
              const renumberedPins = updatedPins.map((p, i) => ({
                ...p,
                label: `${i + 1}`,
                pinType: p.pinType || DND_PIN_TYPES[0],
              }));
              setPins(renumberedPins);
              setNextLabel(renumberedPins.length + 1);
              setSelectedPinLabel(null);
            }
          }
          break;
        case 'Escape':
          // Clear selection and exit modes
          evt.preventDefault();
          setSelectedPinLabel(null);
          setIsAdding(false);
          setIsDeleting(false);
          setShowPinPanel(false);
          break;
        case 'a':
        case 'A':
          // Toggle add mode
          if (evt.ctrlKey || evt.metaKey) {
            return; // Don't interfere with Ctrl+A (select all)
          }
          evt.preventDefault();
          setIsAdding(!isAdding);
          if (!isAdding) {
            setIsDeleting(false);
            setSelectedPinLabel(null);
            setShowPinPanel(true);
          } else {
            setShowPinPanel(false);
          }
          break;
        case 'd':
        case 'D':
          // Toggle delete mode
          if (evt.ctrlKey || evt.metaKey) {
            return; // Don't interfere with Ctrl+D
          }
          evt.preventDefault();
          setIsDeleting(!isDeleting);
          if (!isDeleting) {
            setIsAdding(false);
            setSelectedPinLabel(null);
            setShowPinPanel(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPinLabel, pins, isAdding, isDeleting]);

  // Keep selection-ref & style in sync
  useEffect(() => {
    selectedPinLabelRef.current = selectedPinLabel;
    if (vectorLayerRef.current) vectorLayerRef.current.changed();
  }, [selectedPinLabel]);

  // Sidebar “save” callback: now also handles linkedMapId
  const updateInfo = (
    label: string,
    newInfo: string,
    newArea?: string,
    newExtraSections?: PinData["extraSections"],
    newLinkedMapId?: string,
    newTags?: string[]
  ) => {
    const updated = pins.map((pin) =>
      pin.label === label
        ? {
            ...pin,
            info: newInfo,
            areaName: newArea ?? pin.areaName,
            extraSections: newExtraSections ?? pin.extraSections,
            linkedMapId: newLinkedMapId,
            tags: newTags ?? pin.tags,
          }
        : pin
    );
    setPins(updated);
  };

  // ─── load map + pins on mount ──────────────────────────────────────
  useEffect(() => {
    if (!mapId) return;
    let objectUrl: string;
    getMapRecord(mapId).then((rec) => {
      if (!rec) return;
      objectUrl = URL.createObjectURL(rec.blob);
      setMapUrl(objectUrl);

      // Handle backward compatibility for pins without pinType
      const updatedPins = (rec.pins || []).map((pin) => ({
        ...pin,
        pinType: pin.pinType || DND_PIN_TYPES[0], // Default to first pin type if missing
      }));

      setPins(updatedPins);
      setNextLabel((rec.pins?.length ?? 0) + 1);
      setMapName(rec.name);
      setMapDescription(rec.description || "");
      setEditName(rec.name);
      setEditDesc(rec.description || "");
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mapId]);

  // ─── persist pins whenever they change ────────────────────────────
  useEffect(() => {
    if (mapId && pins.length > 0) {
      setIsSaving(true);
      updateMapPins(mapId, pins)
        .then(() => {
          setLastSaved(new Date());
          setIsSaving(false);
        })
        .catch(console.error);
    }
  }, [mapId, pins]);

  // ─── initialize OL when image is ready ────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapUrl) return;

    setLoading(true);
    const staticSrc = new Static({
      url: mapUrl,
      projection: PIXEL_PROJ,
      imageExtent: EXTENT,
    });
    staticSrc.on("imageloadstart", () => setLoading(true));
    staticSrc.on("imageloadend", () => setLoading(false));
    staticSrc.on("imageloaderror", () => setLoading(false));

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      zIndex: 1,
      style: (feature, resolution) => {
        const radius = Math.max(8, Math.min(24, 100 / resolution));
        const lbl = feature.get("pin") as string;
        const isSel = selectedPinLabelRef.current === lbl;
        const isHovered = hoveredPinLabel === lbl;

        // Get the pin type directly from the feature properties
        const pinType = feature.get("pinType") || DND_PIN_TYPES[0];

        // Enhanced visual feedback for hover and selection
        let strokeColor = "#ffffff";
        let strokeWidth = 2;

        if (isSel) {
          strokeColor = "#00ff00";
          strokeWidth = 3;
        } else if (isHovered && !isAdding && !isDeleting) {
          strokeColor = "#ffff00";
          strokeWidth = 3;
        }

        const style = new Style({
          image: new CircleStyle({
            radius: isHovered || isSel ? radius + 2 : radius, // Slightly larger on hover/select
            fill: new Fill({ 
              color: isHovered && !isSel ? 
                `${pinType.color}DD` : // Slightly more opaque on hover
                pinType.color 
            }),
            stroke: new Stroke({
              color: strokeColor,
              width: strokeWidth,
            }),
          }),
          text: new Text({
            text: pinType.icon,
            font: `${Math.max(12, radius * 0.8)}px sans-serif`,
            fill: new Fill({ color: "#ffffff" }),
            stroke: new Stroke({ color: "#000000", width: 1 }),
          }),
        });

        return style;
      },
    });
    vectorLayerRef.current = vectorLayer;

    const map = new Map({
      target: mapRef.current,
      layers: [new ImageLayer({ source: staticSrc, zIndex: 0 }), vectorLayer],
      view: new View({
        projection: PIXEL_PROJ,
        center: getCenter(EXTENT),
        zoom: 3,
        minZoom: 0.1, // allow zooming far out
        maxZoom: 8,
        extent: [
          EXTENT[0] - IMAGE_W,
          EXTENT[1] - IMAGE_H,
          EXTENT[2] + IMAGE_W,
          EXTENT[3] + IMAGE_H,
        ], // expand viewable extent
      }),
    });

    mapObject.current = map;
    return () => {
      map.setTarget(undefined);
      map.dispose?.();
    };
  }, [vectorSource, mapUrl]); // Removed pins from dependencies to prevent map re-initialization

  // ─── update vector layer style when pins change or hover state changes ─────────────────────
  useEffect(() => {
    if (vectorLayerRef.current) {
      vectorLayerRef.current.changed(); // Trigger style refresh when pins or hover state changes
    }
  }, [pins, hoveredPinLabel]);

  // ─── click to add / delete / select pins ─────────────────────────
  useEffect(() => {
    const map = mapObject.current;
    if (!map) return;
    const onClick = (evt: any) => {
      if (isAdding) {
        const [x, y] = evt.coordinate;
        const label = `${nextLabel}`;
        setPins((p) => [
          ...p,
          {
            label,
            info: "",
            areaName: "",
            x,
            y,
            extraSections: [],
            tags: [],
            pinType: selectedPinType,
          },
        ]);
        setNextLabel((n) => n + 1);
        return;
      }
      if (isDeleting) {
        let hit: string | null = null;
        map.forEachFeatureAtPixel(evt.pixel, (feat) => {
          if (typeof feat.get("pin") === "string") hit = feat.get("pin");
        });
        if (hit) {
          const pin = pins.find(p => p.label === hit);
          const pinDescription = pin?.areaName || `Pin ${hit}`;
          
          if (window.confirm(`Are you sure you want to delete "${pinDescription}"?\n\nThis action cannot be undone.`)) {
            const rem = pins.filter((p) => p.label !== hit);
            const rel = rem.map((p, i) => ({
              ...p,
              label: `${i + 1}`,
              pinType: p.pinType || DND_PIN_TYPES[0], // Ensure pinType exists
            }));
            setPins(rel);
            setNextLabel(rel.length + 1);
            setSelectedPinLabel(null);
          }
        }
        return;
      }
      let hit: string | null = null;
      map.forEachFeatureAtPixel(evt.pixel, (feat) => {
        if (typeof feat.get("pin") === "string") hit = feat.get("pin");
      });
      setSelectedPinLabel(hit);
    };
    map.on("singleclick", onClick);
    map.on("pointermove", (evt) => {
      const hit = map.hasFeatureAtPixel(evt.pixel);
      map.getTargetElement().style.cursor = hit ? "pointer" : "";
      
      // Handle tooltip and hover state
      if (hit && !isAdding && !isDeleting) {
        let hoveredLabel: string | null = null;
        map.forEachFeatureAtPixel(evt.pixel, (feat) => {
          if (typeof feat.get("pin") === "string") {
            hoveredLabel = feat.get("pin");
          }
        });
        
        if (hoveredLabel) {
          setHoveredPinLabel(hoveredLabel);
          const pin = pins.find(p => p.label === hoveredLabel);
          if (pin) {
            const tooltipContent = `${pin.areaName || 'Pin'} ${pin.label}${pin.pinType ? ` (${pin.pinType.name})` : ''}`;
            const mouseEvent = evt.originalEvent as MouseEvent;
            setTooltip({
              visible: true,
              x: mouseEvent.clientX,
              y: mouseEvent.clientY,
              content: tooltipContent
            });
          }
        }
      } else {
        setHoveredPinLabel(null);
        setTooltip(prev => ({ ...prev, visible: false }));
      }
    });
    return () => map.un("singleclick", onClick);
  }, [isAdding, isDeleting, nextLabel, pins, selectedPinType]);

  // ─── drag‐to‐move pins ───────────────────────────────────────────
  useEffect(() => {
    const map = mapObject.current;
    if (!map) return;
    let trans: Translate | null = null;
    if (selectedPinLabel) {
      const feat = vectorSource
        .getFeatures()
        .find((f) => f.get("pin") === selectedPinLabel);
      if (feat) {
        trans = new Translate({ features: new Collection([feat]) });
        map.addInteraction(trans);
        trans.on("translateend", (e) => {
          const f = e.features.item(0);
          const lbl = f?.get("pin");
          const geom = f?.getGeometry() as Point;
          if (typeof lbl === "string" && geom) {
            const [x, y] = geom.getCoordinates();
            setPins((prev) =>
              prev.map((p) => (p.label === lbl ? { ...p, x, y } : p))
            );
          }
        });
      }
    }
    return () => {
      if (trans) map.removeInteraction(trans);
    };
  }, [selectedPinLabel, vectorSource, pins]);

  const selectedPin = selectedPinLabel
    ? pins.find((p) => p.label === selectedPinLabel) || null
    : null;

  // Function to center map on a specific pin
  const centerMapOnPin = (pinLabel: string) => {
    const pin = pins.find((p) => p.label === pinLabel);
    const map = mapObject.current;
    
    if (pin && map) {
      const view = map.getView();
      view.animate({
        center: [pin.x, pin.y],
        zoom: Math.max(view.getZoom() || 3, 4), // Ensure minimum zoom level for visibility
        duration: 500, // Smooth animation duration in ms
      });
    }
  };

  // Function to export current map view as image
  const exportMapView = () => {
    const map = mapObject.current;
    if (!map) return;

    map.once('rendercomplete', () => {
      const canvas = map.getViewport().querySelector('canvas') as HTMLCanvasElement;
      if (canvas) {
        // Create a download link
        const link = document.createElement('a');
        link.download = `${mapName || 'map'}-view.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    });
    map.renderSync();
  };

  return (
    <div className="ci-container">
      {loading && (
        <div className="ci-spinner-overlay">
          <div className="ci-spinner" />
        </div>
      )}
      <div className="ci-map-name-block">
        {editingMeta ? (
          <form
            className="ci-meta-edit-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setMetaSaving(true);
              await updateMapMeta(mapId!, editName, editDesc);
              setMapName(editName);
              setMapDescription(editDesc);
              setEditingMeta(false);
              setMetaSaving(false);
            }}
          >
            <input
              className="ci-meta-edit-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={metaSaving}
              maxLength={80}
              required
            />
            <textarea
              className="ci-meta-edit-textarea"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={2}
              disabled={metaSaving}
              maxLength={400}
              placeholder="Description (optional)"
            />
            <div className="ci-meta-edit-actions">
              <button
                type="submit"
                className="ci-meta-edit-save"
                disabled={metaSaving}
              >
                Save
              </button>
              <button
                type="button"
                className="ci-meta-edit-cancel"
                disabled={metaSaving}
                onClick={() => setEditingMeta(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <span className="ci-map-name">{mapName}</span>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginLeft: "12px"
            }}>
              <div style={{
                background: "rgba(40, 167, 69, 0.9)",
                color: "#fff",
                padding: "4px 8px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                📍 {pins.length} pin{pins.length !== 1 ? 's' : ''}
              </div>
              
              {/* Auto-save indicator */}
              <div style={{
                background: isSaving ? "rgba(255, 193, 7, 0.9)" : "rgba(108, 117, 125, 0.9)",
                color: "#fff",
                padding: "4px 8px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.3s ease"
              }}>
                {isSaving ? (
                  <>
                    <span style={{ 
                      animation: "spin 1s linear infinite",
                      display: "inline-block"
                    }}>⟳</span>
                    Saving...
                  </>
                ) : lastSaved ? (
                  <>
                    ✓ Saved {new Date().getTime() - lastSaved.getTime() < 5000 ? 'now' : 'recently'}
                  </>
                ) : (
                  <>
                    ● Ready
                  </>
                )}
              </div>
            </div>
            {mapDescription && (
              <button
                className="ci-map-desc-btn"
                onClick={() => setDescOpen(true)}
                title="Show map description"
              >
                ℹ️
              </button>
            )}
            <button
              className="ci-map-meta-edit-btn"
              onClick={() => setEditingMeta(true)}
              title="Edit map name/description"
            >
              ✎
            </button>
          </>
        )}
      </div>
      {descOpen && (
        <div className="ci-desc-modal-bg" onClick={() => setDescOpen(false)}>
          <div className="ci-desc-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Description</h2>
            <div className="ci-desc-content">{mapDescription}</div>
            <button
              className="ci-desc-close"
              onClick={() => setDescOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      <button className="ci-back-btn" onClick={() => navigate("/gallery")}>
        ← Back to Maps
      </button>
      
      <button 
        onClick={exportMapView}
        style={{
          position: "absolute",
          top: "10px",
          left: "200px",
          padding: "8px 12px",
          color: "#fff",
          background: "#28a745",
          border: "1px solid #34ce57",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px",
          zIndex: 2000,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#218838";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#28a745";
          e.currentTarget.style.transform = "translateY(0)";
        }}
        title="Export current map view as PNG image"
      >
        📷 Export View
      </button>

      {/* Pin Toolbar */}
      <div className="ci-pin-toolbar">
        {/* Mode Toggle Buttons */}
        <div className="ci-mode-section">
          <button
            className={`ci-mode-btn ${isAdding ? "active" : ""}`}
            onClick={() => {
              setIsAdding(!isAdding);
              if (!isAdding) {
                setIsDeleting(false);
                setSelectedPinLabel(null);
                setShowPinPanel(true);
              } else {
                setShowPinPanel(false);
              }
            }}
            title="Add pins to the map"
          >
            📍 Add Pin
          </button>

          <button
            className={`ci-mode-btn ${isDeleting ? "active" : ""}`}
            onClick={() => {
              setIsDeleting(!isDeleting);
              if (!isDeleting) {
                setIsAdding(false);
                setSelectedPinLabel(null);
                setShowPinPanel(false);
              }
            }}
            title="Delete pins from the map"
          >
            🗑️ Delete
          </button>

          <button
            className="ci-mode-btn"
            onClick={() => setShowPinPanel(!showPinPanel)}
            title="Show/hide pin types panel"
          >
            ⚙️ Pin Types
          </button>
        </div>

        {/* Pin Types Panel */}
        {showPinPanel && (
          <div className="ci-pin-panel">
            <div className="ci-pin-panel-header">
              <h3>Select Pin Type ({pins.length} pins total)</h3>
              <select
                value={pinCategory}
                onChange={(e) => setPinCategory(e.target.value)}
                className="ci-category-filter"
              >
                <option value="all">All Categories</option>
                <option value="location">Locations</option>
                <option value="encounter">Encounters</option>
                <option value="npc">NPCs</option>
                <option value="treasure">Treasure</option>
                <option value="hazard">Hazards</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="ci-pin-search">
              <input
                type="text"
                placeholder="Search pin types..."
                value={pinSearch}
                onChange={(e) => setPinSearch(e.target.value)}
                className="ci-search-input"
              />
            </div>

            <div className="ci-pin-grid">
              {DND_PIN_TYPES.filter((pinType) => {
                const matchesCategory =
                  pinCategory === "all" || pinType.category === pinCategory;
                const matchesSearch =
                  pinSearch === "" ||
                  pinType.name
                    .toLowerCase()
                    .includes(pinSearch.toLowerCase()) ||
                  pinType.category
                    .toLowerCase()
                    .includes(pinSearch.toLowerCase());
                return matchesCategory && matchesSearch;
              }).map((pinType) => {
                const pinCount = pins.filter(
                  (p) => p.pinType?.id === pinType.id
                ).length;
                return (
                  <button
                    key={pinType.id}
                    className={`ci-pin-type-btn ${
                      selectedPinType.id === pinType.id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedPinType(pinType)}
                    style={{
                      backgroundColor: pinType.color,
                      border:
                        selectedPinType.id === pinType.id
                          ? "3px solid #ffffff"
                          : "1px solid #666",
                    }}
                    title={`${pinType.name} (${pinCount} on map)`}
                  >
                    <span className="ci-pin-icon">{pinType.icon}</span>
                    <span className="ci-pin-name">{pinType.name}</span>
                    {pinCount > 0 && (
                      <span className="ci-pin-count">{pinCount}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {isAdding && (
              <div className="ci-pin-instructions">
                <p>
                  📍 <strong>Selected:</strong> {selectedPinType.name}
                </p>
                <p>Click anywhere on the map to place this pin type</p>
              </div>
            )}
            
            {/* Keyboard Shortcuts Help */}
            <div style={{
              marginTop: "12px",
              padding: "8px",
              backgroundColor: "rgba(73, 80, 87, 0.8)",
              borderRadius: "6px",
              fontSize: "11px",
              color: "#adb5bd"
            }}>
              <div style={{ fontWeight: "bold", marginBottom: "4px", color: "#fff" }}>Keyboard Shortcuts:</div>
              <div>• <strong>A</strong> - Toggle Add Pin mode</div>
              <div>• <strong>D</strong> - Toggle Delete mode</div>
              <div>• <strong>Delete/Backspace</strong> - Delete selected pin</div>
              <div>• <strong>Escape</strong> - Clear selection & exit modes</div>
            </div>
          </div>
        )}
      </div>
      <div ref={mapRef} className="ci-map" />
      <SideBar 
        selectedLabel={selectedPin} 
        allPins={pins}
        onSelectPin={(pinLabel) => setSelectedPinLabel(pinLabel)}
        onCenterPin={centerMapOnPin}
        updateInfo={updateInfo} 
      />
      
      {/* Pin Tooltip */}
      {tooltip.visible && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 10,
            top: tooltip.y - 30,
            background: "rgba(0, 0, 0, 0.8)",
            color: "#fff",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "bold",
            pointerEvents: "none",
            zIndex: 10000,
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          }}
        >
          {tooltip.content}
        </div>
      )}
      
      {pins.map((p) => (
        <PinFeature
          key={p.label}
          source={vectorSource}
          x={p.x}
          y={p.y}
          pin={p}
          allPins={pins.map((pin) => ({
            label: pin.label,
            pinType: pin.pinType,
          }))}
        />
      ))}
    </div>
  );
};

export default CenteredImage;
