export interface GeocodeResult {
  fullAddress: string;
  shortAddress: string;
  city: string;
  state: string;
  postcode: string;
  latitude: number;
  longitude: number;
}

const GOOGLE_API_KEY = "AIzaSyC2366CHQdrTehbt3PfgnQJE7HEiCM5G6E";

/**
 * Reverse geocode latitude and longitude into high-precision address details.
 * Uses BigDataCloud -> Nominatim OSM -> Google Maps API with intelligent fallbacks.
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult> {
  // 1. High-precision BigDataCloud Client Reverse Geocoder (Free, Fast, Exact Indian Sub-localities)
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const res = await fetch(bdcUrl);
    if (res.ok) {
      const data = await res.json();
      if (data) {
        const subLocality = data.localityInfo?.informative?.[0]?.name || data.locality || "";
        const city = data.city || data.localityInfo?.administrative?.find((a: any) => a.order === 4 || a.order === 5)?.name || data.principalSubdivision || "";
        const state = data.principalSubdivision || "Delhi";
        const postcode = data.postcode || "";

        const primary = subLocality.trim();
        const secondary = city.trim();
        
        let shortAddress = "";
        if (primary && secondary && primary.toLowerCase() !== secondary.toLowerCase()) {
          shortAddress = `${primary}, ${secondary}`;
        } else {
          shortAddress = primary || secondary || "Delhi NCR";
        }

        const fullAddress = `${primary ? primary + ", " : ""}${secondary ? secondary + ", " : ""}${state}`.trim();

        if (shortAddress) {
          return {
            fullAddress: fullAddress || shortAddress,
            shortAddress,
            city: secondary || "New Delhi",
            state,
            postcode,
            latitude,
            longitude
          };
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
      { headers: { "User-Agent": "ZenzyApp/1.0 (contact@zenzy.in)" } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        
        const specific = addr.neighbourhood || addr.suburb || addr.colony || addr.village || addr.city_district || addr.road || addr.residential || addr.town;
        const city = addr.city || addr.town || addr.municipality || addr.state_district || "";
        const state = addr.state || "";
        const postcode = addr.postcode || "";
        
        let fullAddress = data.display_name || "";
        if (fullAddress.endsWith(", India")) {
          fullAddress = fullAddress.substring(0, fullAddress.length - 7);
        }

        let shortAddress = "";
        if (specific && city && specific.toLowerCase() !== city.toLowerCase()) {
          shortAddress = `${specific}, ${city}`;
        } else {
          shortAddress = specific || city || "Delhi NCR";
        }

        return {
          fullAddress: fullAddress || `${shortAddress}, ${state}`.trim(),
          shortAddress,
          city: city || "New Delhi",
          state: state || "Delhi",
          postcode,
          latitude,
          longitude
        };
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
      
      let sublocality = "";
      let locality = "";
      let state = "";
      let postcode = "";

      for (const comp of components) {
        if (comp.types.includes("sublocality_level_1") || comp.types.includes("sublocality")) {
          sublocality = comp.long_name;
        } else if (comp.types.includes("locality")) {
          locality = comp.long_name;
        } else if (comp.types.includes("administrative_area_level_1")) {
          state = comp.long_name;
        } else if (comp.types.includes("postal_code")) {
          postcode = comp.long_name;
        }
      }

      let fullAddress = firstResult.formatted_address || "";
      if (fullAddress.endsWith(", India")) {
        fullAddress = fullAddress.substring(0, fullAddress.length - 7);
      }

      const primaryLoc = sublocality || "";
      const secondaryLoc = locality || state || "";
      let shortAddress = "";
      if (primaryLoc && secondaryLoc && primaryLoc !== secondaryLoc) {
        shortAddress = `${primaryLoc}, ${secondaryLoc}`;
      } else {
        shortAddress = primaryLoc || secondaryLoc || "Delhi NCR";
      }

      return {
        fullAddress,
        shortAddress,
        city: locality || "New Delhi",
        state: state || "Delhi",
        postcode: postcode || "110001",
        latitude,
        longitude
      };
    }
  } catch (err) {
    console.warn("Google Geocoding failed", err);
  }

  // Final fallback to IP detection if available
  return await detectLocationByIP(latitude, longitude);
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
        const lat = data.latitude || defaultLat || 28.6139;
        const lng = data.longitude || defaultLng || 77.209;

        return {
          fullAddress: `${city}, ${region}, India`,
          shortAddress: `${city}, ${region}`,
          city,
          state: region,
          postcode,
          latitude: lat,
          longitude: lng
        };
      }
    }
  } catch (e) {
    console.warn("IP-based location detection failed", e);
  }

  // Absolute fallback
  return {
    fullAddress: "Delhi NCR, India",
    shortAddress: "Delhi NCR",
    city: "Delhi NCR",
    state: "Delhi",
    postcode: "110001",
    latitude: defaultLat || 28.6139,
    longitude: defaultLng || 77.2090
  };
}
