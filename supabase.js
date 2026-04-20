import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default supabase

// Upload images to Supabase Storage and return their public URLs
export async function uploadImages(images, postId) {
  const urls = []
  for (let i = 0; i < images.length; i++) {
    const img = images[i]
    // Convert base64 dataUrl to blob
    const res = await fetch(img.dataUrl)
    const blob = await res.blob()
    const ext = blob.type.split('/')[1] || 'jpg'
    const path = `${postId}/${i}.${ext}`
    const { error } = await supabase.storage
      .from('photos')
      .upload(path, blob, { contentType: blob.type, upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('photos').getPublicUrl(path)
    urls.push(data.publicUrl)
  }
  return urls
}

// Delete all images for a post
export async function deleteImages(postId) {
  const { data: files } = await supabase.storage
    .from('photos')
    .list(postId)
  if (files && files.length > 0) {
    const paths = files.map(f => `${postId}/${f.name}`)
    await supabase.storage.from('photos').remove(paths)
  }
}

// Create a new post
export async function createPost({ userId, imageUrls, district, note, displayTime }) {
  const { data, error } = await supabase
    .from('posts')
    .insert([{ user_id: userId, image_urls: imageUrls, district, note, display_time: new Date(displayTime).toISOString() }])
    .select()
    .single()
  if (error) throw error
  return data
}

// Update an existing post
export async function updatePost({ id, imageUrls, district, note, displayTime }) {
  const { data, error } = await supabase
    .from('posts')
    .update({ image_urls: imageUrls, district, note, display_time: new Date(displayTime).toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Fetch all posts sorted by recorded date newest first
export async function fetchPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('display_time', { ascending: false })
  if (error) throw error
  return data || []
}

// Delete a post and its images
export async function deletePost(postId) {
  await deleteImages(postId)
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) throw error
}
