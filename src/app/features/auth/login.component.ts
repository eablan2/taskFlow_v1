import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  username = '';
  password = '';
  error = signal(false);
  loading = signal(false);

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  submit(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.auth.login(this.username.trim(), this.password).subscribe(user => {
      if (user) {
        this.error.set(false);
        // Keep loading=true so the overlay stays visible during navigation
        this.router.navigate(['/dashboard']);
      } else {
        this.loading.set(false);
        this.error.set(true);
      }
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.submit();
  }
}
