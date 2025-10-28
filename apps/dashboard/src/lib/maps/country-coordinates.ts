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
    console.log(`Loaded ${countryCoordinatesCache.length} country coordinates`);
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
    console.log(
      `No coordinates found for country code: ${countryCode} (normalized: ${normalizedCode}, mapped: ${mappedCode})`,
    );
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
