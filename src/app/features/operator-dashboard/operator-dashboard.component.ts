import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { Subscription } from 'rxjs';
import { ForkliftService, RfidService, MissionService } from '../../services';
import { Forklift, RfidRead, Mission } from '../../models';

@Component({
  selector: 'app-operator-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule
  ],
  templateUrl: './operator-dashboard.component.html',
  styleUrl: './operator-dashboard.component.scss'
})
export class OperatorDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId?: number;
  private subscriptions = new Subscription();

  forklifts: Forklift[] = [];
  rfidReads: RfidRead[] = [];
  activeMissions: Mission[] = [];
  drawerOpened = true;

  constructor(
    private forkliftService: ForkliftService,
    private rfidService: RfidService,
    private missionService: MissionService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.forkliftService.getForklifts().subscribe(forklifts => {
        this.forklifts = forklifts;
      })
    );

    this.subscriptions.add(
      this.rfidService.getRfidReads().subscribe(reads => {
        this.rfidReads = reads.slice(0, 10); // Keep only latest 10
      })
    );

    this.subscriptions.add(
      this.missionService.getMissions().subscribe(missions => {
        this.activeMissions = missions.filter(m => 
          m.status === 'IN_PROGRESS' || m.status === 'ASSIGNED'
        );
      })
    );
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    
    this.startAnimation();
  }

  private getCSSVariable(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private startAnimation(): void {
    const animate = () => {
      this.drawCanvas();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  private drawCanvas(): void {
    if (!this.ctx) return;

    const canvas = this.canvasRef.nativeElement;
    
    // Clear canvas
    this.ctx.fillStyle = '#f5f5f5';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    this.drawGrid();
    
    // Draw locations
    this.drawLocations();
    
    // Draw forklifts
    this.forklifts.forEach(forklift => this.drawForklift(forklift));
  }

  private drawGrid(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.strokeStyle = this.getCSSVariable('--border-color') || '#e0e0e0';
    this.ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x <= canvas.width; x += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, canvas.height);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= canvas.height; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(canvas.width, y);
      this.ctx.stroke();
    }
  }

  private drawLocations(): void {
    // Draw some location markers
    const locations = [
      { x: 100, y: 100, name: 'A1', type: 'storage' },
      { x: 500, y: 300, name: 'LD-1', type: 'dropoff' },
      { x: 200, y: 150, name: 'STG-1', type: 'staging' }
    ];
    
    locations.forEach(loc => {
      this.ctx.fillStyle = this.getLocationColor(loc.type);
      this.ctx.fillRect(loc.x - 15, loc.y - 15, 30, 30);
      
      this.ctx.fillStyle = this.getCSSVariable('--text-primary') || '#000';
      this.ctx.font = '10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(loc.name, loc.x, loc.y + 25);
    });
  }

  private getLocationColor(type: string): string {
    switch (type) {
      case 'storage': return this.getCSSVariable('--location-storage') || '#64B5F6';
      case 'dropoff': return this.getCSSVariable('--location-dropoff') || '#FFB74D';
      case 'staging': return this.getCSSVariable('--location-staging') || '#BA68C8';
      default: return '#9E9E9E';
    }
  }

  private drawForklift(forklift: Forklift): void {
    const x = forklift.currentLocation.x;
    const y = forklift.currentLocation.y;
    const rotation = forklift.rotation * (Math.PI / 180);
    
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);
    
    // Draw forklift body
    this.ctx.fillStyle = this.getForkliftColor(forklift.status);
    this.ctx.fillRect(-10, -15, 20, 30);
    
    // Draw forklift direction indicator
    this.ctx.fillStyle = this.getCSSVariable('--text-primary') || '#333';
    this.ctx.beginPath();
    this.ctx.moveTo(10, 0);
    this.ctx.lineTo(15, -5);
    this.ctx.lineTo(15, 5);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.restore();
    
    // Draw forklift label
    this.ctx.fillStyle = this.getCSSVariable('--text-primary') || '#000';
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(forklift.name, x, y - 25);
    
    // Draw battery level
    this.ctx.fillStyle = forklift.batteryLevel > 20 ? '#4CAF50' : '#EF5350';
    this.ctx.fillText(`${forklift.batteryLevel}%`, x, y + 35);
  }

  private getForkliftColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return this.getCSSVariable('--forklift-active') || '#66BB6A';
      case 'IDLE': return this.getCSSVariable('--forklift-idle') || '#9E9E9E';
      case 'CHARGING': return this.getCSSVariable('--forklift-charging') || '#FFA726';
      case 'ERROR': return this.getCSSVariable('--forklift-error') || '#EF5350';
      default: return this.getCSSVariable('--forklift-maintenance') || '#42A5F5';
    }
  }

  getRfidTypeIcon(type: string): string {
    switch (type) {
      case 'TAG_READ': return 'nfc';
      case 'ZONE_ENTRY': return 'login';
      case 'ZONE_EXIT': return 'logout';
      case 'CHECKPOINT': return 'place';
      default: return 'info';
    }
  }

  toggleDrawer(): void {
    this.drawerOpened = !this.drawerOpened;
  }

  clearRfidReads(): void {
    this.rfidService.clearReads();
  }
}
