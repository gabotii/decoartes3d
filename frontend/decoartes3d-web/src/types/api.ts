// Espejo de los DTOs de Decoartes3D.Application (JSON en camelCase, enums como string).

export type UserRole = 'Customer' | 'Admin'

export type OrderStatus = 'Pending' | 'Confirmed' | 'InProduction' | 'Shipped' | 'Delivered' | 'Cancelled'

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  errors?: Record<string, string[]>
}

// Auth

export interface AuthResponse {
  userId: number
  email: string
  firstName: string
  lastName: string
  role: UserRole
  token: string
  expiresAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string | null
}

// Catálogo

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  isActive: boolean
  sortOrder: number
  productCount: number
  createdAt: string
}

export interface CategoryWriteRequest {
  name: string
  description: string | null
  imageUrl: string | null
  isActive: boolean
  sortOrder: number
}

export interface Material {
  id: number
  name: string
  description: string | null
  colorHex: string | null
  isActive: boolean
  createdAt: string
}

export interface MaterialWriteRequest {
  name: string
  description: string | null
  colorHex: string | null
  isActive: boolean
}

export interface ProductSummary {
  id: number
  name: string
  slug: string
  shortDescription: string | null
  price: number
  stockQuantity: number
  mainImageUrl: string | null
  isActive: boolean
  isFeatured: boolean
  categoryName: string
  categoryId: number
  materialName: string | null
  createdAt: string
}

export interface ProductImage {
  id: number
  url: string
  altText: string | null
  sortOrder: number
}

export interface ProductDetail {
  id: number
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  price: number
  stockQuantity: number
  mainImageUrl: string | null
  width: number | null
  height: number | null
  depth: number | null
  weightGrams: number | null
  isActive: boolean
  isFeatured: boolean
  sortOrder: number
  categoryId: number
  categoryName: string
  materialId: number | null
  materialName: string | null
  materialColorHex: string | null
  images: ProductImage[]
  createdAt: string
  updatedAt: string
}

export interface ProductWriteRequest {
  name: string
  description: string | null
  shortDescription: string | null
  price: number
  stockQuantity: number
  mainImageUrl: string | null
  width: number | null
  height: number | null
  depth: number | null
  weightGrams: number | null
  isActive: boolean
  isFeatured: boolean
  sortOrder: number
  categoryId: number
  materialId: number | null
}

export interface ProductQuery {
  pageNumber?: number
  pageSize?: number
  categoryId?: number
  materialId?: number
  searchTerm?: string
  isActive?: boolean
  isFeatured?: boolean
}

// Pedidos

export interface OrderItem {
  id: number
  productId: number
  productName: string
  productImageUrl: string | null
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Order {
  id: number
  orderNumber: string
  status: OrderStatus
  total: number
  notes: string | null
  shippingFirstName: string
  shippingLastName: string
  shippingEmail: string
  shippingPhone: string | null
  shippingAddress: string
  shippingCity: string
  shippingState: string
  shippingPostalCode: string
  shippingCountry: string
  userId: number | null
  customerName: string | null
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface OrderSummary {
  id: number
  orderNumber: string
  status: OrderStatus
  total: number
  shippingEmail: string
  customerName: string
  itemCount: number
  createdAt: string
}

export interface ShippingDetails {
  shippingFirstName: string
  shippingLastName: string
  shippingEmail: string
  shippingPhone: string | null
  shippingAddress: string
  shippingCity: string
  shippingState: string
  shippingPostalCode: string
  shippingCountry: string
  notes: string | null
}

export interface CreateOrderRequest extends ShippingDetails {
  items: { productId: number; quantity: number }[]
}
