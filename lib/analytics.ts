/**
 * Analytics Tracking Utility
 * Handles all analytics event tracking throughout the application
 */

// Generate or retrieve session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  let sessionId = sessionStorage.getItem('analytics_session_id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('analytics_session_id', sessionId)
  }
  return sessionId
}

// Generate or retrieve device ID
function getDeviceId(): string {
  if (typeof window === 'undefined') return ''
  
  let deviceId = localStorage.getItem('analytics_device_id')
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('analytics_device_id', deviceId)
  }
  return deviceId
}

// Track an analytics event
export async function trackEvent(
  type: string,
  payload?: Record<string, any>
): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const sessionId = getSessionId()
    const deviceId = getDeviceId()

    await fetch('/api/analytics/collect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        payload: payload || {},
        sessionId,
        deviceId,
      }),
    })
  } catch (error) {
    // Silently fail - don't break the app if analytics fails
    console.error('[Analytics] Failed to track event:', error)
  }
}

// Track page view
export function trackPageView(page?: string, title?: string): void {
  trackEvent('page_view', {
    page: page || (typeof window !== 'undefined' ? window.location.pathname : '/'),
    title: title || (typeof document !== 'undefined' ? document.title : ''),
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    referrer: typeof document !== 'undefined' ? document.referrer : '',
  })
}

// Track product view
export function trackProductView(product: {
  product_id: string
  product_name: string
  category_id?: string
  price: number
}): void
export function trackProductView(productId: string, productName: string, price: number, category?: string): void
export function trackProductView(
  productOrId: { product_id: string; product_name: string; category_id?: string; price: number } | string,
  productName?: string,
  price?: number,
  category?: string
): void {
  if (typeof productOrId === 'string') {
    // Called with separate parameters
    trackEvent('product_view', {
      productId: productOrId,
      product_id: productOrId,
      productName: productName!,
      price: price!,
      category,
    })
  } else {
    // Called with object
    trackEvent('VIEW_PRODUCT', {
      product_id: productOrId.product_id,
      product_name: productOrId.product_name,
      category_id: productOrId.category_id,
      price: productOrId.price,
    })
  }
}

// Track product click
export function trackProductClick(productId: string, productName: string, position?: number): void {
  trackEvent('product_click', {
    productId,
    product_id: productId,
    productName,
    position,
  })
}

// Track add to cart
export function trackAddToCart(item: {
  product_id: string
  product_name: string
  quantity: number
  price: number
  cart_total?: number
}): void
export function trackAddToCart(productId: string, productName: string, price: number, quantity: number): void
export function trackAddToCart(
  itemOrId: { product_id: string; product_name: string; quantity: number; price: number; cart_total?: number } | string,
  productName?: string,
  price?: number,
  quantity?: number
): void {
  if (typeof itemOrId === 'string') {
    // Called with separate parameters
    trackEvent('add_to_cart', {
      productId: itemOrId,
      product_id: itemOrId,
      productName: productName!,
      price: price!,
      quantity: quantity!,
      value: price! * quantity!,
    })
  } else {
    // Called with object
    trackEvent('ADD_TO_CART', {
      product_id: itemOrId.product_id,
      product_name: itemOrId.product_name,
      quantity: itemOrId.quantity,
      price: itemOrId.price,
      cart_total: itemOrId.cart_total,
    })
  }
}

// Track remove from cart
export function trackRemoveFromCart(productId: string, productName: string): void {
  trackEvent('remove_from_cart', {
    product_id: productId,
    product_name: productName,
  })
}

// Track cart update
export function trackCartUpdate(productId: string, quantity: number): void {
  trackEvent('UPDATE_CART_QUANTITY', {
    product_id: productId,
    quantity,
  })
}

// Track checkout start
export function trackCheckoutStart(cartValue: number, itemsCount: number): void {
  trackEvent('checkout_start', {
    cart_value: cartValue,
    items_count: itemsCount,
  })
}

// Track checkout step
export function trackCheckoutStep(step: 'address' | 'payment' | 'review'): void {
  trackEvent('CHECKOUT_STEP', {
    step,
  })
}

// Track checkout complete
export function trackCheckoutComplete(order: {
  order_id: string
  total: number
  payment_method: string
  items_count: number
}): void {
  trackEvent('checkout_complete', {
    order_id: order.order_id,
    total: order.total,
    payment_method: order.payment_method,
    items_count: order.items_count,
  })
}

// Track checkout abandon
export function trackCheckoutAbandon(step: string, cartValue: number): void {
  trackEvent('checkout_abandon', {
    step,
    cart_value: cartValue,
  })
}

// Track purchase
export function trackPurchase(orderId: string, total: number, items: any[]): void {
  trackEvent('purchase', {
    orderId,
    order_id: orderId,
    total,
    items,
    itemCount: items.length,
  })
}

// Track search
export function trackSearch(query: string, resultsCount: number, filters?: Record<string, any>): void {
  trackEvent('SEARCH', {
    query,
    results_count: resultsCount,
    filters: filters || {},
  })
}

// Track search click
export function trackSearchClick(query: string, productId: string): void {
  trackEvent('SEARCH_CLICK', {
    query,
    product_id: productId,
  })
}

// Track user sign in
export function trackSignIn(userId: string): void {
  trackEvent('SIGN_IN', {
    user_id: userId,
  })
}

// Track user sign up
export function trackSignUp(userId: string): void {
  trackEvent('SIGN_UP', {
    user_id: userId,
  })
}

// Track user sign out
export function trackSignOut(): void {
  trackEvent('SIGN_OUT', {})
  // Clear session on sign out
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('analytics_session_id')
  }
}

// Track session start
export function trackSessionStart(): void {
  const sessionId = getSessionId()
  trackEvent('session_start', {
    session_id: sessionId,
    landing_page: typeof window !== 'undefined' ? window.location.pathname : '/',
    referrer: typeof document !== 'undefined' ? document.referrer : '',
  })
}

// Track session end
export function trackSessionEnd(): void {
  trackEvent('SESSION_END', {
    exit_page: window.location.pathname,
  })
}

// Note: Session and page view tracking is handled by AnalyticsProvider component
// to avoid running on server side

