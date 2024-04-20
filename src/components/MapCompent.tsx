import React, { useRef, useEffect, useState } from "react";
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
  const [loc, setLoc] = useState("");
  const [scale, setScale] = useState(0.05);
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
            anchor: [0.5, 1],
            src: "./src/assets/pin.png",
            scale: scale,
          }), // Use the icon style state
        }),
      });

      vectorLayerRef.current = vectorLayer;

      // Sample features with points at desired locations
      const features = [
        new Feature({
          geometry: new Point([2000, 5000]),
          name: "Undertow", // Coordinates in image projection
        }),
        new Feature({
          geometry: new Point([7000, 2000]),
          name: "City of Stars",
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
          maxZoom: 8,
        }),
      });

      map.on("click", (e) => {
        let featureFound = false;
        map.forEachFeatureAtPixel(e.pixel, (feature) => {
          // Feature found at the clicked pixel
          featureFound = true;

          // Do something with the feature, such as getting its properties
          const name = feature.get("name");
          setLoc(name);
        });
        if (!featureFound) {
          const coordinates = map.getCoordinateFromPixel(e.pixel);
          const name = "New Location"; // You can set a default name for the new location

          const newFeature = new Feature({
            geometry: new Point(coordinates),
            name: name,
          });
          vectorSource.addFeature(newFeature);
        }
      });

      map.getView().on("change:resolution", (event) => {
        const resolution = event.target.getResolution();
        const zoomLevel: number | undefined = map
          .getView()
          .getZoomForResolution(resolution);
        // Update the scale based on the zoom level
        const newScale = calculateScale(zoomLevel);
        if (newScale) {
          setScale(newScale);
        }
        // Update the style of the vector layer with the new scale
        vectorLayerRef.current.setStyle(
          new Style({
            image: new Icon({
              anchor: [0.5, 1],
              src: "./src/assets/pin.png",
              scale: newScale,
            }),
          })
        );
      });

      // Function to calculate the scale based on the zoom level
      const calculateScale = (zoomLevel: number | undefined) => {
        // Define your scale logic here
        if (!zoomLevel) {
          return 0.05;
        }
        if (zoomLevel < 3) {
          return 0.05;
        } else if (zoomLevel >= 3 && zoomLevel < 4) {
          return 0.08;
        } else if (zoomLevel >= 4 && zoomLevel < 5) {
          return 0.1;
        } else if (zoomLevel >= 5) {
          return 0.2;
        }
      };
    }
  }, []);

  return (
    <div className="many-maps">
      <div ref={mapRef} className="map-container" />
      <div className="side-bar">{loc}</div>
    </div>
  );
};

export default MapComponent;
