import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);

  email = '';
  message = '';
  error = '';
  loading = false;

  send() {
    this.message = '';
    this.error = '';

    if (!this.email) {
      this.error = 'Please enter your email';
      return;
    }

    this.loading = true;
    this.auth.forgotPassword({ email: this.email }).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'If that email exists, a reset link has been sent.';
        this.email = '';
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to send reset link. Please try again.';
      }
    });
  }
}