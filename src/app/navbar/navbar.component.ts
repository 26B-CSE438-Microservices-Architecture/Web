import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  PLATFORM_ID
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';

import { AuthService } from '../services/auth.service';
import { OwnerService } from '../services/owner.service';
import { OwnerInfo, RestaurantStatus } from '../models/owner.models';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent {
  private readonly ownerService = inject(OwnerService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly ownerInfo = signal<OwnerInfo>({
    name: 'Owner',
    restaurantName: 'Restaurant',
    openClosedStatus: 'CLOSED'
  });

  private readonly localStatus = signal<RestaurantStatus | null>(null);
  readonly isOpen = computed(() => this.effectiveStatus() === 'OPEN');
  readonly restaurantName = computed(() => this.ownerInfo().restaurantName);
  readonly ownerName = computed(() => this.ownerInfo().name);
  readonly statusLabel = computed(() =>
    this.isOpen() ? 'Open' : 'Closed'
  );

  private readonly effectiveStatus = computed(
    () => this.localStatus() ?? this.ownerInfo().openClosedStatus
  );

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    this.ownerService
      .getCurrentOwner()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((owner) => {
        this.ownerInfo.set(owner);
      });
  }

  toggleOpenStatus(): void {
    if (!this.isBrowser) {
      return;
    }

    const nextStatus: RestaurantStatus = this.isOpen() ? 'CLOSED' : 'OPEN';
    this.localStatus.set(nextStatus);

    this.ownerService
      .setRestaurantStatus(nextStatus)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (owner: OwnerInfo) => {
          this.localStatus.set(owner.openClosedStatus);
        },
        error: () => {
          this.localStatus.set(null);
        }
      });
  }

  logout(): void {
    if (!this.isBrowser) {
      return;
    }

    this.authService.logout();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
