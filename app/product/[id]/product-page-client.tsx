"use client"

import { useState, useEffect } from "react"
import { Reveal } from "@/components/reveal"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/lib/cart-context"
import { ShoppingCart, Heart } from "lucide-react"
import settings from "@/lib/constants/settings"
import { trackProductView, trackAddToCart } from "@/lib/analytics"

interface ProductPageClientProps {
  product: any
}

export default function ProductPageClient({ product }: ProductPageClientProps) {
  const { addItem } = useCart()
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0]?.name || "")
  const [quantity, setQuantity] = useState(1)
  const [showAddedNotification, setShowAddedNotification] = useState(false)

  // Track product view on mount
  useEffect(() => {
    if (product?.id) {
      trackProductView(
        product.id,
        product.name,
        product.price,
        product.category || "furniture"
      )
    }
  }, [product?.id])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  
  // Ensure arrays exist with defaults
  const productImages = product.images && product.images.length > 0 ? product.images : [product.image || "/placeholder.svg"]
  const productMaterials = product.materials && product.materials.length > 0 ? product.materials : []
  const productColors = product.colors && product.colors.length > 0 ? product.colors : []
  const productSpecs = product.specifications && product.specifications.length > 0 ? product.specifications : []
  
  // Parse attributes - separate objects from arrays
  const productAttributes = product.attributes || {}
  const attributeObjects: { [key: string]: any } = {}
  const attributeArrays: { [key: string]: string[] } = {}
  
  Object.entries(productAttributes).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      attributeArrays[key] = value
    } else if (typeof value === 'object' && value !== null) {
      attributeObjects[key] = value
    }
  })

  // Track product view
  useEffect(() => {
    if (product?.id) {
      trackProductView({
        product_id: product.id,
        product_name: product.name,
        category_id: product.category_id || product.categories?.id,
        price: typeof product.price === 'number' ? product.price : parseFloat(String(product.price).replace(/[^0-9.]/g, '')) || 0,
      })
    }
  }, [product?.id])

  const handleAddToCart = () => {
    // Track add to cart event
    trackAddToCart(product.id, product.name, product.price, quantity)
    
    addItem({
      id: `${product.id}-${selectedColor}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.image,
      materials: product.materials,
      tax_percentage: product.tax_percentage ?? settings.defaults.taxPercentage,
      shipping_price: product.shipping_price ?? settings.defaults.shippingPrice,
    })
    setShowAddedNotification(true)
    setTimeout(() => setShowAddedNotification(false), 3000)
  }

  return (
    <div className="pt-32 pb-20">
      <div className="container-custom">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm text-neutral-600">
          <Link href="/catalog" className="hover:text-neutral-900">
            Catalog
          </Link>
          <span>/</span>
          <Link href={`/catalog?category=${product.category_id || product.categories?.id}`} className="hover:text-neutral-900">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-neutral-900">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <Reveal>
            <div className="space-y-4">
              <motion.div
                className="relative rounded-lg overflow-hidden bg-neutral-100"
                style={{ aspectRatio: "2/3" }}
                layout
              >
                <Image
                  src={productImages[selectedImageIndex] || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                {product.badge && (
                  <div className="absolute top-4 left-4 z-20">
                    <span className="px-3 py-1 text-xs font-medium rounded-full backdrop-blur-sm bg-amber-500/90 text-white">
                      {product.badge}
                    </span>
                  </div>
                )}
              </motion.div>

              {/* Thumbnail Grid */}
              <div className="grid grid-cols-4 gap-2">
                {productImages.map((img: string, idx: number) => (
                  <motion.button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === idx ? "border-neutral-900" : "border-neutral-200"
                    }`}
                    style={{ aspectRatio: "1/1" }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Image
                      src={img || "/placeholder.svg"}
                      alt={`${product.name} ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Product Details */}
          <Reveal delay={0.1}>
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold text-neutral-900 mb-4">{product.name}</h1>
                <p className="text-3xl font-bold text-neutral-900 mb-4">€{product.price.toLocaleString("de-DE")}</p>
                <p className="text-lg text-neutral-600 mb-6">{product.description}</p>

                {/* Tax and Shipping Info */}
                <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-neutral-600">
                      <span>Tax Rate:</span>
                      <span className="font-medium text-neutral-900">{(product.tax_percentage ?? settings.defaults.taxPercentage)}%</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>Shipping:</span>
                      {(product.shipping_price ?? settings.defaults.shippingPrice) > 0 ? (
                        <span className="font-medium text-neutral-900">{settings.display.currencySymbol}{(product.shipping_price ?? settings.defaults.shippingPrice).toLocaleString(settings.display.currencyLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      ) : (
                        <span className="font-semibold text-green-600">Free</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* In Stock Status */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-neutral-600">{product.inStock ? "In Stock" : "Out of Stock"}</span>
                </div>
              </div>

              {/* Color Selection */}
              {productColors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-4">Color</h3>
                  <div className="flex gap-3">
                    {productColors.map((color: any) => {
                      const colorValue = color.hex || color.value || color.name
                      return (
                        <motion.button
                          key={color.name}
                          onClick={() => setSelectedColor(color.name)}
                          className={`px-4 py-2 rounded-lg border-2 transition-all ${
                            selectedColor === color.name
                              ? "border-neutral-900 bg-neutral-900 text-white"
                              : "border-neutral-200 text-neutral-900 hover:border-neutral-900"
                          }`}
                          whileHover={{ scale: 1.05 }}
                          title={color.name}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: colorValue, borderColor: colorValue }}
                            ></div>
                            {color.name}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Selection */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-4">Quantity</h3>
                <div className="flex items-center border border-neutral-300 rounded-lg w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-neutral-100"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                    className="w-16 text-center border-l border-r border-neutral-300 focus:outline-none"
                    min="1"
                  />
                  <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2 hover:bg-neutral-100">
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="space-y-3">
                <motion.button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="w-full bg-neutral-900 text-white py-4 rounded-lg font-semibold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </motion.button>

                <button className="w-full border-2 border-neutral-900 text-neutral-900 py-4 rounded-lg font-semibold hover:bg-neutral-50 flex items-center justify-center gap-2">
                  <Heart className="w-5 h-5" />
                  Save for Later
                </button>
              </div>

              {/* Added Notification */}
              {showAddedNotification && (
                <motion.div
                  className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  Added to cart! Continue shopping or check your cart.
                </motion.div>
              )}

              {/* Specifications */}
              <div className="border-t border-neutral-200 pt-8">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Specifications</h3>
                <div className="space-y-3">
                  {product.dimensions && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Dimensions</span>
                      <span className="font-semibold text-neutral-900">{product.dimensions}</span>
                    </div>
                  )}
                  {productMaterials.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Materials</span>
                      <span className="font-semibold text-neutral-900">
                        {productMaterials.join(", ")}
                      </span>
                    </div>
                  )}
                  
                  {/* Dynamic Attributes - Objects as key:value rows */}
                  {Object.entries(attributeObjects).map(([sectionKey, sectionValue]) => (
                    <div key={sectionKey} className="space-y-2">
                      <p className="text-neutral-900 font-semibold capitalize pt-2">
                        {sectionKey.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      {Object.entries(sectionValue as object).map(([key, value]) => (
                        <div key={key} className="flex justify-between pl-4">
                          <span className="text-neutral-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="font-semibold text-neutral-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  
                  {productSpecs.length > 0 && (
                    <div className="pt-4 border-t border-neutral-200">
                      <p className="text-neutral-900 font-semibold mb-3">Features:</p>
                      <ul className="space-y-2">
                        {productSpecs.map((spec: string, idx: number) => (
                          <li key={idx} className="flex gap-2 text-neutral-600">
                            <span className="text-neutral-900">•</span> {spec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Dynamic Attributes - Arrays as bullet lists */}
                  {Object.entries(attributeArrays).map(([key, values]) => (
                    <div key={key} className="pt-4 border-t border-neutral-200">
                      <p className="text-neutral-900 font-semibold mb-3 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </p>
                      <ul className="space-y-2">
                        {values.map((item: string, idx: number) => (
                          <li key={idx} className="flex gap-2 text-neutral-600">
                            <span className="text-neutral-900">•</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Products Link */}
              <Link
                href={`/catalog?category=${product.category_id || product.categories?.id}`}
                className="text-neutral-600 hover:text-neutral-900 font-semibold flex items-center gap-2"
              >
                View More in {product.category}
                <span>→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
