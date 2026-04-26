import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-restaurant-profile',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './restaurant-profile.component.html',
  styleUrls: ['./restaurant-profile.component.css']
})
export class RestaurantProfileComponent {

  successMessage = '';

  restaurant = {
    name: 'Mock Bistro',
    description: 'Best burgers in town',
    address: 'Istanbul, Turkey',
    phone: '+90 555 000 0000',
    openingTime: '09:00',
    closingTime: '22:00',
    status: 'Open'
  };

  save() {
    console.log('Saved:', this.restaurant);

    this.successMessage = 'Profile updated successfully!';

    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }
}