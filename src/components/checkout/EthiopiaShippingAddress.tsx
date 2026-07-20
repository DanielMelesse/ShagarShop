"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { MapPosition } from "@/components/checkout/EthiopiaMapPicker";
import {
  ETHIOPIA_REGIONS,
  findLocationInRegion,
  getEthiopiaRegion,
  getLocationsForRegion,
} from "@/lib/ethiopia-locations";

const EthiopiaMapPicker = dynamic(() => import("@/components/checkout/EthiopiaMapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-64 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 sm:h-72" />
  ),
});

const DATALIST_ID = "ethiopia-area-options";

interface EthiopiaShippingAddressProps {
  defaultName?: string;
}

export function EthiopiaShippingAddress({ defaultName }: EthiopiaShippingAddressProps) {
  const [regionId, setRegionId] = useState("addis-ababa");
  const [area, setArea] = useState("");
  const [street, setStreet] = useState("");
  const [marker, setMarker] = useState<MapPosition | null>(null);
  const [mapFocus, setMapFocus] = useState<MapPosition | null>(null);

  const [showMap, setShowMap] = useState(false);

  const region = getEthiopiaRegion(regionId);
  const areaOptions = useMemo(() => getLocationsForRegion(regionId), [regionId]);

  const cityValue = region
    ? area.trim()
      ? `${region.label} — ${area.trim()}`
      : region.label
    : area.trim();

  const addressValue = marker
    ? `${street.trim()} (Pin: ${marker.lat.toFixed(5)}, ${marker.lng.toFixed(5)})`
    : street.trim();

  function handleRegionChange(nextRegionId: string) {
    setRegionId(nextRegionId);
    setArea("");
    setMarker(null);
    setMapFocus(null);
  }

  function handleAreaChange(value: string) {
    setArea(value);
    const match = findLocationInRegion(regionId, value);
    if (match) {
      setMapFocus({ lat: match.lat, lng: match.lng });
      setMarker({ lat: match.lat, lng: match.lng });
    }
  }

  return (
    <fieldset className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
      <legend className="px-1 text-sm font-semibold text-zinc-900">
        Shipping address
      </legend>

      <input
        required
        name="name"
        placeholder="Full name"
        defaultValue={defaultName ?? ""}
        className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700">Region</span>
          <select
            value={regionId}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm"
          >
            {ETHIOPIA_REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700">
            City / area
          </span>
          <input
            list={DATALIST_ID}
            value={area}
            onChange={(e) => handleAreaChange(e.target.value)}
            placeholder="Type or choose from list"
            className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm"
            autoComplete="address-level2"
          />
          <datalist id={DATALIST_ID}>
            {areaOptions.map((loc) => (
              <option key={loc.id} value={loc.label} />
            ))}
          </datalist>
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-zinc-700">
          Street, building, and directions
        </span>
        <textarea
          required
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          rows={2}
          placeholder="e.g. Bole Road, near Edna Mall, Gate 2"
          className="w-full resize-y rounded-lg border border-zinc-300 px-4 py-2 text-sm"
          autoComplete="street-address"
        />
      </label>

      <div className="space-y-3">
        {!showMap ? (
          <button
            type="button"
            onClick={() => setShowMap(true)}
            className="w-full rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
          >
            Pick location on map (optional)
          </button>
        ) : (
          <EthiopiaMapPicker
            marker={marker}
            focus={mapFocus}
            onMarkerChange={(position) => {
              setMarker(position);
              setMapFocus(position);
            }}
          />
        )}
      </div>

      {/* Submitted to existing order API */}
      <input type="hidden" name="city" value={cityValue} />
      <input type="hidden" name="address" value={addressValue} />
      <input type="hidden" name="zip" value={region?.postalCode ?? "1000"} />
    </fieldset>
  );
}
