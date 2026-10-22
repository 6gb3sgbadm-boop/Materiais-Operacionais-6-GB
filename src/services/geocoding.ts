/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Fallback reference center coordinates for all cities / stations in 6° GB
export const GB6_CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  mongagua: { lat: -24.0931, lng: -46.6205 },
  mongaguá: { lat: -24.0931, lng: -46.6205 },
  santos: { lat: -23.9618, lng: -46.3322 },
  'sao vicente': { lat: -23.9631, lng: -46.3919 },
  'são vicente': { lat: -23.9631, lng: -46.3919 },
  'praia grande': { lat: -24.0089, lng: -46.4128 },
  cubatao: { lat: -23.8950, lng: -46.4253 },
  cubatão: { lat: -23.8950, lng: -46.4253 },
  guaruja: { lat: -23.9931, lng: -46.2564 },
  guarujá: { lat: -23.9931, lng: -46.2564 },
  bertioga: { lat: -23.8544, lng: -46.1386 },
  itanhaem: { lat: -24.1833, lng: -46.7833 },
  itanhaém: { lat: -24.1833, lng: -46.7833 },
  peruibe: { lat: -24.3200, lng: -46.9980 },
  peruíbe: { lat: -24.3200, lng: -46.9980 },
  registro: { lat: -24.4965, lng: -47.8447 },
  cajati: { lat: -24.7351, lng: -48.1221 },
  jacupiranga: { lat: -24.6952, lng: -48.0018 },
  iguape: { lat: -24.7082, lng: -47.5552 },
  miracatu: { lat: -24.2811, lng: -47.4592 },
  eldorado: { lat: -24.5218, lng: -48.1154 },
};

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName?: string;
  source: 'nominatim' | 'fallback';
}

/**
 * Geocodes an address in the Baixada Santista / Vale do Ribeira (SP)
 * Uses Nominatim with automatic fallback to city center coordinates
 */
export async function geocodeStationAddress(
  address: string,
  city: string
): Promise<GeocodeResult> {
  const cleanCity = city.trim();
  const normalizedCityKey = cleanCity.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const fallback =
    GB6_CITY_COORDINATES[cleanCity.toLowerCase()] ||
    GB6_CITY_COORDINATES[normalizedCityKey] || { lat: -23.9631, lng: -46.3919 };

  if (!address.trim()) {
    return { ...fallback, source: 'fallback' };
  }

  // Clean address for high-accuracy geocoding query
  // e.g. "Av. Monteiro Lobato, 5100 - Agenor de Campos, Mongaguá - SP" -> "Avenida Monteiro Lobato 5100 Mongagua SP"
  const cleanAddress = address
    .replace(/[–—]/g, '-')
    .replace(/\b(n[ºo°]|número)\s*/gi, '')
    .trim();

  const queries = [
    `${cleanAddress}, ${cleanCity}, SP, Brasil`,
    `${cleanAddress}, Brasil`,
    `${cleanCity}, SP, Brasil`,
  ];

  for (const query of queries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
        query
      )}`;
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const first = data[0];
          const lat = parseFloat(first.lat);
          const lng = parseFloat(first.lon);
          if (!isNaN(lat) && !isNaN(lng)) {
            return {
              lat,
              lng,
              displayName: first.display_name,
              source: 'nominatim',
            };
          }
        }
      }
    } catch (err) {
      // Continue to next query / fallback
    }
  }

  return { ...fallback, source: 'fallback' };
}
