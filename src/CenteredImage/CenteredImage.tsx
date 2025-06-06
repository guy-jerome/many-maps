// src/CenteredImage/CenteredImage.tsx

import React, { useEffect, useRef, useState } from 'react';
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
import {
  Style,
  Circle as CircleStyle,
  Fill,
  Stroke,
  Text,
} from 'ol/style';
import { Point } from 'ol/geom';

import PinFeature from '../PinFeature/PinFeature';
import SideBar from '../SideBar/SideBar';

// define once, reuse everywhere
const IMAGE_W = 10200;
const IMAGE_H = 6600;
const EXTENT: [number, number, number, number] = [0, 0, IMAGE_W, IMAGE_H];
const PIXEL_PROJ = new Projection({
  code: 'pixel',
  units: 'pixels',
  extent: EXTENT,
});

const MapWithPins: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObject = useRef<Map | null>(null);

  // 1) A single VectorSource for all PinFeature instances
  const [vectorSource] = useState(() => new VectorSource());
  const vectorLayerRef = useRef<VectorLayer<any> | null>(null);

  // 2) Keep an array of pins (label, info, x, y)
  const [pins, setPins] = useState<
    Array<{
        areaName: any; label: string; info: string; x: number; y: number 
}>
  >([
    { label: '1', areaName:'Basic Area', info: 'This is basic info', x: 1500, y: 1500 },
    { label: '2', areaName:'Basic Area 2', info: 'More information', x: 3000, y: 3000 },
  ]);

  // 3) Keep a strictly-increasing label counter for new pins
  const [nextLabel, setNextLabel] = useState(pins.length + 1);

  // 4) Which pin-label is currently selected (or null)
  const [selectedPinLabel, setSelectedPinLabel] = useState<string | null>(null);

  // Use a ref so the style function can always see the latest selectedPinLabel:
  const selectedPinLabelRef = useRef<string | null>(null);

  // Whenever selectedPinLabel changes, update the ref and re-render layer
  useEffect(() => {
    selectedPinLabelRef.current = selectedPinLabel;
    if (vectorLayerRef.current) {
      vectorLayerRef.current.changed();
    }
  }, [selectedPinLabel]);

  // 5) Two mutually-exclusive modes: add / delete
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Move‐Pin mode is now implied by “selectedPinLabel !== null”

  // 6) When the user “Saves” in the sidebar, update that pin’s info
const updateInfo = (label: string, newInfo: string, newArea?: string) => {
  setPins((prev) =>
    prev.map((pin) =>
      pin.label === label
        ? { ...pin, info: newInfo, areaName: newArea ?? pin.areaName }
        : pin
    )
  );
};

  //
  // ─── INITIALIZE THE MAP (only once) ───────────────────────────────────────────────
  //
  useEffect(() => {
    if (!mapRef.current) return;

    // Create the VectorLayer with a style function that reads selectedPinLabelRef.current
    const vectorLayer = new VectorLayer(
      ({
        source: vectorSource,
        zIndex: 1,
        renderMode: 'vector',
        updateWhileAnimating: true,
        updateWhileInteracting: true,
        style: (feature: any, resolution: number) => {
          // Convert a fixed “map‐unit” radius into px
          const MAP_RADIUS_IN_MAP_UNITS = 100;
          const displayRadiusPx = MAP_RADIUS_IN_MAP_UNITS / resolution;

          const rawLabel = feature.get('pin');
          const textValue = typeof rawLabel === 'string' ? rawLabel : '';

          // Read the latest selection from the ref:
          const currentlySelected = selectedPinLabelRef.current;
          const strokeColor =
            rawLabel === currentlySelected ? 'blue' : 'white';

          return new Style({
            image: new CircleStyle({
              radius: displayRadiusPx,
              fill: new Fill({ color: 'black' }),
              stroke: new Stroke({ color: strokeColor, width: 2 }),
            }),
            text: new Text({
              text: textValue,
              font: `${displayRadiusPx}px sans-serif`,
              fill: new Fill({ color: 'white' }),
              offsetY: 0,
            }),
          });
        },
      } as any) // cast to any so TS allows renderMode / updateWhile*
    );
    vectorLayerRef.current = vectorLayer;

    // Now initialize the map
    const map = new Map({
      target: mapRef.current,
      layers: [
        new ImageLayer({
          source: new Static({
            url: '/images/mentzer-dungeon.png',
            projection: PIXEL_PROJ,
            imageExtent: EXTENT,
          }),
          zIndex: 0,
        }),
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
  }, [vectorSource]); // no dependence on selectedPinLabel here

  //
  // ─── HANDLE SINGLE-CLICKS ON THE MAP ─────────────────────────────────────────────
  //
  useEffect(() => {
    const map = mapObject.current;
    if (!map) return;

    const onClick = (evt: any) => {
      // 1) If in “Add” mode, drop a new pin but stay in Add mode
      if (isAdding) {
        const [newX, newY] = evt.coordinate as [number, number];
        const newLabel = String(nextLabel);

        setPins((prev) => [
          ...prev,
          { label: newLabel, info: '', areaName: '', x: newX, y: newY },
        ]);
        setNextLabel((n) => n + 1);
        return;
      }

      // 2) If in “Delete” mode, remove the clicked pin and re‐label
      if (isDeleting) {
        let clickedLabel: string | null = null;
        map.forEachFeatureAtPixel(evt.pixel, (feature) => {
          const lab = feature.get('pin');
          if (typeof lab === 'string') {
            clickedLabel = lab;
          }
        });

        if (clickedLabel !== null) {
          const filtered = pins.filter((pin) => pin.label !== clickedLabel);
          // Re‐label the remaining pins 1..N
          const relabeled = filtered.map((pin, idx) => ({
            label: String(idx + 1),
            info: pin.info,
            areaName: pin.areaName,
            x: pin.x,
            y: pin.y,
          }));

          setPins(relabeled);
          setNextLabel(relabeled.length + 1);
          setSelectedPinLabel(null);
        }
        return;
      }

      // 3) Otherwise: check if a pin was clicked
      let clickedLabel: string | null = null;
      map.forEachFeatureAtPixel(evt.pixel, (feature) => {
        const lab = feature.get('pin');
        if (typeof lab === 'string') {
          clickedLabel = lab;
        }
      });

      if (clickedLabel !== null) {
        // Clicking a pin selects it (turn border blue). Translation is handled in the next effect.
        setSelectedPinLabel(clickedLabel);
      } else {
        // Clicking empty space clears selection (white border)
        setSelectedPinLabel(null);
      }
    };

    map.on('singleclick', onClick);
    return () => {
      map.un('singleclick', onClick);
    };
  }, [isAdding, isDeleting, nextLabel, pins]);

  //
  // ─── MOVE-PIN MODE VIA OL’s Translate INTERACTION (only for selected pin) ────────
  //
  useEffect(() => {
    const map = mapObject.current;
    if (!map) return;

    let translate: Translate | null = null;

    if (selectedPinLabel !== null) {
      // Find the single feature that matches the selected label
      const allFeatures = vectorSource.getFeatures();
      const featureToMove = allFeatures.find(
        (f) => f.get('pin') === selectedPinLabel
      );
      if (featureToMove) {
        // Create a collection containing only that one feature
        const singleFeatureCollection = new Collection([featureToMove]);
        translate = new Translate({
          features: singleFeatureCollection,
        });
        map.addInteraction(translate);

        translate.on('translateend', (evt) => {
          const feature = evt.features.item(0);
          if (!feature) return;
          const label = feature.get('pin');
          if (typeof label !== 'string') return;

          const geom = feature.getGeometry() as Point;
          const [newX, newY] = geom.getCoordinates();

          setPins((prev) =>
            prev.map((pin) =>
              pin.label === label ? { ...pin, x: newX, y: newY } : pin
            )
          );
        });
      }
    }

    return () => {
      if (translate) {
        map.removeInteraction(translate);
      }
    };
  }, [selectedPinLabel, vectorSource, pins]);

  //
  // ─── LOOK UP THE “LIVE” PIN OBJECT FOR THE SIDEBAR ───────────────────────────────
  //
  const selectedPinObj =
    selectedPinLabel === null
      ? null
      : pins.find((p) => p.label === selectedPinLabel) || null;

  //
  // ─── RENDER EVERYTHING ───────────────────────────────────────────────────────────
  //
  return (
    <div style={containerStyle}>
      {/* ─── MODE TOGGLE BUTTONS (bottom-left) ───────────────────────────── */}
      <div style={buttonContainer}>
        <button
          onClick={() => {
            setIsAdding((prev) => !prev);
            if (!isAdding) {
              setIsDeleting(false);
              setSelectedPinLabel(null);
            }
          }}
          style={{
            ...toggleButtonStyle,
            backgroundColor: isAdding ? '#495057' : '#343a40',
            border: '1px solid #495057',
          }}
        >
          {isAdding ? 'Exit Add-Pin Mode' : 'Enter Add-Pin Mode'}
        </button>

        <button
          onClick={() => {
            setIsDeleting((prev) => !prev);
            if (!isDeleting) {
              setIsAdding(false);
              setSelectedPinLabel(null);
            }
          }}
          style={{
            ...toggleButtonStyle,
            marginTop: '8px',
            backgroundColor: isDeleting ? '#495057' : '#343a40',
            border: '1px solid #495057',
          }}
        >
          {isDeleting ? 'Exit Delete-Pin Mode' : 'Enter Delete-Pin Mode'}
        </button>
      </div>

      {/* ─── THE OPENLAYERS MAP ───────────────────────────────────────────── */}
      <div ref={mapRef} style={mapStyle} />

      {/* ─── SIDEBAR ───────────────────────────────────────────────────────── */}
      <SideBar selectedLabel={selectedPinObj} updateInfo={updateInfo} />

      {/* ─── DRAW ALL PINS ─────────────────────────────────────────────────── */}
      {pins.map((pin) => (
        <PinFeature
          key={pin.label}
          source={vectorSource}
          x={pin.x}
          y={pin.y}
          pin={{ label: pin.label, info: pin.info, areaName: pin.areaName }}
        />
      ))}
    </div>
  );
};

// ───────────────────────────────────────────────────────────────────────────────
// Styles
// ───────────────────────────────────────────────────────────────────────────────
const containerStyle: React.CSSProperties = {
  display: 'flex',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  position: 'relative', // so buttons can be absolutely positioned
};

const mapStyle: React.CSSProperties = {
  flex: 1,
};

const buttonContainer: React.CSSProperties = {
  position: 'absolute',
  bottom: '50px',
  left: '10px',
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
};

const toggleButtonStyle: React.CSSProperties = {
  padding: '8px 12px',
  color: '#fff',
  fontSize: '14px',
  borderRadius: '4px',
  cursor: 'pointer',
  width: '160px',
  textAlign: 'center',
};

export default MapWithPins;
