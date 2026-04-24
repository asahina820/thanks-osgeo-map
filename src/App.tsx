import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { CONFIG } from "./config";
import type { Item, PickedLocation } from "./types";
import { Form } from "./components/Form";
import { Button } from "@/components/ui/button";

export function App() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [pickingLocation, setPickingLocation] = useState(false);
  const pickingLocationRef = useRef(false);
  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(null);
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
        const fields = Object.fromEntries(item.fields.map((f) => [f.key, f.value]));
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

    const geojson: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };

    if (map.getSource("items")) {
      (map.getSource("items") as maplibregl.GeoJSONSource).setData(geojson);
      return;
    }

    map.addSource("items", { type: "geojson", data: geojson });
    map.addLayer({
      id: "items-circles",
      type: "circle",
      source: "items",
      paint: {
        "circle-radius": 8,
        "circle-color": "#4caf50",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff",
        "circle-opacity": 0.85,
      },
    });

    map.on("click", "items-circles", (e) => {
      if (pickingLocationRef.current) return;
      const feature = e.features?.[0];
      if (!feature) return;
      const props = feature.properties as Record<string, string>;
      const coords = (feature.geometry as GeoPoint).coordinates;
      const favoriteHtml = props.favorite
        ? `<p class="popup-favorite">${props.favorite}</p>`
        : "";
      new maplibregl.Popup({ maxWidth: "280px" })
        .setLngLat(coords)
        .setHTML(
          `<div class="popup-body">
            <p class="popup-name">${props.nickname} <span class="popup-country">${props.country}</span></p>
            ${favoriteHtml}
            <p class="popup-comment">${props.comment}</p>
          </div>`
        )
        .addTo(map);
    });

    map.on("mouseenter", "items-circles", () => {
      if (!pickingLocationRef.current) map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "items-circles", () => {
      if (!pickingLocationRef.current) map.getCanvas().style.cursor = "";
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://tile.openstreetmap.jp/styles/maptiler-basic-en/style.json",
      center: [137, 37],
      zoom: 2,
    });
    map.addControl(new maplibregl.NavigationControl(), "bottom-right");
    map.on("load", loadItemsLayer);
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
          geometry: { type: "Point", coordinates: [pickedLocation.lng, pickedLocation.lat] },
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
        style={{ position: "absolute", inset: 0 }}
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
