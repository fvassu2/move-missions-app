import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Mission } from '../../models';
import { MissionCardComponent } from '../mission-card/mission-card.component';

@Component({
  selector: 'app-mission-list',
  standalone: true,
  imports: [CommonModule, MissionCardComponent],
  templateUrl: './mission-list.component.html',
  styleUrls: ['./mission-list.component.css']
})
export class MissionListComponent {
  @Input() missions: Mission[] = [];
  @Input() title: string = 'Missioni';
  @Input() emptyMessage: string = 'Nessuna missione disponibile';
  @Output() missionAction = new EventEmitter<{ action: string, mission: Mission }>();

  onMissionAction(event: { action: string, mission: Mission }): void {
    this.missionAction.emit(event);
  }
}
