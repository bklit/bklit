// Geo-related type definitions for the analytics system

// Basic geo location data
export interface GeoLocation {
  country: string;
  countryCode: string;
  region?: string;
  regionName?: string;
  city: string;
  zip?: string;
  lat: number;
  lon: number;
  timezone?: string;
  currency?: string;
  isp?: string;
  mobile?: boolean;
  ip?: string;
}

// IP geolocation response
export interface IpGeoResponse {
  status: string;
  message?: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  currency: string;
  isp: string;
  mobile: boolean;
  query: string;
}

// Country coordinates for mapping
export interface CountryCoordinates {
  latitude: number;
  longitude: number;
  country: string;
  countryCode: string;
}

// Prisma groupBy result types for analytics
export interface TopCountryResult {
  country: string | null;
  countryCode: string | null;
  _count: {
    country: number;
  };
}

export interface TopCountryData {
  country: string;
  countryCode: string;
  views: number;
}

export interface CountryWithVisits {
  country: string | null;
  countryCode: string | null;
  lat: number | null;
  lon: number | null;
  _count: {
    country: number;
  };
}

export interface CityResult {
  city: string | null;
  _count: {
    city: number;
  };
}

export interface CountryWithCities {
  country: string;
  countryCode: string;
  totalVisits: number;
  coordinates: [number, number] | null;
  cities: Array<{
    name: string;
    visits: number;
  }>;
}

export interface CountryStats {
  country: string;
  countryCode: string;
  totalVisits: number;
  mobileVisits: number;
  desktopVisits: number;
  uniqueVisits: number;
  coordinates: [number, number] | null;
}

export interface CountryCodeResult {
  country: string | null;
  countryCode: string | null;
  _count: {
    countryCode: number;
  };
}

export interface SessionData {
  id: string;
  sessionId: string;
  projectId: string;
  startedAt: Date;
  endedAt: Date | null;
  duration: number | null;
  didBounce: boolean;
  url: string;
  userAgent?: string;
  country?: string;
  city?: string;
  pageViewEvents: Array<{
    id: string;
    url: string;
    timestamp: Date;
    createdAt: Date;
  }>;
}
