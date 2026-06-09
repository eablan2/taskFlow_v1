import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { NotificationsResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private dataSubject = new BehaviorSubject<NotificationsResponse>({ recent: [], previous: [], unread: 0 });
  data$ = this.dataSubject.asObservable();

  private pollSub?: Subscription;

  constructor(private http: HttpClient) {}

  startPolling(): void {
    this.load();
    this.pollSub = interval(30_000).subscribe(() => this.load());
  }

  stopPolling(): void {
    this.pollSub?.unsubscribe();
  }

  load(): void {
    this.http.get<NotificationsResponse>('/api/notifications').subscribe(d => this.dataSubject.next(d));
  }

  markAllRead(): void {
    this.http.post('/api/notifications/read-all', {}).subscribe(() => this.load());
  }

  clearAll(): void {
    this.http.delete('/api/notifications').subscribe(() => this.dataSubject.next({ recent: [], previous: [], unread: 0 }));
  }

  get unread(): number { return this.dataSubject.value.unread; }
}
