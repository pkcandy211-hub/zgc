/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Player {
  id: string;      // Unique player ID
  name: string;    // Player name
  group: string;   // Group/category name (e.g. 十單組, 風雲組)
  serial?: number; // Serial number in the CSV group
}

export interface SignInRecord {
  playerId: string;
  playerName: string;
  group: string;
  timestamp: string; // ISO String
  deviceInfo?: string; // Information about browser/agent for verification
  method: 'self' | 'admin'; // Signed in by themselves or forced by admin
  mainForceCount?: string; // 主力數量: 0主, 1主, 2主, 2主以上
  siegeCarCount?: string;  // 攻城車數量: 0車, 1車, 2車, 2車以上
}

export interface Event {
  id: string;
  title: string;
  date: string;
  description?: string;
  isActive: boolean; // Whether the event is currently accepting check-ins
  records: Record<string, SignInRecord>; // Key: playerId -> Record
  location?: string;
  hours?: string;
  target?: string;
  category?: string;
  eventType?: string;
  mainForce?: string;
  siegeCar?: string;
}

export interface GroupSummary {
  groupName: string;
  totalCount: number;
  signedCount: number;
  percentage: number;
}

export interface EventStats {
  totalPlayers: number;
  totalPresent: number;
  totalAbsent: number;
  attendanceRate: number;
  byGroup: GroupSummary[];
}
