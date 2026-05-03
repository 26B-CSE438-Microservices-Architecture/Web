import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  email: string = '';
  password: string = '';
  showPassword: boolean = false;
  rememberMe: boolean = false;
  errorMessage: string = '';

  constructor(private router: Router, private auth: AuthService) {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('rememberedEmail');
      if (savedEmail) {
        this.email = savedEmail;
        this.rememberMe = true;
      }
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login() {
    this.errorMessage = '';
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        if (typeof window !== 'undefined') {
          if (this.rememberMe) {
            localStorage.setItem('rememberedEmail', this.email);
          } else {
            localStorage.removeItem('rememberedEmail');
          }
        }
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.errorMessage = 'Invalid email or password';
      }
    });
  }
}