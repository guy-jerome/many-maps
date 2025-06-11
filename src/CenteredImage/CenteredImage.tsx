// src/CenteredImage/CenteredImage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Map from 'ol/Map';
import View from 'ol/View';
import ImageLayer from 'ol/layer/Image';
import Static from 'ol/source/ImageStatic';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Projection from 'ol/proj/Projection';
import { getCenter } from 'ol/extent';
import Translate from 'ol/interaction/Translate';
import Collection from 'ol/Collection';
import { Style, Circle as CircleStyle, Fill, Stroke, Text } from 'ol/style';
import { Point } from 'ol/geom';

import PinFeature from '../PinFeature/PinFeature';
import SideBar from '../SideBar/SideBar';

// Image dimensions & projection
const IMAGE_W = 10200;
const IMAGE_H = 6600;
const EXTENT: [number, number, number, number] = [0, 0, IMAGE_W, IMAGE_H];
const PIXEL_PROJ = new Projection({ code: 'pixel', units: 'pixels', extent: EXTENT });

type ExtraSection = { title: string; content: string };
type PinData = { label: string; areaName: string; info: string; x: number; y: number; extraSections: ExtraSection[] };

const CenteredImage: React.FC = () => {
  // Grab the mapId from the URL and construct the image URL
  const { mapId } = useParams<{ mapId: string }>();
  const mapUrl = `/images/${mapId}.png`;

  const mapRef = useRef<HTMLDivElement>(null);
  const mapObject = useRef<Map | null>(null);

  // Single shared vector source
  const [vectorSource] = useState(() => new VectorSource());
  const vectorLayerRef = useRef<VectorLayer<any> | null>(null);

  // Pin state
  const [pins, setPins] = useState<PinData[]>([]);
  const [nextLabel, setNextLabel] = useState(1);
  const [selectedPinLabel, setSelectedPinLabel] = useState<string | null>(null);
  const selectedPinLabelRef = useRef<string | null>(null);

  // Mode toggles
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync ref + trigger rerender for style update
  useEffect(() => {
    selectedPinLabelRef.current = selectedPinLabel;
    if (vectorLayerRef.current) vectorLayerRef.current.changed();
  }, [selectedPinLabel]);

  // Update pin info from sidebar
  const updateInfo = (label: string, newInfo: string, newArea?: string, newExtraSections?: ExtraSection[]) => {
    setPins(prev => prev.map(pin =>
      pin.label === label
        ? { ...pin, info: newInfo, areaName: newArea ?? pin.areaName, extraSections: newExtraSections ?? pin.extraSections }
        : pin
    ));
  };

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current) return;

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      zIndex: 1,
      style: (feature: any, resolution: number) => {
        const radius = 100 / resolution;
        const raw = feature.get('pin');
        const label = typeof raw === 'string' ? raw : '';
        const isSel = selectedPinLabelRef.current === label;
        return new Style({
          image: new CircleStyle({ radius, fill: new Fill({ color: 'black' }), stroke: new Stroke({ color: isSel ? 'blue' : 'white', width: 2 }) }),
          text: new Text({ text: label, font: `${radius}px sans-serif`, fill: new Fill({ color: 'white' }) }),
        });
      },
    });
    vectorLayerRef.current = vectorLayer;

    const map = new Map({
      target: mapRef.current,
      layers: [
        new ImageLayer({ source: new Static({ url: mapUrl, projection: PIXEL_PROJ, imageExtent: EXTENT }), zIndex: 0 }),
        vectorLayer,
      ],
      view: new View({ projection: PIXEL_PROJ, center: getCenter(EXTENT), zoom: 2, minZoom: 1, maxZoom: 8, extent: EXTENT }),
    });

    mapObject.current = map;
    return () => { map.setTarget(undefined); map.dispose?.(); };
  }, [vectorSource, mapUrl]);

  // Handle single clicks (add / delete / select)
  useEffect(() => {
    const map = mapObject.current;
    if (!map) return;

    const onClick = (evt: any) => {
      // Add mode
      if (isAdding) {
        const [x, y] = evt.coordinate;
        const label = `${nextLabel}`;
        setPins(prev => [...prev, { label, info: '', areaName: '', x, y, extraSections: [] }]);
        setNextLabel(n => n + 1);
        return;
      }
      // Delete mode
      if (isDeleting) {
        let clicked: string | null = null;
        map.forEachFeatureAtPixel(evt.pixel, feat => { if (typeof feat.get('pin') === 'string') clicked = feat.get('pin'); });
        if (clicked) {
          const remaining = pins.filter(p => p.label !== clicked);
          const relabeled = remaining.map((p, i) => ({ ...p, label: `${i+1}` }));
          setPins(relabeled);
          setNextLabel(relabeled.length + 1);
          setSelectedPinLabel(null);
        }
        return;
      }
      // Selection
      let clicked: string | null = null;
      map.forEachFeatureAtPixel(evt.pixel, feat => { if (typeof feat.get('pin') === 'string') clicked = feat.get('pin'); });
      setSelectedPinLabel(clicked);
    };

    map.on('singleclick', onClick);
    return () => void map.un('singleclick', onClick);
  }, [isAdding, isDeleting, nextLabel, pins]);

  // Move-pin interaction
  useEffect(() => {
    const map = mapObject.current;
    if (!map) return;
    let trans: Translate | null = null;

    if (selectedPinLabel) {
      const feat = vectorSource.getFeatures().find(f => f.get('pin') === selectedPinLabel);
      if (feat) {
        trans = new Translate({ features: new Collection([feat]) });
        map.addInteraction(trans);
        trans.on('translateend', e => {
          const f = e.features.item(0);
          const lbl = f?.get('pin');
          const geom = f?.getGeometry() as Point;
          if (typeof lbl === 'string' && geom) {
            const [x, y] = geom.getCoordinates();
            setPins(prev => prev.map(p => p.label === lbl ? { ...p, x, y } : p));
          }
        });
      }
    }

    return () => { if (trans) map.removeInteraction(trans); };
  }, [selectedPinLabel, vectorSource, pins]);

  // Find currently selected pin object
  const selectedPin = selectedPinLabel ? pins.find(p => p.label === selectedPinLabel) ?? null : null;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      {/* Mode buttons */}
      <div style={{ position: 'absolute', bottom: 50, left: 10, zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
        <button onClick={() => { setIsAdding(a => !a); if (!isAdding) { setIsDeleting(false); setSelectedPinLabel(null); } }}
          style={{ padding: '8px 12px', color: '#fff', fontSize: 14, borderRadius: 4, cursor: 'pointer', width: 160, textAlign: 'center', backgroundColor: isAdding ? '#495057' : '#343a40', border: '1px solid #495057' }}>
          {isAdding ? 'Exit Add-Pin Mode' : 'Enter Add-Pin Mode'}
        </button>
        <button onClick={() => { setIsDeleting(d => !d); if (!isDeleting) { setIsAdding(false); setSelectedPinLabel(null); } }}
          style={{ marginTop: 8, padding: '8px 12px', color: '#fff', fontSize: 14, borderRadius: 4, cursor: 'pointer', width: 160, textAlign: 'center', backgroundColor: isDeleting ? '#495057' : '#343a40', border: '1px solid #495057' }}>
          {isDeleting ? 'Exit Delete-Pin Mode' : 'Enter Delete-Pin Mode'}
        </button>
      </div>

      {/* Map container */}
      <div ref={mapRef} style={{ flex: 1 }} />

      {/* Sidebar */}
      <SideBar selectedLabel={selectedPin} updateInfo={updateInfo} />

      {/* Render pin features */}
      {pins.map(pin => (
        <PinFeature key={pin.label} source={vectorSource} x={pin.x} y={pin.y} pin={pin} />
      ))}
    </div>
  );
};

export default CenteredImage;