import React, { useRef, useEffect } from "react";
import Map from "ol/Map";
import View from "ol/View";
import ImageLayer from "ol/layer/Image";
import ImageStatic from "ol/source/ImageStatic";
import Projection from "ol/proj/Projection";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { Icon, Style } from "ol/style";

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const vectorLayerRef = useRef<VectorLayer>();

  useEffect(() => {
    if (mapRef.current) {
      // Specify your image details
      const imageUrl = "src/assets/Sword-Coast-Map_HighRes.jpg";
      const imageExtent = [0, 0, 10100, 6600]; // [minX, minY, maxX, maxY]

      // Create an image projection (if your image has georeferencing)
      const imageProjection = new Projection({
        code: "my-image-projection", // Replace if needed
        units: "pixels",
        extent: imageExtent,
      });

      // Vector layer for pins
      const vectorSource = new VectorSource();
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: new Style({
          image: new Icon({
            anchor: [0.5, 1], // Center the icon at its base
            src: "src/assets/pin.png", // Path to your pin icon
            scale: 0.1,
          }),
        }),
      });

      vectorLayerRef.current = vectorLayer;

      // Sample features with points at desired locations
      const features = [
        new Feature({
          geometry: new Point([2000, 5000]), // Coordinates in image projection
        }),
        new Feature({
          geometry: new Point([7000, 2000]),
        }),
      ];
      vectorSource.addFeatures(features);

      const map = new Map({
        target: mapRef.current,
        layers: [
          new ImageLayer({
            source: new ImageStatic({
              url: imageUrl,
              projection: imageProjection,
              imageExtent: imageExtent,
            }),
          }),
          vectorLayer,
        ],
        view: new View({
          projection: imageProjection,
          center: [imageExtent[0] / 2, imageExtent[1] / 2],
          zoom: 2,
          extent: imageExtent,
        }),
      });

      map.on("movestart", () => {
        const resolution = map.getView().getResolution();
        const scale = 0.1 / resolution; // Adjust 0.1 to the base scale of your icon
        vectorLayer.setStyle(
          new Style({
            image: new Icon({
              anchor: [0.5, 1],
              src: "src/assets/pin.png",
              scale: scale,
            }),
          })
        );
      });
    }
  }, []);

  return <div ref={mapRef} className="map-container" />;
};

export default MapComponent;
