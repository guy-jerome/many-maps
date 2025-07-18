// filepath: /home/ajroberts/src/map-aid/src/CenteredImage/CenteredImage.tsx
// src/CenteredImage/CenteredImage.tsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Map from "ol/Map";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";

import PinFeature from "../PinFeature/PinFeature";
import SideBar from "../SideBar/SideBar";
import WikiSidebar from "../WikiSidebar/WikiSidebar";
import PinToolbar from "./PinToolbar";
import MapHeader from "./MapHeader";
import LoadingSpinner from "./LoadingSpinner";

import { PinType } from "../idbService";
import { DND_PIN_TYPES } from "./constants";
import { initializeMap, centerOnPin as centerOnPinHelper } from "./mapHelpers";
import { useMapData } from "./useMapData";
import { useMapInteractions } from "./useMapInteractions";
import { usePinDragInteraction } from "./hooks";

import "./CenteredImage.css";

const CenteredImage: React.FC = () => {
  const navigate = useNavigate();
  const { mapId } = useParams<{ mapId: string }>();

  // Map refs and state
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObject = useRef<Map | null>(null);
  const vectorLayerRef = useRef<VectorLayer<any> | null>(null);
  const selectedPinLabelRef = useRef<string | null>(null);
  const [vectorSource] = useState(() => new VectorSource());
  const [loading, setLoading] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Pin interaction state
  const [selectedPinLabel, setSelectedPinLabel] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPinType, setSelectedPinType] = useState<PinType>(
    DND_PIN_TYPES[0]
  );
  const [showPinPanel, setShowPinPanel] = useState(false);
  const [pinCategory, setPinCategory] = useState<string>("all");
  const [pinSearch, setPinSearch] = useState<string>("");

  // Map metadata state
  const [descOpen, setDescOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaSaving, setMetaSaving] = useState(false);

  // Wiki sidebar state
  const [isWikiOpen, setIsWikiOpen] = useState(false);
  const [wikiWidth, setWikiWidth] = useState(350);

  // Use custom hooks for data and interactions
  const {
    mapUrl,
    pins,
    setPins,
    mapName,
    setMapName,
    mapDescription,
    setMapDescription,
    nextLabel,
    setNextLabel,
    editName,
    setEditName,
    editDesc,
    setEditDesc,
    updateInfo,
  } = useMapData(mapId);

  // Use custom hook for pin drag interaction
  const isDraggingRef = usePinDragInteraction(
    mapObject,
    vectorSource,
    selectedPinLabel,
    setPins
  );

  // Use custom hook for map interactions
  useMapInteractions(
    mapObject,
    isAdding,
    isDeleting,
    nextLabel,
    selectedPinType,
    pins,
    setPins,
    setNextLabel,
    setSelectedPinLabel,
    mapInitialized
  );

  // Keep selection ref in sync
  useEffect(() => {
    selectedPinLabelRef.current = selectedPinLabel;
    if (isDraggingRef) {
      isDraggingRef.current = false;
    }
    if (vectorLayerRef.current) {
      vectorLayerRef.current.changed();
    }
  }, [selectedPinLabel, isDraggingRef]);

  // Initialize map when URL is available
  useEffect(() => {
    if (!mapRef.current || !mapUrl) return;

    setMapInitialized(false);
    setSelectedPinLabel(null); // Reset selected pin when initializing map

    const { map, vectorLayer } = initializeMap(
      mapRef,
      mapUrl,
      vectorSource,
      setLoading,
      selectedPinLabelRef
    );

    mapObject.current = map;
    vectorLayerRef.current = vectorLayer;

    // Small delay to ensure map is fully initialized
    setTimeout(() => {
      setMapInitialized(true);
    }, 100);

    return () => {
      map.setTarget(undefined);
      map.dispose?.();
      setMapInitialized(false);
      vectorSource.clear(); // Clear vector source when map is disposed
    };
  }, [mapUrl, vectorSource]);

  // Refresh vector layer when pins change
  useEffect(() => {
    if (vectorLayerRef.current) {
      vectorLayerRef.current.changed();
    }
  }, [pins]);

  // Center map on pin function
  const centerOnPin = (pinLabel: string) => {
    centerOnPinHelper(pinLabel, pins, mapObject.current);
  };

  // Pin toolbar handlers
  const handleAddToggle = () => {
    setIsAdding(!isAdding);
    if (!isAdding) {
      setIsDeleting(false);
      setSelectedPinLabel(null);
      setShowPinPanel(true);
    } else {
      setShowPinPanel(false);
    }
  };

  const handleDeleteToggle = () => {
    setIsDeleting(!isDeleting);
    if (!isDeleting) {
      setIsAdding(false);
      setSelectedPinLabel(null);
      setShowPinPanel(false);
    }
  };

  const handlePinPanelToggle = () => {
    setShowPinPanel(!showPinPanel);
  };

  // Wiki sidebar handlers
  const handleWikiToggle = () => {
    setIsWikiOpen(!isWikiOpen);
  };

  const handleWikiWidthChange = (width: number) => {
    setWikiWidth(width);
  };

  const selectedPin = selectedPinLabel
    ? pins.find((p) => p.label === selectedPinLabel) || null
    : null;

  if (!mapId) {
    return <div>No map ID provided</div>;
  }

  return (
    <div className="ci-container">
      <LoadingSpinner loading={loading} />

      <MapHeader
        mapId={mapId}
        mapName={mapName}
        mapDescription={mapDescription}
        editingMeta={editingMeta}
        editName={editName}
        editDesc={editDesc}
        metaSaving={metaSaving}
        descOpen={descOpen}
        setMapName={setMapName}
        setMapDescription={setMapDescription}
        setEditingMeta={setEditingMeta}
        setEditName={setEditName}
        setEditDesc={setEditDesc}
        setMetaSaving={setMetaSaving}
        setDescOpen={setDescOpen}
      />

      <button
        className="ci-back-btn"
        style={isWikiOpen ? { left: `${wikiWidth + 50}px` } : {}}
        onClick={() => navigate("/gallery")}
      >
        ← Back to Maps
      </button>

      <PinToolbar
        isAdding={isAdding}
        isDeleting={isDeleting}
        showPinPanel={showPinPanel}
        onAddToggle={handleAddToggle}
        onDeleteToggle={handleDeleteToggle}
        onPinPanelToggle={handlePinPanelToggle}
        pins={pins}
        selectedPinType={selectedPinType}
        onPinTypeSelect={setSelectedPinType}
        pinCategory={pinCategory}
        onPinCategoryChange={setPinCategory}
        pinSearch={pinSearch}
        onPinSearchChange={setPinSearch}
        isWikiOpen={isWikiOpen}
        wikiWidth={wikiWidth}
      />

      <div ref={mapRef} className="ci-map" />

      <SideBar
        selectedLabel={selectedPin}
        allPins={pins}
        onSelectPin={setSelectedPinLabel}
        onCenterPin={centerOnPin}
        updateInfo={updateInfo}
      />

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

      <WikiSidebar
        mapId={mapId}
        isOpen={isWikiOpen}
        onToggle={handleWikiToggle}
        pins={pins}
        selectedPinLabel={selectedPinLabel}
        onPinSelect={setSelectedPinLabel}
        onWidthChange={handleWikiWidthChange}
      />
    </div>
  );
};

export default CenteredImage;
