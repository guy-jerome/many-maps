// Custom hook for map data management
import { useState, useEffect } from "react";
import { getMapRecord, updateMapPins, PinData } from "../idbService";
import { DND_PIN_TYPES } from "./constants";

export const useMapData = (mapId: string | undefined) => {
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [pins, setPins] = useState<PinData[]>([]);
  const [mapName, setMapName] = useState<string>("");
  const [mapDescription, setMapDescription] = useState<string>("");
  const [nextLabel, setNextLabel] = useState(1);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Load map data on mount
  useEffect(() => {
    if (!mapId) return;
    
    let objectUrl: string;
    
    const loadMapData = async () => {
      try {
        const rec = await getMapRecord(mapId);
        if (!rec) return;
        
        objectUrl = URL.createObjectURL(rec.blob);
        setMapUrl(objectUrl);

        // Handle backward compatibility for pins without pinType
        const updatedPins = (rec.pins || []).map((pin) => ({
          ...pin,
          pinType: pin.pinType || DND_PIN_TYPES[0],
        }));

        setPins(updatedPins);
        setNextLabel((rec.pins?.length ?? 0) + 1);
        setMapName(rec.name);
        setMapDescription(rec.description || "");
        setEditName(rec.name);
        setEditDesc(rec.description || "");
      } catch (error) {
        console.error("Error loading map data:", error);
      }
    };

    loadMapData();
    
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mapId]);

  // Persist pins whenever they change
  useEffect(() => {
    if (mapId && pins.length >= 0) {
      updateMapPins(mapId, pins).catch(console.error);
    }
  }, [mapId, pins]);

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

  return {
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
  };
};
