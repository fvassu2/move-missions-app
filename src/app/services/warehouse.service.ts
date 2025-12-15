import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Location } from '../models';

export interface WarehouseMap {
  id: string;
  name: string;
  width: number;
  height: number;
  locations: Location[];
}

@Injectable({
  providedIn: 'root'
})
export class WarehouseService {
  private warehouseMapSubject = new BehaviorSubject<WarehouseMap | null>(null);
  public warehouseMap$ = this.warehouseMapSubject.asObservable();

  private mockWarehouse: WarehouseMap = {
    id: 'WH-MAIN',
    name: 'Main Warehouse',
    width: 800,
    height: 600,
    locations: [
      { id: 'WH-A1', name: 'Warehouse A1', x: 100, y: 100, zone: 'A', type: 'storage' },
      { id: 'WH-A2', name: 'Warehouse A2', x: 150, y: 100, zone: 'A', type: 'storage' },
      { id: 'WH-B1', name: 'Warehouse B1', x: 250, y: 150, zone: 'B', type: 'storage' },
      { id: 'WH-B2', name: 'Warehouse B2', x: 300, y: 200, zone: 'B', type: 'storage' },
      { id: 'LD-01', name: 'Loading Dock 1', x: 500, y: 300, zone: 'Loading', type: 'dropoff' },
      { id: 'LD-02', name: 'Loading Dock 2', x: 550, y: 300, zone: 'Loading', type: 'dropoff' },
      { id: 'REC-01', name: 'Receiving 1', x: 50, y: 50, zone: 'Receiving', type: 'pickup' },
      { id: 'REC-02', name: 'Receiving 2', x: 100, y: 50, zone: 'Receiving', type: 'pickup' },
      { id: 'STG-01', name: 'Staging 1', x: 200, y: 150, zone: 'Staging', type: 'staging' },
      { id: 'STG-02', name: 'Staging 2', x: 250, y: 200, zone: 'Staging', type: 'staging' },
      { id: 'CHG-01', name: 'Charging Station 1', x: 50, y: 400, zone: 'Charging', type: 'charging' },
      { id: 'CHG-02', name: 'Charging Station 2', x: 100, y: 400, zone: 'Charging', type: 'charging' }
    ]
  };

  constructor() {
    this.warehouseMapSubject.next(this.mockWarehouse);
  }

  public getWarehouseMap(): Observable<WarehouseMap | null> {
    return this.warehouseMap$;
  }

  public getLocations(): Location[] {
    return this.mockWarehouse.locations;
  }

  public getLocationById(id: string): Location | undefined {
    return this.mockWarehouse.locations.find(loc => loc.id === id);
  }

  public addLocation(location: Location): void {
    this.mockWarehouse.locations.push(location);
    this.warehouseMapSubject.next({ ...this.mockWarehouse });
  }
}
