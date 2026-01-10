"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface MultiImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  label?: string
  maxImages?: number
}

export function MultiImageUpload({ value, onChange, label = "Upload Images", maxImages = 10 }: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Check if adding these files would exceed the max
    if (value.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`)
      return
    }

    // Validate all files first
    for (const file of files) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Invalid file type for ${file.name}. Only JPEG, PNG, WebP and GIF are allowed`)
        return
      }

      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is 5MB`)
        return
      }
    }

    setUploading(true)
    const uploadedUrls: string[] = []

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const file of files) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
        })

        const data = await response.json()

        if (data.success) {
          uploadedUrls.push(data.url)
        } else {
          toast.error(`Failed to upload ${file.name}: ${data.error}`)
        }
      }

      if (uploadedUrls.length > 0) {
        onChange([...value, ...uploadedUrls])
        toast.success(`${uploadedUrls.length} image(s) uploaded successfully!`)
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload images")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemove = (urlToRemove: string) => {
    onChange(value.filter(url => url !== urlToRemove))
    toast.success("Image removed")
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-neutral-700">{label}</label>
      
      <div className="space-y-4">
        {/* Uploaded Images Grid */}
        {value.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {value.map((url, index) => (
              <div key={index} className="relative group">
                <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-neutral-200 bg-white">
                  <Image
                    src={url}
                    alt={`Image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(url)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Area */}
        {value.length < maxImages && (
          <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-neutral-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 text-neutral-400 animate-spin" />
                <p className="text-sm text-neutral-600">Uploading images...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <ImageIcon className="h-10 w-10 text-neutral-400" />
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Choose Images
                  </Button>
                </div>
                <p className="text-xs text-neutral-500">
                  PNG, JPG, WebP or GIF (max 5MB each) • {value.length}/{maxImages} uploaded
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
