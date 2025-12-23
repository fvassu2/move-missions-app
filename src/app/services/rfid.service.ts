import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { RfidRead, RfidReadType } from '../models';

@Injectable({
  providedIn: 'root'
})
export class RfidService {
  private rfidReadsSubject = new BehaviorSubject<RfidRead[]>([]);
  public rfidReads$ = this.rfidReadsSubject.asObservable();

  private recentReads: RfidRead[] = [];
  private maxRecentReads = 50;

  constructor() {
    this.startMockRfidReads();
  }

  public getRfidReads(): Observable<RfidRead[]> {
    return this.rfidReads$;
  }

  public addRfidRead(read: RfidRead): void {
    this.recentReads = [read, ...this.recentReads].slice(0, this.maxRecentReads);
    this.rfidReadsSubject.next([...this.recentReads]);
  }

  private startMockRfidReads(): void {
    // Simulate RFID reads every 3-8 seconds
    interval(5000).subscribe(() => {
      if (Math.random() > 0.3) { // 70% chance of a read
        const mockRead: RfidRead = {
          id: `RFID-${Date.now()}`,
          tagId: `TAG-${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`,
          readerId: `RDR-${Math.floor(Math.random() * 10) + 1}`,
          timestamp: new Date(),
          type: this.getRandomReadType(),
          location: {
            x: Math.floor(Math.random() * 600),
            y: Math.floor(Math.random() * 400)
          },
          forkliftId: Math.random() > 0.5 ? `FL-00${Math.floor(Math.random() * 3) + 1}` : undefined,
          metadata: {
            signalStrength: Math.floor(Math.random() * 40) + 60,
            antenna: Math.floor(Math.random() * 4) + 1
          }
        };
        
        this.addRfidRead(mockRead);
      }
    });
  }

  private getRandomReadType(): RfidReadType {
    const types = [
      RfidReadType.TAG_READ,
      RfidReadType.ZONE_ENTRY,
      RfidReadType.ZONE_EXIT,
      RfidReadType.CHECKPOINT
    ];
    return types[Math.floor(Math.random() * types.length)];
  }

  public clearReads(): void {
    this.recentReads = [];
    this.rfidReadsSubject.next([]);
  }
}
