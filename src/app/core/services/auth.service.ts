import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, filter, map, of, take, tap } from 'rxjs';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject  = new BehaviorSubject<User | null>(null);
  private sessionReadySubject = new BehaviorSubject<boolean>(false);

  currentUser$:   Observable<User | null> = this.currentUserSubject.asObservable();
  /** Emits true once the initial session restore attempt has completed. */
  sessionReady$:  Observable<boolean>     = this.sessionReadySubject.asObservable();

  get currentUser(): User | null { return this.currentUserSubject.value; }
  get isAdmin(): boolean         { return this.currentUser?.role === 'admin'; }
  get isLoggedIn(): boolean      { return this.currentUser !== null; }

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  login(username: string, password: string): Observable<User | null> {
    return this.http.post<{ user: User; token: string }>('/api/auth/login', { username, password }).pipe(
      tap(({ user, token }) => {
        localStorage.setItem('tf_token', token);
        this.currentUserSubject.next(user);
      }),
      map(({ user }) => user),
      catchError(() => of(null)),
    );
  }

  logout(): void {
    this.http.post('/api/auth/logout', {}).pipe(catchError(() => of(null))).subscribe();
    localStorage.removeItem('tf_token');
    this.currentUserSubject.next(null);
  }

  private restoreSession(): void {
    const token = localStorage.getItem('tf_token');
    if (!token) {
      this.sessionReadySubject.next(true);
      return;
    }
    this.http.get<User>('/api/auth/me').pipe(
      catchError(() => {
        localStorage.removeItem('tf_token');
        return of(null);
      }),
    ).subscribe(user => {
      this.currentUserSubject.next(user);
      this.sessionReadySubject.next(true);
    });
  }
}
