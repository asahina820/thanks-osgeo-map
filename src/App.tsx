import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import maplibregl, { GlobeControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { CONFIG } from "./config";
import type { Item, PickedLocation } from "./types";
import { Form } from "./components/Form";
import { Button } from "@/components/ui/button";
import { MapPopup } from "./components/MapPopup";
import { MapInfo } from "./components/MapInfo";
import { StatsDialog } from "./components/StatsDialog";

export function App() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [pickingLocation, setPickingLocation] = useState(false);
  const pickingLocationRef = useRef(false);
  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(
    null,
  );
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    pickingLocationRef.current = pickingLocation;
  }, [pickingLocation]);

  const loadItemsLayer = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;

    let items: Item[] = [];
    try {
      const res = await fetch(`${CONFIG.backendUrl}/items`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { data?: { items?: Item[] } };
      items = json.data?.items ?? [];
    } catch (e) {
      console.error("Failed to load items:", e);
    }

    type GeoPoint = { type: "Point"; coordinates: [number, number] };

    const features = items
      .map((item) => {
        const fields = Object.fromEntries(
          item.fields.map((f) => [f.key, f.value]),
        );
        const raw = fields["location"];
        const location: GeoPoint | null =
          typeof raw === "string" ? JSON.parse(raw) : (raw as GeoPoint | null);
        if (!location?.coordinates) return null;
        return {
          type: "Feature" as const,
          geometry: location,
          properties: {
            nickname: String(fields["nickname"] ?? ""),
            country: String(fields["country"] ?? ""),
            favorite: String(fields["your-favorite-foss4g"] ?? ""),
            comment: String(fields["comment"] ?? ""),
          },
        };
      })
      .filter((f): f is NonNullable<typeof f> => f !== null);

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features,
    };

    if (map.getSource("items")) {
      (map.getSource("items") as maplibregl.GeoJSONSource).setData(geojson);
      return;
    }

    map.addSource("items", {
      type: "geojson",
      data: geojson,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    // Cluster circles
    map.addLayer({
      id: "items-clusters",
      type: "circle",
      source: "items",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#4caf50",
        "circle-radius": ["step", ["get", "point_count"], 20, 10, 28, 50, 36],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff",
        "circle-opacity": 0.85,
      },
    });

    // Cluster count labels
    map.addLayer({
      id: "items-cluster-count",
      type: "symbol",
      source: "items",
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-size": 13,
      },
      paint: { "text-color": "#fff" },
    });

    // Individual points
    map.addLayer({
      id: "items-unclustered",
      type: "circle",
      source: "items",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-radius": 8,
        "circle-color": "#4caf50",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff",
        "circle-opacity": 0.85,
      },
    });

    // Click cluster → zoom in
    map.on("click", "items-clusters", async (e) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const clusterId = feature.properties?.cluster_id as number;
      const source = map.getSource("items") as maplibregl.GeoJSONSource;
      const zoom = await source.getClusterExpansionZoom(clusterId);
      map.easeTo({ center: (feature.geometry as GeoPoint).coordinates, zoom });
    });

    // Click individual point → popup
    map.on("click", "items-unclustered", (e) => {
      if (pickingLocationRef.current) return;
      const feature = e.features?.[0];
      if (!feature) return;
      const props = feature.properties as Record<string, string>;
      const coords = (feature.geometry as GeoPoint).coordinates;

      const container = document.createElement("div");
      const root = createRoot(container);
      root.render(
        <MapPopup
          nickname={props.nickname}
          country={props.country}
          favorite={props.favorite}
          comment={props.comment}
        />,
      );

      const popup = new maplibregl.Popup({ maxWidth: "none", closeButton: false })
        .setLngLat(coords)
        .setDOMContent(container)
        .addTo(map);

      popup.on("close", () => root.unmount());
    });

    map.on("mouseenter", "items-clusters", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "items-clusters", () => {
      map.getCanvas().style.cursor = "";
    });
    map.on("mouseenter", "items-unclustered", () => {
      if (!pickingLocationRef.current) map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "items-unclustered", () => {
      if (!pickingLocationRef.current) map.getCanvas().style.cursor = "";
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style:
        "https://tile.openstreetmap.jp/styles/maptiler-basic-en/style.json",
      center: [137, 37],
      zoom: 2,
    });
    map.addControl(new maplibregl.NavigationControl(), "bottom-right");
    map.addControl(new GlobeControl(), "bottom-right");
    map.on("load", () => {
      map.setSky({
        "sky-color": "#0d1b3e",
        "sky-horizon-blend": 0.5,
        "horizon-color": "#0d1b3e",
        "horizon-fog-blend": 0.2,
        "atmosphere-blend": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0, 1,
          5, 1,
          7, 0,
        ],
      });
      loadItemsLayer();
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [loadItemsLayer]);

  // Map click for location picking
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pickingLocation) return;

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      setPickingLocation(false);
      setPickedLocation({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    };
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [pickingLocation]);

  // Update pin layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pickedLocation || !map.isStyleLoaded()) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [pickedLocation.lng, pickedLocation.lat],
          },
          properties: {},
        },
      ],
    };

    if (map.getSource("pin")) {
      (map.getSource("pin") as maplibregl.GeoJSONSource).setData(geojson);
      return;
    }

    map.addSource("pin", { type: "geojson", data: geojson });
    map.addLayer({
      id: "pin-layer",
      type: "circle",
      source: "pin",
      paint: {
        "circle-radius": 10,
        "circle-color": "#4caf50",
        "circle-stroke-width": 3,
        "circle-stroke-color": "#fff",
        "circle-pitch-alignment": "map",
      },
    });
  }, [pickedLocation]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={mapContainerRef}
        style={{ position: "absolute", inset: 0, backgroundColor: "#0d1b3e" }}
        className={pickingLocation ? "map-picking" : undefined}
      />
      <Form
        pickingLocation={pickingLocation}
        pickedLocation={pickedLocation}
        onTogglePick={() => setPickingLocation((prev) => !prev)}
        onSubmitSuccess={loadItemsLayer}
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
      />
      <MapInfo />
      <StatsDialog />
      {/* FAB: mobile only */}
      {!formOpen && (
        <Button
          className="flex sm:hidden items-center justify-center absolute bottom-6 right-4 z-10 w-14 h-14 rounded-full bg-[#1a1a2e] text-[22px] shadow-lg"
          onClick={() => setFormOpen(true)}
          aria-label="Open form"
        >
          ✏️
        </Button>
      )}
    </div>
  );
}
