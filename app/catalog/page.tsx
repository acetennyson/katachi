"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FilterPanel } from "@/components/filter-panel"
import { ProductCard } from "@/components/product-card"
import { motion } from "framer-motion"
import { Reveal } from "@/components/reveal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Search, X, SlidersHorizontal } from "lucide-react"
import { trackSearch, trackProductClick, trackPageView } from "@/lib/analytics"

// Mock products removed - now fetching from database
const mockProducts_OLD = [
  {
    id: "1",
    name: "Modern Oak Lounge Chair",
    price: "€3,890",
    numericPrice: 3890,
    image: "/modern-oak-lounge-chair.png",
    badge: "Limited" as const,
    category: "Chairs",
    materials: ["Oak Wood", "Leather"],
  },
  {
    id: "2",
    name: "Minimalist Wooden Dining Table",
    price: "€2,450",
    numericPrice: 2450,
    image: "/minimalist-wooden-dining-table.png",
    category: "Tables",
    materials: ["Walnut Wood"],
  },
  {
    id: "3",
    name: "Minimalist Walnut Dining Table",
    price: "€2,850",
    numericPrice: 2850,
    image: "/minimalist-walnut-dining-table.png",
    badge: "New" as const,
    category: "Tables",
    materials: ["Walnut Wood"],
  },
  {
    id: "4",
    name: "Verde Modular Chair",
    price: "€4,890",
    numericPrice: 4890,
    image: "/green-velvet-modular-chair.png",
    category: "Chairs",
    materials: ["Copper Frame", "Premium Velvet"],
  },
  {
    id: "5",
    name: "Terracotta Cloud Chair",
    price: "€5,250",
    numericPrice: 5250,
    image: "/terracotta-cloud-chair.png",
    category: "Chairs",
    materials: ["Copper Frame", "Terracotta Velvet"],
  },
  {
    id: "6",
    name: "Sage Copper Lounge",
    price: "€4,675",
    numericPrice: 4675,
    image: "/sage-copper-lounge-chair.png",
    badge: "Limited" as const,
    category: "Chairs",
    materials: ["Copper Frame", "Sage Velvet"],
  },
]

export default function CatalogPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const categoryId = searchParams.get("category")
  const searchQuery = searchParams.get("search")
  const sortOrder = searchParams.get("sort") || "newest"

  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryId)
  const [searchTerm, setSearchTerm] = useState(searchQuery || "")
  const [sortBy, setSortBy] = useState(sortOrder)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])

  // Track page view on mount
  useEffect(() => {
    trackPageView("/catalog")
  }, [])
  const [currentCategoryName, setCurrentCategoryName] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (categoryId && categories.length > 0) {
      const cat = categories.find(c => c.id === categoryId)
      setCurrentCategoryName(cat?.name || "")
    }
  }, [categoryId, categories])

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories")
      ])
      
      const productsData = await productsRes.json()
      const categoriesData = await categoriesRes.json()
      
      if (productsData.success) {
        setProducts(productsData.products || [])
      }
      if (categoriesData.success) {
        setCategories(categoriesData.categories || [])
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateURL = (params: { category?: string | null, search?: string, sort?: string }) => {
    const newParams = new URLSearchParams()
    if (params.category) newParams.set("category", params.category)
    if (params.search) newParams.set("search", params.search)
    if (params.sort && params.sort !== "newest") newParams.set("sort", params.sort)
    
    const newURL = newParams.toString() ? `/catalog?${newParams.toString()}` : "/catalog"
    router.push(newURL, { scroll: false })
  }

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category)
    updateURL({ category, search: searchTerm, sort: sortBy })
  }

  const handleSearchChange = (search: string) => {
    setSearchTerm(search)
    updateURL({ category: selectedCategory, search, sort: sortBy })
    
    // Track search when user types (debounced)
    if (search && search.length > 2) {
      setTimeout(() => {
        const filtered = products.filter((p) => {
          const term = search.toLowerCase()
          return p.name?.toLowerCase().includes(term) || 
                 p.description?.toLowerCase().includes(term) ||
                 p.materials?.some((m: string) => m.toLowerCase().includes(term))
        })
        trackSearch(search, filtered.length, { category: selectedCategory, sort: sortBy })
      }, 500)
    }
  }

  const handleSortChange = (sort: string) => {
    setSortBy(sort)
    updateURL({ category: selectedCategory, search: searchTerm, sort })
  }

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products]
    
    // Filter by category
    if (selectedCategory) {
      result = result.filter(p => p.category_id === selectedCategory)
    }
    
    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.type?.toLowerCase().includes(term)
      )
    }
    
    // Filter by price range
    result = result.filter(p => {
      const price = parseFloat(p.price)
      return price >= priceRange[0] && price <= priceRange[1]
    })
    
    // Filter only active and in-stock products
    result = result.filter(p => p.status === "ACTIVE" && p.in_stock !== false)
    
    // Sort
    result.sort((a, b) => {
      if (sortBy === "price-low") return parseFloat(a.price) - parseFloat(b.price)
      if (sortBy === "price-high") return parseFloat(b.price) - parseFloat(a.price)
      if (sortBy === "name-asc") return a.name.localeCompare(b.name)
      if (sortBy === "name-desc") return b.name.localeCompare(a.name)
      if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      // Default: newest
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    
    return result
  }, [products, selectedCategory, searchTerm, sortBy, priceRange])

  return (
    <main className="min-h-screen">
      <Header />
      <div className="pt-32 pb-20">
        <div className="container-custom">
          <Reveal>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-neutral-900">
              {currentCategoryName || "Catalog"}
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl mb-4">
              {currentCategoryName 
                ? `Browse our ${currentCategoryName.toLowerCase()} collection` 
                : "Explore our curated collection of timeless furniture pieces"}
            </p>
          </Reveal>

          {/* Search and Sort Bar */}
          <Reveal delay={0.1}>
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => handleSearchChange("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-neutral-400 hover:text-neutral-900" />
                  </button>
                )}
              </div>
              
              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px]">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterPanel
                      categories={["All", ...categories.map(c => c.name)]}
                      selectedCategory={currentCategoryName || (selectedCategory ? "" : "All")}
                      onCategoryChange={(cat) => {
                        if (cat === "All") {
                          handleCategoryChange(null)
                        } else {
                          const category = categories.find(c => c.name === cat)
                          handleCategoryChange(category?.id || null)
                        }
                      }}
                      sortBy={sortBy}
                      onSortChange={handleSortChange}
                      priceRange={priceRange}
                      onPriceRangeChange={setPriceRange}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-4 py-2 border border-neutral-300 rounded-md text-sm font-medium text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer hidden md:block"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Filters - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-32">
                <FilterPanel
                  categories={["All", ...categories.map(c => c.name)]}
                  selectedCategory={currentCategoryName || (selectedCategory ? "" : "All")}
                  onCategoryChange={(cat) => {
                    if (cat === "All") {
                      handleCategoryChange(null)
                    } else {
                      const category = categories.find(c => c.name === cat)
                      handleCategoryChange(category?.id || null)
                    }
                  }}
                  sortBy={sortBy}
                  onSortChange={handleSortChange}
                  priceRange={priceRange}
                  onPriceRangeChange={setPriceRange}
                />
              </div>
            </div>

            {/* Products Grid */}
            <div className="lg:col-span-3">
              {filteredAndSortedProducts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-lg text-neutral-600 mb-6">No products found matching your criteria.</p>
                  <button
                    onClick={() => {
                      setSelectedCategory(null)
                      setSortBy("featured")
                      setPriceRange([0, 10000])
                    }}
                    className="text-neutral-900 font-semibold hover:underline"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
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
                  {filteredAndSortedProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          transition: { duration: 0.6 },
                        },
                      }}
                      onClick={() => trackProductClick(product.id, product.name, index)}
                    >
                      <Reveal delay={index * 0.05}>
                        <ProductCard product={product} />
                      </Reveal>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Results Count */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
                  <p className="text-neutral-600">Loading products...</p>
                </div>
              ) : filteredAndSortedProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-600 text-lg mb-4">No products found</p>
                  {(selectedCategory || searchTerm) && (
                    <Button onClick={() => {
                      handleCategoryChange(null)
                      handleSearchChange("")
                    }}>
                      Clear All Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="mt-8 text-center">
                  <p className="text-neutral-600">
                    Showing {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? "product" : "products"}
                  </p>
                  {(selectedCategory || searchTerm) && (
                    <div className="flex justify-center gap-2 mt-4">
                      {selectedCategory && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleCategoryChange(null)}
                          className="gap-2"
                        >
                          Clear: {currentCategoryName}
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                      {searchTerm && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSearchChange("")}
                          className="gap-2"
                        >
                          Clear: "{searchTerm}"
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
