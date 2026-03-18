import zipcodes from 'zipcodes';
import rawCities from '@/data/us-cities.json';

/**
 * Haversine distance in miles between two lat/lng points.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Normalize a raw ZIP string from the database.
 * Handles ZIP+4 ("02453-3483" → "02453") and missing leading zeros ("2108" → "02108").
 */
function normalizeZip(raw: string): string {
  // Strip ZIP+4 suffix
  let zip = raw.split('-')[0].trim();
  // Pad to 5 digits (handles "2108" → "02108")
  zip = zip.padStart(5, '0');
  return zip;
}

/**
 * Look up coordinates for a US ZIP code. Returns null if not found.
 * Handles ZIP+4 format and missing leading zeros.
 */
export function zipToCoords(raw: string): { lat: number; lng: number } | null {
  const zip = normalizeZip(raw);
  const result = zipcodes.lookup(zip);
  if (!result) return null;
  return { lat: result.latitude, lng: result.longitude };
}

export interface CityEntry {
  city: string;
  state: string;
  lat: number;
  lng: number;
}

/**
 * Pre-generated list of ~30K US cities loaded from static JSON.
 * Generated via `node scripts/generate-cities.js`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _cities: CityEntry[] = (rawCities as any[]).map((r) => ({
  city: r.c as string,
  state: r.s as string,
  lat: r.a as number,
  lng: r.o as number,
}));

export function getUSCities(): CityEntry[] {
  return _cities;
}
