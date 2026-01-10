"use client"

import { motion } from "framer-motion"
import { ProductCard } from "./product-card"
import { Reveal } from "./reveal"

const allProducts = [
  {
    id: "1",
    name: "Modern Oak Lounge Chair",
    price: "€3,890",
    image: "/modern-oak-lounge-chair.png",
    badge: "Limited" as const,
    category: "Chairs",
    materials: ["Oak Wood", "Leather"],
  },
  {
    id: "2",
    name: "Minimalist Wooden Dining Table",
    price: "€2,450",
    image: "/minimalist-wooden-dining-table.png",
    category: "Tables",
    materials: ["Walnut Wood"],
  },
  {
    id: "3",
    name: "Minimalist Walnut Dining Table",
    price: "€2,850",
    image: "/minimalist-walnut-dining-table.png",
    badge: "New" as const,
    category: "Tables",
    materials: ["Walnut Wood"],
  },
  {
    id: "4",
    name: "Verde Modular Chair",
    price: "€4,890",
    image: "/green-velvet-modular-chair.png",
    category: "Chairs",
    materials: ["Copper Frame", "Premium Velvet"],
  },
  {
    id: "5",
    name: "Terracotta Cloud Chair",
    price: "€5,250",
    image: "/terracotta-cloud-chair.png",
    category: "Chairs",
    materials: ["Copper Frame", "Terracotta Velvet"],
  },
  {
    id: "6",
    name: "Sage Copper Lounge",
    price: "€4,675",
    image: "/sage-copper-lounge-chair.png",
    badge: "Limited" as const,
    category: "Chairs",
    materials: ["Copper Frame", "Sage Velvet"],
  },
]

interface ProductRecommendationsProps {
  currentProductId: string
  currentCategory: string
}

export function ProductRecommendations({ currentProductId, currentCategory }: ProductRecommendationsProps) {
  // Get recommendations: other products in same category
  const recommendations = allProducts
    .filter((p) => p.id !== currentProductId && p.category === currentCategory)
    .slice(0, 3)

  if (recommendations.length === 0) {
    return null
  }

  return (
    <section className="py-20 lg:py-32 border-t border-neutral-200">
      <div className="container-custom">
        <Reveal>
          <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-12">You Might Also Like</h2>
        </Reveal>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 },
            },
          }}
        >
          {recommendations.map((product, index) => (
            <motion.div
              key={product.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
              }}
            >
              <Reveal delay={index * 0.05}>
                <ProductCard product={product} />
              </Reveal>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
