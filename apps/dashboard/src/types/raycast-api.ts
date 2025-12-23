export interface RaycastTopCountriesRequest {
  projectId: string;
}

export interface RaycastTopCountryData {
  country: string;
  countryCode: string;
  views: number;
  uniqueVisitors: number;
}

export interface RaycastTopCountriesResponse {
  success: boolean;
  data?: RaycastTopCountryData[];
  error?: string;
  period?: {
    startDate: string;
    endDate: string;
  };
}

// Device Usage Types
export interface RaycastDeviceUsageResponse {
  success: boolean;
  data?: {
    mobile: {
      views: number;
      percentage: number;
    };
    desktop: {
      views: number;
      percentage: number;
    };
    total: number;
  };
  error?: string;
  period?: {
    startDate: string;
    endDate: string;
  };
}

// Top Referrers Types
export interface RaycastReferrerData {
  referrer: string;
  views: number;
  percentage: number;
}

export interface RaycastTopReferrersResponse {
  success: boolean;
  data?: RaycastReferrerData[];
  error?: string;
  period?: {
    startDate: string;
    endDate: string;
  };
}

// Top Pages Types
export interface RaycastPageData {
  path: string;
  views: number;
}

export interface RaycastTopPagesResponse {
  success: boolean;
  data?: RaycastPageData[];
  error?: string;
  period?: {
    startDate: string;
    endDate: string;
  };
}

// Browser Usage Types
export interface RaycastBrowserData {
  browser: string;
  views: number;
  percentage: number;
}

export interface RaycastBrowserUsageResponse {
  success: boolean;
  data?: RaycastBrowserData[];
  error?: string;
  period?: {
    startDate: string;
    endDate: string;
  };
}
