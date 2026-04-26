import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {

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

    console.log('📨 Sending reset request for:', this.email);

    setTimeout(() => {
      this.loading = false;
      this.message = 'Reset link sent (mock ✔)';
      console.log('✅ Reset process completed for:', this.email);
      this.email = '';
    }, 1000);
  }
}