export interface EthiopiaRegion {
  id: string;
  label: string;
  postalCode: string;
}

export interface EthiopiaLocation {
  id: string;
  label: string;
  regionId: string;
  lat: number;
  lng: number;
}

/** Ethiopia map framing */
export const ETHIOPIA_CENTER = { lat: 9.145, lng: 40.49 };
export const ETHIOPIA_DEFAULT_ZOOM = 6;
export const ETHIOPIA_LOCATION_ZOOM = 13;
export const ETHIOPIA_BOUNDS: [[number, number], [number, number]] = [
  [3.4, 33.0],
  [14.9, 48.0],
];

export const ETHIOPIA_REGIONS: EthiopiaRegion[] = [
  { id: "addis-ababa", label: "Addis Ababa", postalCode: "1000" },
  { id: "dire-dawa", label: "Dire Dawa", postalCode: "3000" },
  { id: "afar", label: "Afar", postalCode: "1000" },
  { id: "amhara", label: "Amhara", postalCode: "1000" },
  { id: "benishangul-gumuz", label: "Benishangul-Gumuz", postalCode: "1000" },
  { id: "central-ethiopia", label: "Central Ethiopia", postalCode: "1000" },
  { id: "gambela", label: "Gambela", postalCode: "1000" },
  { id: "harari", label: "Harari", postalCode: "3100" },
  { id: "oromia", label: "Oromia", postalCode: "1000" },
  { id: "sidama", label: "Sidama", postalCode: "1000" },
  { id: "somali", label: "Somali", postalCode: "1000" },
  { id: "south-ethiopia", label: "South Ethiopia", postalCode: "1000" },
  { id: "southwest-ethiopia", label: "Southwest Ethiopia", postalCode: "1000" },
  { id: "tigray", label: "Tigray", postalCode: "1000" },
];

export const ETHIOPIA_LOCATIONS: EthiopiaLocation[] = [
  // Addis Ababa sub-cities
  { id: "aa-bole", label: "Bole", regionId: "addis-ababa", lat: 8.997, lng: 38.789 },
  { id: "aa-kirkos", label: "Kirkos", regionId: "addis-ababa", lat: 9.012, lng: 38.754 },
  { id: "aa-yeka", label: "Yeka", regionId: "addis-ababa", lat: 9.045, lng: 38.802 },
  { id: "aa-lideta", label: "Lideta", regionId: "addis-ababa", lat: 9.024, lng: 38.732 },
  { id: "aa-arada", label: "Arada", regionId: "addis-ababa", lat: 9.032, lng: 38.747 },
  { id: "aa-gullele", label: "Gullele", regionId: "addis-ababa", lat: 9.055, lng: 38.724 },
  { id: "aa-kolfe", label: "Kolfe Keranio", regionId: "addis-ababa", lat: 9.01, lng: 38.695 },
  { id: "aa-nifas", label: "Nifas Silk-Lafto", regionId: "addis-ababa", lat: 8.978, lng: 38.728 },
  { id: "aa-akaki", label: "Akaki Kality", regionId: "addis-ababa", lat: 8.862, lng: 38.78 },
  { id: "aa-addis-ketema", label: "Addis Ketema", regionId: "addis-ababa", lat: 9.034, lng: 38.715 },
  { id: "aa-lemi-kura", label: "Lemi Kura", regionId: "addis-ababa", lat: 8.945, lng: 38.81 },

  // Dire Dawa
  { id: "dd-city", label: "Dire Dawa City", regionId: "dire-dawa", lat: 9.6, lng: 41.866 },

  // Oromia
  { id: "or-adama", label: "Adama (Nazret)", regionId: "oromia", lat: 8.54, lng: 39.27 },
  { id: "or-jimma", label: "Jimma", regionId: "oromia", lat: 7.667, lng: 36.833 },
  { id: "or-bishoftu", label: "Bishoftu (Debre Zeit)", regionId: "oromia", lat: 8.752, lng: 38.978 },
  { id: "or-shashamane", label: "Shashamane", regionId: "oromia", lat: 7.2, lng: 38.6 },
  { id: "or-ambo", label: "Ambo", regionId: "oromia", lat: 8.983, lng: 37.85 },
  { id: "or-negele", label: "Negele Borana", regionId: "oromia", lat: 5.317, lng: 39.583 },

  // Amhara
  { id: "am-bahir-dar", label: "Bahir Dar", regionId: "amhara", lat: 11.594, lng: 37.391 },
  { id: "am-gondar", label: "Gondar", regionId: "amhara", lat: 12.6, lng: 37.467 },
  { id: "am-dessie", label: "Dessie", regionId: "amhara", lat: 11.133, lng: 39.633 },
  { id: "am-debre-markos", label: "Debre Markos", regionId: "amhara", lat: 10.35, lng: 37.733 },
  { id: "am-debre-berhan", label: "Debre Berhan", regionId: "amhara", lat: 9.683, lng: 39.533 },
  { id: "am-lalibela", label: "Lalibela", regionId: "amhara", lat: 12.031, lng: 39.047 },

  // Tigray
  { id: "ti-mekelle", label: "Mekelle", regionId: "tigray", lat: 13.497, lng: 39.475 },
  { id: "ti-adigrat", label: "Adigrat", regionId: "tigray", lat: 14.277, lng: 39.462 },
  { id: "ti-axum", label: "Axum", regionId: "tigray", lat: 14.121, lng: 38.725 },

  // Sidama
  { id: "si-hawassa", label: "Hawassa", regionId: "sidama", lat: 7.062, lng: 38.476 },

  // South Ethiopia
  { id: "se-arba-minch", label: "Arba Minch", regionId: "south-ethiopia", lat: 6.033, lng: 37.55 },
  { id: "se-sodo", label: "Wolaita Sodo", regionId: "south-ethiopia", lat: 6.85, lng: 37.767 },
  { id: "se-dilla", label: "Dilla", regionId: "south-ethiopia", lat: 6.417, lng: 38.317 },

  // Southwest Ethiopia
  { id: "sw-bonga", label: "Bonga", regionId: "southwest-ethiopia", lat: 7.283, lng: 36.233 },
  { id: "sw-mizan", label: "Mizan Teferi", regionId: "southwest-ethiopia", lat: 6.983, lng: 35.583 },

  // Harari
  { id: "ha-harar", label: "Harar", regionId: "harari", lat: 9.313, lng: 42.117 },

  // Somali
  { id: "so-jijiga", label: "Jijiga", regionId: "somali", lat: 9.35, lng: 42.8 },
  { id: "so-gode", label: "Gode", regionId: "somali", lat: 5.95, lng: 43.583 },

  // Afar
  { id: "af-semera", label: "Semera", regionId: "afar", lat: 11.793, lng: 41.014 },
  { id: "af-assaita", label: "Assaita", regionId: "afar", lat: 11.667, lng: 41.433 },

  // Gambela
  { id: "ga-gambela", label: "Gambela Town", regionId: "gambela", lat: 8.25, lng: 34.583 },

  // Benishangul-Gumuz
  { id: "bg-assosa", label: "Assosa", regionId: "benishangul-gumuz", lat: 10.067, lng: 34.533 },

  // Central Ethiopia
  { id: "ce-hosaena", label: "Hosaena", regionId: "central-ethiopia", lat: 7.55, lng: 37.85 },
];

const regionById = new Map(ETHIOPIA_REGIONS.map((r) => [r.id, r]));
const locationByLabel = new Map(
  ETHIOPIA_LOCATIONS.map((l) => [`${l.regionId}:${l.label.toLowerCase()}`, l]),
);

export function getEthiopiaRegion(id: string): EthiopiaRegion | undefined {
  return regionById.get(id);
}

export function getLocationsForRegion(regionId: string): EthiopiaLocation[] {
  return ETHIOPIA_LOCATIONS.filter((l) => l.regionId === regionId);
}

export function findLocationInRegion(
  regionId: string,
  label: string,
): EthiopiaLocation | undefined {
  const key = `${regionId}:${label.trim().toLowerCase()}`;
  return locationByLabel.get(key);
}
