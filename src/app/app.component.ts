import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Mission, MissionState, MissionPriority } from '../lib/models';
import { MissionService, SignalRService, ConnectionState } from '../lib/services';
import { MissionListComponent } from '../lib/components/mission-list/mission-list.component';

interface RfidMessage {
  timestamp: Date;
  text: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MissionListComponent
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

  // UI State
  currentTheme: 'light' | 'dark' = 'light';
  missionsPanelOpen = false;
  rfidLogOpen = false;
  activeTab: 'my' | 'available' = 'my';

  // RFID State
  rfidConnected = true; // Simulated - would come from backend
  binsLoaded = 0;
  lastRfidMessage: RfidMessage | null = null;
  rfidLogMessages: RfidMessage[] = [];

  constructor(
    private missionService: MissionService,
    private signalRService: SignalRService
  ) {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      this.currentTheme = savedTheme;
    }
    
    // Simulate RFID messages
    this.startRfidSimulation();
  }

  ngOnInit(): void {
    this.myMissions$ = this.missionService.myMissions$;
    this.availableMissions$ = this.missionService.availableMissions$;
    this.currentMission$ = this.missionService.currentMission$;
    this.missionState$ = this.missionService.missionState$;
    this.connectionState$ = this.signalRService.connectionState$;

    // Subscribe to mission state to update bins
    this.missionState$.subscribe(state => {
      if (state.phase === 'loading' && state.progress > 50) {
        this.binsLoaded = Math.floor(Math.random() * 6) + 1; // 1-6 bins
      } else if (state.phase === 'unloading' && state.progress > 50) {
        this.binsLoaded = 0;
      }
    });
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

  // Theme Management
  toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', this.currentTheme);
  }

  // Panel Management
  toggleMissionsPanel(): void {
    this.missionsPanelOpen = !this.missionsPanelOpen;
    if (this.missionsPanelOpen) {
      this.rfidLogOpen = false; // Close RFID log if open
    }
  }

  toggleRfidLog(): void {
    this.rfidLogOpen = !this.rfidLogOpen;
    if (this.rfidLogOpen) {
      this.missionsPanelOpen = false; // Close missions panel if open
    }
  }

  // Mission Display Helpers
  getMissionStatusColorClass(mission: Mission): string {
    if (mission.status === 'in_progress') {
      return 'status-active';
    }
    return 'status-assigned';
  }

  getPriorityLabel(priority: MissionPriority): string {
    switch (priority) {
      case 'high': return 'ALTA';
      case 'low': return 'BASSA';
      default: return 'NORMALE';
    }
  }

  getPhaseLabel(phase: string): string {
    switch (phase) {
      case 'idle': return '🏠 In Attesa';
      case 'moving_to_source': return '🚜 Verso Prelievo';
      case 'loading': return '📦 Caricamento';
      case 'moving_to_dest': return '🚜 Verso Destinazione';
      case 'unloading': return '📤 Scaricamento';
      default: return phase;
    }
  }

  getBinsArray(count: number): number[] {
    return Array(count).fill(0);
  }

  // RFID Simulation
  private startRfidSimulation(): void {
    // Simulate RFID messages
    setInterval(() => {
      if (Math.random() > 0.7) {
        const messages = [
          { text: 'Gate A-01 rilevato - 3 bins caricati', type: 'success' as const },
          { text: 'Bins scansionati: BIN-001, BIN-002, BIN-003', type: 'info' as const },
          { text: 'Missione M-001 avviata automaticamente', type: 'success' as const },
          { text: 'Posizione corretta - Procedere', type: 'success' as const },
          { text: 'ERRORE: Posizione sbagliata! Gate: B-05 Previsto: A-03', type: 'error' as const },
          { text: 'ATTENZIONE: Bins non previsti da missioni', type: 'warning' as const }
        ];
        
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        const msg: RfidMessage = {
          timestamp: new Date(),
          ...randomMsg
        };
        
        this.lastRfidMessage = msg;
        this.rfidLogMessages.unshift(msg);
        
        // Keep only last 50 messages
        if (this.rfidLogMessages.length > 50) {
          this.rfidLogMessages.pop();
        }
        
        // Clear last message after 5 seconds
        setTimeout(() => {
          this.lastRfidMessage = null;
        }, 5000);
      }
    }, 8000);

    // Simulate RFID connection status changes
    setInterval(() => {
      if (Math.random() > 0.95) {
        this.rfidConnected = !this.rfidConnected;
      }
    }, 10000);
  }
}
