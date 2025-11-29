import countryCoordinatesData from "./country-coordinates.json";

interface CountryCoordinate {
  country: string;
  alpha2Code: string;
  alpha3Code: string;
  latitude: number;
  longitude: number;
}

const countryCodeMappings: Record<string, string> = {
  UK: "GB",
  USA: "US",
  UAE: "AE",
  KSA: "SA",
  "U.S.": "US",
  "U.S.A.": "US",
  "United States": "US",
  "United Kingdom": "GB",
  "Great Britain": "GB",
  England: "GB",
  Scotland: "GB",
  Wales: "GB",
  "Northern Ireland": "GB",
};

let countryCoordinatesCache: CountryCoordinate[] | null = null;

export function getCountryCoordinates(): CountryCoordinate[] {
  if (countryCoordinatesCache) {
    return countryCoordinatesCache;
  }

  try {
    countryCoordinatesCache = countryCoordinatesData as CountryCoordinate[];
    return countryCoordinatesCache;
  } catch (error) {
    console.error("Error loading country coordinates:", error);
    return [];
  }
}

export function findCountryCoordinates(
  countryCode: string,
): CountryCoordinate | null {
  const coordinates = getCountryCoordinates();
  const normalizedCode = countryCode.toUpperCase().trim();
  const mappedCode = countryCodeMappings[normalizedCode] || normalizedCode;

  let found = coordinates.find((coord) => coord.alpha2Code === mappedCode);

  if (!found) {
    found = coordinates.find((coord) => coord.alpha3Code === mappedCode);
  }

  if (!found) {
    found = coordinates.find((coord) => coord.alpha2Code === normalizedCode);
  }

  if (!found) {
    found = coordinates.find((coord) => coord.alpha3Code === normalizedCode);
  }

  if (!found) {
    found = coordinates.find(
      (coord) =>
        coord.alpha2Code.includes(normalizedCode) ||
        coord.alpha3Code.includes(normalizedCode),
    );
  }

  if (!found) {
    // Country code not found - will use fallback
  }

  return found || null;
}

export function getCountryCodeForFlag(countryName: string): string {
  const coordinates = getCountryCoordinates();
  const normalizedName = countryName.toLowerCase().trim();

  let found = coordinates.find(
    (coord) => coord.country.toLowerCase() === normalizedName,
  );

  if (!found) {
    found = coordinates.find(
      (coord) =>
        coord.country.toLowerCase().includes(normalizedName) ||
        normalizedName.includes(coord.country.toLowerCase()),
    );
  }

  return found?.alpha2Code?.toLowerCase() || "xx";
}

/**
 * Get full country name from a 2-letter or 3-letter country code
 * @param countryCode - ISO 3166-1 alpha-2 (2-letter) or alpha-3 (3-letter) country code
 * @returns Full country name, or "Unknown" if not found
 */
export function getCountryNameFromCode(countryCode: string): string {
  if (!countryCode) {
    return "Unknown";
  }

  const coordinates = getCountryCoordinates();
  const normalizedCode = countryCode.toUpperCase().trim();

  // First try to find by alpha-2 code (2-letter)
  let found = coordinates.find((coord) => coord.alpha2Code === normalizedCode);

  // If not found, try alpha-3 code (3-letter)
  if (!found) {
    found = coordinates.find((coord) => coord.alpha3Code === normalizedCode);
  }

  return found?.country || "Unknown";
}

/**
 * Get alpha-2 country code (2-letter) from a 2-letter or 3-letter country code
 * @param countryCode - ISO 3166-1 alpha-2 (2-letter) or alpha-3 (3-letter) country code
 * @returns Alpha-2 country code (lowercase), or "xx" if not found
 */
export function getAlpha2Code(countryCode: string): string {
  if (!countryCode) {
    return "xx";
  }

  const coordinates = getCountryCoordinates();
  const normalizedCode = countryCode.toUpperCase().trim();

  // First try to find by alpha-2 code (2-letter)
  let found = coordinates.find((coord) => coord.alpha2Code === normalizedCode);

  // If not found, try alpha-3 code (3-letter)
  if (!found) {
    found = coordinates.find((coord) => coord.alpha3Code === normalizedCode);
  }

  return found?.alpha2Code?.toLowerCase() || "xx";
}
