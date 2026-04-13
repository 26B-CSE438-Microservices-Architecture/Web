import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [FormsModule]
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  showPassword: boolean = false;

  constructor(private router: Router, private auth: AuthService) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login() {
    if (this.auth.login(this.email, this.password)) {
      this.router.navigate(['/dashboard']); // Navigate on success
    } else {
      alert('Invalid email or password');
    }
  }

  forgotPassword() {
    alert('Password recovery not implemented yet 😅');
  }
}