import { Component, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AsyncPipe, DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationService } from '../../core/services/notification.service';
import { WorkItemModalComponent } from '../shared/work-item-modal.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe, DatePipe, WorkItemModalComponent],
  templateUrl: './shell.component.html',
})
export class ShellComponent implements OnInit, OnDestroy {
  currentUser$ = this.auth.currentUser$;
  toasts$      = this.toast.toasts$;
  menuOpen     = signal(false);
  bellOpen     = false;
  toggleMenu() { this.menuOpen.update(v => !v); }

  constructor(
    private auth:  AuthService,
    private toast: ToastService,
    private router: Router,
    public  theme: ThemeService,
    public  notif: NotificationService,
  ) {}

  ngOnInit(): void { this.notif.startPolling(); }
  ngOnDestroy(): void { this.notif.stopPolling(); }

  get initials(): string {
    const name = this.auth.currentUser?.name ?? '';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  get isAdmin(): boolean { return this.auth.isAdmin; }

  logout(): void { this.auth.logout(); this.router.navigate(['/login']); }
  dismissToast(id: number): void { this.toast.dismiss(id); }

  toggleBell(): void {
    this.bellOpen = !this.bellOpen;
    if (this.bellOpen) this.notif.markAllRead();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.bell-wrap')) this.bellOpen = false;
  }
}
