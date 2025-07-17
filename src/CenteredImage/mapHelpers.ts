// Map-related helper functions
import React from "react";
import Map from "ol/Map";
import View from "ol/View";
import ImageLayer from "ol/layer/Image";
import VectorLayer from "ol/layer/Vector";
import Static from "ol/source/ImageStatic";
import VectorSource from "ol/source/Vector";
import Projection from "ol/proj/Projection";
import { getCenter } from "ol/extent";
import { Style, Circle as CircleStyle, Fill, Stroke, Text } from "ol/style";
import { EXTENT, DND_PIN_TYPES } from "./constants";
import { PinData } from "../idbService";

const PIXEL_PROJ = new Projection({
  code: "pixel",
  units: "pixels",
  extent: EXTENT,
});

/**
 * Initialize the OpenLayers map with image layer and vector layer
 */
export const initializeMap = (
  mapRef: React.RefObject<HTMLDivElement | null>,
  mapUrl: string,
  vectorSource: VectorSource,
  setLoading: (loading: boolean) => void,
  selectedPinLabelRef?: React.RefObject<string | null>
): { map: Map; vectorLayer: VectorLayer<any> } => {
  if (!mapRef.current) {
    throw new Error("Map ref is not available");
  }

  const staticSrc = new Static({
    url: mapUrl,
    projection: PIXEL_PROJ,
    imageExtent: EXTENT,
  });

  staticSrc.on("imageloadstart", () => setLoading(true));
  staticSrc.on("imageloadend", () => setLoading(false));
  staticSrc.on("imageloaderror", () => setLoading(false));

  const imageLayer = new ImageLayer({
    source: staticSrc,
    zIndex: 0,
  });

  const vectorLayer = new VectorLayer({
    source: vectorSource,
    zIndex: 1,
    style: (feature: any, resolution: number) => createPinStyle(feature, resolution, selectedPinLabelRef),
  });

  const map = new Map({
    target: mapRef.current,
    layers: [imageLayer, vectorLayer],
    view: new View({
      projection: PIXEL_PROJ,
      center: getCenter(EXTENT),
      zoom: 2,
      maxZoom: 10,
    }),
  });

  return { map, vectorLayer };
};

/**
 * Create style for pin features
 */
const createPinStyle = (feature: any, resolution: number, selectedPinLabelRef?: React.RefObject<string | null>) => {
  const radius = Math.max(8, Math.min(24, 100 / resolution));
  const lbl = feature.get("pin") as string;
  
  // Try to get selected pin from feature or use a global ref if available
  const selectedPinLabel = selectedPinLabelRef?.current || null;
  const isSel = selectedPinLabel === lbl;

  // Get the pin type directly from the feature properties
  const pinType = feature.get("pinType") || DND_PIN_TYPES[0];

  return new Style({
    image: new CircleStyle({
      radius,
      fill: new Fill({ color: pinType.color }),
      stroke: new Stroke({
        color: isSel ? "#00ff00" : "#ffffff",
        width: isSel ? 3 : 2,
      }),
    }),
    text: new Text({
      text: pinType.icon,
      font: `${Math.max(12, radius * 0.8)}px sans-serif`,
      fill: new Fill({ color: "#ffffff" }),
      stroke: new Stroke({ color: "#000000", width: 1 }),
    }),
  });
};

/**
 * Handle map click events for adding/selecting pins
 */
export const handleMapClick = (
  evt: any,
  map: Map,
  isAdding: boolean,
  isDeleting: boolean,
  nextLabel: number,
  selectedPinType: any,
  pins: PinData[],
  setPins: (pins: PinData[]) => void,
  setNextLabel: (label: number) => void,
  setSelectedPinLabel: (label: string | null) => void
) => {
  const coord = evt.coordinate;
  const [x, y] = coord;

  if (isAdding) {
    // Add new pin
    const newPin: PinData = {
      label: nextLabel.toString(),
      x,
      y,
      info: "",
      pinType: selectedPinType,
      areaName: "",
      linkedMapId: "",
      extraSections: [],
      tags: [],
    };
    setPins([...pins, newPin]);
    setNextLabel(nextLabel + 1);
    setSelectedPinLabel(newPin.label);
  } else if (isDeleting) {
    // Delete pin at this location
    let hit: string | null = null;
    map.forEachFeatureAtPixel(evt.pixel, (feat) => {
      if (typeof feat.get("pin") === "string") hit = feat.get("pin");
    });
    if (hit) {
      setPins(pins.filter((p) => p.label !== hit));
      setSelectedPinLabel(null);
    }
  } else {
    // Select pin
    let hit: string | null = null;
    map.forEachFeatureAtPixel(evt.pixel, (feat) => {
      if (typeof feat.get("pin") === "string") hit = feat.get("pin");
    });
    setSelectedPinLabel(hit);
  }
};

/**
 * Center map on a specific pin
 */
export const centerOnPin = (
  pinLabel: string,
  pins: PinData[],
  map: Map | null
) => {
  const pin = pins.find(p => p.label === pinLabel);
  if (pin && map) {
    const view = map.getView();
    view.animate({
      center: [pin.x, pin.y],
      zoom: 6,
      duration: 500,
    });
  }
};

/**
 * Calculate pin counts by type
 */
export const calculatePinCounts = (pins: PinData[]): { [key: string]: number } => {
  const counts: { [key: string]: number } = {};
  pins.forEach((pin) => {
    if (pin.pinType?.id) {
      counts[pin.pinType.id] = (counts[pin.pinType.id] || 0) + 1;
    }
  });
  return counts;
};

/**
 * Filter pin types based on category and search
 */
export const filterPinTypes = (
  pinCategory: string,
  pinSearch: string
) => {
  return DND_PIN_TYPES.filter((pinType) => {
    const matchesCategory =
      pinCategory === "all" || pinType.category === pinCategory;
    const matchesSearch =
      pinSearch === "" ||
      pinType.name.toLowerCase().includes(pinSearch.toLowerCase()) ||
      pinType.category.toLowerCase().includes(pinSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });
};
