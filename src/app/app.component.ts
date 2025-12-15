import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Mission, MissionState } from '../lib/models';
import { MissionService, SignalRService, ConnectionState } from '../lib/services';
import { MissionListComponent } from '../lib/components/mission-list/mission-list.component';
import { ForkliftAnimationComponent } from '../lib/components/forklift-animation/forklift-animation.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MissionListComponent,
    ForkliftAnimationComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Dashboard Mulettista';
  
  myMissions$!: Observable<Mission[]>;
  availableMissions$!: Observable<Mission[]>;
  currentMission$!: Observable<Mission | null>;
  missionState$!: Observable<MissionState>;
  connectionState$!: Observable<ConnectionState>;
  
  ConnectionState = ConnectionState;

  constructor(
    private missionService: MissionService,
    private signalRService: SignalRService
  ) {}

  ngOnInit(): void {
    this.myMissions$ = this.missionService.myMissions$;
    this.availableMissions$ = this.missionService.availableMissions$;
    this.currentMission$ = this.missionService.currentMission$;
    this.missionState$ = this.missionService.missionState$;
    this.connectionState$ = this.signalRService.connectionState$;
  }

  onMissionAction(event: { action: string, mission: Mission }): void {
    const { action, mission } = event;
    
    switch (action) {
      case 'start':
        this.missionService.startMission(mission.id);
        break;
      
      case 'confirmLoad':
        this.missionService.confirmLoad(mission.id);
        break;
      
      case 'confirmUnload':
        this.missionService.confirmUnload(mission.id);
        break;
      
      case 'complete':
        this.missionService.completeMission(mission.id);
        break;
      
      case 'reportProblem':
        const issue = prompt('Descrivi il problema:');
        if (issue) {
          this.missionService.reportProblem(mission.id, issue);
        }
        break;
      
      case 'accept':
        this.missionService.acceptMission(mission.id);
        break;
      
      default:
        console.warn('Unknown action:', action);
    }
  }

  getConnectionStatusClass(state: ConnectionState): string {
    switch (state) {
      case ConnectionState.Connected:
        return 'status-connected';
      case ConnectionState.Connecting:
      case ConnectionState.Reconnecting:
        return 'status-connecting';
      case ConnectionState.Disconnected:
      case ConnectionState.Failed:
        return 'status-disconnected';
      default:
        return '';
    }
  }

  getConnectionStatusText(state: ConnectionState): string {
    switch (state) {
      case ConnectionState.Connected:
        return '✅ Connesso';
      case ConnectionState.Connecting:
        return '🔄 Connessione...';
      case ConnectionState.Reconnecting:
        return '🔄 Riconnessione...';
      case ConnectionState.Disconnected:
        return '❌ Disconnesso';
      case ConnectionState.Failed:
        return '❌ Connessione Fallita';
      default:
        return state;
    }
  }
}
