// src/CenteredImage/CenteredImage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

import {
  getMapRecord,
  updateMapPins,
  PinData,
} from '../idbService';

import './CenteredImage.css';

const IMAGE_W = 10200;
const IMAGE_H = 6600;
const EXTENT: [number, number, number, number] = [0, 0, IMAGE_W, IMAGE_H];
const PIXEL_PROJ = new Projection({
  code: 'pixel',
  units: 'pixels',
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
  const [nextLabel, setNextLabel] = useState(1);
  const [selectedPinLabel, setSelectedPinLabel] = useState<string | null>(null);
  const selectedPinLabelRef = useRef<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // keep label-ref in sync
  useEffect(() => {
    selectedPinLabelRef.current = selectedPinLabel;
    if (vectorLayerRef.current) vectorLayerRef.current.changed();
  }, [selectedPinLabel]);

  // sidebar callback
  const updateInfo = (
    label: string,
    newInfo: string,
    newArea?: string,
    newExtraSections?: PinData['extraSections']
  ) => {
    setPins((prev) =>
      prev.map((p) =>
        p.label === label
          ? {
              ...p,
              info: newInfo,
              areaName: newArea ?? p.areaName,
              extraSections: newExtraSections ?? p.extraSections,
            }
          : p
      )
    );
  };

  // ─── load map + pins ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapId) return;
    let objectUrl: string;
    getMapRecord(mapId).then((rec) => {
      if (!rec) return;
      objectUrl = URL.createObjectURL(rec.blob);
      setMapUrl(objectUrl);
      setPins(rec.pins || []);
      setNextLabel((rec.pins?.length ?? 0) + 1);
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mapId]);

  // ─── persist pins on change ──────────────────────────────────────
  useEffect(() => {
    if (mapId) updateMapPins(mapId, pins).catch(console.error);
  }, [mapId, pins]);

  // ─── initialize OL when mapUrl ready ─────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapUrl) return;

    setLoading(true);
    const staticSrc = new Static({
      url: mapUrl,
      projection: PIXEL_PROJ,
      imageExtent: EXTENT,
    });

    // spinner control
    staticSrc.on('imageloadstart', () => setLoading(true));
    staticSrc.on('imageloadend', () => setLoading(false));
    staticSrc.on('imageloaderror', () => setLoading(false));

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      zIndex: 1,
      style: (feature, resolution) => {
        const radius = 100 / resolution;
        const lbl = feature.get('pin') as string;
        const isSel = selectedPinLabelRef.current === lbl;
        return new Style({
          image: new CircleStyle({
            radius,
            fill: new Fill({ color: 'black' }),
            stroke: new Stroke({ color: isSel ? 'blue' : 'white', width: 2 }),
          }),
          text: new Text({
            text: lbl,
            font: `${radius}px sans-serif`,
            fill: new Fill({ color: 'white' }),
          }),
        });
      },
    });
    vectorLayerRef.current = vectorLayer;

    const map = new Map({
      target: mapRef.current,
      layers: [
        new ImageLayer({ source: staticSrc, zIndex: 0 }),
        vectorLayer,
      ],
      view: new View({
        projection: PIXEL_PROJ,
        center: getCenter(EXTENT),
        zoom: 2,
        minZoom: 1,
        maxZoom: 8,
        extent: EXTENT,
      }),
    });

    mapObject.current = map;
    return () => {
      map.setTarget(undefined);
      map.dispose?.();
    };
  }, [vectorSource, mapUrl]);

  // ─── click handlers ──────────────────────────────────────────────
  useEffect(() => {
    const map = mapObject.current;
    if (!map) return;

    const onClick = (evt: any) => {
      if (isAdding) {
        const [x, y] = evt.coordinate;
        const label = `${nextLabel}`;
        setPins((p) => [...p, { label, info: '', areaName: '', x, y, extraSections: [] }]);
        setNextLabel((n) => n + 1);
        return;
      }
      if (isDeleting) {
        let hit: string | null = null;
        map.forEachFeatureAtPixel(evt.pixel, (feat) => {
          if (typeof feat.get('pin') === 'string') hit = feat.get('pin');
        });
        if (hit) {
          const rem = pins.filter((p) => p.label !== hit);
          const rel = rem.map((p, i) => ({ ...p, label: `${i + 1}` }));
          setPins(rel);
          setNextLabel(rel.length + 1);
          setSelectedPinLabel(null);
        }
        return;
      }
      let hit: string | null = null;
      map.forEachFeatureAtPixel(evt.pixel, (feat) => {
        if (typeof feat.get('pin') === 'string') hit = feat.get('pin');
      });
      setSelectedPinLabel(hit);
    };

    map.on('singleclick', onClick);
    return () => map.un('singleclick', onClick);
  }, [isAdding, isDeleting, nextLabel, pins]);

  // ─── drag interaction ────────────────────────────────────────────
  useEffect(() => {
    const map = mapObject.current;
    if (!map) return;
    let trans: Translate | null = null;
    if (selectedPinLabel) {
      const feat = vectorSource.getFeatures().find((f) => f.get('pin') === selectedPinLabel);
      if (feat) {
        trans = new Translate({ features: new Collection([feat]) });
        map.addInteraction(trans);
        trans.on('translateend', (e) => {
          const f = e.features.item(0);
          const lbl = f?.get('pin');
          const geom = f?.getGeometry() as Point;
          if (typeof lbl === 'string' && geom) {
            const [x, y] = geom.getCoordinates();
            setPins((prev) => prev.map((p) => (p.label === lbl ? { ...p, x, y } : p)));
          }
        });
      }
    }
    return () => { if (trans) map.removeInteraction(trans); };
  }, [selectedPinLabel, vectorSource, pins]);

  const selectedPin = selectedPinLabel ? pins.find((p) => p.label === selectedPinLabel) || null : null;

  return (
    <div className="ci-container">
      {loading && (
        <div className="ci-spinner-overlay">
          <div className="ci-spinner" />
        </div>
      )}

      <button className="ci-back-btn" onClick={() => navigate('/')}>
        ← Back to Maps
      </button>

      <div className="ci-mode-btns">
        <button onClick={() => { setIsAdding(a => !a); if (!isAdding) { setIsDeleting(false); setSelectedPinLabel(null); } }}>
          {isAdding ? 'Exit Add-Pin Mode' : 'Enter Add-Pin Mode'}
        </button>
        <button onClick={() => { setIsDeleting(d => !d); if (!isDeleting) { setIsAdding(false); setSelectedPinLabel(null); } }}>
          {isDeleting ? 'Exit Delete-Pin Mode' : 'Enter Delete-Pin Mode'}
        </button>
      </div>

      <div ref={mapRef} className="ci-map" />
      <SideBar selectedLabel={selectedPin} updateInfo={updateInfo} />
      {pins.map(p => (
        <PinFeature key={p.label} source={vectorSource} x={p.x} y={p.y} pin={p} />
      ))}
    </div>
  );
};

export default CenteredImage;
