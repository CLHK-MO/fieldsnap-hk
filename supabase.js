import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default supabase

export async function uploadImages(images, postId) {
  const urls = []
  for (let i = 0; i < images.length; i++) {
    const img = images[i]
    const res = await fetch(img.dataUrl)
    const blob = await res.blob()
    const ext = blob.type.split('/')[1] || 'jpg'
    const path = `${postId}/${i}.${ext}`
    const { data, error } = await supabase.storage
      .from('photos')
      .upload(path, blob, { contentType: blob.type, upsert: true })
    if (error) {
      console.error('Storage upload error:', JSON.stringify(error))
      throw new Error('Storage: ' + error.message)
    }
    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)
    urls.push(urlData.publicUrl)
  }
  return urls
}

export async function deleteImages(postId) {
  const { data: files } = await supabase.storage.from('photos').list(postId)
  if (files && files.length > 0) {
    const paths = files.map(f => `${postId}/${f.name}`)
    await supabase.storage.from('photos').remove(paths)
  }
}

export async function createPost({ userId, imageUrls, district, note, displayTime }) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`
  const { data, error } = await supabase
    .from('posts')
    .insert([{ id, user_id: userId, image_urls: imageUrls, district, note, display_time: new Date(displayTime).toISOString() }])
    .select()
    .single()
  if (error) {
    console.error('Insert error:', JSON.stringify(error))
    throw new Error('DB: ' + error.message)
  }
  return data
}

export async function updatePost({ id, imageUrls, district, note, displayTime }) {
  const { data, error } = await supabase
    .from('posts')
    .update({ image_urls: imageUrls, district, note, display_time: new Date(displayTime).toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) {
    console.error('Update error:', JSON.stringify(error))
    throw new Error('DB: ' + error.message)
  }
  return data
}

export async function fetchPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('display_time', { ascending: false })
  if (error) {
    console.error('Fetch error:', JSON.stringify(error))
    throw new Error('DB: ' + error.message)
  }
  return data || []
}

export async function deletePost(postId) {
  await deleteImages(postId)
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) throw error
}
