// src/PinFeature/PinFeature.tsx
import { useEffect } from 'react';
import { Feature } from 'ol';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';

interface PinFeatureProps {
  source: VectorSource;
  x: number;
  y: number;
  pin: { label: string; info: string };
}

/**
 * We no longer set a fixed Style here. The VectorLayer in 
 * CenteredImage.tsx will supply a style function that reads
 * the map's zoom and decides how large each pin should be.
 */
const PinFeature: React.FC<PinFeatureProps> = ({
  source,
  x,
  y,
  pin,
}) => {
  useEffect(() => {
    const feature = new Feature({
      geometry: new Point([x, y]),
    });

    // Store only the label on the feature
    feature.set('pin', pin.label);

    source.addFeature(feature);
    return () => {
      source.removeFeature(feature);
    };
  }, [x, y, pin.label, source]);

  return null;
};

export default PinFeature;
