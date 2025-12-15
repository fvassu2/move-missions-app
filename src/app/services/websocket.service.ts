import { Injectable } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { retryWhen, tap, delayWhen } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket$?: WebSocketSubject<any>;
  private messagesSubject$ = new Subject<any>();
  private reconnectInterval = 5000;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  public messages$ = this.messagesSubject$.asObservable();

  constructor() {}

  public connect(url: string): void {
    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = this.getNewWebSocket(url);
      
      this.socket$
        .pipe(
          retryWhen(errors =>
            errors.pipe(
              tap(err => {
                console.error('WebSocket error:', err);
                this.reconnectAttempts++;
              }),
              delayWhen(() => {
                const delay = Math.min(
                  this.reconnectInterval * Math.pow(2, this.reconnectAttempts),
                  30000
                );
                console.log(`Reconnecting in ${delay}ms...`);
                return timer(delay);
              })
            )
          )
        )
        .subscribe(
          message => {
            this.messagesSubject$.next(message);
            this.reconnectAttempts = 0;
          },
          error => console.error('WebSocket error:', error)
        );
    }
  }

  private getNewWebSocket(url: string): WebSocketSubject<any> {
    return webSocket({
      url,
      openObserver: {
        next: () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
        }
      },
      closeObserver: {
        next: () => {
          console.log('WebSocket disconnected');
        }
      }
    });
  }

  public send(data: any): void {
    if (this.socket$) {
      this.socket$.next(data);
    }
  }

  public close(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = undefined;
    }
  }
}
