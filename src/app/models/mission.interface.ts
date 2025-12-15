import { Location } from './location.interface';

export enum MissionStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED'
}

export enum MissionPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface Mission {
  id: string;
  name: string;
  description?: string;
  status: MissionStatus;
  priority: MissionPriority;
  forkliftId?: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration?: number;
  actualDuration?: number;
  metadata?: Record<string, any>;
}
