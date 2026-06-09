import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, combineLatest, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { WorkItem, WorkItemFilters, ItemType, ItemStatus } from '../models';

@Injectable({ providedIn: 'root' })
export class WorkItemService {
  private itemsSubject  = new BehaviorSubject<WorkItem[]>([]);
  private filtersSubject = new BehaviorSubject<WorkItemFilters>({});

  items$:         Observable<WorkItem[]>        = this.itemsSubject.asObservable();
  filters$:       Observable<WorkItemFilters>   = this.filtersSubject.asObservable();
  filteredItems$: Observable<WorkItem[]>;

  readonly STATUSES: ItemStatus[] = ['New', 'Active', 'In Review', 'Done', 'Blocked'];
  readonly TYPES: ItemType[]      = ['Epic', 'Feature', 'User Story', 'Task'];

  constructor(private http: HttpClient) {
    this.filteredItems$ = combineLatest([this.items$, this.filters$]).pipe(
      map(([items, filters]) => this.applyFilters(items, filters)),
    );
    this.load();
  }

  private load(): void {
    this.http.get<WorkItem[]>('/api/items').subscribe(items => this.itemsSubject.next(items));
  }

  // ── Queries ─────────────────────────────────────────────────────────

  getAll(): WorkItem[] { return this.itemsSubject.value; }

  getById(id: string): WorkItem | undefined {
    return this.getAll().find(i => i.id === id);
  }

  getByStatus(status: ItemStatus): WorkItem[] {
    return this.getAll().filter(i => i.status === status);
  }

  getRecent(limit = 8): WorkItem[] {
    return [...this.getAll()].sort((a, b) => b.created - a.created).slice(0, limit);
  }

  // ── Filters ──────────────────────────────────────────────────────────

  setFilters(filters: WorkItemFilters): void   { this.filtersSubject.next(filters); }
  patchFilter(patch: Partial<WorkItemFilters>): void {
    this.filtersSubject.next({ ...this.filtersSubject.value, ...patch });
  }
  clearFilters(): void { this.filtersSubject.next({}); }

  private applyFilters(items: WorkItem[], f: WorkItemFilters): WorkItem[] {
    let result = [...items].sort((a, b) => b.created - a.created);
    if (f.search) {
      const q = f.search.toLowerCase();
      result = result.filter(i => i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
    }
    if (f.type)     result = result.filter(i => i.type     === f.type);
    if (f.status)   result = result.filter(i => i.status   === f.status);
    if (f.priority) result = result.filter(i => i.priority === f.priority);
    if (f.assignee) result = result.filter(i => i.assignee === f.assignee);
    return result;
  }

  // ── Mutations ────────────────────────────────────────────────────────

  create(data: Omit<WorkItem, 'id' | 'created'>): Observable<WorkItem> {
    return this.http.post<WorkItem>('/api/items', data).pipe(
      tap(() => this.load()),
    );
  }

  update(id: string, changes: Partial<Omit<WorkItem, 'id' | 'created'>>): Observable<WorkItem> {
    return this.http.put<WorkItem>(`/api/items/${id}`, changes).pipe(
      tap(() => this.load()),
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/items/${id}`).pipe(
      tap(() => this.load()),
    );
  }

  // ── Stats ────────────────────────────────────────────────────────────

  getStats() {
    const items  = this.getAll();
    const total  = items.length;
    const done   = items.filter(i => i.status === 'Done').length;
    const active = items.filter(i => i.status === 'Active').length;
    const points = items.reduce((sum, i) => sum + (i.points || 0), 0);

    const byType   = this.TYPES.map(t   => ({ label: t, count: items.filter(i => i.type   === t).length }));
    const byStatus = this.STATUSES.map(s => ({ label: s, count: items.filter(i => i.status === s).length }));

    return { total, done, active, points, byType, byStatus };
  }
}
