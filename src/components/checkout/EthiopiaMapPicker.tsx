"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ETHIOPIA_BOUNDS,
  ETHIOPIA_CENTER,
  ETHIOPIA_DEFAULT_ZOOM,
  ETHIOPIA_LOCATION_ZOOM,
} from "@/lib/ethiopia-locations";

export interface MapPosition {
  lat: number;
  lng: number;
}

interface EthiopiaMapPickerProps {
  marker: MapPosition | null;
  focus: MapPosition | null;
  onMarkerChange: (position: MapPosition) => void;
}

function fixLeafletIcons() {
  // Webpack/Next bundles break Leaflet's default marker asset paths.
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

export default function EthiopiaMapPicker({
  marker,
  focus,
  onMarkerChange,
}: EthiopiaMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onMarkerChangeRef = useRef(onMarkerChange);

  useEffect(() => {
    onMarkerChangeRef.current = onMarkerChange;
  }, [onMarkerChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    fixLeafletIcons();

    const map = L.map(containerRef.current, {
      center: [ETHIOPIA_CENTER.lat, ETHIOPIA_CENTER.lng],
      zoom: ETHIOPIA_DEFAULT_ZOOM,
      maxBounds: ETHIOPIA_BOUNDS,
      maxBoundsViscosity: 0.85,
      minZoom: 5,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    map.on("click", (e) => {
      onMarkerChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (marker) {
      if (markerRef.current) {
        markerRef.current.setLatLng([marker.lat, marker.lng]);
      } else {
        markerRef.current = L.marker([marker.lat, marker.lng], { draggable: true }).addTo(
          map,
        );
        markerRef.current.on("dragend", () => {
          const pos = markerRef.current?.getLatLng();
          if (pos) {
            onMarkerChangeRef.current({ lat: pos.lat, lng: pos.lng });
          }
        });
      }
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [marker]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;

    map.flyTo([focus.lat, focus.lng], ETHIOPIA_LOCATION_ZOOM, { duration: 0.8 });
  }, [focus]);

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500">
        Click the map or drag the pin to mark your delivery area within Ethiopia.
      </p>
      <div
        ref={containerRef}
        className="h-64 w-full overflow-hidden rounded-xl border border-zinc-200 sm:h-72"
        aria-label="Ethiopia delivery map"
      />
    </div>
  );
}
