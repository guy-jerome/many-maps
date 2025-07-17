// Custom hook for pin interaction management
import { useEffect, useRef } from "react";
import Map from "ol/Map";
import VectorSource from "ol/source/Vector";
import Translate from "ol/interaction/Translate";
import Collection from "ol/Collection";
import { Point } from "ol/geom";
import { PinData } from "../idbService";

export const usePinDragInteraction = (
  mapObject: React.RefObject<Map | null>,
  vectorSource: VectorSource,
  selectedPinLabel: string | null,
  setPins: React.Dispatch<React.SetStateAction<PinData[]>>
) => {
  const translateInteractionRef = useRef<Translate | null>(null);
  const translateCollectionRef = useRef<Collection<any> | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  useEffect(() => {
    const map = mapObject.current;
    if (!map) return;

    // Remove existing interaction if any
    if (translateInteractionRef.current) {
      map.removeInteraction(translateInteractionRef.current);
      translateInteractionRef.current = null;
      translateCollectionRef.current = null;
    }

    if (selectedPinLabel) {
      const feat = vectorSource
        .getFeatures()
        .find((f) => f.get("pin") === selectedPinLabel);
      if (feat) {
        const collection = new Collection([feat]);
        const trans = new Translate({ features: collection });
        translateInteractionRef.current = trans;
        translateCollectionRef.current = collection;
        map.addInteraction(trans);

        // Track when dragging starts
        trans.on("translatestart", () => {
          isDraggingRef.current = true;
        });

        // Only update state when drag ends
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
          // Reset dragging flag immediately
          isDraggingRef.current = false;
        });
      }
    }

    return () => {
      if (translateInteractionRef.current) {
        map.removeInteraction(translateInteractionRef.current);
        translateInteractionRef.current = null;
        translateCollectionRef.current = null;
      }
    };
  }, [selectedPinLabel, vectorSource, mapObject, setPins]);

  return isDraggingRef;
};
