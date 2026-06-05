import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  show(message: string, type: ToastType = 'success', duration = 3000): void {
    const toast: Toast = { id: ++this.counter, message, type };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);
    setTimeout(() => this.dismiss(toast.id), duration);
  }

  dismiss(id: number): void {
    this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
  }
}
