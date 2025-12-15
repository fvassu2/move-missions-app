import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatChipsModule } from '@angular/material/chips';
import { MissionService, WarehouseService } from '../../services';
import { Mission, MissionStatus, MissionPriority, Location } from '../../models';
import { MissionFormComponent } from './mission-form/mission-form.component';

@Component({
  selector: 'app-mission-manager',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatToolbarModule,
    MatChipsModule
  ],
  templateUrl: './mission-manager.component.html',
  styleUrl: './mission-manager.component.scss'
})
export class MissionManagerComponent implements OnInit {
  missions: Mission[] = [];
  filteredMissions: Mission[] = [];
  displayedColumns: string[] = ['id', 'name', 'status', 'priority', 'forklift', 'locations', 'actions'];
  
  filterForm: FormGroup;
  statuses = Object.values(MissionStatus);
  priorities = Object.values(MissionPriority);

  constructor(
    private missionService: MissionService,
    private warehouseService: WarehouseService,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      status: [''],
      priority: [''],
      search: ['']
    });
  }

  ngOnInit(): void {
    this.missionService.getMissions().subscribe(missions => {
      this.missions = missions;
      this.applyFilters();
    });

    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  applyFilters(): void {
    const { status, priority, search } = this.filterForm.value;
    
    this.filteredMissions = this.missions.filter(mission => {
      const matchesStatus = !status || mission.status === status;
      const matchesPriority = !priority || mission.priority === priority;
      const matchesSearch = !search || 
        mission.name.toLowerCase().includes(search.toLowerCase()) ||
        mission.id.toLowerCase().includes(search.toLowerCase());
      
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(MissionFormComponent, {
      width: '800px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.missionService.createMission(result).subscribe();
      }
    });
  }

  openEditDialog(mission: Mission): void {
    const dialogRef = this.dialog.open(MissionFormComponent, {
      width: '800px',
      data: { mode: 'edit', mission }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.missionService.updateMission(mission.id, result).subscribe();
      }
    });
  }

  deleteMission(mission: Mission): void {
    if (confirm(`Are you sure you want to delete mission "${mission.name}"?`)) {
      this.missionService.deleteMission(mission.id).subscribe();
    }
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase().replace('_', '-')}`;
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority.toLowerCase()}`;
  }

  clearFilters(): void {
    this.filterForm.reset();
  }
}
