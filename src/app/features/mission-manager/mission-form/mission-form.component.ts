import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { WarehouseService } from '../../../services';
import { Mission, MissionStatus, MissionPriority, Location } from '../../../models';

@Component({
  selector: 'app-mission-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './mission-form.component.html',
  styleUrl: './mission-form.component.scss'
})
export class MissionFormComponent implements OnInit, AfterViewInit {
  @ViewChild('mapCanvas', { static: false }) mapCanvasRef!: ElementRef<HTMLCanvasElement>;
  
  missionForm: FormGroup;
  mode: 'create' | 'edit';
  mission?: Mission;
  
  statuses = Object.values(MissionStatus);
  priorities = Object.values(MissionPriority);
  locations: Location[] = [];
  
  private ctx!: CanvasRenderingContext2D;
  private selectedPickup?: Location;
  private selectedDropoff?: Location;

  constructor(
    private fb: FormBuilder,
    private warehouseService: WarehouseService,
    private dialogRef: MatDialogRef<MissionFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'create' | 'edit', mission?: Mission }
  ) {
    this.mode = data.mode;
    this.mission = data.mission;
    
    this.missionForm = this.fb.group({
      name: [this.mission?.name || '', Validators.required],
      description: [this.mission?.description || ''],
      status: [this.mission?.status || MissionStatus.PENDING, Validators.required],
      priority: [this.mission?.priority || MissionPriority.NORMAL, Validators.required],
      pickupLocationId: [this.mission?.pickupLocation.id || '', Validators.required],
      dropoffLocationId: [this.mission?.dropoffLocation.id || '', Validators.required],
      forkliftId: [this.mission?.forkliftId || '']
    });
  }

  ngOnInit(): void {
    this.locations = this.warehouseService.getLocations();
    
    if (this.mission) {
      this.selectedPickup = this.mission.pickupLocation;
      this.selectedDropoff = this.mission.dropoffLocation;
    }
    
    this.missionForm.get('pickupLocationId')?.valueChanges.subscribe(id => {
      this.selectedPickup = this.locations.find(loc => loc.id === id);
      this.drawMap();
    });
    
    this.missionForm.get('dropoffLocationId')?.valueChanges.subscribe(id => {
      this.selectedDropoff = this.locations.find(loc => loc.id === id);
      this.drawMap();
    });
  }

  ngAfterViewInit(): void {
    const canvas = this.mapCanvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    canvas.width = 700;
    canvas.height = 400;
    
    this.drawMap();
  }

  private getCSSVariable(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  private drawMap(): void {
    if (!this.ctx) return;
    
    const canvas = this.mapCanvasRef.nativeElement;
    
    // Clear canvas
    this.ctx.fillStyle = this.getCSSVariable('--background-light') || '#f5f5f5';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    this.ctx.strokeStyle = this.getCSSVariable('--border-color') || '#e0e0e0';
    this.ctx.lineWidth = 1;
    
    for (let x = 0; x <= canvas.width; x += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, canvas.height);
      this.ctx.stroke();
    }
    
    for (let y = 0; y <= canvas.height; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(canvas.width, y);
      this.ctx.stroke();
    }
    
    // Draw all locations
    this.locations.forEach(loc => {
      const isPickup = this.selectedPickup?.id === loc.id;
      const isDropoff = this.selectedDropoff?.id === loc.id;
      
      if (isPickup || isDropoff) {
        this.ctx.fillStyle = isPickup ? 
          (this.getCSSVariable('--location-pickup') || '#81C784') : 
          (this.getCSSVariable('--location-dropoff') || '#FFB74D');
        this.ctx.fillRect(loc.x - 15, loc.y - 15, 30, 30);
      } else {
        this.ctx.fillStyle = this.getLocationColor(loc.type || 'storage');
        this.ctx.fillRect(loc.x - 10, loc.y - 10, 20, 20);
      }
      
      this.ctx.fillStyle = this.getCSSVariable('--text-primary') || '#000';
      this.ctx.font = '10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(loc.name, loc.x, loc.y + 25);
    });
    
    // Draw route line
    if (this.selectedPickup && this.selectedDropoff) {
      this.ctx.strokeStyle = this.getCSSVariable('--status-assigned') || '#2196F3';
      this.ctx.lineWidth = 3;
      this.ctx.setLineDash([5, 5]);
      this.ctx.beginPath();
      this.ctx.moveTo(this.selectedPickup.x, this.selectedPickup.y);
      this.ctx.lineTo(this.selectedDropoff.x, this.selectedDropoff.y);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
  }

  private getLocationColor(type: string): string {
    switch (type) {
      case 'storage': return this.getCSSVariable('--location-storage') || '#64B5F6';
      case 'pickup': return this.getCSSVariable('--location-pickup') || '#81C784';
      case 'dropoff': return this.getCSSVariable('--location-dropoff') || '#FFB74D';
      case 'charging': return this.getCSSVariable('--location-charging') || '#FFA726';
      case 'staging': return this.getCSSVariable('--location-staging') || '#BA68C8';
      default: return '#9E9E9E';
    }
  }

  onSubmit(): void {
    if (this.missionForm.valid) {
      const formValue = this.missionForm.value;
      const pickupLocation = this.locations.find(loc => loc.id === formValue.pickupLocationId);
      const dropoffLocation = this.locations.find(loc => loc.id === formValue.dropoffLocationId);
      
      if (pickupLocation && dropoffLocation) {
        const result = {
          ...formValue,
          pickupLocation,
          dropoffLocation
        };
        
        this.dialogRef.close(result);
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
