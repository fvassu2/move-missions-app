import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { Forklift, ForkliftStatus } from '../models';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ForkliftService {
  private forkliftsSubject = new BehaviorSubject<Forklift[]>([]);
  public forklifts$ = this.forkliftsSubject.asObservable();

  private mockForklifts: Forklift[] = [
    {
      id: 'FL-001',
      name: 'Forklift Alpha',
      status: ForkliftStatus.ACTIVE,
      currentLocation: { id: 'WH-A1', name: 'Warehouse A1', x: 100, y: 100, zone: 'A', type: 'storage' },
      targetLocation: { id: 'LD-01', name: 'Loading Dock 1', x: 500, y: 300, zone: 'Loading', type: 'dropoff' },
      batteryLevel: 85,
      speed: 2.5,
      rotation: 45,
      lastUpdate: new Date()
    },
    {
      id: 'FL-002',
      name: 'Forklift Beta',
      status: ForkliftStatus.IDLE,
      currentLocation: { id: 'STG-01', name: 'Staging 1', x: 200, y: 150, zone: 'Staging', type: 'staging' },
      batteryLevel: 92,
      speed: 0,
      rotation: 0,
      lastUpdate: new Date()
    },
    {
      id: 'FL-003',
      name: 'Forklift Gamma',
      status: ForkliftStatus.CHARGING,
      currentLocation: { id: 'CHG-01', name: 'Charging Station 1', x: 50, y: 400, zone: 'Charging', type: 'charging' },
      batteryLevel: 45,
      speed: 0,
      rotation: 180,
      lastUpdate: new Date()
    }
  ];

  constructor() {
    this.forkliftsSubject.next(this.mockForklifts);
    this.startPositionTracking();
  }

  public getForklifts(): Observable<Forklift[]> {
    return this.forklifts$;
  }

  public getForkliftById(id: string): Observable<Forklift | undefined> {
    return this.forklifts$.pipe(
      map(forklifts => forklifts.find(f => f.id === id))
    );
  }

  public updateForkliftPosition(id: string, x: number, y: number, rotation?: number): void {
    const forklifts = this.forkliftsSubject.value;
    const index = forklifts.findIndex(f => f.id === id);
    
    if (index !== -1) {
      forklifts[index] = {
        ...forklifts[index],
        currentLocation: {
          ...forklifts[index].currentLocation,
          x,
          y
        },
        rotation: rotation ?? forklifts[index].rotation,
        lastUpdate: new Date()
      };
      this.forkliftsSubject.next([...forklifts]);
    }
  }

  private startPositionTracking(): void {
    // Simulate position updates every 2 seconds
    interval(2000).subscribe(() => {
      const forklifts = this.forkliftsSubject.value;
      const updated = forklifts.map(forklift => {
        if (forklift.status === ForkliftStatus.ACTIVE && forklift.targetLocation) {
          const dx = forklift.targetLocation.x - forklift.currentLocation.x;
          const dy = forklift.targetLocation.y - forklift.currentLocation.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 5) {
            const moveX = (dx / distance) * forklift.speed;
            const moveY = (dy / distance) * forklift.speed;
            const rotation = Math.atan2(dy, dx) * (180 / Math.PI);
            
            return {
              ...forklift,
              currentLocation: {
                ...forklift.currentLocation,
                x: forklift.currentLocation.x + moveX,
                y: forklift.currentLocation.y + moveY
              },
              rotation,
              lastUpdate: new Date()
            };
          }
        }
        return forklift;
      });
      
      this.forkliftsSubject.next(updated);
    });
  }
}
