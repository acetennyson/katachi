"use client"

import { motion } from "framer-motion"

interface FilterPanelProps {
  categories: string[]
  selectedCategory: string | null
  onCategoryChange: (category: string | null) => void
  sortBy: string
  onSortChange: (sort: string) => void
  priceRange: [number, number]
  onPriceRangeChange: (range: [number, number]) => void
}

export function FilterPanel({
  categories,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  priceRange,
  onPriceRangeChange,
}: FilterPanelProps) {
  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 mb-4 uppercase tracking-wide">Category</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category === "All" ? null : category)}
              className={`block w-full text-left px-3 py-2 rounded-lg transition-all text-sm ${
                (category === "All" && selectedCategory === null) || selectedCategory === category
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 mb-4 uppercase tracking-wide">Sort By</h3>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-900"
        >
          <option value="featured">Featured</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 mb-4 uppercase tracking-wide">Price Range</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-neutral-600 block mb-1">Min Price</label>
            <input
              type="number"
              value={priceRange[0]}
              onChange={(e) => onPriceRangeChange([Number(e.target.value), priceRange[1]])}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-900"
              placeholder="€0"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-600 block mb-1">Max Price</label>
            <input
              type="number"
              value={priceRange[1]}
              onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-900"
              placeholder="€10,000"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
