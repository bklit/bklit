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
