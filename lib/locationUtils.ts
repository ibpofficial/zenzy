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

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult> {
  // 1. Try Google Geocoding API first for maximum precision
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
      let route = "";
      let neighborhood = "";
      let streetNumber = "";

      for (const comp of components) {
        if (comp.types.includes("sublocality_level_1") || comp.types.includes("sublocality")) {
          sublocality = comp.long_name;
        } else if (comp.types.includes("locality")) {
          locality = comp.long_name;
        } else if (comp.types.includes("administrative_area_level_1")) {
          state = comp.long_name;
        } else if (comp.types.includes("postal_code")) {
          postcode = comp.long_name;
        } else if (comp.types.includes("route")) {
          route = comp.long_name;
        } else if (comp.types.includes("neighborhood")) {
          neighborhood = comp.long_name;
        } else if (comp.types.includes("street_number")) {
          streetNumber = comp.long_name;
        }
      }

      // Clean up Google's full formatted address (remove ", India" at the end)
      let fullAddress = firstResult.formatted_address || "";
      if (fullAddress.endsWith(", India")) {
        fullAddress = fullAddress.substring(0, fullAddress.length - 7);
      }

      // Build short address for UI pill
      const primaryLoc = sublocality || neighborhood || route || "";
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
        city: locality || "Jaipur",
        state: state || "Rajasthan",
        postcode: postcode || "302017",
        latitude,
        longitude
      };
    }
  } catch (err) {
    console.error("Google Geocoding failed, falling back to Nominatim", err);
  }

  // 2. Fallback to Nominatim OpenStreetMap reverse geocoder
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
    const data = await res.json();
    if (data && data.address) {
      const addr = data.address;
      
      const specific = addr.neighbourhood || addr.suburb || addr.colony || addr.village || addr.city_district || addr.road || addr.town;
      const city = addr.city || addr.town || addr.village || "";
      const state = addr.state || "";
      const postcode = addr.postcode || "";
      
      const house = addr.house_number || "";
      const streetAddress = (house && specific) ? `${house}, ${specific}` : (specific || "Auto-detected Location");
      
      // Full Address construction
      let fullAddress = data.display_name || "";
      if (fullAddress.endsWith(", India")) {
        fullAddress = fullAddress.substring(0, fullAddress.length - 7);
      }

      // Short Address construction
      let shortAddress = "";
      if (specific && city && specific !== city) {
        shortAddress = `${specific}, ${city}`;
      } else {
        shortAddress = specific || city || "Delhi NCR";
      }

      return {
        fullAddress: fullAddress || `${streetAddress}, ${city}, ${state}`.trim(),
        shortAddress,
        city: city || "Jaipur",
        state: state || "Rajasthan",
        postcode: postcode || "302017",
        latitude,
        longitude
      };
    }
  } catch (err) {
    console.error("Nominatim Geocoding failed", err);
  }

  // Final fallback
  return {
    fullAddress: "Delhi NCR",
    shortAddress: "Delhi NCR",
    city: "New Delhi",
    state: "Delhi",
    postcode: "110001",
    latitude,
    longitude
  };
}
