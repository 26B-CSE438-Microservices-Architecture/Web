import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  email = '';
  token = '';
  password = '';
  confirmPassword = '';
  
  loading = false;
  message = '';
  error = '';

  ngOnInit(): void {
    // Read token and email from URL query parameters
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    this.email = this.route.snapshot.queryParamMap.get('email') || '';

    if (!this.token) {
      this.error = 'Invalid or missing reset token.';
    }
    if (!this.email) {
      this.error = this.error ? 'Invalid or missing reset token and email.' : 'Missing email address.';
    }
  }

  submit(): void {
    console.log('>>> ResetPasswordComponent.submit() triggered.');
    this.message = '';
    this.error = '';

    if (!this.password || !this.confirmPassword) {
      this.error = 'Please fill in all fields.';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    const payload = {
      email: this.email,
      token: this.token,
      password: this.password,
      confirmPassword: this.confirmPassword
    };

    console.log('>>> Calling auth.resetPassword(payload)... Payload:', payload);
    this.loading = true;

    this.auth.resetPassword(payload).subscribe({
      next: (response: any) => {
        console.log('>>> Reset password success response:', response);
        this.loading = false;
        this.message = 'Password reset successfully! Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err) => {
        console.error('>>> Reset password error response:', err);
        this.loading = false;
        const backendMessage = err.error?.message || err.error?.detail;
        this.error = backendMessage || 'Failed to reset password. The link may be expired.';
      }
    });
  }
}
