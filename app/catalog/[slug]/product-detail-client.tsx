"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Reveal } from "@/components/reveal"
import { Button } from "@/components/ui/button"
import { Plus, Minus } from "lucide-react"

interface ProductDetailClientProps {
  product: any
  slug: string
}

export default function ProductDetailClient({ product, slug }: ProductDetailClientProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)

  const handleAddToCart = () => {
    console.log(`Added ${quantity} of ${product.name} to cart`)
  }

  return (
    <div className="pt-32 pb-20">
      <div className="container-custom">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Image Gallery */}
          <Reveal>
            <div className="flex flex-col gap-4">
              <div className="relative aspect-square bg-neutral-100 rounded-lg overflow-hidden">
                <Image
                  src={product.images[selectedImage] || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {product.images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index ? "border-neutral-900" : "border-neutral-200"
                    }`}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`View ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Product Info */}
          <Reveal delay={0.1}>
            <div className="flex flex-col">
              <div className="mb-6">
                <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">{product.name}</h1>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-yellow-500">★★★★★</span>
                  <span className="text-neutral-600">
                    {product.rating} ({product.reviews} reviews)
                  </span>
                </div>
                <p className="text-3xl font-bold text-neutral-900 mb-4">{product.price}</p>
                <p className="text-lg text-neutral-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Materials */}
              <div className="mb-6 pb-6 border-b border-neutral-200">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">MATERIALS</h3>
                <div className="flex flex-wrap gap-2">
                  {product.materials.map((material: string) => (
                    <span key={material} className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm">
                      {material}
                    </span>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="mb-6 pb-6 border-b border-neutral-200">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">COLORS</h3>
                <div className="flex gap-3">
                  {product.colors.map((color: any) => (
                    <button key={color.name} className="flex flex-col items-center gap-2" title={color.name}>
                      <div
                        className="w-8 h-8 rounded-full border-2 border-neutral-300 hover:border-neutral-900 transition-all"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-xs text-neutral-600">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Specs */}
              <div className="mb-8 pb-6 border-b border-neutral-200">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">SPECIFICATIONS</h3>
                <div className="space-y-2 text-sm text-neutral-600">
                  <p>
                    <span className="font-medium text-neutral-900">Dimensions:</span> {product.dimensions}
                  </p>
                  <p>
                    <span className="font-medium text-neutral-900">Weight:</span> {product.weight}
                  </p>
                  <p>
                    <span className="font-medium text-neutral-900">Stock:</span> {product.stock} in stock
                  </p>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-neutral-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-neutral-100 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                    className="w-12 text-center border-l border-r border-neutral-300 focus:outline-none"
                    min="1"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-neutral-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 bg-neutral-900 text-white hover:bg-neutral-800 py-6 text-lg"
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          </Reveal>
        </motion.div>
      </div>
    </div>
  )
}
