// Google Drive API helpers

const FOLDER_NAME = 'FieldSnap HK';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const TOKEN_KEY = 'fieldsnap_gtoken';

let gapiInited = false;
let gisInited = false;
let tokenClient = null;
let folderId = null;

function loadScript(src) {
  return new Promise((resolve) => {
    if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    document.head.appendChild(s);
  });
}

function saveToken(token) {
  const expiry = Date.now() + (token.expires_in - 60) * 1000;
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ ...token, expiry }));
}

function loadToken() {
  try {
    const t = JSON.parse(localStorage.getItem(TOKEN_KEY));
    if (t && t.expiry > Date.now()) return t;
  } catch (e) {}
  return null;
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function initGoogleDrive() {
  await loadScript('https://apis.google.com/js/api.js');
  await loadScript('https://accounts.google.com/gsi/client');

  await new Promise((resolve) => window.gapi.load('client', resolve));
  await window.gapi.client.init({
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    scope: SCOPES,
    callback: () => {},
  });
  gisInited = true;

  // Restore saved token if still valid
  const saved = loadToken();
  if (saved) {
    window.gapi.client.setToken(saved);
    return true;
  }
  return false;
}

export function isAuthorized() {
  const token = window.gapi?.client?.getToken();
  if (!token) return false;
  const saved = loadToken();
  return !!saved;
}

export function authorizeGoogleDrive() {
  return new Promise((resolve, reject) => {
    if (!gapiInited || !gisInited) { reject(new Error('Google APIs not loaded')); return; }
    tokenClient.callback = (resp) => {
      if (resp.error) { reject(resp); return; }
      saveToken(resp);
      window.gapi.client.setToken(resp);
      resolve(resp);
    };
    // Use prompt: '' to silently reauth if already granted, 'consent' for first time
    const saved = loadToken();
    tokenClient.requestAccessToken({ prompt: saved ? '' : 'consent' });
  });
}

// Call this on app load to silently refresh token if needed
export async function silentRefresh() {
  if (!gapiInited || !gisInited) return false;
  const saved = loadToken();
  if (saved) {
    window.gapi.client.setToken(saved);
    return true;
  }
  // Try silent reauth (no popup)
  return new Promise((resolve) => {
    tokenClient.callback = (resp) => {
      if (resp.error) { resolve(false); return; }
      saveToken(resp);
      window.gapi.client.setToken(resp);
      resolve(true);
    };
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

export function signOutGoogle() {
  const token = window.gapi.client.getToken();
  if (token) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken('');
  }
  clearToken();
  folderId = null;
}

async function getOrCreateFolder() {
  if (folderId) return folderId;

  const res = await window.gapi.client.drive.files.list({
    q: "name='" + FOLDER_NAME + "' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    fields: 'files(id)',
  });

  if (res.result.files.length > 0) {
    folderId = res.result.files[0].id;
    return folderId;
  }

  const folder = await window.gapi.client.drive.files.create({
    resource: {
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  });
  folderId = folder.result.id;

  await window.gapi.client.drive.permissions.create({
    fileId: folderId,
    resource: { role: 'reader', type: 'anyone' },
  });

  return folderId;
}

export async function uploadPost(post) {
  const folder = await getOrCreateFolder();

  const metadata = {
    name: 'post_' + post.id + '.json',
    mimeType: 'application/json',
    parents: [folder],
  };

  const body = JSON.stringify(post);
  const boundary = 'fieldsnap_boundary_xyz';
  const delimiter = '\r\n--' + boundary + '\r\n';
  const closeDelim = '\r\n--' + boundary + '--';

  const multipartBody =
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    body +
    closeDelim;

  const token = window.gapi.client.getToken().access_token;
  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime',
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'multipart/related; boundary="' + boundary + '"',
      },
      body: multipartBody,
    }
  );

  if (!response.ok) throw new Error('Upload failed');
  return response.json();
}

export async function fetchPosts() {
  const folder = await getOrCreateFolder();

  const res = await window.gapi.client.drive.files.list({
    q: "'" + folder + "' in parents and name contains 'post_' and trashed=false",
    fields: 'files(id,name,createdTime)',
    orderBy: 'createdTime desc',
    pageSize: 100,
  });

  const files = res.result.files || [];
  const token = window.gapi.client.getToken().access_token;

  const posts = await Promise.all(
    files.map(async (file) => {
      try {
        const r = await fetch(
          'https://www.googleapis.com/drive/v3/files/' + file.id + '?alt=media',
          { headers: { Authorization: 'Bearer ' + token } }
        );
        return await r.json();
      } catch (e) {
        return null;
      }
    })
  );

  return posts.filter(Boolean).sort((a, b) => b.timestamp - a.timestamp);
}

export async function deletePost(postId) {
  const folder = await getOrCreateFolder();
  const res = await window.gapi.client.drive.files.list({
    q: "name='post_" + postId + ".json' and '" + folder + "' in parents and trashed=false",
    fields: 'files(id)',
  });
  if (res.result.files.length > 0) {
    await window.gapi.client.drive.files.delete({ fileId: res.result.files[0].id });
  }
}

export async function updatePost(post) {
  const folder = await getOrCreateFolder();

  const res = await window.gapi.client.drive.files.list({
    q: "name='post_" + post.id + ".json' and '" + folder + "' in parents and trashed=false",
    fields: 'files(id)',
  });

  const token = window.gapi.client.getToken().access_token;

  if (res.result.files.length > 0) {
    const fileId = res.result.files[0].id;
    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=media',
      {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(post),
      }
    );
    if (!response.ok) throw new Error('Update failed');
    return response.json();
  } else {
    return uploadPost(post);
  }
}
