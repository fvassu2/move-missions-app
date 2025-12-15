export enum RfidReadType {
  TAG_READ = 'TAG_READ',
  ZONE_ENTRY = 'ZONE_ENTRY',
  ZONE_EXIT = 'ZONE_EXIT',
  CHECKPOINT = 'CHECKPOINT'
}

export interface RfidRead {
  id: string;
  tagId: string;
  readerId: string;
  timestamp: Date;
  type: RfidReadType;
  location: {
    x: number;
    y: number;
  };
  forkliftId?: string;
  missionId?: string;
  metadata?: Record<string, any>;
}
