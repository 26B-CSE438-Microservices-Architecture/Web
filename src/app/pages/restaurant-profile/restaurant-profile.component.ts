import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe, SlicePipe } from '@angular/common';

import { OwnerService } from '../../services/owner.service';
import { RestaurantProfile, UpdateRestaurantProfileDto } from '../../models/owner.models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-restaurant-profile',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, SlicePipe],
  templateUrl: './restaurant-profile.component.html',
  styleUrls: ['./restaurant-profile.component.css']
})
export class RestaurantProfileComponent implements OnInit {
  private readonly ownerService = inject(OwnerService);

  profile: RestaurantProfile = this.emptyProfile();
  editDraft: UpdateRestaurantProfileDto = this.emptyDraft();

  isEditing = false;
  loading = true;
  saving = false;
  statusUpdating = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    // Prefer the vendor ID saved from the menu page, then the env default
    const savedId = localStorage.getItem('menu_restaurant_id');
    const restaurantId = savedId || environment.defaultVendorId || '';

    if (restaurantId) {
      this.ownerService.getRestaurantProfile(restaurantId).subscribe({
        next: (data) => {
          this.profile = data;
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'Failed to load restaurant profile.';
          this.loading = false;
        }
      });
      return;
    }

    this.ownerService.getCurrentOwner().subscribe(owner => {
      const ownerId = owner.restaurantId;
      if (!ownerId) {
        this.errorMessage = 'No restaurant found. Please visit the Menu page first.';
        this.loading = false;
        return;
      }
      this.ownerService.getRestaurantProfile(ownerId).subscribe({
        next: (data) => {
          this.profile = data;
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'Failed to load restaurant profile.';
          this.loading = false;
        }
      });
    });
  }

  startEdit(): void {
    this.editDraft = {
      name: this.profile.name,
      description: this.profile.description,
      cuisineType: this.profile.cuisineType,
      addressText: this.profile.addressText,
      latitude: this.profile.latitude,
      longitude: this.profile.longitude,
      logoUrl: this.profile.logoUrl,
      minOrderAmount: this.profile.minOrderAmount,
      deliveryFee: this.profile.deliveryFee,
      openingTime: this.toTimeInput(this.profile.openingTime),
      closingTime: this.toTimeInput(this.profile.closingTime)
    };
    this.isEditing = true;
    this.errorMessage = '';
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.errorMessage = '';
  }

  save(): void {
    this.saving = true;
    const payload: UpdateRestaurantProfileDto = {
      ...this.editDraft,
      openingTime: this.fromTimeInput(this.editDraft.openingTime),
      closingTime: this.fromTimeInput(this.editDraft.closingTime)
    };
    this.ownerService.updateRestaurantProfile(this.profile.id, payload).subscribe({
      next: (updated) => {
        this.profile = updated;
        this.isEditing = false;
        this.saving = false;
        this.showSuccess('Profile updated successfully.');
      },
      error: () => {
        this.saving = false;
        this.errorMessage = 'Failed to update profile. Please try again.';
      }
    });
  }

  setStatus(status: 'Open' | 'Closed' | 'Busy'): void {
    if (this.profile.status === status || this.statusUpdating) return;
    this.statusUpdating = true;
    this.ownerService.updateRestaurantStatus(this.profile.id, status).subscribe({
      next: (updated) => {
        this.profile = updated;
        this.statusUpdating = false;
        this.showSuccess(`Status changed to ${status}.`);
      },
      error: () => {
        this.statusUpdating = false;
        this.errorMessage = 'Failed to update status.';
      }
    });
  }

  statusClass(): string {
    switch (this.profile.status) {
      case 'Open':   return 'chip-open';
      case 'Busy':   return 'chip-busy';
      case 'Closed': return 'chip-closed';
      default:       return '';
    }
  }

  formatTime(time: string): string {
    return time ? time.substring(0, 5) : '—';
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    this.errorMessage = '';
    setTimeout(() => { this.successMessage = ''; }, 3000);
  }

  private toTimeInput(t: string): string {
    return t ? t.substring(0, 5) : '';
  }

  private fromTimeInput(t: string): string {
    return t && t.length === 5 ? `${t}:00` : t;
  }

  private emptyProfile(): RestaurantProfile {
    return {
      id: '', name: '', description: '', cuisineType: '',
      addressText: '', latitude: 0, longitude: 0, logoUrl: '',
      minOrderAmount: 0, deliveryFee: 0, isActive: true,
      status: 'Open', openingTime: '00:00:00', closingTime: '00:00:00',
      createdAt: '', updatedAt: ''
    };
  }

  private emptyDraft(): UpdateRestaurantProfileDto {
    return {
      name: '', description: '', cuisineType: '', addressText: '',
      latitude: 0, longitude: 0, logoUrl: '',
      minOrderAmount: 0, deliveryFee: 0,
      openingTime: '09:00', closingTime: '22:00'
    };
  }
}