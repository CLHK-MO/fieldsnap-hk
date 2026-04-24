import { useState, useEffect, useCallback, useRef } from 'react'
import supabase, {
  createPost, updatePost, fetchPosts, uploadImages, toggleLike,
  fetchComments, addComment, deleteComment,
  fetchAnnouncement, postAnnouncement, removeAnnouncement,
} from './supabase.js'

const USERS = [
  { id: 'rep1', name: 'Wanger Cheung', username: 'wanger',    password: 'wc21102121', color: '#FF6B35', initials: 'WC' },
  { id: 'rep2', name: 'Hazel Chan',    username: 'hazel',     password: 'hc21102121', color: '#00B4D8', initials: 'HC' },
  { id: 'rep3', name: 'Victor Choi',   username: 'victor',    password: 'vc21102121', color: '#06D6A0', initials: 'VC' },
  { id: 'rep4', name: 'Marketing',     username: 'marketing', password: 'HK21102121', color: '#FFB703', initials: 'MK' },
]

const SESSION_KEY = 'fieldsnap_user'
const SEEN_KEY = 'fieldsnap_seen'

function getSeenCounts() {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}') } catch { return {} }
}
function markSeen(postId, count) {
  const seen = getSeenCounts()
  seen[postId] = count
  localStorage.setItem(SEEN_KEY, JSON.stringify(seen))
}

function toLocalDateTimeString(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const labelStyle = {
  display: 'block', color: '#888', fontSize: 12,
  fontWeight: 600, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase',
}
const inputStyle = {
  width: '100%', background: '#131318', border: '1px solid #2a2a38',
  borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14,
  outline: 'none', fontFamily: "'DM Sans', sans-serif",
}
const primaryBtn = {
  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
  background: 'linear-gradient(135deg,#FF6B35,#FFB703)',
  color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif",
}

function Avatar({ user, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: user.color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.35, flexShrink: 0,
    }}>{user.initials}</div>
  )
}

function Lightbox({ urls, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex)
  const touchStartX = useRef(null)

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'ArrowRight') setCurrent(c => Math.min(c + 1, urls.length - 1))
      if (e.key === 'ArrowLeft') setCurrent(c => Math.max(c - 1, 0))
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [urls.length, onClose])

  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 50) setCurrent(c => Math.min(c + 1, urls.length - 1))
    if (diff < -50) setCurrent(c => Math.max(c - 1, 0))
    touchStartX.current = null
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <button onClick={onClose} style={{
        position: 'absolute', top: 20, right: 20,
        background: 'rgba(0,0,0,0.75)', border: '2px solid rgba(255,255,255,0.3)', color: '#fff',
        borderRadius: '50%', width: 44, height: 44, fontSize: 18, cursor: 'pointer', zIndex: 201,
        fontWeight: 700, boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
      }}>X</button>
      {current > 0 && (
        <button onClick={e => { e.stopPropagation(); setCurrent(c => c - 1) }} style={{
          position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(0,0,0,0.75)', border: '2px solid rgba(255,255,255,0.3)', color: '#fff',
          borderRadius: '50%', width: 44, height: 44, fontSize: 20, cursor: 'pointer', zIndex: 201,
          fontWeight: 700, boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}>&lt;</button>
      )}
      <img src={urls[current]} alt="" onClick={e => e.stopPropagation()} style={{
        maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain',
        borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      }} />
      {current < urls.length - 1 && (
        <button onClick={e => { e.stopPropagation(); setCurrent(c => c + 1) }} style={{
          position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(0,0,0,0.75)', border: '2px solid rgba(255,255,255,0.3)', color: '#fff',
          borderRadius: '50%', width: 44, height: 44, fontSize: 20, cursor: 'pointer', zIndex: 201,
          fontWeight: 700, boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}>&gt;</button>
      )}
      {urls.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 20,
          padding: '4px 14px', fontSize: 13,
        }}>{current + 1} / {urls.length}</div>
      )}
    </div>
  )
}

function CommentsSection({ post, currentUser, onCountChange }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchComments(post.id).then(data => {
      setComments(data)
      markSeen(post.id, data.length)
      if (onCountChange) onCountChange(data.length)
    }).finally(() => setLoading(false))
  }, [post.id])

  async function handleAdd() {
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const comment = await addComment({ postId: post.id, userId: currentUser.id, content: text.trim() })
      const updated = [...comments, comment]
      setComments(updated)
      markSeen(post.id, updated.length)
      if (onCountChange) onCountChange(updated.length)
      setText('')
    } catch (e) { console.error(e) }
    finally { setSubmitting(false) }
  }

  async function handleDelete(commentId) {
    try {
      await deleteComment(commentId)
      const updated = comments.filter(c => c.id !== commentId)
      setComments(updated)
      markSeen(post.id, updated.length)
      if (onCountChange) onCountChange(updated.length)
    } catch (e) { console.error(e) }
  }

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid #2a2a38', paddingTop: 12 }}>
      <div style={{ color: '#666', fontSize: 12, fontWeight: 600, marginBottom: 10, letterSpacing: 0.5 }}>
        COMMENTS {comments.length > 0 && `(${comments.length})`}
      </div>
      {loading
        ? <div style={{ color: '#444', fontSize: 13 }}>Loading...</div>
        : comments.length === 0
          ? <div style={{ color: '#444', fontSize: 13, marginBottom: 10 }}>No comments yet.</div>
          : comments.map(c => {
              const u = USERS.find(u => u.id === c.user_id)
              if (!u) return null
              const date = new Date(c.created_at)
              const timeStr = date.toLocaleDateString('en-HK', { day: 'numeric', month: 'short' }) + ' ' +
                date.toLocaleTimeString('en-HK', { hour: '2-digit', minute: '2-digit' })
              return (
                <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
                  <Avatar user={u} size={26} />
                  <div style={{ flex: 1, background: '#131318', borderRadius: 10, padding: '8px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ color: u.color, fontWeight: 600, fontSize: 12 }}>{u.name.split(' ')[0]}</span>
                      <span style={{ color: '#444', fontSize: 11 }}>{timeStr}</span>
                    </div>
                    <div style={{ color: '#ddd', fontSize: 13, lineHeight: 1.5 }}>{c.content}</div>
                  </div>
                  {(c.user_id === currentUser.id || currentUser.id === 'rep4') && (
                    <button onClick={() => handleDelete(c.id)} style={{
                      background: 'none', border: 'none', color: '#444',
                      cursor: 'pointer', fontSize: 12, padding: '4px', flexShrink: 0,
                    }}>X</button>
                  )}
                </div>
              )
            })
      }
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Avatar user={currentUser} size={28} />
        <div style={{ flex: 1, display: 'flex', gap: 6 }}>
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAdd()}
            placeholder="Add a comment..."
            style={{ ...inputStyle, padding: '8px 12px', fontSize: 13, background: '#131318', borderRadius: 10, flex: 1 }}
          />
          <button onClick={handleAdd} disabled={!text.trim() || submitting} style={{
            background: text.trim() ? currentUser.color : '#2a2a38',
            border: 'none', borderRadius: 10, color: '#fff',
            padding: '8px 14px', cursor: text.trim() ? 'pointer' : 'default',
            fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
          }}>{submitting ? '...' : 'Send'}</button>
        </div>
      </div>
    </div>
  )
}

function AnnouncementBanner({ announcement, currentUser, onRemove, onPost }) {
  const isMarketing = currentUser.id === 'rep4'
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  async function handlePost() {
    if (!text.trim()) return
    setSaving(true)
    try { await onPost(text.trim()); setText(''); setEditing(false) }
    finally { setSaving(false) }
  }

  if (!announcement && !isMarketing) return null

  return (
    <div style={{ margin: '12px 20px 0' }}>
      {announcement && (
        <div style={{
          background: 'linear-gradient(135deg, #FF6B3522, #FFB70322)',
          border: '1px solid #FF6B3544', borderRadius: 14, padding: '12px 16px',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>&#x1F4E3;</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#FFB703', fontWeight: 700, fontSize: 12, marginBottom: 4, letterSpacing: 0.5 }}>ANNOUNCEMENT</div>
            <div style={{ color: '#eee', fontSize: 14, lineHeight: 1.6 }}>{announcement.content}</div>
          </div>
          {isMarketing && (
            <button onClick={onRemove} style={{
              background: 'none', border: 'none', color: '#666',
              cursor: 'pointer', fontSize: 16, flexShrink: 0, padding: 2,
            }}>X</button>
          )}
        </div>
      )}
      {isMarketing && (
        <div style={{ marginTop: announcement ? 8 : 0 }}>
          {!editing
            ? <button onClick={() => { setEditing(true); setText(announcement?.content || '') }} style={{
                background: '#1a1a24', border: '1px dashed #2a2a38',
                borderRadius: 12, padding: '10px 16px', color: '#666',
                cursor: 'pointer', fontSize: 13, width: '100%', textAlign: 'left',
                fontFamily: "'DM Sans', sans-serif",
              }}>+ {announcement ? 'Update announcement' : 'Post an announcement...'}</button>
            : <div style={{ background: '#1a1a24', border: '1px solid #2a2a38', borderRadius: 14, padding: 14 }}>
                <textarea value={text} onChange={e => setText(e.target.value)}
                  placeholder="Type your announcement..." rows={3} autoFocus
                  style={{ ...inputStyle, resize: 'none', lineHeight: 1.5, marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handlePost} disabled={!text.trim() || saving} style={{
                    ...primaryBtn, width: 'auto', padding: '10px 20px', fontSize: 13,
                    background: text.trim() ? 'linear-gradient(135deg,#FF6B35,#FFB703)' : '#2a2a38',
                    color: text.trim() ? '#fff' : '#555',
                  }}>{saving ? 'Posting...' : 'Post'}</button>
                  <button onClick={() => setEditing(false)} style={{
                    background: '#2a2a38', border: 'none', color: '#888',
                    borderRadius: 10, padding: '10px 16px', cursor: 'pointer',
                    fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                  }}>Cancel</button>
                </div>
              </div>
          }
        </div>
      )}
    </div>
  )
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  function handleLogin() {
    const user = USERS.find(u => u.username === username.toLowerCase().trim() && u.password === password)
    if (user) { onLogin(user) }
    else { setError('Wrong username or password.'); setShake(true); setTimeout(() => setShake(false), 500) }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f14',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif", padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 380, animation: shake ? 'shake 0.4s ease' : 'fadeUp 0.5s ease both' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            background: 'linear-gradient(135deg,#FF6B35,#FFB703)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontSize: 28, fontWeight: 800, letterSpacing: -1,
          }}>FieldSnap HK</div>
          <div style={{ color: '#555', fontSize: 14, marginTop: 6 }}>Sales District Photo Board</div>
        </div>
        <div style={{
          background: '#1a1a24', borderRadius: 20, padding: '32px 28px',
          border: '1px solid #2a2a38', boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}>
          <label style={labelStyle}>Username</label>
          <input style={inputStyle} placeholder="e.g. wanger" value={username}
            onChange={e => { setUsername(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} autoCapitalize="none" />
          <label style={{ ...labelStyle, marginTop: 16 }}>Password</label>
          <input style={inputStyle} type="password" placeholder="Password" value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          {error && <p style={{ color: '#FF6B35', fontSize: 13, marginTop: 10 }}>{error}</p>}
          <button onClick={handleLogin} style={{ ...primaryBtn, marginTop: 24 }}>Sign In</button>
        </div>
        <p style={{ color: '#333', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
          Contact your manager if you need access.
        </p>
      </div>
    </div>
  )
}

function PostModal({ user, onClose, onSubmit, existingPost }) {
  const isEditing = !!existingPost
  const [district, setDistrict] = useState(isEditing ? existingPost.district : '')
  const [note, setNote] = useState(isEditing ? (existingPost.note || '') : '')
  const [images, setImages] = useState(
    isEditing
      ? (existingPost.image_urls || []).map((url, i) => ({ id: `existing_${i}`, dataUrl: url, isExisting: true }))
      : []
  )
  const [dragging, setDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState('')
  const [dateTime, setDateTime] = useState(
    isEditing ? toLocalDateTimeString(new Date(existingPost.display_time)) : toLocalDateTimeString(new Date())
  )

  function readFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = e => setImages(prev => [...prev, { id: Date.now() + Math.random(), dataUrl: e.target.result, isExisting: false }])
      reader.readAsDataURL(file)
    })
  }

  function handleDrop(e) { e.preventDefault(); setDragging(false); readFiles(e.dataTransfer.files) }
  function removeImage(id) { setImages(prev => prev.filter(img => img.id !== id)) }

  async function handleSubmit() {
    if (!images.length || !district) return
    setSubmitting(true)
    setProgress(isEditing ? 'Saving changes...' : 'Uploading photos...')
    try { await onSubmit({ images, district, note: note.trim(), dateTime }) }
    catch (e) { setProgress('Failed: ' + (e.message || 'Unknown error')); setSubmitting(false) }
  }

  const ready = images.length > 0 && district

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 100, fontFamily: "'DM Sans', sans-serif", animation: 'fadeIn 0.2s ease',
    }} onClick={e => e.target === e.currentTarget && !submitting && onClose()}>
      <div style={{
        background: '#1a1a24', borderRadius: '24px 24px 0 0',
        width: '100%', maxWidth: 520, padding: '28px 24px 36px',
        border: '1px solid #2a2a38', borderBottom: 'none',
        animation: 'slideUp 0.3s ease', maxHeight: '92vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{isEditing ? 'Edit Post' : 'New Post'}</span>
          <button onClick={onClose} disabled={submitting} style={{
            background: '#2a2a38', border: 'none', color: '#888',
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13,
          }}>Cancel</button>
        </div>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !submitting && document.getElementById('fileInput').click()}
          style={{
            border: `2px dashed ${dragging ? user.color : '#2a2a38'}`,
            borderRadius: 16, minHeight: 130,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: submitting ? 'default' : 'pointer', marginBottom: 10,
            background: dragging ? 'rgba(255,107,53,0.05)' : '#131318',
            transition: 'border-color 0.2s', padding: 14,
          }}
        >
          {images.length === 0
            ? <div style={{ textAlign: 'center', color: '#444' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>&#x1F4F8;</div>
                <div style={{ fontSize: 14 }}>Tap to choose photos</div>
                <div style={{ fontSize: 12, marginTop: 4, color: '#333' }}>Multiple photos supported</div>
              </div>
            : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, width: '100%' }}>
                {images.map(img => (
                  <div key={img.id} style={{ position: 'relative', width: 78, height: 78, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={img.dataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {!submitting && (
                      <button onClick={e => { e.stopPropagation(); removeImage(img.id) }} style={{
                        position: 'absolute', top: 3, right: 3,
                        background: 'rgba(0,0,0,0.75)', border: 'none', color: '#fff',
                        borderRadius: '50%', width: 20, height: 20, fontSize: 10,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>X</button>
                    )}
                  </div>
                ))}
                {!submitting && (
                  <div style={{
                    width: 78, height: 78, borderRadius: 10, border: '2px dashed #2a2a38',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#555', fontSize: 22, flexShrink: 0,
                  }}>+</div>
                )}
              </div>
          }
        </div>
        <input id="fileInput" type="file" accept="image/*" multiple style={{ display: 'none' }}
          onChange={e => readFiles(e.target.files)} />
        {images.length > 0 && !submitting && (
          <p style={{ color: '#555', fontSize: 12, marginBottom: 16 }}>
            {images.length} photo{images.length > 1 ? 's' : ''} - tap X to remove - tap above to add more
          </p>
        )}
        <label style={labelStyle}>Date &amp; Time</label>
        <input type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)}
          style={{ ...inputStyle, colorScheme: 'dark' }} />
        <p style={{ color: '#444', fontSize: 11, marginTop: 5, marginBottom: 16 }}>
          Auto-filled with now. Adjust if photos were taken at a different time.
        </p>
        <label style={labelStyle}>Location</label>
        <input style={inputStyle} placeholder="e.g. Mong Kok, Tsim Sha Tsui, Tuen Mun"
          value={district} onChange={e => setDistrict(e.target.value)} disabled={submitting} />
        <label style={{ ...labelStyle, marginTop: 16 }}>
          Note <span style={{ color: '#555', fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(optional)</span>
        </label>
        <textarea value={note} onChange={e => setNote(e.target.value)}
          placeholder="What's happening here?" rows={3} disabled={submitting}
          style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }} />
        {progress && (
          <div style={{
            marginTop: 14, padding: '10px 14px', borderRadius: 10,
            background: '#131318', border: '1px solid #2a2a38',
            color: '#FFB703', fontSize: 13, textAlign: 'center',
          }}>{progress}</div>
        )}
        <button onClick={handleSubmit} disabled={!ready || submitting} style={{
          ...primaryBtn,
          background: ready && !submitting ? `linear-gradient(135deg, ${user.color}, ${user.color}cc)` : '#2a2a38',
          color: ready && !submitting ? '#fff' : '#555', marginTop: 16,
        }}>
          {submitting
            ? (isEditing ? 'Saving...' : 'Uploading...')
            : (isEditing ? 'Save Changes' : `Share ${images.length > 1 ? images.length + ' Photos' : 'Photo'} with Team`)
          }
        </button>
      </div>
    </div>
  )
}

function PhotoCard({ photo, currentUser, onEdit, onLike, onGlobalUnreadChange }) {
  const uploader = USERS.find(u => u.id === photo.user_id)
  if (!uploader) return null

  const date = new Date(photo.display_time)
  const dateStr = date.toLocaleDateString('en-HK', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-HK', { hour: '2-digit', minute: '2-digit' })
  const urls = photo.image_urls || []
  const canEdit = photo.user_id === currentUser.id
  const isMyPost = photo.user_id === currentUser.id
  const likes = photo.likes || []
  const hasLiked = likes.includes(currentUser.id)

  const [lightbox, setLightbox] = useState(null)
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState(null)

  // Load comment count in background for ALL posts (so count shows on button)
  // For own posts this also powers the unread badge
  useEffect(() => {
    fetchComments(photo.id).then(data => {
      setCommentCount(data.length)
      // Only mark seen for own posts when comments are currently open
      // Don't auto-mark seen here — let the user open comments to mark seen
    })
  }, [photo.id])

  // Seen count: how many comments this user last acknowledged
  const seenCount = getSeenCounts()[photo.id] !== undefined ? getSeenCounts()[photo.id] : 0
  // Unread = my post + comments hidden + more comments than last seen
  const unreadCount = isMyPost && !showComments && commentCount !== null && commentCount > seenCount
    ? commentCount - seenCount
    : 0

  const likeNames = likes.map(id => {
    const u = USERS.find(u => u.id === id)
    return u ? u.name.split(' ')[0] : null
  }).filter(Boolean)

  return (
    <div style={{
      background: '#1a1a24', borderRadius: 20,
      border: '1px solid #2a2a38', overflow: 'hidden',
      animation: 'fadeUp 0.4s ease both',
    }}>
      {urls.length === 1
        ? <img src={urls[0]} alt="" onClick={() => setLightbox(0)}
            style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block', cursor: 'pointer' }} />
        : <div style={{ display: 'grid', gridTemplateColumns: urls.length === 2 ? '1fr 1fr' : '1fr 1fr 1fr', gap: 2 }}>
            {urls.slice(0, 6).map((url, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={url} alt="" onClick={() => setLightbox(i)}
                  style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block', cursor: 'pointer' }} />
                {i === 5 && urls.length > 6 && (
                  <div onClick={() => setLightbox(5)} style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 20, cursor: 'pointer',
                  }}>+{urls.length - 6}</div>
                )}
              </div>
            ))}
          </div>
      }

      <div style={{ padding: '16px 18px' }}>
        <div style={{
          display: 'inline-block', background: `${uploader.color}22`,
          color: uploader.color, borderRadius: 8, padding: '3px 10px',
          fontSize: 12, fontWeight: 600, marginBottom: 10,
        }}>{photo.district}</div>

        {photo.note && (
          <p style={{ color: '#ddd', fontSize: 14, lineHeight: 1.6, marginBottom: 14 }}>{photo.note}</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid #2a2a38', paddingTop: 12 }}>
          <Avatar user={uploader} size={32} />
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{uploader.name}</div>
            <div style={{ color: '#555', fontSize: 11 }}>{dateStr} - {timeStr}</div>
          </div>
          {urls.length > 1 && (
            <div style={{ color: '#555', fontSize: 12 }}>{urls.length} photos</div>
          )}

          {/* Comment button with unread badge */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowComments(s => !s)} style={{
              background: showComments ? '#2a3a4a' : '#2a2a38',
              border: showComments ? '1px solid #00B4D844' : '1px solid transparent',
              borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
              fontSize: 13, color: showComments ? '#00B4D8' : '#888',
              fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
            }}>
              &#x1F4AC;{commentCount !== null && commentCount > 0 ? ` ${commentCount}` : ''}
            </button>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6,
                background: '#FF6B35', borderRadius: '50%',
                minWidth: 18, height: 18, fontSize: 10, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, border: '2px solid #1a1a24', padding: '0 3px',
              }}>{unreadCount}</span>
            )}
          </div>

          {canEdit && (
            <button onClick={() => onEdit(photo)} style={{
              background: '#2a2a38', border: 'none', color: '#888',
              borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12,
              fontFamily: "'DM Sans', sans-serif",
            }}>Edit</button>
          )}

          <button onClick={() => onLike(photo)} style={{
            background: hasLiked ? '#FF6B3522' : '#2a2a38',
            border: hasLiked ? '1px solid #FF6B3566' : '1px solid transparent',
            borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
            fontSize: 15, color: hasLiked ? '#FF6B35' : '#666',
            fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
          }}>&#x2665;</button>
        </div>

        {likeNames.length > 0 && (
          <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
            <span style={{ color: '#FF6B35' }}>&#x2665;</span> Liked by <span style={{ color: '#aaa' }}>{likeNames.join(', ')}</span>
          </div>
        )}

        {showComments && (
          <CommentsSection
            post={photo}
            currentUser={currentUser}
            onCountChange={count => {
              setCommentCount(count)
              if (onGlobalUnreadChange) onGlobalUnreadChange()
            }}
          />
        )}
      </div>

      {lightbox !== null && <Lightbox urls={urls} startIndex={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try { const s = localStorage.getItem(SESSION_KEY); return s ? JSON.parse(s) : null }
    catch { return null }
  })
  const [photos, setPhotos] = useState([])
  const [showUpload, setShowUpload] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [feedLoading, setFeedLoading] = useState(false)
  const [error, setError] = useState('')
  const [announcement, setAnnouncement] = useState(null)
  const [globalUnread, setGlobalUnread] = useState(0)

  async function checkUnread(posts) {
    if (!currentUser) return
    const myPosts = posts.filter(p => p.user_id === currentUser.id)
    if (myPosts.length === 0) { setGlobalUnread(0); return }
    const seen = getSeenCounts()
    let total = 0
    await Promise.all(myPosts.map(async post => {
      try {
        const comments = await fetchComments(post.id)
        const seenCount = seen[post.id] !== undefined ? seen[post.id] : 0
        if (comments.length > seenCount) total += comments.length - seenCount
      } catch (e) {}
    }))
    setGlobalUnread(total)
  }

  const loadFeed = useCallback(async () => {
    if (!currentUser) return
    setFeedLoading(true)
    try {
      const [posts, ann] = await Promise.all([fetchPosts(), fetchAnnouncement()])
      setPhotos(posts)
      setAnnouncement(ann)
      checkUnread(posts)
    } catch (e) { setError('Could not load feed.') }
    finally { setFeedLoading(false) }
  }, [currentUser])

  useEffect(() => { loadFeed() }, [loadFeed])

  function handleLogin(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    setCurrentUser(user)
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY)
    setCurrentUser(null)
    setPhotos([])
    setFilter('all')
    setSearchQuery('')
  }

  async function handleNewPost({ images, district, note, dateTime }) {
    const postId = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    const newImages = images.filter(img => !img.isExisting)
    const imageUrls = await uploadImages(newImages.map(img => ({ dataUrl: img.dataUrl })), postId)
    const post = await createPost({ userId: currentUser.id, imageUrls, district, note, displayTime: dateTime })
    setPhotos(prev => [post, ...prev])
    setShowUpload(false)
  }

  async function handleEditPost({ images, district, note, dateTime }) {
    const post = editingPost
    const existingUrls = images.filter(img => img.isExisting).map(img => img.dataUrl)
    const newImages = images.filter(img => !img.isExisting)
    let newUrls = []
    if (newImages.length > 0) {
      newUrls = await uploadImages(newImages.map(img => ({ dataUrl: img.dataUrl })), `${post.id}_edit_${Date.now()}`)
    }
    const updated = await updatePost({ id: post.id, imageUrls: [...existingUrls, ...newUrls], district, note, displayTime: dateTime })
    setPhotos(prev => prev.map(p => p.id === updated.id ? updated : p))
    setEditingPost(null)
  }

  async function handleLike(photo) {
    try {
      const updated = await toggleLike(photo.id, currentUser.id, photo.likes)
      setPhotos(prev => prev.map(p => p.id === updated.id ? updated : p))
    } catch (e) { setError('Could not update like.') }
  }

  async function handlePostAnnouncement(content) {
    const ann = await postAnnouncement(content)
    setAnnouncement(ann)
  }

  async function handleRemoveAnnouncement() {
    await removeAnnouncement()
    setAnnouncement(null)
  }

  const displayed = photos
    .filter(p => filter === 'all' || p.user_id === filter)
    .filter(p => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (p.district && p.district.toLowerCase().includes(q)) || (p.note && p.note.toLowerCase().includes(q))
    })

  if (!currentUser) return (
    <>
      <LoginScreen onLogin={handleLogin} />
      <GlobalStyles />
    </>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f14', fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 }}>
      <div style={{
        background: '#1a1a24', borderBottom: '1px solid #2a2a38', padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{
          background: 'linear-gradient(135deg,#FF6B35,#FFB703)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          fontWeight: 800, fontSize: 18, letterSpacing: -0.5,
        }}>FieldSnap HK</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {globalUnread > 0 && (
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <button onClick={() => {
                const firstUnread = photos.find(p => {
                  if (p.user_id !== currentUser.id) return false
                  const seen = getSeenCounts()
                  return (seen[p.id] !== undefined ? seen[p.id] : 0) < fetchComments.length
                })
                document.getElementById('feed-top')?.scrollIntoView({ behavior: 'smooth' })
              }} style={{
                background: '#2a1a0f', border: '1px solid #FF6B3544', borderRadius: 8,
                padding: '6px 10px', cursor: 'pointer', fontSize: 14, color: '#FF6B35',
                fontFamily: "'DM Sans', sans-serif",
              }}>&#x1F514;</button>
              <span style={{
                position: 'absolute', top: -6, right: -6,
                background: '#FF6B35', borderRadius: '50%',
                minWidth: 18, height: 18, fontSize: 10, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, border: '2px solid #1a1a24', padding: '0 3px',
              }}>{globalUnread}</span>
            </div>
          )}
          <button onClick={loadFeed} disabled={feedLoading} style={{
            background: '#2a2a38', border: 'none', borderRadius: 8,
            padding: '6px 10px', cursor: 'pointer', fontSize: 13, color: '#888',
            fontFamily: "'DM Sans', sans-serif",
          }}>{feedLoading ? '...' : 'Refresh'}</button>
          <Avatar user={currentUser} size={34} />
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, lineHeight: 1 }}>{currentUser.name}</div>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#555', fontSize: 11, cursor: 'pointer', padding: 0, marginTop: 2 }}>Sign out</button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          margin: '12px 20px 0', padding: '10px 14px', borderRadius: 10,
          background: '#1e1216', border: '1px solid #3a1020', color: '#FF6B35', fontSize: 13,
        }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#FF6B35', cursor: 'pointer', float: 'right' }}>X</button>
        </div>
      )}

      <AnnouncementBanner
        announcement={announcement} currentUser={currentUser}
        onRemove={handleRemoveAnnouncement} onPost={handlePostAnnouncement}
      />

      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ position: 'relative' }}>
          <input
            style={{ ...inputStyle, paddingLeft: 40, background: '#1a1a24', border: searchQuery ? '1px solid #FF6B3566' : '1px solid #2a2a38' }}
            placeholder="Search location or note..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          />
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#555', pointerEvents: 'none' }}>&#x1F50D;</span>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: '#2a2a38', border: 'none', color: '#888', borderRadius: '50%',
              width: 20, height: 20, fontSize: 11, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>X</button>
          )}
        </div>
        {searchQuery && (
          <p style={{ color: '#555', fontSize: 12, marginTop: 8 }}>
            {displayed.length} result{displayed.length !== 1 ? 's' : ''} for "{searchQuery}"
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '12px 20px 8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[{ id: 'all', label: 'All Team' }, ...USERS.map(u => ({ id: u.id, label: u.name.split(' ')[0] }))].map(tab => {
          const u = USERS.find(u => u.id === tab.id)
          const active = filter === tab.id
          return (
            <button key={tab.id} onClick={() => setFilter(tab.id)} style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: 100,
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: active ? (u ? u.color : '#fff') : '#1a1a24',
              color: active ? (u ? '#fff' : '#0f0f14') : '#666',
              transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
            }}>{tab.label}</button>
          )
        })}
      </div>

      <div id="feed-top" style={{ padding: '12px 20px', display: 'grid', gap: 16 }}>
        {feedLoading && photos.length === 0
          ? <div style={{ textAlign: 'center', color: '#444', paddingTop: 60, fontSize: 14 }}>Loading feed...</div>
          : displayed.length === 0
            ? <div style={{ textAlign: 'center', color: '#333', paddingTop: 60, fontSize: 14, lineHeight: 2 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>&#x1F4EB;</div>
                {searchQuery ? `No results for "${searchQuery}"` : filter === 'all' ? 'No photos yet. Be the first to share!' : 'No posts from this rep yet.'}
              </div>
            : displayed.map(p => (
                <PhotoCard key={p.id} photo={p} currentUser={currentUser} onEdit={setEditingPost} onLike={handleLike} onGlobalUnreadChange={() => checkUnread(photos)} />
              ))
        }
      </div>

      <button onClick={() => setShowUpload(true)} style={{
        position: 'fixed', bottom: 28, right: 24,
        width: 58, height: 58, borderRadius: '50%', border: 'none',
        background: `linear-gradient(135deg, ${currentUser.color}, ${currentUser.color}bb)`,
        color: '#fff', fontSize: 26, cursor: 'pointer',
        boxShadow: `0 8px 24px ${currentUser.color}66`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
      }}>+</button>

      {showUpload && <PostModal user={currentUser} onClose={() => setShowUpload(false)} onSubmit={handleNewPost} />}
      {editingPost && <PostModal user={currentUser} onClose={() => setEditingPost(null)} onSubmit={handleEditPost} existingPost={editingPost} />}

      <GlobalStyles />
    </div>
  )
}

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
      @keyframes fadeUp   { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:none } }
      @keyframes shake    { 0%,100%{transform:none} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
      @keyframes slideUp  { from { transform:translateY(100%) } to { transform:none } }
      @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #0f0f14; }
      ::-webkit-scrollbar { display: none; }
      input::placeholder, textarea::placeholder { color: #444; }
      textarea { font-family: 'DM Sans', sans-serif; }
      input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(0.4); cursor: pointer; }
    `}</style>
  )
}
