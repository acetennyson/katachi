import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductRecommendations } from "@/components/product-recommendations"
import ProductPageClient from "./product-page-client"
import { getSupabaseServiceRole } from "@/lib/supabase"
import { Metadata } from "next"

// Keeping mock products as fallback for development
const mockProducts: Record<string, any> = {
  "1": {
    id: "1",
    name: "Modern Oak Lounge Chair",
    price: 3890,
    image: "/modern-oak-lounge-chair.png",
    badge: "Limited",
    materials: ["Oak Wood", "Premium Leather"],
    description:
      "A timeless lounge chair crafted from solid oak with premium leather upholstery. Perfect for creating a sophisticated seating area in your living space.",
    images: [
      "/modern-oak-lounge-chair.png",
      "/modern-oak-lounge-chair-side.png",
      "/modern-oak-lounge-chair-detail.png",
    ],
    dimensions: "W: 85cm × D: 90cm × H: 75cm",
    category: "Chairs",
    colors: [
      { name: "Natural Oak", value: "#D2B48C" },
      { name: "Dark Oak", value: "#6B4423" },
    ],
    inStock: true,
    specifications: [
      "Made from sustainably sourced solid oak",
      "Premium full-grain leather seating",
      "Ergonomic design for extended comfort",
      "Easy to maintain and clean",
      "Available in 2 wood finishes",
    ],
  },
  "2": {
    id: "2",
    name: "Minimalist Wooden Dining Table",
    price: 2450,
    image: "/minimalist-wooden-dining-table.png",
    category: "Tables",
    materials: ["Walnut Wood"],
    description: "A minimalist dining table in walnut wood, perfect for contemporary dining spaces.",
    images: ["/minimalist-wooden-dining-table.png", "/walnut-table.jpg"],
    dimensions: "W: 180cm × D: 90cm × H: 75cm",
    colors: [{ name: "Natural Walnut", value: "#654321" }],
    inStock: true,
    specifications: [
      "Solid walnut wood construction",
      "Minimalist design aesthetic",
      "Seats 6-8 people comfortably",
      "Easy assembly",
    ],
  },
  "3": {
    id: "3",
    name: "Minimalist Walnut Dining Table",
    price: 2850,
    image: "/minimalist-walnut-dining-table.png",
    badge: "New",
    category: "Tables",
    materials: ["Walnut Wood"],
    description: "Premium walnut dining table with a modern minimalist design.",
    images: ["/minimalist-walnut-dining-table.png", "/minimalist-walnut-dining-table-side-view.png"],
    dimensions: "W: 200cm × D: 100cm × H: 75cm",
    colors: [{ name: "Premium Walnut", value: "#3E2723" }],
    inStock: true,
    specifications: ["Premium walnut veneer", "Solid wood frame", "Extended length for larger gatherings"],
  },
  "4": {
    id: "4",
    name: "Verde Modular Chair",
    price: 4890,
    image: "/green-velvet-modular-chair.png",
    badge: "New",
    category: "Chairs",
    materials: ["Copper Frame", "Premium Velvet"],
    description: "A contemporary modular chair with copper frame and premium velvet upholstery.",
    images: ["/green-velvet-modular-chair.png"],
    dimensions: "W: 180cm × D: 90cm × H: 75cm",
    colors: [
      { name: "Forest Green", value: "#355E3B" },
      { name: "Sage Green", value: "#9CAF88" },
    ],
    inStock: true,
    specifications: ["Modular design", "Copper metal frame", "Premium velvet fabric", "Customizable configuration"],
  },
  "5": {
    id: "5",
    name: "Terracotta Cloud Chair",
    price: 5250,
    image: "/terracotta-cloud-chair.png",
    category: "Chairs",
    materials: ["Copper Frame", "Terracotta Velvet"],
    description: "An artistic chair featuring a copper frame and luxurious terracotta velvet.",
    images: ["/terracotta-cloud-chair.png"],
    dimensions: "W: 95cm × D: 85cm × H: 80cm",
    colors: [{ name: "Terracotta", value: "#E2725B" }],
    inStock: true,
    specifications: ["Artistic design", "Copper frame", "Premium terracotta velvet", "Limited edition"],
  },
  "6": {
    id: "6",
    name: "Sage Copper Lounge",
    price: 4675,
    image: "/sage-copper-lounge-chair.png",
    badge: "Limited",
    category: "Chairs",
    materials: ["Copper Frame", "Sage Velvet"],
    description: "An elegant lounge chair combining copper and sage velvet for a sophisticated aesthetic.",
    images: ["/sage-copper-lounge-chair.png"],
    dimensions: "W: 85cm × D: 90cm × H: 75cm",
    colors: [{ name: "Sage", value: "#9CAF88" }],
    inStock: true,
    specifications: ["Elegant design", "Copper frame", "Sage velvet upholstery", "Limited availability"],
  },
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params

  try {
    const supabase = await getSupabaseServiceRole()
    const { data, error } = await supabase
      .from("products")
      .select("id, name, description, price, image, images")
      .eq("id", id)
      .single()

    if (error || !data) {
      return {
        title: "Product | Katachi",
        description: "Discover quality products at Katachi",
      }
    }

    const productName = data.name || "Product"
    const description = data.description?.substring(0, 160) || "Quality product available at Katachi"
    const price = data.price ? `€${data.price}` : ""
    const imageUrl = data.image || (Array.isArray(data.images) && data.images[0]) || "/placeholder.svg"
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://katachi.example"
    const fullImageUrl = imageUrl.startsWith("http") ? imageUrl : `${baseUrl}${imageUrl}`

    return {
      title: `${productName} ${price ? `- ${price}` : ""} | Katachi`,
      description,
      openGraph: {
        title: productName,
        description,
        images: [
          {
            url: fullImageUrl,
            width: 1200,
            height: 630,
            alt: productName,
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: productName,
        description,
        images: [fullImageUrl],
      },
    }
  } catch (error) {
    console.error("Error generating product metadata:", error)
    return {
      title: "Product | Katachi",
      description: "Discover quality products at Katachi",
    }
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Try to fetch from database first
  let product = null
  try {
    const supabase = await getSupabaseServiceRole()
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (
          id,
          name,
          slug
        )
      `)
      .eq("id", id)
      .single()

    if (!error && data) {
      // Normalize the product data and handle empty arrays/objects
      product = {
        ...data,
        materials: Array.isArray(data.materials) && data.materials.length > 0 ? data.materials : [],
        images: Array.isArray(data.images) && data.images.length > 0 ? data.images : [data.image],
        colors: Array.isArray(data.colors) && data.colors.length > 0 ? data.colors : [],
        specifications: Array.isArray(data.specifications) && data.specifications.length > 0 ? data.specifications : [],
        inStock: data.in_stock !== undefined ? data.in_stock : true,
        // Use the category name from the joined categories table
        category: data.categories?.name || "Uncategorized",
        dimensions: data.dimensions || "",
        badge: data.badge || "",
        description: data.description || "",
      }
    }
  } catch (error) {
    console.error("Failed to fetch product:", error)
  }

  // Fallback to mock products if not found in database
  if (!product) {
    product = mockProducts[id]
  }

  if (!product) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-32 pb-20">
          <div className="container-custom text-center">
            <h1 className="text-4xl font-bold text-neutral-900 mb-4">Product Not Found</h1>
            <p className="text-neutral-600 mb-4">The product you're looking for doesn't exist or has been removed.</p>
            <a href="/catalog" className="text-neutral-600 hover:text-neutral-900 underline">
              Return to Catalog
            </a>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <Header />
      <ProductPageClient product={product} />
      <ProductRecommendations currentProductId={product.id} currentCategory={product.category} />
      <Footer />
    </main>
  )
}
