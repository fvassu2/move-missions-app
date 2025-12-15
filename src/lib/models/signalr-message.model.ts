export interface SignalRMessage {
  type: string;
  payload: any;
}

export interface MissionAssignedMessage extends SignalRMessage {
  type: 'MissionAssigned';
  payload: {
    missionId: string;
    operatorId: string;
  };
}

export interface MissionStatusChangedMessage extends SignalRMessage {
  type: 'MissionStatusChanged';
  payload: {
    missionId: string;
    newStatus: string;
    timestamp: Date;
  };
}

export interface MissionUpdateMessage extends SignalRMessage {
  type: 'MissionUpdate';
  payload: any;
}
