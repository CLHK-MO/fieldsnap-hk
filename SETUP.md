# FieldSnap HK — Setup Guide

Follow these steps once to get the app live. Takes about 20 minutes.

---

## Step 1 — Get a free Google Cloud API Key

1. Go to https://console.cloud.google.com
2. Create a new project (name it anything, e.g. "FieldSnap")
3. Go to **APIs & Services → Library**
4. Search and **Enable** these two APIs:
   - **Google Drive API**
   - **Google Picker API** (optional but useful)
5. Go to **APIs & Services → Credentials**
6. Click **Create Credentials → API Key**
   - Copy the key — this is your `VITE_GOOGLE_API_KEY`
7. Click **Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: FieldSnap HK
   - Under **Authorised JavaScript origins**, add:
     - `http://localhost:5173` (for local testing)
     - `https://your-app.vercel.app` (your Vercel URL — add after deploying)
   - Click **Create**
   - Copy the **Client ID** — this is your `VITE_GOOGLE_CLIENT_ID`
8. Go to **APIs & Services → OAuth consent screen**
   - Choose **External**
   - Fill in App name: "FieldSnap HK", your email
   - Add your 4 users' Google email addresses under **Test users**
   - Save

---

## Step 2 — Deploy to Vercel

### Option A: Deploy via GitHub (recommended)

1. Create a free account at https://github.com if you don't have one
2. Create a new repository called `fieldsnap-hk`
3. Upload all these project files to it
4. Go to https://vercel.com and sign up (free)
5. Click **Add New Project → Import Git Repository**
6. Select your `fieldsnap-hk` repo
7. Under **Environment Variables**, add:
   - `VITE_GOOGLE_API_KEY` = your API key from Step 1
   - `VITE_GOOGLE_CLIENT_ID` = your Client ID from Step 1
8. Click **Deploy**
9. Vercel gives you a URL like `https://fieldsnap-hk.vercel.app`

### Option B: Deploy via Vercel CLI

```bash
npm install -g vercel
cd fieldsnap
vercel
# Follow the prompts, add env vars when asked
```

---

## Step 3 — Add your Vercel URL to Google Cloud

1. Go back to Google Cloud Console → **Credentials → your OAuth Client ID**
2. Under **Authorised JavaScript origins**, add your Vercel URL:
   `https://your-app.vercel.app`
3. Save

---

## Step 4 — Share the Google Drive folder

When the first user signs in and connects Google Drive, a folder called
**"FieldSnap HK"** is automatically created in their Drive.

**To share it with the other 3 reps:**
1. Open Google Drive
2. Find the **FieldSnap HK** folder
3. Right-click → Share
4. Add the other 3 reps' Google email addresses
5. Set permission to **Editor** (so they can upload)

> ⚠️ Only the person who first authorises creates the folder. All reps need to
> authorise with their own Google account, but they'll all read/write to the
> same folder once it's shared.

---

## Step 5 — Send logins to your team

| Name           | Username    | Password     |
|----------------|-------------|--------------|
| Wanger Cheung  | wanger      | wc21102121   |
| Hazel Chan     | hazel       | hc21102121   |
| Victor Choi    | victor      | vc21102121   |
| Marketing      | marketing   | HK21102121   |

Share the app URL and their credentials. First time they open it they'll see a
"Connect Google Drive" button — they tap it, sign in with their Google account,
and they're in.

---

## Local development (optional)

```bash
# Install dependencies
npm install

# Create your env file
cp .env.example .env.local
# Edit .env.local and paste your API key + Client ID

# Run locally
npm run dev
# Opens at http://localhost:5173
```

---

## Troubleshooting

**"Google Drive authorization failed"**
→ Check that your Client ID is correct and your Vercel URL is in the
  Authorised JavaScript origins list in Google Cloud Console.

**"Failed to load Google Drive"**
→ Check that your API Key is correct and the Google Drive API is enabled.

**Rep can't see other reps' photos**
→ Make sure the FieldSnap HK folder in Google Drive is shared with all 4 reps.

**Photos not showing after upload**
→ Hit the 🔄 refresh button in the top bar to reload the feed from Drive.
