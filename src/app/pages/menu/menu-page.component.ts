import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MenuService } from '../../services/menu.service';
import { OwnerService } from '../../services/owner.service';
import {
  CategoryDto,
  CreateCategoryDto,
  CreateProductDto,
  MenuDto,
  ProductDto,
  RestaurantSummary,
  UpdateCategoryDto,
  UpdateProductDto
} from '../../models/menu.models';
import { OwnerInfo } from '../../models/owner.models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-menu-page',
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
  templateUrl: './menu-page.component.html',
  styleUrl: './menu-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuPageComponent {
  private readonly menuService = inject(MenuService);
  private readonly ownerService = inject(OwnerService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly selectedRestaurantId = signal<string>('');
  readonly selectedRestaurantName = signal<string>('');
  readonly menu = signal<MenuDto | null>(null);

  readonly resolvingRestaurant = signal(false);
  readonly loadingMenu = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly editingCategoryId = signal<string | null>(null);
  readonly addingProductToCategoryId = signal<string | null>(null);
  readonly editingProductId = signal<string | null>(null);
  readonly showingAddCategory = signal(false);
  readonly showingRestaurantPicker = signal(false);
  readonly restaurants = signal<RestaurantSummary[]>([]);

  private readonly RESTAURANT_ID_KEY = 'menu_restaurant_id';
  private readonly RESTAURANT_NAME_KEY = 'menu_restaurant_name';

  readonly sortedCategories = computed(() => {
    const currentMenu = this.menu();
    if (!currentMenu || !Array.isArray(currentMenu.categories)) {
      return [] as CategoryDto[];
    }

    return [...currentMenu.categories].sort((a, b) => a.displayOrder - b.displayOrder);
  });

  readonly categoryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    displayOrder: [0, [Validators.required]]
  });

  readonly editCategoryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    displayOrder: [1, [Validators.required, Validators.min(0)]]
  });

  readonly productForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(500)]],
    price: [0, [Validators.required, Validators.min(0)]]
  });

  readonly editProductForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(500)]],
    price: [0, [Validators.required, Validators.min(0)]],
    categoryId: ['', [Validators.required]]
  });

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    if (environment.defaultVendorId) {
      this.selectedRestaurantId.set(environment.defaultVendorId);
      this.selectedRestaurantName.set(environment.defaultVendorName ?? '');
      this.loadMenu();
      return;
    }

    const savedId = localStorage.getItem(this.RESTAURANT_ID_KEY);
    const savedName = localStorage.getItem(this.RESTAURANT_NAME_KEY);
    if (savedId) {
      this.selectedRestaurantId.set(savedId);
      this.selectedRestaurantName.set(savedName ?? '');
      this.loadMenu();
      return;
    }

    if (environment.defaultVendorName) {
      this.resolvingRestaurant.set(true);
      this.resolveRestaurantByName(environment.defaultVendorName);
      return;
    }

    this.resolveRestaurantContext();
  }

  resolveRestaurantContext(): void {
    if (environment.defaultVendorId) {
      this.selectedRestaurantId.set(environment.defaultVendorId);
      this.selectedRestaurantName.set(environment.defaultVendorName ?? '');
      this.loadMenu();
      return;
    }

    if (environment.defaultVendorName) {
      this.resolvingRestaurant.set(true);
      this.errorMessage.set(null);
      this.resolveRestaurantByName(environment.defaultVendorName);
      return;
    }

    this.resolvingRestaurant.set(true);
    this.errorMessage.set(null);

    this.ownerService
      .getCurrentOwner()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (owner) => {
          if (owner.restaurantName) {
            this.selectedRestaurantName.set(owner.restaurantName);
          }

          const directRestaurantId = this.extractRestaurantId(owner);
          if (directRestaurantId) {
            this.selectedRestaurantId.set(directRestaurantId);
            this.loadMenu();
            return;
          }

          this.resolveRestaurantByName(owner.restaurantName ?? '');
        },
        error: (error) => {
          this.errorMessage.set(this.extractErrorMessage(error));
          this.resolvingRestaurant.set(false);
        },
        complete: () => undefined
      });
  }

  loadAdminMenu(): void {
    this.resetEditorState();
    this.loadMenu();
  }

  loadMenu(): void {
    const restaurantId = this.selectedRestaurantId();
    if (!restaurantId) {
      return;
    }

    this.loadingMenu.set(true);
    this.errorMessage.set(null);

    this.menuService
      .getRestaurantMenu(restaurantId, this.selectedRestaurantName())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (menu) => {
          this.menu.set(menu);
          if (menu.restaurantName) {
            this.selectedRestaurantName.set(menu.restaurantName);
          }
        },
        error: (error) => {
          this.errorMessage.set(this.extractErrorMessage(error));
          this.menu.set(null);
        },
        complete: () => {
          this.loadingMenu.set(false);
          this.resolvingRestaurant.set(false);
        }
      });
  }

  createCategory(): void {
    if (this.categoryForm.invalid || !this.selectedRestaurantId()) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const displayOrder = this.nextCategoryDisplayOrder();
    this.categoryForm.patchValue({ displayOrder });
    const payload: CreateCategoryDto = this.categoryForm.getRawValue();
    this.submitting.set(true);
    this.errorMessage.set(null);

    this.menuService
      .createCategory(this.selectedRestaurantId(), payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.categoryForm.reset({ name: '', displayOrder: 0 });
          this.showingAddCategory.set(false);
          this.successMessage.set('Category created successfully.');
          this.loadMenu();
        },
        error: (error) => {
          this.submitting.set(false);
          this.errorMessage.set(this.extractErrorMessage(error));
          this.showingAddCategory.set(false);
        },
        complete: () => {
          this.submitting.set(false);
        }
      });
  }

  startEditCategory(category: CategoryDto): void {
    this.editingCategoryId.set(category.id);
    this.editCategoryForm.setValue({
      name: category.name,
      displayOrder: category.displayOrder
    });
  }

  cancelEditCategory(): void {
    this.editingCategoryId.set(null);
  }

  saveCategory(categoryId: string): void {
    if (this.editCategoryForm.invalid) {
      this.editCategoryForm.markAllAsTouched();
      return;
    }

    const payload: UpdateCategoryDto = this.editCategoryForm.getRawValue();
    this.submitting.set(true);
    this.errorMessage.set(null);

    this.menuService
      .updateCategory(categoryId, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.editingCategoryId.set(null);
          this.successMessage.set('Category updated successfully.');
          this.loadMenu();
        },
        error: (error) => {
          this.submitting.set(false);
          this.errorMessage.set(this.extractErrorMessage(error));
        },
        complete: () => {
          this.submitting.set(false);
        }
      });
  }

  removeCategory(categoryId: string): void {
    if (!confirm('Delete this category and all its products?')) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.menuService
      .deleteCategory(categoryId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set('Category deleted successfully.');
          this.loadMenu();
        },
        error: (error) => {
          this.submitting.set(false);
          this.errorMessage.set(this.extractErrorMessage(error));
        },
        complete: () => {
          this.submitting.set(false);
        }
      });
  }

  startAddProduct(categoryId: string): void {
    this.addingProductToCategoryId.set(categoryId);
    this.editingProductId.set(null);
    this.productForm.reset({
      name: '',
      description: '',
      price: 0
    });
  }

  cancelAddProduct(): void {
    this.addingProductToCategoryId.set(null);
  }

  createProduct(categoryId: string): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const payload: CreateProductDto = {
      ...this.productForm.getRawValue(),
      imageUrl: ''
    };
    this.submitting.set(true);
    this.errorMessage.set(null);

    this.menuService
      .createProduct(categoryId, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.addingProductToCategoryId.set(null);
          this.successMessage.set('Product created successfully.');
          this.loadMenu();
        },
        error: (error) => {
          this.submitting.set(false);
          this.errorMessage.set(this.extractErrorMessage(error));
        },
        complete: () => {
          this.submitting.set(false);
        }
      });
  }

  startEditProduct(product: ProductDto): void {
    this.editingProductId.set(product.id);
    this.addingProductToCategoryId.set(null);
    this.editProductForm.setValue({
      name: product.name,
      description: product.description,
      price: product.price,
      categoryId: product.categoryId
    });
  }

  cancelEditProduct(): void {
    this.editingProductId.set(null);
  }

  saveProduct(productId: string): void {
    if (this.editProductForm.invalid) {
      this.editProductForm.markAllAsTouched();
      return;
    }

    const existingProduct = this.findProductById(productId);
    const payload: UpdateProductDto = {
      ...this.editProductForm.getRawValue(),
      imageUrl: existingProduct?.imageUrl ?? ''
    };
    this.submitting.set(true);
    this.errorMessage.set(null);

    this.menuService
      .updateProduct(productId, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.editingProductId.set(null);
          this.successMessage.set('Product updated successfully.');
          this.loadMenu();
        },
        error: (error) => {
          this.submitting.set(false);
          this.errorMessage.set(this.extractErrorMessage(error));
        },
        complete: () => {
          this.submitting.set(false);
        }
      });
  }

  toggleStock(product: ProductDto): void {
    this.submitting.set(true);
    this.errorMessage.set(null);

    this.menuService
      .toggleProductStock(product.id, { isAvailable: !product.isAvailable })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set('Product availability updated.');
          this.loadMenu();
        },
        error: (error) => {
          this.submitting.set(false);
          this.errorMessage.set(this.extractErrorMessage(error));
        },
        complete: () => {
          this.submitting.set(false);
        }
      });
  }

  removeProduct(productId: string): void {
    if (!confirm('Delete this product?')) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.menuService
      .deleteProduct(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set('Product deleted successfully.');
          this.loadMenu();
        },
        error: (error) => {
          this.submitting.set(false);
          this.errorMessage.set(this.extractErrorMessage(error));
        },
        complete: () => {
          this.submitting.set(false);
        }
      });
  }

  clearBanner(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  openAddCategory(): void {
    this.categoryForm.reset({ name: '', displayOrder: 0 });
    this.showingAddCategory.set(true);
  }

  closeAddCategory(): void {
    this.showingAddCategory.set(false);
  }

  pickRestaurant(restaurant: RestaurantSummary): void {
    localStorage.setItem(this.RESTAURANT_ID_KEY, restaurant.id);
    localStorage.setItem(this.RESTAURANT_NAME_KEY, restaurant.name);
    this.selectedRestaurantId.set(restaurant.id);
    this.selectedRestaurantName.set(restaurant.name);
    this.showingRestaurantPicker.set(false);
    this.loadMenu();
  }

  closeRestaurantPicker(): void {
    this.showingRestaurantPicker.set(false);
    if (!this.selectedRestaurantId()) {
      this.errorMessage.set('No restaurant selected. Click "Switch Restaurant" to pick one.');
    }
  }

  switchRestaurant(): void {
    localStorage.removeItem(this.RESTAURANT_ID_KEY);
    localStorage.removeItem(this.RESTAURANT_NAME_KEY);
    this.selectedRestaurantId.set('');
    this.selectedRestaurantName.set('');
    this.menu.set(null);
    this.resetEditorState();
    this.resolveRestaurantContext();
  }

  private resetEditorState(): void {
    this.editingCategoryId.set(null);
    this.addingProductToCategoryId.set(null);
    this.editingProductId.set(null);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private nextCategoryDisplayOrder(): number {
    const currentMenu = this.menu();
    if (!currentMenu || currentMenu.categories.length === 0) {
      return 1;
    }

    const maxOrder = Math.max(...currentMenu.categories.map((category) => category.displayOrder));
    return maxOrder + 1;
  }

  private findProductById(productId: string): ProductDto | undefined {
    return this.sortedCategories()
      .flatMap(category => category.products)
      .find(product => product.id === productId);
  }

  private resolveRestaurantByName(restaurantName: string): void {
    this.menuService
      .getRestaurants()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (restaurants) => {
          if (restaurantName && restaurantName.trim().length > 0) {
            const normalizedOwnerRestaurantName = restaurantName.trim().toLowerCase();
            const byName = restaurants.find(
              (restaurant) => restaurant.name.trim().toLowerCase() === normalizedOwnerRestaurantName
            );

            if (byName) {
              this.selectedRestaurantId.set(byName.id);
              this.selectedRestaurantName.set(byName.name);
              localStorage.setItem(this.RESTAURANT_ID_KEY, byName.id);
              localStorage.setItem(this.RESTAURANT_NAME_KEY, byName.name);
              this.resolvingRestaurant.set(false);
              this.loadMenu();
              return;
            }
          }

          if (restaurants.length === 1) {
            this.selectedRestaurantId.set(restaurants[0].id);
            this.selectedRestaurantName.set(restaurants[0].name);
            localStorage.setItem(this.RESTAURANT_ID_KEY, restaurants[0].id);
            localStorage.setItem(this.RESTAURANT_NAME_KEY, restaurants[0].name);
            this.loadMenu();
            return;
          }

          this.restaurants.set(restaurants);
          this.resolvingRestaurant.set(false);
          this.showingRestaurantPicker.set(true);
        },
        error: (error) => {
          this.resolvingRestaurant.set(false);
          this.errorMessage.set(this.extractErrorMessage(error));
        }
      });
  }

  private extractRestaurantId(owner: OwnerInfo): string | null {
    if (owner.restaurantId && owner.restaurantId.trim().length > 0) {
      return owner.restaurantId;
    }

    return null;
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim().length > 0) {
        return error.error;
      }

      if (typeof error.error === 'object' && error.error !== null) {
        const maybeError = (error.error as { error?: string }).error;
        if (typeof maybeError === 'string' && maybeError.trim().length > 0) {
          return maybeError;
        }

        const maybeMessage = (error.error as { message?: string }).message;
        if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
          return maybeMessage;
        }
      }

      return `Request failed with status ${error.status}.`;
    }

    return 'Unexpected error occurred.';
  }
}
