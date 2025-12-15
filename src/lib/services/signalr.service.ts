import { Injectable, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { SignalRMessage } from '../models';

export enum ConnectionState {
  Disconnected = 'Disconnected',
  Connecting = 'Connecting',
  Connected = 'Connected',
  Reconnecting = 'Reconnecting',
  Failed = 'Failed'
}

@Injectable({
  providedIn: 'root'
})
export class SignalRService implements OnDestroy {
  private hubConnection: signalR.HubConnection | null = null;
  private messageSubject = new Subject<SignalRMessage>();
  private connectionStateSubject = new BehaviorSubject<ConnectionState>(ConnectionState.Disconnected);
  private reconnectAttempts = 0;
  private reconnectTimer: any;
  
  public messages$: Observable<SignalRMessage> = this.messageSubject.asObservable();
  public connectionState$: Observable<ConnectionState> = this.connectionStateSubject.asObservable();

  constructor() {
    if (!environment.mockMode) {
      this.startConnection();
    } else {
      console.log('📡 SignalR Service: Running in MOCK MODE');
      this.connectionStateSubject.next(ConnectionState.Connected);
      this.startMockMessageSimulation();
    }
  }

  ngOnDestroy(): void {
    this.stopConnection();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
  }

  private startConnection(): void {
    if (this.hubConnection) {
      return;
    }

    this.connectionStateSubject.next(ConnectionState.Connecting);
    console.log('📡 Connecting to SignalR hub at:', environment.signalRHubUrl);

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalRHubUrl)
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.elapsedMilliseconds < 60000) {
            return Math.random() * 10000;
          } else {
            return null;
          }
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.hubConnection.onreconnecting(() => {
      console.log('📡 SignalR: Reconnecting...');
      this.connectionStateSubject.next(ConnectionState.Reconnecting);
    });

    this.hubConnection.onreconnected(() => {
      console.log('✅ SignalR: Reconnected');
      this.connectionStateSubject.next(ConnectionState.Connected);
      this.reconnectAttempts = 0;
    });

    this.hubConnection.onclose((error) => {
      console.error('❌ SignalR: Connection closed', error);
      this.connectionStateSubject.next(ConnectionState.Disconnected);
      this.attemptReconnect();
    });

    this.registerHandlers();
    
    this.hubConnection
      .start()
      .then(() => {
        console.log('✅ SignalR: Connected');
        this.connectionStateSubject.next(ConnectionState.Connected);
        this.reconnectAttempts = 0;
      })
      .catch((err) => {
        console.error('❌ SignalR: Connection failed', err);
        this.connectionStateSubject.next(ConnectionState.Failed);
        this.attemptReconnect();
      });
  }

  private registerHandlers(): void {
    if (!this.hubConnection) return;

    // Register handlers for different message types
    this.hubConnection.on('MissionAssigned', (data: any) => {
      console.log('📨 Mission Assigned:', data);
      this.messageSubject.next({ type: 'MissionAssigned', payload: data });
    });

    this.hubConnection.on('MissionStatusChanged', (data: any) => {
      console.log('📨 Mission Status Changed:', data);
      this.messageSubject.next({ type: 'MissionStatusChanged', payload: data });
    });

    this.hubConnection.on('MissionUpdate', (data: any) => {
      console.log('📨 Mission Update:', data);
      this.messageSubject.next({ type: 'MissionUpdate', payload: data });
    });

    this.hubConnection.on('NotifyOperator', (message: string) => {
      console.log('📨 Notification:', message);
      this.messageSubject.next({ type: 'Notification', payload: { message } });
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= environment.maxReconnectAttempts) {
      console.error('❌ Max reconnect attempts reached');
      this.connectionStateSubject.next(ConnectionState.Failed);
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${environment.maxReconnectAttempts})...`);
    
    this.reconnectTimer = setTimeout(() => {
      this.hubConnection = null;
      this.startConnection();
    }, environment.reconnectInterval);
  }

  public stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop().then(() => {
        console.log('📡 SignalR: Connection stopped');
        this.connectionStateSubject.next(ConnectionState.Disconnected);
      });
      this.hubConnection = null;
    }
  }

  public sendMessage(methodName: string, ...args: any[]): Promise<void> {
    if (environment.mockMode) {
      console.log(`📤 MOCK: Sending ${methodName}`, args);
      return Promise.resolve();
    }

    if (!this.hubConnection || this.connectionStateSubject.value !== ConnectionState.Connected) {
      return Promise.reject('Not connected to hub');
    }

    return this.hubConnection.invoke(methodName, ...args);
  }

  // Mock mode simulation
  private startMockMessageSimulation(): void {
    // Simulate periodic updates in mock mode
    setInterval(() => {
      const mockTypes = ['MissionUpdate', 'Notification'];
      const randomType = mockTypes[Math.floor(Math.random() * mockTypes.length)];
      
      if (Math.random() > 0.8) { // 20% chance of message
        this.messageSubject.next({
          type: randomType,
          payload: {
            message: 'Mock notification from SignalR',
            timestamp: new Date()
          }
        });
      }
    }, 10000); // Every 10 seconds
  }

  public getConnectionState(): ConnectionState {
    return this.connectionStateSubject.value;
  }

  public isConnected(): boolean {
    return this.connectionStateSubject.value === ConnectionState.Connected;
  }
}
