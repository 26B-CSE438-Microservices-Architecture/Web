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
    console.log('>>> ForgotPasswordComponent.send() triggered. Email:', this.email);
    this.message = '';
    this.error = '';

    const emailToSubmit = this.email?.trim();
    if (!emailToSubmit) {
      this.error = 'Please enter a valid email address.';
      return;
    }

    const payload = { email: emailToSubmit };
    
    // Requirement 8: Log request details
    console.log('Forgot Password Request:', {
      endpoint: '/auth/forgot-password',
      body: payload
    });

    this.loading = true;
    console.log('>>> Calling auth.forgotPassword(payload)...');

    const obs = this.auth.forgotPassword(payload);
    console.log('>>> Observable created:', obs);

    obs.subscribe({
      next: (res) => {
        console.log('>>> Forgot password success response:', res);
        this.loading = false;
        this.message = 'Email sent! If that account exists, you will receive a reset link shortly.';
        this.email = '';
      },
      error: (err) => {
        console.error('>>> Forgot password error response:', err);
        this.loading = false;
        
        // Extract backend error message if available
        const backendMessage = err.error?.message || err.error?.detail;
        this.error = backendMessage || 'Failed to send reset link. Please try again.';
      },
      complete: () => {
        console.log('>>> Forgot password observable completed.');
      }
    });
  }
}