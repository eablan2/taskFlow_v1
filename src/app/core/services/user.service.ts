import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private usersSubject = new BehaviorSubject<User[]>([]);

  users$: Observable<User[]> = this.usersSubject.asObservable();

  constructor(private http: HttpClient) {
    this.load();
  }

  private load(): void {
    this.http.get<User[]>('/api/users').subscribe(users => this.usersSubject.next(users));
  }

  getAll(): User[] {
    return this.usersSubject.value;
  }

  getById(id: string): User | undefined {
    return this.getAll().find(u => u.id === id);
  }

  isUsernameTaken(username: string, excludeId?: string): boolean {
    return this.getAll().some(u => u.username === username && u.id !== excludeId);
  }

  add(user: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>('/api/users', user).pipe(
      tap(() => this.load()),
    );
  }

  update(id: string, changes: Partial<Omit<User, 'id'>>): Observable<User> {
    return this.http.put<User>(`/api/users/${id}`, changes).pipe(
      tap(() => this.load()),
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/users/${id}`).pipe(
      tap(() => this.load()),
    );
  }
}
