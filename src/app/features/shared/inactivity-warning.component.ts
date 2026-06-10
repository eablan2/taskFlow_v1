import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { InactivityService } from '../../core/services/inactivity.service';

@Component({
  selector: 'app-inactivity-warning',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if (inactivity.warning$ | async) {
      <div class="inactivity-backdrop">
        <div class="inactivity-modal">
          <div class="inactivity-icon"><i class="ti ti-clock-exclamation"></i></div>
          <h3 class="inactivity-title">Still there?</h3>
          <p class="inactivity-msg">
            You've been inactive for a while. You'll be logged out in
          </p>
          <div class="inactivity-countdown">{{ inactivity.remainingSeconds$ | async }}s</div>
          <button class="btn btn-primary inactivity-btn" (click)="inactivity.stayLoggedIn()">
            Stay logged in
          </button>
        </div>
      </div>
    }
  `,
})
export class InactivityWarningComponent {
  constructor(public inactivity: InactivityService) {}
}
