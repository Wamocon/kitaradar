import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export interface AutocompleteResult {
  displayName: string;
  shortName: string;
  lat: number;
  lng: number;
  type: string;
}

interface NominatimAutocomplete {
  place_id: number;
  display_name: string;
  name: string;
  lat: string;
  lon: string;
  type: string;
  addresstype: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    suburb?: string;
    postcode?: string;
    state?: string;
    country?: string;
  };
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(q)}` +
    `&countrycodes=de` +
    `&format=jsonv2` +
    `&addressdetails=1` +
    `&limit=6` +
    `&dedupe=1`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "KitaRadar/1.0 (kitaradar@wamocon.com)",
      "Accept": "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return NextResponse.json({ results: [] });
  }

  const data: NominatimAutocomplete[] = await res.json();

  const results: AutocompleteResult[] = data
    .filter((item) =>
      ["city", "town", "village", "suburb", "postcode", "municipality", "administrative"].includes(
        item.addresstype ?? item.type
      )
    )
    .map((item) => {
      const addr = item.address ?? {};
      const city = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? addr.suburb ?? item.name;
      const postcode = addr.postcode ? `${addr.postcode} ` : "";
      const state = addr.state ? `, ${addr.state}` : "";
      const shortName = `${postcode}${city}${state}`;

      return {
        displayName: item.display_name,
        shortName,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.addresstype ?? item.type,
      };
    });

  return NextResponse.json({ results });
}
