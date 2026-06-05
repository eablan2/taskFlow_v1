import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';
import { WorkItemModalComponent } from '../shared/work-item-modal.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe, WorkItemModalComponent],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  currentUser$ = this.auth.currentUser$;
  toasts$      = this.toast.toasts$;
  menuOpen     = signal(false);
  toggleMenu() { this.menuOpen.update(v => !v); }

  constructor(
    private auth:  AuthService,
    private toast: ToastService,
    public  theme: ThemeService,
  ) {}

  get initials(): string {
    const name = this.auth.currentUser?.name ?? '';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  get isAdmin(): boolean {
    return this.auth.isAdmin;
  }

  logout(): void {
    this.auth.logout();
  }

  dismissToast(id: number): void {
    this.toast.dismiss(id);
  }
}
