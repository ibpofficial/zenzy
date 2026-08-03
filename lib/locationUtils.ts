export interface GeocodeResult {
  fullAddress: string;
  shortAddress: string;
  city: string;
  state: string;
  postcode: string;
  latitude: number;
  longitude: number;
  source?: "cache" | "gps" | "ip" | "fallback";
}

export interface AddressComponents {
  houseOrLandmark?: string; // House/Plot No. or Landmark (e.g., "171/90" or "Plot No. 171/90" or "Apollo Gate")
  areaName?: string;        // Area/Colony (e.g., "Sanganer")
  sectorName?: string;      // Sector/Block/Sub-locality (e.g., "Sector 5" or "Block B")
  districtOrCity?: string;  // District/City (e.g., "Jaipur")
  state?: string;           // State (e.g., "Rajasthan")
  postcode?: string;        // Pincode (e.g., "302029")
}

const GOOGLE_API_KEY = "AIzaSyC2366CHQdrTehbt3PfgnQJE7HEiCM5G6E";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours cache TTL

// In-Memory Cache for ultra-fast zero-latency lookups
const MEMORY_CACHE = new Map<string, { data: GeocodeResult; timestamp: number }>();

// In-flight request deduplication map to prevent redundant parallel HTTP calls
const IN_FLIGHT_REQUESTS = new Map<string, Promise<GeocodeResult>>();

/**
 * Check if a string component is a timezone (e.g. "Asia/Kolkata"),
 * continent ("Asia"), or generic geographical meta-word ("Earth", "World", "India", "GMT", "UTC").
 */
export function isTimezoneOrMeta(str: string): boolean {
  if (!str) return true;
  const trimmed = str.trim();
  if (!trimmed) return true;
  const lower = trimmed.toLowerCase();

  // Generic forbidden top-level entities
  const forbidden = new Set(["asia", "earth", "world", "india", "gmt", "utc"]);
  if (forbidden.has(lower)) return true;

  // Timezone strings matching continent/city or region/city pattern (e.g. "Asia/Kolkata", "Asia/Calcutta", "Europe/London")
  // Note: Ignore plot/house numbers like "171/90" which contain digits on both sides of "/"
  if (/^(asia|europe|america|africa|australia|pacific|atlantic|indian|etc)\/[a-z_]+/i.test(lower)) {
    return true;
  }

  // Descriptions containing "time zone" or "timezone"
  if (lower.includes("time zone") || lower.includes("timezone")) {
    return true;
  }

  return false;
}

/**
 * Clean up address string by removing unwanted geographical meta labels
 * like "Asia/Kolkata", "Asia", "Earth", "World", "India", etc.
 */
export function sanitizeAddressString(rawAddress: string): string {
  if (!rawAddress) return "";
  
  // Split by comma
  const parts = rawAddress.split(",").map((p) => p.trim());

  const cleanParts = parts.filter((part) => {
    if (!part) return false;
    return !isTimezoneOrMeta(part);
  });

  // Remove duplicates case-insensitively while preserving order
  const uniqueParts: string[] = [];
  for (const part of cleanParts) {
    const lower = part.toLowerCase();
    if (!uniqueParts.some((existing) => existing.toLowerCase() === lower)) {
      uniqueParts.push(part);
    }
  }

  return uniqueParts.join(", ");
}

/**
 * Formats address components into shortAddress & fullAddress adhering strictly to the required hierarchy:
 * 1. House address / Plot no / Landmark name (e.g. "171/90" or "Plot No. 171/90")
 * 2. Area name (e.g. "Sanganer")
 * 3. Sector name / Sub-locality (e.g. "Sector 5")
 * 4. District / City (e.g. "Jaipur")
 * 5. State & Postcode (for fullAddress)
 */
export function formatAddressFromComponents(comp: AddressComponents): { shortAddress: string; fullAddress: string } {
  const house = (comp.houseOrLandmark || "").trim();
  const area = (comp.areaName || "").trim();
  const sector = (comp.sectorName || "").trim();
  const district = (comp.districtOrCity || "").trim();
  const state = (comp.state || "").trim();
  const postcode = (comp.postcode || "").trim();

  const ordered: string[] = [];

  const addIfValid = (val: string) => {
    if (!val || isTimezoneOrMeta(val)) return;
    const lower = val.toLowerCase();
    // Don't add if already in ordered list
    if (!ordered.some((existing) => existing.toLowerCase() === lower)) {
      ordered.push(val);
    }
  };

  // Order required:
  // 1. House address / Plot no / Landmark
  if (house) addIfValid(house);
  // 2. Area name
  if (area) addIfValid(area);
  // 3. Sector name / Sub-locality
  if (sector) addIfValid(sector);
  // 4. District / City
  if (district) addIfValid(district);

  // Short address: Order of components (e.g. "Plot No. 171/90, Sanganer, Sector 5, Jaipur" or "Sanganer, Jaipur")
  let shortAddress = sanitizeAddressString(ordered.join(", "));
  if (!shortAddress) {
    shortAddress = district || area || "Jaipur";
  }

  // Full address: Ordered components + State + Postcode
  const fullList = [...ordered];
  if (state && !isTimezoneOrMeta(state)) {
    const lowerState = state.toLowerCase();
    if (!fullList.some((e) => e.toLowerCase() === lowerState)) {
      fullList.push(state);
    }
  }
  if (postcode && !isTimezoneOrMeta(postcode)) {
    if (!fullList.includes(postcode)) {
      fullList.push(postcode);
    }
  }

  let fullAddress = sanitizeAddressString(fullList.join(", "));
  if (!fullAddress) {
    fullAddress = shortAddress;
  }

  return { shortAddress, fullAddress };
}

/**
 * Rounds latitude / longitude coordinates to a given decimal precision.
 * 3 decimal places is approx ~110m accuracy, perfect for caching neighborhood geocoding.
 */
export function getCoordCacheKey(lat: number, lng: number, precision = 3): string {
  const roundedLat = Number(lat.toFixed(precision));
  const roundedLng = Number(lng.toFixed(precision));
  return `${roundedLat},${roundedLng}`;
}

/**
 * Reads cached geocode result from Memory or sessionStorage.
 */
function getCachedGeocode(cacheKey: string): GeocodeResult | null {
  const now = Date.now();

  const validateCachedData = (data: GeocodeResult): GeocodeResult | null => {
    if (!data || !data.fullAddress) return null;
    if (isTimezoneOrMeta(data.fullAddress) || data.fullAddress.toLowerCase().includes("asia/kolkata")) {
      return null;
    }
    return data;
  };

  // 1. Check Memory Cache
  const memItem = MEMORY_CACHE.get(cacheKey);
  if (memItem && now - memItem.timestamp < CACHE_TTL_MS) {
    const valid = validateCachedData(memItem.data);
    if (valid) return { ...valid, source: "cache" };
  }

  // 2. Check SessionStorage Cache (persists during tab session)
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      const stored = sessionStorage.getItem(`zenzy_geo_${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (now - parsed.timestamp < CACHE_TTL_MS) {
          const valid = validateCachedData(parsed.data);
          if (valid) {
            MEMORY_CACHE.set(cacheKey, parsed);
            return { ...valid, source: "cache" };
          }
        } else {
          sessionStorage.removeItem(`zenzy_geo_${cacheKey}`);
        }
      }
    } catch {
      // Ignore storage read errors
    }
  }

  return null;
}

/**
 * Persists geocode result to Memory & sessionStorage.
 */
function setCachedGeocode(cacheKey: string, data: GeocodeResult): void {
  const entry = { data, timestamp: Date.now() };
  MEMORY_CACHE.set(cacheKey, entry);

  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      sessionStorage.setItem(`zenzy_geo_${cacheKey}`, JSON.stringify(entry));
    } catch {
      // Storage quota reached or restricted
    }
  }
}

/**
 * Reverse geocode latitude and longitude into high-precision address details.
 * Features 2-tier caching (~100m grid rounding) & in-flight request deduplication.
 * Format: House/Plot/Landmark -> Area Name -> Sector Name -> District -> State -> Postcode.
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult> {
  const cacheKey = getCoordCacheKey(latitude, longitude, 3);

  // 0. Check Cache First (Zero Network Calls!)
  const cached = getCachedGeocode(cacheKey);
  if (cached) {
    return cached;
  }

  // 0b. Request Deduplication: If a request for the exact same cell is in-flight, return the existing Promise
  if (IN_FLIGHT_REQUESTS.has(cacheKey)) {
    return IN_FLIGHT_REQUESTS.get(cacheKey)!;
  }

  const geocodePromise = (async (): Promise<GeocodeResult> => {
    try {
      // 1. High-precision BigDataCloud Client Reverse Geocoder
      try {
        const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
        const res = await fetch(bdcUrl);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            const admin = data.localityInfo?.administrative || [];
            const informative = data.localityInfo?.informative || [];

            const validInformative = informative
              .map((i: any) => i.name)
              .filter((name: string) => name && !isTimezoneOrMeta(name));

            const districtObj = admin.find((a: any) => a.order === 5 || a.order === 4);
            const areaObj = admin.find((a: any) => a.order === 6 || a.order === 7);
            const sectorObj = admin.find((a: any) => a.order === 8 || a.order === 9);
            const landmarkObj = admin.find((a: any) => a.order >= 10);

            const houseOrLandmark = landmarkObj?.name || validInformative[0] || "";
            const areaName = data.locality || areaObj?.name || "";
            const sectorName = sectorObj?.name || "";
            const districtOrCity = data.city || districtObj?.name || "";
            const state = data.principalSubdivision || "Rajasthan";
            const postcode = data.postcode || "";

            const { shortAddress, fullAddress } = formatAddressFromComponents({
              houseOrLandmark,
              areaName,
              sectorName,
              districtOrCity,
              state,
              postcode
            });

            if (shortAddress) {
              const result: GeocodeResult = {
                fullAddress,
                shortAddress,
                city: districtOrCity || "Jaipur",
                state,
                postcode,
                latitude,
                longitude,
                source: "gps"
              };
              setCachedGeocode(cacheKey, result);
              return result;
            }
          }
        }
      } catch (err) {
        console.warn("BigDataCloud Geocoding failed, trying Nominatim", err);
      }

      // 2. Try OpenStreetMap Nominatim with custom User-Agent
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          { headers: { "User-Agent": "ZenzyApp/1.0 (contact@zenzy.shop)" } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;

            const doorBuilding = addr.house_number || addr.building || addr.office || addr.amenity || addr.shop || addr.landmark || "";
            const roadStreet = addr.road || addr.street || "";
            const houseOrLandmark = doorBuilding && roadStreet ? `${doorBuilding}, ${roadStreet}` : doorBuilding || roadStreet || "";

            const areaName = addr.suburb || addr.neighbourhood || addr.colony || addr.residential || addr.village || "";
            const sectorName = addr.sector || addr.quarter || addr.subdistrict || addr.tehsil || addr.block || "";
            const districtOrCity = addr.city_district || addr.city || addr.town || addr.municipality || addr.district || "";
            const state = addr.state || "";
            const postcode = addr.postcode || "";

            const { shortAddress, fullAddress } = formatAddressFromComponents({
              houseOrLandmark,
              areaName,
              sectorName,
              districtOrCity,
              state,
              postcode
            });

            const result: GeocodeResult = {
              fullAddress,
              shortAddress,
              city: districtOrCity || "Jaipur",
              state: state || "Rajasthan",
              postcode,
              latitude,
              longitude,
              source: "gps"
            };
            setCachedGeocode(cacheKey, result);
            return result;
          }
        }
      } catch (err) {
        console.warn("Nominatim Geocoding failed, trying Google Maps", err);
      }

      // 3. Fallback to Google Geocoding API
      try {
        const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`;
        const res = await fetch(googleUrl);
        const data = await res.json();

        if (data.status === "OK" && data.results && data.results.length > 0) {
          const firstResult = data.results[0];
          const components = firstResult.address_components || [];

          let streetNumber = "";
          let route = "";
          let subpremise = "";
          let premise = "";
          let sublocality1 = "";
          let sublocality2 = "";
          let locality = "";
          let adminArea2 = "";
          let state = "";
          let postcode = "";

          for (const comp of components) {
            const types = comp.types || [];
            if (types.includes("subpremise")) subpremise = comp.long_name;
            else if (types.includes("premise") || types.includes("building")) premise = comp.long_name;
            else if (types.includes("street_number")) streetNumber = comp.long_name;
            else if (types.includes("route")) route = comp.long_name;
            else if (types.includes("sublocality_level_1") || types.includes("neighborhood")) sublocality1 = comp.long_name;
            else if (types.includes("sublocality_level_2") || types.includes("sublocality_level_3")) sublocality2 = comp.long_name;
            else if (types.includes("locality")) locality = comp.long_name;
            else if (types.includes("administrative_area_level_2")) adminArea2 = comp.long_name;
            else if (types.includes("administrative_area_level_1")) state = comp.long_name;
            else if (types.includes("postal_code")) postcode = comp.long_name;
          }

          const housePart = subpremise || premise || streetNumber || "";
          const houseOrLandmark = housePart && route ? `${housePart}, ${route}` : housePart || route || "";
          const areaName = sublocality1 || "";
          const sectorName = sublocality2 || "";
          const districtOrCity = locality || adminArea2 || "";

          const { shortAddress, fullAddress } = formatAddressFromComponents({
            houseOrLandmark,
            areaName,
            sectorName,
            districtOrCity,
            state,
            postcode
          });

          const result: GeocodeResult = {
            fullAddress,
            shortAddress,
            city: districtOrCity || "Jaipur",
            state: state || "Rajasthan",
            postcode: postcode || "302011",
            latitude,
            longitude,
            source: "gps"
          };
          setCachedGeocode(cacheKey, result);
          return result;
        }
      } catch (err) {
        console.warn("Google Geocoding failed", err);
      }

      // Final fallback to IP detection if available
      return await detectLocationByIP(latitude, longitude);
    } finally {
      IN_FLIGHT_REQUESTS.delete(cacheKey);
    }
  })();

  IN_FLIGHT_REQUESTS.set(cacheKey, geocodePromise);
  return geocodePromise;
}

/**
 * IP-based location auto-detection fallback when GPS is disabled/blocked by user
 */
export async function detectLocationByIP(defaultLat?: number, defaultLng?: number): Promise<GeocodeResult> {
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (res.ok) {
      const data = await res.json();
      if (data && data.city) {
        const city = data.city;
        const region = data.region || data.country_name || "";
        const postcode = data.postal || "";
        const lat = data.latitude || defaultLat || 26.9124;
        const lng = data.longitude || defaultLng || 75.7873;

        const { shortAddress, fullAddress } = formatAddressFromComponents({
          areaName: city,
          districtOrCity: region,
          state: region,
          postcode
        });

        return {
          fullAddress: fullAddress || `${city}, ${region}`,
          shortAddress: shortAddress || `${city}, ${region}`,
          city,
          state: region,
          postcode,
          latitude: lat,
          longitude: lng,
          source: "ip"
        };
      }
    }
  } catch (e) {
    console.warn("IP-based location detection failed", e);
  }

  // Absolute fallback
  return {
    fullAddress: "Sanganer, Jaipur, Rajasthan, 302029",
    shortAddress: "Sanganer, Jaipur",
    city: "Jaipur",
    state: "Rajasthan",
    postcode: "302029",
    latitude: defaultLat || 26.8143,
    longitude: defaultLng || 75.7958,
    source: "fallback"
  };
}

/**
 * Smart location lookup engine.
 * Tries browser GPS geolocation -> reverse geocodes with cache -> falls back to IP-based location.
 */
export async function getSmartLocation(options?: { enableHighAccuracy?: boolean; timeout?: number }): Promise<GeocodeResult> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      detectLocationByIP().then(resolve);
      return;
    }

    const geoOptions = {
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      timeout: options?.timeout ?? 8000,
      maximumAge: 5 * 60 * 1000 // Accept positions cached within last 5 mins by browser
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const result = await reverseGeocode(latitude, longitude);
        resolve(result);
      },
      async (err) => {
        console.warn("Browser Geolocation failed/denied, falling back to IP:", err.message);
        const result = await detectLocationByIP();
        resolve(result);
      },
      geoOptions
    );
  });
}

/**
 * Clears location cache (memory & sessionStorage)
 */
export function clearLocationCache(): void {
  MEMORY_CACHE.clear();
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("zenzy_geo_")) {
          sessionStorage.removeItem(key);
        }
      });
    } catch {
      // Ignore
    }
  }
}
