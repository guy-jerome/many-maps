// Custom hook for map interactions
import { useEffect } from "react";
import Map from "ol/Map";
import { handleMapClick } from "./mapHelpers";
import { PinData, PinType } from "../idbService";

export const useMapInteractions = (
  mapObject: React.RefObject<Map | null>,
  isAdding: boolean,
  isDeleting: boolean,
  nextLabel: number,
  selectedPinType: PinType,
  pins: PinData[],
  setPins: React.Dispatch<React.SetStateAction<PinData[]>>,
  setNextLabel: (label: number) => void,
  setSelectedPinLabel: (label: string | null) => void,
  mapInitialized: boolean
) => {
  useEffect(() => {
    const map = mapObject.current;
    if (!map || !mapInitialized) return;

    const onClick = (evt: any) => {
      handleMapClick(
        evt,
        map,
        isAdding,
        isDeleting,
        nextLabel,
        selectedPinType,
        pins,
        setPins,
        setNextLabel,
        setSelectedPinLabel
      );
    };

    const onPointerMove = (evt: any) => {
      const hit = map.hasFeatureAtPixel(evt.pixel);
      map.getTargetElement().style.cursor = hit ? "pointer" : "";
    };

    map.on("singleclick", onClick);
    map.on("pointermove", onPointerMove);

    return () => {
      map.un("singleclick", onClick);
      map.un("pointermove", onPointerMove);
    };
  }, [
    mapObject,
    isAdding,
    isDeleting,
    nextLabel,
    selectedPinType,
    pins,
    setPins,
    setNextLabel,
    setSelectedPinLabel,
    mapInitialized,
  ]);
};
