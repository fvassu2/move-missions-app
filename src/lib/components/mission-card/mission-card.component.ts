import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Mission } from '../../models';

@Component({
  selector: 'app-mission-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mission-card.component.html',
  styleUrls: ['./mission-card.component.css']
})
export class MissionCardComponent {
  @Input() mission!: Mission;
  @Input() isExpanded: boolean = false;
  @Output() actionClick = new EventEmitter<{ action: string, mission: Mission }>();

  getStatusClass(): string {
    switch (this.mission.status) {
      case 'completed': return 'status-completed';
      case 'in_progress': return 'status-in-progress';
      case 'assigned': return 'status-assigned';
      case 'failed': return 'status-failed';
      default: return 'status-pending';
    }
  }

  getPriorityClass(): string {
    switch (this.mission.priority) {
      case 'high': return 'priority-high';
      case 'low': return 'priority-low';
      default: return 'priority-normal';
    }
  }

  getTypeIcon(): string {
    switch (this.mission.type) {
      case 'load': return '📦';
      case 'unload': return '📤';
      case 'move': return '🔄';
      default: return '📋';
    }
  }

  getStatusLabel(): string {
    switch (this.mission.status) {
      case 'completed': return 'Completata';
      case 'in_progress': return 'In Corso';
      case 'assigned': return 'Assegnata';
      case 'failed': return 'Fallita';
      default: return 'In Attesa';
    }
  }

  getPriorityLabel(): string {
    switch (this.mission.priority) {
      case 'high': return 'Alta';
      case 'low': return 'Bassa';
      default: return 'Normale';
    }
  }

  onAction(action: string): void {
    this.actionClick.emit({ action, mission: this.mission });
  }
}
