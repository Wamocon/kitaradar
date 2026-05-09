export interface OverpassKita {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  postalCode: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  kitaType: "public" | "church" | "private" | "free";
  osmId: string;
  distanceKm?: number;
  // Extended detail fields from OSM
  openingHours: string | null;
  operator: string | null;
  operatorType: string | null;
  capacity: number | null;
  description: string | null;
  fee: string | null;
  religion: string | null;
  minAge: number | null;
  maxAge: number | null;
  wheelchair: boolean | null;
  fax: string | null;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/** Geocode an address string to lat/lng using Nominatim */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&countrycodes=de&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "KitaRadar/1.0 (kitaradar@wamocon.com)" },
  });
  if (!res.ok) return null;
  const data: NominatimResult[] = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

/** Query Overpass API for kindergartens / childcare within a radius */
export async function searchKitasOverpass(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<OverpassKita[]> {
  const query = `
[out:json][timeout:25];
(
  node["amenity"="kindergarten"](around:${radiusMeters},${lat},${lng});
  way["amenity"="kindergarten"](around:${radiusMeters},${lat},${lng});
  node["amenity"="childcare"](around:${radiusMeters},${lat},${lng});
  way["amenity"="childcare"](around:${radiusMeters},${lat},${lng});
);
out center tags;
  `.trim();

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "KitaRadar/1.0 (kitaradar@wamocon.com)",
      "Accept": "application/json",
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) {
    console.error(`[overpass] HTTP ${res.status} ${res.statusText}`);
    return [];
  }

  const data: { elements: OverpassElement[] } = await res.json();

  return data.elements
    .filter((el) => el.lat !== undefined || el.center !== undefined)
    .map((el): OverpassKita => {
      const elLat = el.lat ?? el.center!.lat;
      const elLng = el.lon ?? el.center!.lon;
      const tags = el.tags ?? {};

      const operator = (tags["operator:type"] ?? tags["operator"] ?? "").toLowerCase();
      let kitaType: OverpassKita["kitaType"] = "free";
      if (operator.includes("kirchlich") || operator.includes("caritas") || operator.includes("diakonie") || operator.includes("church")) {
        kitaType = "church";
      } else if (operator.includes("kommunal") || operator.includes("städtisch") || operator.includes("städtische") || operator.includes("gemeinde")) {
        kitaType = "public";
      } else if (operator.includes("privat") || operator.includes("gmbh") || operator.includes("ag")) {
        kitaType = "private";
      }

      const distanceKm = haversineKm(lat, lng, elLat, elLng);

      const rawCapacity = tags["capacity"];
      const capacity = rawCapacity ? parseInt(rawCapacity, 10) : null;
      const rawMinAge = tags["min_age"];
      const rawMaxAge = tags["max_age"];
      const rawWheelchair = tags["wheelchair"];

      return {
        id: `osm-${el.id}`,
        name: tags["name"] ?? "Unbekannte Einrichtung",
        lat: elLat,
        lng: elLng,
        address: [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ") || "",
        city: tags["addr:city"] ?? "",
        postalCode: tags["addr:postcode"] ?? "",
        phone: tags["contact:phone"] ?? tags["phone"] ?? null,
        email: tags["contact:email"] ?? tags["email"] ?? null,
        website: tags["contact:website"] ?? tags["website"] ?? null,
        kitaType,
        osmId: String(el.id),
        distanceKm: Math.round(distanceKm * 10) / 10,
        // Extended OSM fields
        openingHours: tags["opening_hours"] ?? null,
        operator: tags["operator"] ?? null,
        operatorType: tags["operator:type"] ?? null,
        capacity: !isNaN(capacity ?? NaN) ? capacity : null,
        description: tags["description"] ?? tags["note"] ?? null,
        fee: tags["fee"] ?? null,
        religion: tags["religion"] ?? null,
        minAge: rawMinAge ? parseFloat(rawMinAge) : null,
        maxAge: rawMaxAge ? parseFloat(rawMaxAge) : null,
        wheelchair: rawWheelchair === "yes" ? true : rawWheelchair === "no" ? false : null,
        fax: tags["contact:fax"] ?? tags["fax"] ?? null,
      };
    });
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
