import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

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
    if (!token) return;
    this.http.get<User>('/api/auth/me').pipe(
      catchError(() => {
        localStorage.removeItem('tf_token');
        return of(null);
      }),
    ).subscribe(user => this.currentUserSubject.next(user));
  }
}
