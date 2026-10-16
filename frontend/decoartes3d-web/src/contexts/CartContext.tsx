import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ProductDetail, ProductSummary } from '../types/api'
import { readStorage, writeStorage } from '../utils/storage'

const STORAGE_KEY = 'decoartes3d.cart'
export const MAX_QUANTITY_PER_ITEM = 100

export interface CartItem {
  productId: number
  slug: string
  name: string
  price: number
  imageUrl: string | null
  stock: number
  quantity: number
}

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (product: ProductSummary | ProductDetail, quantity?: number) => void
  setQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clear: () => void
  quantityOf: (productId: number) => number
}

const CartContext = createContext<CartContextValue | null>(null)

const maxFor = (stock: number) => Math.min(stock, MAX_QUANTITY_PER_ITEM)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readStorage<CartItem[]>(STORAGE_KEY) ?? [])

  useEffect(() => writeStorage(STORAGE_KEY, items), [items])

  // Mantiene el carrito sincronizado entre pestañas abiertas.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setItems(readStorage<CartItem[]>(STORAGE_KEY) ?? [])
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const addItem = useCallback((product: ProductSummary | ProductDetail, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((i) => i.productId === product.id)
      const nextQuantity = Math.min((existing?.quantity ?? 0) + quantity, maxFor(product.stockQuantity))
      if (nextQuantity <= 0) return current

      const item: CartItem = {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        imageUrl: product.mainImageUrl,
        stock: product.stockQuantity,
        quantity: nextQuantity,
      }
      return existing ? current.map((i) => (i.productId === product.id ? item : i)) : [...current, item]
    })
  }, [])

  const setQuantity = useCallback((productId: number, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((i) => i.productId !== productId)
        : current.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(quantity, maxFor(i.stock)) } : i)),
    )
  }, [])

  const removeItem = useCallback((productId: number) => {
    setItems((current) => current.filter((i) => i.productId !== productId))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      addItem,
      setQuantity,
      removeItem,
      clear,
      quantityOf: (productId) => items.find((i) => i.productId === productId)?.quantity ?? 0,
    }),
    [items, addItem, setQuantity, removeItem, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart debe usarse dentro de <CartProvider>.')
  return context
}
