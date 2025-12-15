export type MissionType = 'load' | 'unload' | 'move';
export type MissionPriority = 'high' | 'normal' | 'low';
export type MissionStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';

export interface Mission {
  id: string;
  operatorId?: string;
  type: MissionType;
  sourceLocation: string;
  destinationLocation: string;
  material: string;
  sku?: string;
  quantity: number;
  priority: MissionPriority;
  status: MissionStatus;
  assignedToMe: boolean;
  isCurrentMission: boolean;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export type MissionPhase = 'idle' | 'moving_to_source' | 'loading' | 'moving_to_dest' | 'unloading';

export interface MissionState {
  phase: MissionPhase;
  progress: number; // 0-100
}
