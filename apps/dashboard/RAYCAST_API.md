# Raycast Extension API Documentation

This document describes the API endpoints available for the Raycast extension to integrate with Bklit Analytics.

## Base URL

- **Production**: `https://app.bklit.co`
- **Local Development**: `http://localhost:3000`

## Authentication

All API requests require authentication using an API token.

### API Token Format

Tokens follow the format: `bk_live_<64-char-hex>`

### Authentication Header

```
Authorization: Bearer bk_live_your_token_here
```

### Getting an API Token

1. Log in to your Bklit dashboard
2. Navigate to **Settings > API Tokens**
3. Click **Create New Token**
4. Assign the token to your project(s)
5. Copy the token (it will only be shown once)

## Endpoints

### Get Top Countries (Last 24 Hours)

Retrieves the top 5 countries by page views from the last 24 hours.

**Endpoint**: `POST /api/raycast/top-countries`

**Request Headers**:
```
Authorization: Bearer bk_live_your_token_here
Content-Type: application/json
```

**Request Body**:
```json
{
  "projectId": "clxxxx..."
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "country": "United States",
      "countryCode": "US",
      "views": 1234,
      "uniqueVisitors": 567
    },
    {
      "country": "United Kingdom",
      "countryCode": "GB",
      "views": 890,
      "uniqueVisitors": 234
    },
    {
      "country": "Canada",
      "countryCode": "CA",
      "views": 456,
      "uniqueVisitors": 123
    },
    {
      "country": "Germany",
      "countryCode": "DE",
      "views": 234,
      "uniqueVisitors": 89
    },
    {
      "country": "France",
      "countryCode": "FR",
      "views": 123,
      "uniqueVisitors": 45
    }
  ],
  "period": {
    "startDate": "2025-12-22T00:00:00.000Z",
    "endDate": "2025-12-23T00:00:00.000Z"
  }
}
```

**Error Responses**:

**400 Bad Request** - Missing or invalid project ID:
```json
{
  "success": false,
  "error": "projectId is required"
}
```

**401 Unauthorized** - Missing or invalid token:
```json
{
  "success": false,
  "error": "Authorization token is required"
}
```

```json
{
  "success": false,
  "error": "Invalid token"
}
```

```json
{
  "success": false,
  "error": "Token has expired"
}
```

```json
{
  "success": false,
  "error": "Token is not authorized for project clxxxx..."
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": "Internal server error"
}
```

### Get Device Usage (Last 24 Hours)

Retrieves mobile vs desktop breakdown from the last 24 hours.

**Endpoint**: `POST /api/raycast/device-usage`

**Request Headers & Body**: Same as top-countries endpoint

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "mobile": {
      "views": 1234,
      "percentage": 45.2
    },
    "desktop": {
      "views": 1500,
      "percentage": 54.8
    },
    "total": 2734
  },
  "period": {
    "startDate": "2025-12-22T00:00:00.000Z",
    "endDate": "2025-12-23T00:00:00.000Z"
  }
}
```

### Get Top Referrers (Last 24 Hours)

Retrieves the top 5 referrers by page views from the last 24 hours.

**Endpoint**: `POST /api/raycast/top-referrers`

**Request Headers & Body**: Same as top-countries endpoint

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "referrer": "google.com",
      "views": 456,
      "percentage": 35.2
    },
    {
      "referrer": "Direct / None",
      "views": 234,
      "percentage": 18.1
    }
  ],
  "period": {
    "startDate": "2025-12-22T00:00:00.000Z",
    "endDate": "2025-12-23T00:00:00.000Z"
  }
}
```

### Get Top Pages (Last 24 Hours)

Retrieves the top 5 pages by page views from the last 24 hours.

**Endpoint**: `POST /api/raycast/top-pages`

**Request Headers & Body**: Same as top-countries endpoint

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "path": "/",
      "views": 1234
    },
    {
      "path": "/about",
      "views": 567
    }
  ],
  "period": {
    "startDate": "2025-12-22T00:00:00.000Z",
    "endDate": "2025-12-23T00:00:00.000Z"
  }
}
```

### Get Browser Usage (Last 24 Hours)

Retrieves the top 5 browsers by page views from the last 24 hours.

**Endpoint**: `POST /api/raycast/browser-usage`

**Request Headers & Body**: Same as top-countries endpoint

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "browser": "Chrome",
      "views": 1234,
      "percentage": 52.3
    },
    {
      "browser": "Safari",
      "views": 567,
      "percentage": 24.0
    }
  ],
  "period": {
    "startDate": "2025-12-22T00:00:00.000Z",
    "endDate": "2025-12-23T00:00:00.000Z"
  }
}
```

## TypeScript Types

```typescript
// Top Countries
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

// Device Usage
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

// Top Referrers
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

// Top Pages
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

// Browser Usage
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
```

## Rate Limiting

Currently, there is no rate limiting on the Raycast API endpoints. However, we recommend:

- Cache responses for at least 5 minutes
- Avoid making requests more frequently than once per minute
- Use the menu bar extension's built-in refresh interval (default: 5 minutes)

## Testing

### Using cURL

```bash
# Replace with your actual token and project ID
curl -X POST https://app.bklit.co/api/raycast/top-countries \
  -H "Authorization: Bearer bk_live_your_actual_token_here" \
  -H "Content-Type: application/json" \
  -d '{"projectId": "your_actual_project_id"}'
```

### Expected Response

A successful request should return a 200 status code with the JSON response containing top countries data.

## Troubleshooting

### "Invalid token" Error

- Verify the token is correct and starts with `bk_live_`
- Check that the token is assigned to the specified project
- Ensure the token hasn't expired

### "Token is not authorized for project" Error

- The token exists but isn't assigned to the requested project
- Go to Settings > API Tokens in the dashboard
- Edit the token and assign it to the correct project(s)

### No Data Returned

- The project might not have received any traffic in the last 24 hours
- Check the dashboard directly to verify analytics data exists
- Ensure the project ID is correct

## Support

For issues or questions:
- Check the [Bklit Documentation](https://docs.bklit.co)
- Contact support through the dashboard
- Report bugs via GitHub issues (if applicable)

## Changelog

### v1.1.0 (2025-12-23)
- Added `/api/raycast/device-usage` endpoint - Mobile vs desktop breakdown
- Added `/api/raycast/top-referrers` endpoint - Top 5 referrers
- Added `/api/raycast/top-pages` endpoint - Top 5 pages
- Added `/api/raycast/browser-usage` endpoint - Top 5 browsers

### v1.0.0 (2025-12-23)
- Initial release
- Added `/api/raycast/top-countries` endpoint
- Returns top 5 countries from last 24 hours

