'use server'

import type { ActionResult, getSessionWithProfile } from '@/lib/supabase/helpers';


import { v4 as uuidv4 } from 'uuid'


export async function uploadAsset(formData: FormData): Promise<ActionResult<{url: string}>> {
  try {
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'misc'
    
    if (!file) throw new Error('No file provided')
    
    // Ensure the file is an image for security (basic validation)
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed.')
    }

    // Size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB.')
    }

    const { supabase, profile } = await getSessionWithProfile()

    // Construct secure storage path: business_id/folder/uuid-filename
    // The UUID prevents cache collisions and overwriting identical filenames
    const fileExt = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `${profile.business_id}/${folder}/${fileName}`

    // Upload to Supabase Storage bucket 'tenant-assets'
    const { error: uploadError } = await supabase.storage
      .from('tenant-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite, we use unique names
      })

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

    // Retrieve the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('tenant-assets')
      .getPublicUrl(filePath)

    return { success: true, data: { url: publicUrl } }
  } catch (error) {
    Sentry.captureException(error);
    console.error('Asset upload error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown upload error' }
  }
}

export async function deleteAsset(url: string) {
  try {
    if (!url) return { success: false }

    const { supabase, profile } = await getSessionWithProfile()
    
    // Extract the relative path from the full public URL
    // Public URLs look like: https://[project].supabase.co/storage/v1/object/public/tenant-assets/[business_id]/[folder]/[filename]
    const baseUrl = supabase.storage.from('tenant-assets').getPublicUrl('').data.publicUrl
    
    if (!url.startsWith(baseUrl)) {
      return { success: false, error: 'Cannot delete external URLs' }
    }

    // Remove the base url + trailing slash to get the exact file path
    const filePath = url.replace(`${baseUrl}/`, '')
    
    // Defense in depth: Verify the user is deleting from their own tenant folder
    if (!filePath.startsWith(`${profile.business_id}/`)) {
      throw new Error('Unauthorized deletion attempt')
    }
    
    // Deletion requires authenticated session context, RLS ensures they only delete their own folder
    const { error } = await supabase.storage
      .from('tenant-assets')
      .remove([filePath])

    if (error) throw new Error(`Deletion failed: ${error.message}`)

    return { success: true }
  } catch (error) {
    Sentry.captureException(error);
    console.error('Asset deletion error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown deletion error' }
  }
}
