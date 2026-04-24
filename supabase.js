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
    const { error } = await supabase.storage
      .from('photos')
      .upload(path, blob, { contentType: blob.type, upsert: true })
    if (error) throw new Error('Storage: ' + error.message)
    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)
    const mediaType = (img.isVideo || blob.type.startsWith('video/')) ? 'video' : 'image'
    urls.push({ url: urlData.publicUrl, type: mediaType })
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
    .insert([{ id, user_id: userId, image_urls: imageUrls, district, note, display_time: new Date(displayTime).toISOString(), likes: [] }])
    .select()
    .single()
  if (error) throw new Error('DB: ' + error.message)
  return data
}

export async function updatePost({ id, imageUrls, district, note, displayTime }) {
  const { data, error } = await supabase
    .from('posts')
    .update({ image_urls: imageUrls, district, note, display_time: new Date(displayTime).toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error('DB: ' + error.message)
  return data
}

export async function toggleLike(postId, userId, currentLikes) {
  const likes = currentLikes || []
  const newLikes = likes.includes(userId) ? likes.filter(id => id !== userId) : [...likes, userId]
  const { data, error } = await supabase
    .from('posts')
    .update({ likes: newLikes })
    .eq('id', postId)
    .select()
    .single()
  if (error) throw new Error('Like error: ' + error.message)
  return data
}

export async function fetchPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('display_time', { ascending: false })
  if (error) throw new Error('DB: ' + error.message)
  return data || []
}

export async function deletePost(postId) {
  await deleteImages(postId)
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) throw error
}

export async function fetchComments(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) throw new Error('Comments: ' + error.message)
  return data || []
}

export async function addComment({ postId, userId, content, postOwnerId, postDistrict }) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`
  const { data, error } = await supabase
    .from('comments')
    .insert([{ id, post_id: postId, user_id: userId, content }])
    .select()
    .single()
  if (error) throw new Error('Comment: ' + error.message)

  try {
    const { data: existingComments } = await supabase
      .from('comments')
      .select('user_id')
      .eq('post_id', postId)
      .neq('id', id)

    const notifyUserIds = new Set()
    if (postOwnerId && postOwnerId !== userId) notifyUserIds.add(postOwnerId)
    if (existingComments) {
      existingComments.forEach(c => { if (c.user_id !== userId) notifyUserIds.add(c.user_id) })
    }

    for (const notifyUserId of notifyUserIds) {
      const notifId = `${notifyUserId}_${postId}`
      await supabase.from('notifications').upsert({
        id: notifId,
        user_id: notifyUserId,
        post_id: postId,
        post_district: postDistrict || 'Unknown',
        post_owner_id: postOwnerId || '',
        last_comment_at: new Date().toISOString(),
        read: false,
      })
    }
  } catch (e) { console.error('Notification error:', e) }

  return data
}

export async function deleteComment(commentId) {
  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (error) throw error
}

export async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('last_comment_at', { ascending: false })
  if (error) throw new Error('Notifications: ' + error.message)
  return data || []
}

export async function markNotificationRead(notifId) {
  await supabase.from('notifications').update({ read: true }).eq('id', notifId)
}

export async function markAllNotificationsRead(userId) {
  await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
}

export async function fetchAnnouncement() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error('Announcement: ' + error.message)
  return data
}

export async function postAnnouncement(content) {
  await supabase.from('announcements').delete().neq('id', 'none')
  const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`
  const { data, error } = await supabase
    .from('announcements')
    .insert([{ id, content }])
    .select()
    .single()
  if (error) throw new Error('Announcement: ' + error.message)
  return data
}

export async function removeAnnouncement() {
  const { error } = await supabase.from('announcements').delete().neq('id', 'none')
  if (error) throw error
}
