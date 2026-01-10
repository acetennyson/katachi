import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import ProductDetailClient from "./product-detail-client"

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const slug = (await params).slug

  // Mock product - replace with API call
  const product = {
    id: "1",
    name: "Modern Oak Lounge Chair",
    price: "€3,890",
    description:
      "A timeless lounge chair crafted from premium oak wood with leather upholstery. Perfect for creating a focal point in any modern living space.",
    rating: 4.8,
    reviews: 24,
    stock: 5,
    materials: ["Oak Wood", "Leather"],
    dimensions: "W: 85cm × D: 90cm × H: 75cm",
    weight: "28 kg",
    images: [
      "/modern-oak-lounge-chair.png",
      "/modern-oak-lounge-chair-side.png",
      "/modern-oak-lounge-chair-detail.png",
    ],
    colors: [
      { name: "Natural Oak", hex: "#D4A574" },
      { name: "Dark Oak", hex: "#6B4423" },
      { name: "Light Oak", hex: "#E8D4B8" },
    ],
  }

  return (
    <main className="min-h-screen">
      <Header />
      <ProductDetailClient product={product} slug={slug} />
      <Footer />
    </main>
  )
}
