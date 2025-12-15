import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { Mission, MissionState, MissionStatus } from '../models';
import { SignalRService } from './signalr.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MissionService implements OnDestroy {
  private missionsSubject = new BehaviorSubject<Mission[]>([]);
  private currentMissionSubject = new BehaviorSubject<Mission | null>(null);
  private missionStateSubject = new BehaviorSubject<MissionState>({
    phase: 'idle',
    progress: 0
  });

  private stateUpdateTimer: ReturnType<typeof setInterval> | null = null;
  private newMissionTimer: ReturnType<typeof setInterval> | null = null;

  public missions$: Observable<Mission[]> = this.missionsSubject.asObservable();
  public currentMission$: Observable<Mission | null> = this.currentMissionSubject.asObservable();
  public missionState$: Observable<MissionState> = this.missionStateSubject.asObservable();

  // Derived observables
  public myMissions$: Observable<Mission[]> = this.missions$.pipe(
    map(missions => missions.filter(m => m.assignedToMe && m.status !== 'completed'))
  );

  public availableMissions$: Observable<Mission[]> = this.missions$.pipe(
    map(missions => missions.filter(m => !m.assignedToMe && m.status === 'pending'))
  );

  // TODO: In production, inject AuthService and get operator ID from authenticated user
  // For mock/demo purposes, using a hard-coded operator ID
  private readonly CURRENT_OPERATOR_ID = 'OP-001';

  constructor(private signalRService: SignalRService) {
    if (environment.mockMode) {
      this.loadMockData();
      this.startMockSimulation();
    }

    // Listen to SignalR messages
    this.signalRService.messages$.subscribe(message => {
      this.handleSignalRMessage(message);
    });
  }

  ngOnDestroy(): void {
    if (this.stateUpdateTimer) {
      clearInterval(this.stateUpdateTimer);
      this.stateUpdateTimer = null;
    }
    if (this.newMissionTimer) {
      clearInterval(this.newMissionTimer);
      this.newMissionTimer = null;
    }
  }

  private loadMockData(): void {
    const mockMissions: Mission[] = [
      {
        id: 'M-001',
        operatorId: this.CURRENT_OPERATOR_ID,
        type: 'load',
        sourceLocation: 'A-01-01',
        destinationLocation: 'B-03-05',
        material: 'Pallet di cartone',
        sku: 'SKU-12345',
        quantity: 24,
        priority: 'high',
        status: 'assigned',
        assignedToMe: true,
        isCurrentMission: true,
        createdAt: new Date(Date.now() - 300000),
        startedAt: new Date(Date.now() - 60000)
      },
      {
        id: 'M-002',
        operatorId: this.CURRENT_OPERATOR_ID,
        type: 'move',
        sourceLocation: 'C-02-03',
        destinationLocation: 'D-01-02',
        material: 'Pallet di plastica',
        sku: 'SKU-67890',
        quantity: 12,
        priority: 'normal',
        status: 'assigned',
        assignedToMe: true,
        isCurrentMission: false,
        createdAt: new Date(Date.now() - 120000)
      },
      {
        id: 'M-003',
        type: 'unload',
        sourceLocation: 'E-05-01',
        destinationLocation: 'F-02-04',
        material: 'Pallet di legno',
        sku: 'SKU-11111',
        quantity: 36,
        priority: 'low',
        status: 'pending',
        assignedToMe: false,
        isCurrentMission: false,
        createdAt: new Date(Date.now() - 600000)
      },
      {
        id: 'M-004',
        type: 'load',
        sourceLocation: 'G-01-05',
        destinationLocation: 'H-04-03',
        material: 'Pallet di metallo',
        sku: 'SKU-22222',
        quantity: 18,
        priority: 'normal',
        status: 'pending',
        assignedToMe: false,
        isCurrentMission: false,
        createdAt: new Date(Date.now() - 900000)
      },
      {
        id: 'M-005',
        operatorId: this.CURRENT_OPERATOR_ID,
        type: 'move',
        sourceLocation: 'A-03-02',
        destinationLocation: 'B-01-01',
        material: 'Pallet misto',
        sku: 'SKU-33333',
        quantity: 20,
        priority: 'high',
        status: 'assigned',
        assignedToMe: true,
        isCurrentMission: false,
        createdAt: new Date(Date.now() - 180000)
      }
    ];

    this.missionsSubject.next(mockMissions);
    
    const currentMission = mockMissions.find(m => m.isCurrentMission);
    if (currentMission) {
      this.currentMissionSubject.next(currentMission);
      this.startMissionAnimation(currentMission);
    }
  }

  private startMockSimulation(): void {
    // Simulate mission state changes
    this.stateUpdateTimer = setInterval(() => {
      const currentState = this.missionStateSubject.value;
      if (currentState.phase !== 'idle' && currentState.progress < 100) {
        this.missionStateSubject.next({
          ...currentState,
          progress: Math.min(currentState.progress + 2, 100)
        });
      } else if (currentState.progress >= 100) {
        this.advanceMissionPhase();
      }
    }, 500);

    // Simulate new missions appearing
    this.newMissionTimer = setInterval(() => {
      if (Math.random() > 0.7) {
        this.addRandomMission();
      }
    }, 30000);
  }

  private advanceMissionPhase(): void {
    const currentState = this.missionStateSubject.value;
    const phases: MissionState['phase'][] = ['idle', 'moving_to_source', 'loading', 'moving_to_dest', 'unloading'];
    const currentIndex = phases.indexOf(currentState.phase);
    
    if (currentIndex < phases.length - 1) {
      this.missionStateSubject.next({
        phase: phases[currentIndex + 1],
        progress: 0
      });
    } else {
      // Mission completed
      this.missionStateSubject.next({
        phase: 'idle',
        progress: 0
      });
    }
  }

  private addRandomMission(): void {
    const locations = ['A-01-01', 'B-02-03', 'C-03-05', 'D-04-02', 'E-05-01', 'F-01-04', 'G-02-05', 'H-03-01'];
    const materials = ['Pallet di cartone', 'Pallet di plastica', 'Pallet di legno', 'Pallet misto'];
    const types: Mission['type'][] = ['load', 'unload', 'move'];
    const priorities: Mission['priority'][] = ['high', 'normal', 'low'];

    const newMission: Mission = {
      id: `M-${Date.now().toString().slice(-6)}`,
      type: types[Math.floor(Math.random() * types.length)],
      sourceLocation: locations[Math.floor(Math.random() * locations.length)],
      destinationLocation: locations[Math.floor(Math.random() * locations.length)],
      material: materials[Math.floor(Math.random() * materials.length)],
      sku: `SKU-${Math.floor(Math.random() * 90000) + 10000}`,
      quantity: Math.floor(Math.random() * 40) + 10,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status: 'pending',
      assignedToMe: false,
      isCurrentMission: false,
      createdAt: new Date()
    };

    const currentMissions = this.missionsSubject.value;
    this.missionsSubject.next([...currentMissions, newMission]);
    console.log('➕ New mission added:', newMission.id);
  }

  private handleSignalRMessage(message: any): void {
    switch (message.type) {
      case 'MissionAssigned':
        this.handleMissionAssigned(message.payload);
        break;
      case 'MissionStatusChanged':
        this.handleMissionStatusChanged(message.payload);
        break;
      case 'MissionUpdate':
        this.handleMissionUpdate(message.payload);
        break;
    }
  }

  private handleMissionAssigned(payload: any): void {
    const missions = this.missionsSubject.value;
    const updatedMissions = missions.map(m => {
      if (m.id === payload.missionId && payload.operatorId === this.CURRENT_OPERATOR_ID) {
        return { ...m, operatorId: payload.operatorId, assignedToMe: true, status: 'assigned' as MissionStatus };
      }
      return m;
    });
    this.missionsSubject.next(updatedMissions);
  }

  private handleMissionStatusChanged(payload: any): void {
    const missions = this.missionsSubject.value;
    const updatedMissions = missions.map(m => {
      if (m.id === payload.missionId) {
        return { ...m, status: payload.newStatus as MissionStatus };
      }
      return m;
    });
    this.missionsSubject.next(updatedMissions);
  }

  private handleMissionUpdate(payload: any): void {
    console.log('Mission update received:', payload);
  }

  // Public methods for mission actions
  public startMission(missionId: string): void {
    console.log('🚀 Starting mission:', missionId);
    const missions = this.missionsSubject.value;
    const updatedMissions = missions.map(m => {
      if (m.id === missionId) {
        const updated = { 
          ...m, 
          status: 'in_progress' as MissionStatus, 
          startedAt: new Date(),
          isCurrentMission: true
        };
        this.currentMissionSubject.next(updated);
        this.startMissionAnimation(updated);
        return updated;
      }
      return { ...m, isCurrentMission: false };
    });
    this.missionsSubject.next(updatedMissions);

    this.signalRService.sendMessage('UpdateMissionStatus', missionId, 'in_progress');
  }

  private startMissionAnimation(mission: Mission): void {
    this.missionStateSubject.next({
      phase: 'moving_to_source',
      progress: 0
    });
  }

  public confirmLoad(missionId: string): void {
    console.log('📦 Confirming load for mission:', missionId);
    this.missionStateSubject.next({
      phase: 'loading',
      progress: 0
    });
  }

  public confirmUnload(missionId: string): void {
    console.log('📤 Confirming unload for mission:', missionId);
    this.missionStateSubject.next({
      phase: 'unloading',
      progress: 0
    });
  }

  public completeMission(missionId: string): void {
    console.log('✅ Completing mission:', missionId);
    const missions = this.missionsSubject.value;
    const updatedMissions = missions.map(m => {
      if (m.id === missionId) {
        return { 
          ...m, 
          status: 'completed' as MissionStatus, 
          completedAt: new Date(),
          isCurrentMission: false
        };
      }
      return m;
    });
    this.missionsSubject.next(updatedMissions);
    this.currentMissionSubject.next(null);
    this.missionStateSubject.next({ phase: 'idle', progress: 0 });

    this.signalRService.sendMessage('UpdateMissionStatus', missionId, 'completed');

    // Auto-select next mission if available
    setTimeout(() => {
      const nextMission = updatedMissions.find(m => m.assignedToMe && m.status === 'assigned');
      if (nextMission) {
        this.startMission(nextMission.id);
      }
    }, 2000);
  }

  public reportProblem(missionId: string, issue: string): void {
    console.error('⚠️ Problem reported for mission:', missionId, issue);
    const missions = this.missionsSubject.value;
    const updatedMissions = missions.map(m => {
      if (m.id === missionId) {
        return { ...m, status: 'failed' as MissionStatus };
      }
      return m;
    });
    this.missionsSubject.next(updatedMissions);
    this.currentMissionSubject.next(null);
    this.missionStateSubject.next({ phase: 'idle', progress: 0 });

    this.signalRService.sendMessage('ReportProblem', missionId, issue);
  }

  public acceptMission(missionId: string): void {
    console.log('👍 Accepting mission:', missionId);
    const missions = this.missionsSubject.value;
    const updatedMissions = missions.map(m => {
      if (m.id === missionId) {
        return { 
          ...m, 
          operatorId: this.CURRENT_OPERATOR_ID,
          assignedToMe: true, 
          status: 'assigned' as MissionStatus 
        };
      }
      return m;
    });
    this.missionsSubject.next(updatedMissions);

    this.signalRService.sendMessage('AcceptMission', missionId, this.CURRENT_OPERATOR_ID);
  }
}
