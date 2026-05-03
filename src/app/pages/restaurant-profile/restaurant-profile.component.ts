import { Component, DestroyRef, ElementRef, effect, inject, NgZone, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

import { OwnerService } from '../../services/owner.service';
import { OwnerInfo, RestaurantProfile, UpdateRestaurantProfileDto } from '../../models/owner.models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-restaurant-profile',
  standalone: true,
  host: {
    ngSkipHydration: 'true'
  },
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './restaurant-profile.component.html',
  styleUrls: ['./restaurant-profile.component.css']
})
export class RestaurantProfileComponent implements OnInit {
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly ownerService = inject(OwnerService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly ngZone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly profile = signal<RestaurantProfile>(this.emptyProfile());
  editDraft: UpdateRestaurantProfileDto = this.emptyDraft();
  readonly owner = signal<OwnerInfo>(this.emptyOwner());

  readonly isEditing = signal(false);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly statusUpdating = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  constructor() {
    effect(() => {
      this.loading();
      this.isEditing();

      if (!this.isBrowser) {
        return;
      }

      queueMicrotask(() => this.removeCoordinateArtifacts());
    });
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    this.loadProfile();
    this.scheduleInitialRetry();
  }

  private loadProfile(): void {
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.ownerService
      .getCurrentOwner()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((owner) => {
          this.owner.set(owner);

          const savedId = localStorage.getItem('menu_restaurant_id');
          const restaurantId = savedId || owner.restaurantId || environment.defaultVendorId || '';

          if (!restaurantId) {
            throw new Error('No restaurant found. Please visit the Menu page first.');
          }

          return this.ownerService.getRestaurantProfile(restaurantId);
        })
      )
      .subscribe({
        next: (data) => {
          this.ngZone.run(() => {
            this.profile.set(data);
            if (!this.owner().restaurantName) {
              this.owner.update((owner) => ({ ...owner, restaurantName: data.name }));
            }
            this.loading.set(false);
          });
        },
        error: (error: unknown) => {
          this.ngZone.run(() => {
            this.errorMessage.set(
              error instanceof Error
                ? error.message
                : 'Failed to load restaurant profile.'
            );
            this.loading.set(false);
          });
        }
      });
  }

  private scheduleInitialRetry(): void {
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;

      if (this.loading()) {
        this.loadProfile();
      }
    }, 800);
  }

  startEdit(): void {
    const profile = this.profile();
    this.editDraft = {
      name: profile.name,
      description: profile.description,
      addressText: profile.addressText,
      logoUrl: profile.logoUrl,
      minOrderAmount: profile.minOrderAmount,
      deliveryFee: profile.deliveryFee
    };
    this.isEditing.set(true);
    this.errorMessage.set('');
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.errorMessage.set('');
  }

  save(): void {
    this.saving.set(true);
    this.ownerService.updateRestaurantProfile(this.profile().id, this.editDraft).subscribe({
      next: (updated) => {
        this.ngZone.run(() => {
          this.profile.set(updated);
          this.isEditing.set(false);
          this.saving.set(false);
          this.showSuccess('Profile updated successfully.');
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.saving.set(false);
          this.errorMessage.set('Failed to update profile. Please try again.');
        });
      }
    });
  }

  setStatus(status: 'Open' | 'Closed' | 'Busy'): void {
    if (this.profile().status === status || this.statusUpdating()) return;
    this.statusUpdating.set(true);
    this.ownerService.updateRestaurantStatus(this.profile().id, status).subscribe({
      next: (updated) => {
        this.ngZone.run(() => {
          this.profile.set(updated);
          this.statusUpdating.set(false);

          if (status === 'Open' || status === 'Closed') {
            window.location.reload();
            return;
          }

          this.showSuccess(`Status changed to ${status}.`);
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.statusUpdating.set(false);
          this.errorMessage.set('Failed to update status.');
        });
      }
    });
  }

  statusClass(): string {
    switch (this.profile().status) {
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
    this.successMessage.set(msg);
    this.errorMessage.set('');
    setTimeout(() => { this.successMessage.set(''); }, 3000);
  }

  private removeCoordinateArtifacts(): void {
    const root = this.hostElement.nativeElement;

    root.querySelectorAll<HTMLElement>('.info-row, .field').forEach((element) => {
      const label = element.querySelector<HTMLElement>('.info-label, label');
      const labelText = label?.textContent?.trim().toLowerCase();

      if (labelText === 'latitude' || labelText === 'longitude') {
        element.remove();
      }
    });
  }

  private emptyProfile(): RestaurantProfile {
    return {
      id: '', name: '', description: '',
      addressText: '', logoUrl: '',
      minOrderAmount: 0, deliveryFee: 0,
      status: 'Open', openingTime: '00:00:00', closingTime: '00:00:00'
    };
  }

  private emptyDraft(): UpdateRestaurantProfileDto {
    return {
      name: '', description: '', addressText: '',
      logoUrl: '',
      minOrderAmount: 0, deliveryFee: 0
    };
  }

  private emptyOwner(): OwnerInfo {
    return {
      id: '',
      name: 'Owner',
      email: '',
      phone: null,
      role: '',
      active: false,
      createdAt: '',
      restaurantId: '',
      restaurantName: '',
      openClosedStatus: 'CLOSED'
    };
  }
}