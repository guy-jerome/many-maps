// src/PinFeature/PinFeature.tsx
import { useEffect } from "react";
import { Feature } from "ol";
import Point from "ol/geom/Point";
import VectorSource from "ol/source/Vector";

interface ExtraSection {
  title: string;
  content: string;
}

interface PinType {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: "location" | "encounter" | "treasure" | "npc" | "hazard" | "custom";
}

interface PinFeatureProps {
  source: VectorSource;
  x: number;
  y: number;
  pin: {
    label: string;
    info: string;
    areaName: string;
    extraSections: ExtraSection[];
    pinType: PinType;
  };
}

/**
 * Pin feature component that creates OpenLayers features for map pins.
 * The styling is handled by the VectorLayer in CenteredImage.tsx.
 */
const PinFeature: React.FC<PinFeatureProps> = ({ source, x, y, pin }) => {
  useEffect(() => {
    const feature = new Feature({
      geometry: new Point([x, y]),
    });

    // Store the label and pin type on the feature for identification and styling
    feature.set("pin", pin.label);
    feature.set("pinType", pin.pinType);

    source.addFeature(feature);
    return () => {
      source.removeFeature(feature);
    };
  }, [x, y, pin.label, pin.pinType, source]);

  return null;
};

export default PinFeature;
