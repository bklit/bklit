// Analytics card component types

// Common props for analytics cards
export interface AnalyticsCardProps {
  projectId: string;
  organizationId?: string;
  userId: string;
}

export interface SessionAnalyticsCardProps {
  projectId: string;
  organizationId: string;
}

// Extended analytics types for cards
export interface SessionAnalyticsSummary {
  totalSessions: number;
  bounceRate: number;
}

// Chart data types for visualization components
export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface PieChartData extends ChartDataPoint {
  name: string;
  value: number;
}

// Browser stats for the browser card (extends the base type)
export interface BrowserStatWithIcon {
  browser: string;
  count: number;
  icon?: React.ReactNode;
}

// Mobile/Desktop stats for the mobile-desktop card
export interface DeviceStats {
  mobile: number;
  desktop: number;
}

// Bounce rate data for the bounce rate card
export interface BounceRateData {
  totalSessions: number;
  bouncedSessions: number;
  bounceRate: number;
}
