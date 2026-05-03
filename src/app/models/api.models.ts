// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyTokenRequest {
  token: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface Address {
  id: string;
  title: string;
  street: string;
  city: string;
  district?: string;
  zipCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface CreateAddressRequest {
  title: string;
  street: string;
  city: string;
  district?: string;
  zipCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface FavoriteVendor {
  vendorId: string;
  name: string;
  logoUrl?: string;
  cuisineType?: string;
  rating?: number;
  addedAt?: string;
}

// ─── Vendors ─────────────────────────────────────────────────────────────────

export interface Vendor {
  id: string;
  name: string;
  description?: string;
  cuisineType?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  addressText?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviewCount?: number;
  minOrderAmount?: number;
  deliveryFee?: number;
  estimatedDeliveryMinutes?: number;
  isActive: boolean;
  status?: string;
  distanceKm?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVendorRequest {
  name: string;
  description?: string;
  cuisineType?: string;
  addressText?: string;
  latitude?: number;
  longitude?: number;
  minOrderAmount?: number;
  deliveryFee?: number;
}

export interface UpdateVendorRequest {
  name?: string;
  description?: string;
  cuisineType?: string;
  addressText?: string;
  latitude?: number;
  longitude?: number;
  logoUrl?: string;
  coverImageUrl?: string;
  minOrderAmount?: number;
  deliveryFee?: number;
  openingTime?: string;
  closingTime?: string;
}

export interface VendorStatusPatch {
  status: string;
}

export interface VendorMenu {
  vendorId: string;
  vendorName: string;
  categories: MenuCategory[];
}

export interface MenuCategory {
  id: string;
  name: string;
  displayOrder: number;
  products: MenuProduct[];
}

export interface MenuProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  categoryId: string;
}

export interface Review {
  id: string;
  userId: string;
  vendorId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  vendorId?: string;
  title: string;
  description?: string;
  discountType?: string;
  discountValue?: number;
  minOrderAmount?: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  displayOrder?: number;
}

export interface NearbyQuery {
  latitude: number;
  longitude: number;
  radiusKm?: number;
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl?: string;
}

export interface Cart {
  vendorId?: string;
  vendorName?: string;
  items: CartItem[];
  totalAmount: number;
  deliveryFee?: number;
}

export interface AddCartItemRequest {
  vendorId: string;
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CheckoutRequest {
  addressId?: string;
  paymentMethodId?: string;
  notes?: string;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface Order {
  id: string;
  status: string;
  vendorId?: string;
  vendorName?: string;
  totalAmount: number;
  deliveryFee?: number;
  items: OrderItem[];
  deliveryAddress?: Address;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface RefundRequest {
  reason?: string;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  provider?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  provider?: string;
  returnUrl?: string;
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface SearchQuery {
  q?: string;
  category?: string;
  page?: number;
  size?: number;
}

export interface SearchResult {
  vendors?: Vendor[];
  products?: MenuProduct[];
  totalCount?: number;
  page?: number;
  size?: number;
}

export interface DiscoveryResult {
  featured?: Vendor[];
  popular?: Vendor[];
  nearby?: Vendor[];
  campaigns?: Campaign[];
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  role?: string;
}

// ─── Generic wrappers ────────────────────────────────────────────────────────

export interface PagedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}
