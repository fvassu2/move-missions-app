import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Mission, MissionStatus, MissionPriority } from '../models';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MissionService {
  private missionsSubject = new BehaviorSubject<Mission[]>([]);
  public missions$ = this.missionsSubject.asObservable();

  private mockMissions: Mission[] = [
    {
      id: '1',
      name: 'Transport Pallet A',
      description: 'Move pallet from warehouse to loading dock',
      status: MissionStatus.IN_PROGRESS,
      priority: MissionPriority.HIGH,
      forkliftId: 'FL-001',
      pickupLocation: { id: 'WH-A1', name: 'Warehouse A1', x: 100, y: 100, zone: 'A', type: 'storage' },
      dropoffLocation: { id: 'LD-01', name: 'Loading Dock 1', x: 500, y: 300, zone: 'Loading', type: 'dropoff' },
      createdAt: new Date(Date.now() - 3600000),
      startedAt: new Date(Date.now() - 1800000),
      estimatedDuration: 900
    },
    {
      id: '2',
      name: 'Pickup Raw Materials',
      description: 'Collect materials from receiving area',
      status: MissionStatus.PENDING,
      priority: MissionPriority.NORMAL,
      pickupLocation: { id: 'REC-01', name: 'Receiving 1', x: 50, y: 50, zone: 'Receiving', type: 'pickup' },
      dropoffLocation: { id: 'WH-B2', name: 'Warehouse B2', x: 300, y: 200, zone: 'B', type: 'storage' },
      createdAt: new Date(Date.now() - 900000),
      estimatedDuration: 600
    }
  ];

  constructor() {
    this.missionsSubject.next(this.mockMissions);
  }

  public getMissions(): Observable<Mission[]> {
    return this.missions$;
  }

  public getMissionById(id: string): Observable<Mission | undefined> {
    const missions = this.missionsSubject.value;
    return of(missions.find(m => m.id === id)).pipe(delay(100));
  }

  public createMission(mission: Omit<Mission, 'id' | 'createdAt'>): Observable<Mission> {
    const newMission: Mission = {
      ...mission,
      id: `M-${Date.now()}`,
      createdAt: new Date()
    };
    
    const missions = [...this.missionsSubject.value, newMission];
    this.missionsSubject.next(missions);
    
    return of(newMission).pipe(delay(300));
  }

  public updateMission(id: string, updates: Partial<Mission>): Observable<Mission | undefined> {
    const missions = this.missionsSubject.value;
    const index = missions.findIndex(m => m.id === id);
    
    if (index !== -1) {
      missions[index] = { ...missions[index], ...updates };
      this.missionsSubject.next([...missions]);
      return of(missions[index]).pipe(delay(300));
    }
    
    return of(undefined).pipe(delay(300));
  }

  public deleteMission(id: string): Observable<boolean> {
    const missions = this.missionsSubject.value.filter(m => m.id !== id);
    this.missionsSubject.next(missions);
    return of(true).pipe(delay(300));
  }

  public assignForklift(missionId: string, forkliftId: string): Observable<Mission | undefined> {
    return this.updateMission(missionId, { 
      forkliftId, 
      status: MissionStatus.ASSIGNED 
    });
  }
}
