import { Location } from './location.interface';

export enum ForkliftStatus {
  IDLE = 'IDLE',
  ACTIVE = 'ACTIVE',
  CHARGING = 'CHARGING',
  MAINTENANCE = 'MAINTENANCE',
  ERROR = 'ERROR'
}

export interface Forklift {
  id: string;
  name: string;
  status: ForkliftStatus;
  currentLocation: Location;
  targetLocation?: Location;
  batteryLevel: number;
  speed: number;
  rotation: number;
  lastUpdate: Date;
}
