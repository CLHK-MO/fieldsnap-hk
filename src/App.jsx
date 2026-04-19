import { useState, useEffect, useCallback } from 'react';
import {
  initGoogleDrive,
  authorizeGoogleDrive,
  isAuthorized,
  signOutGoogle,
  uploadPost,
  fetchPosts,
} from './drive.js';

// ── CONFIG ────────────────────────────────────────────────────────────────────
const USERS = [
  { id: 'rep1', name: 'Wanger Cheung', username: 'wanger',    password: 'wc21102121',  color: '#FF6B35', initials: 'WC' },
  { id: 'rep2', name: 'Hazel Chan',    username: 'hazel',     password: 'hc21102121',  color: '#00B4D8', initials: 'HC' },
  { id: 'rep3', name: 'Victor Choi',   username: 'victor',    password: 'vc21102121',  color: '#06D6A0', initials: 'VC' },
  { id: 'rep4', name: 'Marketing',     username: 'marketing', password: 'HK21102121',  color: '#FFB703', initials: 'MK' },
];

function toLocalDateTimeString(date) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const labelStyle = {
  display: 'block', color: '#888', fontSize: 12,
  fontWeight: 600, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase',
};
const inputStyle = {
  width: '100%', background: '#131318', border: '1px solid #2a2a38',
  borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14,
  outline: 'none', fontFamily: "'DM Sans', sans-serif",
};
const primaryBtn = {
  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
  background: 'linear-gradient(135deg,#FF6B35,#FFB703)',
  color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.3,
};

function Avatar({ user, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: user.color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.35, flexShrink: 0,
    }}>{user.initials}</div>
  );
}

function LoginScreen({ onLogin, driveReady }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [shake, setShake]       = useState(false);

  function handleLogin() {
    const user = USERS.find(
      u => u.username === username.toLowerCase().trim() && u.password === password
    );
    if (user) { onLogin(user); }
    else {
      setError('Wrong username or password.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
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
          }}>📍 FieldSnap HK</div>
          <div style={{ color: '#555', fontSize: 14, marginTop: 6 }}>Sales District Photo Board</div>
        </div>
        <div style={{
          background: '#1a1a24', borderRadius: 20, padding: '32px 28px',
          border: '1px solid #2a2a38', boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}>
          {!driveReady && (
            <div style={{
              background: '#1e1a12', border: '1px solid #3a3010', borderRadius: 10,
              padding: '10px 14px', marginBottom: 20, color: '#FFB703', fontSize: 13,
            }}>⏳ Connecting to Google Drive…</div>
          )}
          <label style={labelStyle}>Username</label>
          <input style={inputStyle} placeholder="e.g. wanger" value={username}
            onChange={e => { setUsername(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} autoCapitalize="none" />
          <label style={{ ...labelStyle, marginTop: 16 }}>Password</label>
          <input style={inputStyle} type="password" placeholder="••••••" value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          {error && <p style={{ color: '#FF6B35', fontSize: 13, marginTop: 10 }}>{error}</p>}
          <button onClick={handleLogin} style={{ ...primaryBtn, marginTop: 24 }}>Sign In →</button>
        </div>
        <p style={{ color: '#333', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
          Contact your manager if you need access.
        </p>
      </div>
    </div>
  );
}

function GoogleAuthPrompt({ onAuthorize, loading }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f14',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif", padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center', animation: 'fadeUp 0.5s ease both' }}>
        <div style={{ fontSize: 52, marginBottom: 20 }}>☁️</div>
        <div style={{
          background: 'linear-gradient(135deg,#FF6B35,#FFB703)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          fontSize: 24, fontWeight: 800, marginBottom: 10,
        }}>Connect Google Drive</div>
        <p style={{ color: '#666', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
          FieldSnap stores all photos in a shared Google Drive folder so your whole team sees the same feed in real time.
        </p>
        <button onClick={onAuthorize} disabled={loading} style={{
          ...primaryBtn, width: 'auto', padding: '14px 32px', opacity: loading ? 0.6 : 1,
        }}>
          {loading ? 'Connecting…' : 'Connect Google Drive'}
        </button>
        <p style={{ color: '#333', fontSize: 12, marginTop: 16 }}>
          You'll be asked to sign in to Google once.
        </p>
      </div>
    </div>
  );
}

function UploadModal({ user, onClose, onSubmit }) {
  const [district,   setDistrict]   = useState('');
  const [note,       setNote]       = useState('');
  const [images,     setImages]     = useState([]);
  const [dragging,   setDragging]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dateTime,   setDateTime]   = useState(toLocalDateTimeString(new Date()));
  const [progress,   setProgress]   = useState('');

  function readFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = e => {
        setImages(prev => [...prev, { id: Date.now() + Math.random(), dataUrl: e.target.result }]);
      };
      reader.readAsDataURL(file);
    });
  }

  function handleDrop(e) {
    e.preventDefault(); setDragging(false);
    readFiles(e.dataTransfer.files);
  }

  function removeImage(id) {
    setImages(prev => prev.filter(img => img.id !== id));
  }

  async function handleSubmit() {
    if (!images.length || !district) return;
    setSubmitting(true);
    setProgress('Uploading to Google Drive…');
    try {
      await onSubmit({ images, district, note: note.trim(), dateTime });
    } catch (e) {
      setProgress('Upload failed. Please try again.');
      setSubmitting(false);
    }
  }

  const ready = images.length > 0 && district;

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
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>New Post</span>
          <button onClick={onClose} disabled={submitting} style={{
            background: '#2a2a38', border: 'none', color: '#888',
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13,
          }}>Cancel</button>
        </div>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
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
                <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
                <div style={{ fontSize: 14 }}>Tap to choose photos</div>
                <div style={{ fontSize: 12, marginTop: 4, color: '#333' }}>Multiple photos supported · drag & drop</div>
              </div>
            : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, width: '100%' }}>
                {images.map(img => (
                  <div key={img.id} style={{ position: 'relative', width: 78, height: 78, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={img.dataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {!submitting && (
                      <button onClick={e => { e.stopPropagation(); removeImage(img.id); }} style={{
                        position: 'absolute', top: 3, right: 3,
                        background: 'rgba(0,0,0,0.75)', border: 'none', color: '#fff',
                        borderRadius: '50%', width: 20, height: 20, fontSize: 10,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>✕</button>
                    )}
                  </div>
                ))}
                {!submitting && (
                  <div style={{
                    width: 78, height: 78, borderRadius: 10, border: '2px dashed #2a2a38',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#555', fontSize: 22, flexShrink: 0,
                  }}>＋</div>
                )}
              </div>
          }
        </div>
        <input id="fileInput" type="file" accept="image/*" multiple style={{ display: 'none' }}
          onChange={e => readFiles(e.target.files)} />
        {images.length > 0 && !submitting && (
          <p style={{ color: '#555', fontSize: 12, marginBottom: 16 }}>
            {images.length} photo{images.length > 1 ? 's' : ''} selected · tap ✕ to remove · tap above to add more
          </p>
        )}
        <label style={labelStyle}>Date & Time</label>
        <input type="datetime-local" value={dateTime}
          onChange={e => setDateTime(e.target.value)}
          style={{ ...inputStyle, colorScheme: 'dark' }} />
        <p style={{ color: '#444', fontSize: 11, marginTop: 5, marginBottom: 16 }}>
          Auto-filled with now. Adjust if the photos were taken at a different time.
        </p>
        <label style={labelStyle}>Location</label>
        <input style={inputStyle} placeholder="e.g. Mong Kok, Tsim Sha Tsui, Tuen Mun…"
          value={district} onChange={e => setDistrict(e.target.value)} disabled={submitting} />
        <label style={{ ...labelStyle, marginTop: 16 }}>Note <span style={{ color: '#555', fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(optional)</span></label>
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
          {submitting ? 'Uploading…' : `Share ${images.length > 1 ? images.length + ' Photos' : 'Photo'} with Team →`}
        </button>
      </div>
    </div>
  );
}

function PhotoCard({ photo }) {
  const uploader = USERS.find(u => u.id === photo.userId);
  if (!uploader) return null;
  const date = new Date(photo.displayTime || photo.timestamp);
  const dateStr = date.toLocaleDateString('en-HK', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-HK', { hour: '2-digit', minute: '2-digit' });
  const imgs = photo.images || (photo.imgData ? [{ dataUrl: photo.imgData }] : []);

  return (
    <div style={{
      background: '#1a1a24', borderRadius: 20,
      border: '1px solid #2a2a38', overflow: 'hidden',
      animation: 'fadeUp 0.4s ease both',
    }}>
      {imgs.length === 1
        ? <img src={imgs[0].dataUrl} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
        : <div style={{ display: 'grid', gridTemplateColumns: imgs.length === 2 ? '1fr 1fr' : '1fr 1fr 1fr', gap: 2 }}>
            {imgs.slice(0, 6).map((img, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={img.dataUrl} alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
                {i === 5 && imgs.length > 6 && (
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 20,
                  }}>+{imgs.length - 6}</div>
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
        }}>📍 {photo.district}</div>
        {photo.note && <p style={{ color: '#ddd', fontSize: 14, lineHeight: 1.6, marginBottom: 14 }}>{photo.note}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid #2a2a38', paddingTop: 12 }}>
          <Avatar user={uploader} size={32} />
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{uploader.name}</div>
            <div style={{ color: '#555', fontSize: 11 }}>🕐 {dateStr} · {timeStr}</div>
          </div>
          {imgs.length > 1 && <div style={{ color: '#555', fontSize: 12 }}>📷 {imgs.length}</div>}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser,  setCurrentUser]  = useState(null);
  const [photos,       setPhotos]       = useState([]);
  const [showUpload,   setShowUpload]   = useState(false);
  const [filter,       setFilter]       = useState('all');
  const [driveReady,   setDriveReady]   = useState(false);
  const [driveAuthed,  setDriveAuthed]  = useState(false);
  const [authLoading,  setAuthLoading]  = useState(false);
  const [feedLoading,  setFeedLoading]  = useState(false);
  const [error,        setError]        = useState('');

  useEffect(() => {
    initGoogleDrive()
      .then(() => {
        setDriveReady(true);
        if (isAuthorized()) setDriveAuthed(true);
      })
      .catch(() => setError('Failed to load Google Drive. Check your API keys.'));
  }, []);

  const loadFeed = useCallback(async () => {
    if (!driveAuthed || !currentUser) return;
    setFeedLoading(true);
    try {
      const posts = await fetchPosts();
      setPhotos(posts);
    } catch {
      setError('Could not load posts. Try refreshing.');
    } finally {
      setFeedLoading(false);
    }
  }, [driveAuthed, currentUser]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  async function handleAuthorize() {
    setAuthLoading(true);
    try {
      await authorizeGoogleDrive();
      setDriveAuthed(true);
    } catch {
      setError('Google Drive authorization failed.');
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogin(user) { setCurrentUser(user); }

  function handleLogout() {
    setCurrentUser(null);
    setShowUpload(false);
    setFilter('all');
  }

  async function handleSubmit({ images, district, note, dateTime }) {
    const displayTime = dateTime ? new Date(dateTime).getTime() : Date.now();
    const post = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      userId: currentUser.id,
      images, district, note,
      timestamp: Date.now(),
      displayTime,
    };
    await uploadPost(post);
    setPhotos(prev => [post, ...prev]);
    setShowUpload(false);
  }

  const displayed = filter === 'all' ? photos : photos.filter(p => p.userId === filter);

  if (!currentUser) return (
    <>
      <LoginScreen onLogin={handleLogin} driveReady={driveReady} />
      <GlobalStyles />
    </>
  );

  if (!driveAuthed) return (
    <>
      <GoogleAuthPrompt onAuthorize={handleAuthorize} loading={authLoading} />
      <GlobalStyles />
    </>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f14', fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 }}>
      <div style={{
        background: '#1a1a24', borderBottom: '1px solid #2a2a38',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{
          background: 'linear-gradient(135deg,#FF6B35,#FFB703)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          fontWeight: 800, fontSize: 18, letterSpacing: -0.5,
        }}>📍 FieldSnap HK</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={loadFeed} disabled={feedLoading} style={{
            background: '#2a2a38', border: 'none', borderRadius: 8,
            padding: '6px 10px', cursor: 'pointer', fontSize: 14, color: '#888',
          }} title="Refresh feed">{feedLoading ? '⏳' : '🔄'}</button>
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
        }}>⚠️ {error} <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#FF6B35', cursor: 'pointer', float: 'right' }}>✕</button></div>
      )}

      <div style={{ display: 'flex', gap: 8, padding: '16px 20px 8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[{ id: 'all', label: 'All Team' }, ...USERS.map(u => ({ id: u.id, label: u.name.split(' ')[0] }))].map(tab => {
          const u = USERS.find(u => u.id === tab.id);
          const active = filter === tab.id;
          return (
            <button key={tab.id} onClick={() => setFilter(tab.id)} style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: 100,
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: active ? (u ? u.color : '#fff') : '#1a1a24',
              color: active ? (u ? '#fff' : '#0f0f14') : '#666',
              transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
            }}>{tab.label}</button>
          );
        })}
      </div>

      <div style={{ padding: '12px 20px', display: 'grid', gap: 16 }}>
        {feedLoading && photos.length === 0
          ? <div style={{ textAlign: 'center', color: '#444', paddingTop: 60 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <div style={{ fontSize: 14 }}>Loading feed from Google Drive…</div>
            </div>
          : displayed.length === 0
            ? <div style={{ textAlign: 'center', color: '#333', paddingTop: 60, fontSize: 14, lineHeight: 2 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                {filter === 'all' ? 'No photos yet. Be the first to share!' : 'No posts from this rep yet.'}
              </div>
            : displayed.map(p => <PhotoCard key={p.id} photo={p} />)
        }
      </div>

      <button onClick={() => setShowUpload(true)} style={{
        position: 'fixed', bottom: 28, right: 24,
        width: 58, height: 58, borderRadius: '50%', border: 'none',
        background: `linear-gradient(135deg, ${currentUser.color}, ${currentUser.color}bb)`,
        color: '#fff', fontSize: 26, cursor: 'pointer',
        boxShadow: `0 8px 24px ${currentUser.color}66`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50,
      }}>＋</button>

      {showUpload && (
        <UploadModal user={currentUser} onClose={() => setShowUpload(false)} onSubmit={handleSubmit} />
      )}

      <GlobalStyles />
    </div>
  );
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
  );
}
