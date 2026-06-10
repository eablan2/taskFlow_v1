import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

const WARN_AFTER_MS   = 8 * 60 * 1000;   // 8 min — show warning
const LOGOUT_AFTER_MS = 10 * 60 * 1000;  // 10 min — auto logout

@Injectable({ providedIn: 'root' })
export class InactivityService {
  readonly warning$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  remainingSeconds$ = new BehaviorSubject<number>(120);

  private warnTimer?: ReturnType<typeof setTimeout>;
  private logoutTimer?: ReturnType<typeof setTimeout>;
  private countdownInterval?: ReturnType<typeof setInterval>;
  private events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
  private boundReset = this.reset.bind(this);

  constructor(private auth: AuthService, private router: Router, private zone: NgZone) {}

  start(): void {
    this.events.forEach(e => window.addEventListener(e, this.boundReset, { passive: true }));
    this.scheduleWarn();
  }

  stop(): void {
    this.events.forEach(e => window.removeEventListener(e, this.boundReset));
    this.clearTimers();
    this.warning$.next(false);
  }

  reset(): void {
    if (this.warning$.value) return; // don't reset during warning countdown
    this.clearTimers();
    this.scheduleWarn();
  }

  stayLoggedIn(): void {
    this.warning$.next(false);
    this.clearTimers();
    this.scheduleWarn();
  }

  private scheduleWarn(): void {
    this.zone.runOutsideAngular(() => {
      this.warnTimer = setTimeout(() => {
        this.zone.run(() => {
          this.warning$.next(true);
          this.remainingSeconds$.next(120);
          this.startCountdown();
        });
      }, WARN_AFTER_MS);
    });
  }

  private startCountdown(): void {
    let secs = 120;
    this.countdownInterval = setInterval(() => {
      secs--;
      this.remainingSeconds$.next(secs);
      if (secs <= 0) this.doLogout();
    }, 1000);

    this.logoutTimer = setTimeout(() => this.doLogout(), LOGOUT_AFTER_MS - WARN_AFTER_MS);
  }

  private doLogout(): void {
    this.stop();
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  private clearTimers(): void {
    clearTimeout(this.warnTimer);
    clearTimeout(this.logoutTimer);
    clearInterval(this.countdownInterval);
  }
}
