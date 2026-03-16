/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useRef, ChangeEvent, DragEvent } from 'react'
import { uploadAsset, deleteAsset } from '@/lib/actions/storage'
import { Button } from '@/components/ui/button'
import { Loader2, UploadCloud, X } from 'lucide-react'
import { toast } from 'sonner'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove: () => void
  folder?: string
  disabled?: boolean
}

export function ImageUpload({ value, onChange, onRemove, folder = 'misc', disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB.')
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const result = await uploadAsset(formData)

      if (!result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      if (result.data?.url) {
        // If there was a previous image, delete it from storage to avoid orphan files
        if (value) {
          await deleteAsset(value).catch(console.error)
        }
        
        onChange(result.data.url)
        toast.success('Image uploaded successfully.')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const onChangeInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }

  const handleRemove = async () => {
    if (value) {
      try {
        await deleteAsset(value)
        onRemove()
        toast.success('Image removed.')
      } catch {
        toast.error('Failed to remove image.')
      }
    }
  }

  if (value) {
    return (
      <div className="relative w-full aspect-video rounded-xl border border-dashed overflow-hidden bg-muted group">
        <img
          src={value}
          alt="Uploaded asset"
          className="object-cover w-full h-full transition-opacity group-hover:opacity-60"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={handleRemove}
            disabled={disabled || isUploading}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
      onDrop={handleDrop}
      className={`relative flex justify-center items-center w-full min-h-[160px] aspect-video rounded-xl border-2 border-dashed transition-all cursor-pointer bg-card ${
        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:bg-muted/50 hover:border-primary/50'
      } ${disabled || isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onChangeInput}
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      <div className="flex flex-col items-center gap-2 text-center text-muted-foreground p-6">
        {isUploading ? (
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        ) : (
          <>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-1">
              <UploadCloud className="w-6 h-6 text-primary" />
            </div>
            <p className="font-medium text-foreground">Click or Drag Image to Upload</p>
            <p className="text-xs">SVG, PNG, JPG or GIF (max. 5MB)</p>
          </>
        )}
      </div>
    </div>
  )
}
