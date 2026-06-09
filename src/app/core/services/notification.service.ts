import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, Subscription, catchError, of, filter, switchMap, take } from 'rxjs';
import { NotificationsResponse } from '../models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private dataSubject = new BehaviorSubject<NotificationsResponse>({ recent: [], previous: [], unread: 0 });
  data$ = this.dataSubject.asObservable();

  private pollSub?: Subscription;

  constructor(private http: HttpClient, private auth: AuthService) {}

  startPolling(): void {
    // Wait until session is restored before first load
    this.auth.sessionReady$.pipe(
      filter(ready => ready),
      take(1),
      switchMap(() => {
        if (!this.auth.isLoggedIn) return of(null);
        this.load();
        return interval(30_000);
      })
    ).subscribe(() => { if (this.auth.isLoggedIn) this.load(); });
  }

  stopPolling(): void {
    this.pollSub?.unsubscribe();
  }

  load(): void {
    this.http.get<NotificationsResponse>('/api/notifications')
      .pipe(catchError(() => of(null)))
      .subscribe(d => { if (d) this.dataSubject.next(d); });
  }

  markAllRead(): void {
    this.http.post('/api/notifications/read-all', {})
      .pipe(catchError(() => of(null)))
      .subscribe(() => this.load());
  }

  clearAll(): void {
    this.http.delete('/api/notifications')
      .pipe(catchError(() => of(null)))
      .subscribe(() => this.dataSubject.next({ recent: [], previous: [], unread: 0 }));
  }

  get unread(): number { return this.dataSubject.value.unread; }
}
