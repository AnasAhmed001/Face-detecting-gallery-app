# Cloud Setup Guide - Free Tier Architecture

This guide walks you through setting up all the free cloud services for the face-tagging gallery app.

## 🎯 Architecture Overview

**All services are free tier and cloud-hosted:**
- **Storage:** Cloudflare R2 (10GB free)
- **Cache/Queue:** Upstash Redis (10K commands/day free)
- **Vector Search:** Qdrant Cloud (1GB cluster free)
- **Database:** MongoDB Atlas (512MB free) - already configured
- **Face Processing:** Modal Labs (30 free GPU hours/month)

**Total Cost:** $0/month ✅

---

## 1️⃣ Cloudflare R2 Setup

**Free Tier:** 10GB storage, 10 million Class A operations, 100 million Class B operations/month

### Steps:

1. **Sign up for Cloudflare:** https://dash.cloudflare.com/sign-up

2. **Create R2 Bucket:**
   - Go to R2 Object Storage in dashboard
   - Click "Create bucket"
   - Name: `saylani-moments`
   - Location: Automatic
   - Click "Create bucket"

3. **Enable Public Access:**
   - Go to bucket settings
   - Under "Public Access" → Enable public read access
   - Copy the public bucket URL (e.g., `https://pub-xxxxx.r2.dev`)

4. **Generate API Token:**
   - Go to "Manage R2 API Tokens"
   - Click "Create API Token"
   - Permissions: Object Read & Write
   - Click "Create API Token"
   - Copy: Account ID, Access Key ID, Secret Access Key

5. **Update `.env`:**
   ```bash
   R2_ACCOUNT_ID=your_cloudflare_account_id
   R2_ACCESS_KEY_ID=your_r2_access_key_id
   R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
   R2_BUCKET=saylani-moments
   R2_PUBLIC_ENDPOINT=https://pub-xxxxx.r2.dev
   ```

---

## 2️⃣ Upstash Redis Setup

**Free Tier:** 10,000 commands/day, 256MB storage, global replication

### Steps:

1. **Sign up for Upstash:** https://console.upstash.com/

2. **Create Redis Database:**
   - Click "Create Database"
   - Name: `face-gallery-cache`
   - Type: Regional (cheaper) or Global (faster)
   - Region: Choose closest to you
   - Click "Create"

3. **Get Connection URL:**
   - Go to database details
   - Copy the "Redis URL" (starts with `rediss://`)
   - Copy the "REST Token" (if using REST API)

4. **Update `.env`:**
   ```bash
   UPSTASH_REDIS_URL=rediss://default:xxxxx@xxxxx.upstash.io:6379
   UPSTASH_REDIS_TOKEN=your_rest_token_here
   ```

---

## 3️⃣ Qdrant Cloud Setup

**Free Tier:** 1GB cluster (enough for ~500,000 face embeddings)

### Steps:

1. **Sign up for Qdrant Cloud:** https://cloud.qdrant.io/

2. **Create Cluster:**
   - Click "Create Cluster"
   - Name: `face-vectors`
   - Plan: Free tier (1GB)
   - Region: Choose closest to you
   - Click "Create"

3. **Get API Key:**
   - Wait for cluster to be ready (~2 minutes)
   - Go to cluster details
   - Copy the "Cluster URL" (e.g., `https://xxxxx.qdrant.io`)
   - Click "Generate API Key"
   - Copy the API key

4. **Update `.env`:**
   ```bash
   QDRANT_URL=https://xxxxx.qdrant.io
   QDRANT_API_KEY=your_qdrant_api_key_here
   ```

---

## 4️⃣ Modal Labs Setup

**Free Tier:** 30 free GPU hours/month, includes CPU usage

### Steps:

1. **Sign up for Modal:** https://modal.com/signup

2. **Install Modal CLI:**
   ```bash
   pip install modal
   ```

3. **Authenticate:**
   ```bash
   modal token new
   ```
   - This opens a browser for authentication
   - Follow the prompts to link your account

4. **Create Secrets in Modal:**
   ```bash
   modal secret create face-processing-secrets \
     MONGO_URI="your_mongodb_atlas_connection_string" \
     R2_ACCOUNT_ID="your_cloudflare_account_id" \
     R2_ACCESS_KEY_ID="your_r2_access_key_id" \
     R2_SECRET_ACCESS_KEY="your_r2_secret_access_key" \
     R2_BUCKET="saylani-moments" \
     QDRANT_URL="https://xxxxx.qdrant.io" \
     QDRANT_API_KEY="your_qdrant_api_key"
   ```

5. **Deploy Modal App:**
   ```bash
   cd "D:\Saylani Work\Face-Tagging-Gallery-App"
   modal deploy modal_app.py
   ```

6. **Get Function URLs:**
   - After deployment, Modal will output the function URLs
   - Copy the base URL (e.g., `https://your-username--face-processing-service-detect-faces.modal.run`)

7. **Update `.env`:**
   ```bash
   MODAL_WEBHOOK_SECRET=generate_a_random_secret_here
   MODAL_FUNCTION_URL=https://your-modal-app
   ```

---

## 5️⃣ Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Verify `.env` is complete:**
   Check that all cloud service credentials are filled in.

3. **Initialize Qdrant collection:**
   ```bash
   npm run dev
   ```
   - The backend will automatically create the Qdrant collection on first start

4. **Test the backend:**
   ```bash
   curl http://localhost:5000/
   # Should return: "API is running..."
   ```

---

## 🧪 Testing the Setup

### 1. Test Storage (Cloudflare R2):
```bash
# The backend should be able to generate presigned URLs
curl -X POST http://localhost:5000/api/s3/generate-presigned-post \
  -H "Content-Type: application/json" \
  -d '{"userId":"test123","eventId":"event456"}'
```

### 2. Test Cache (Upstash Redis):
The cache will be automatically tested when you use face matching.

### 3. Test Qdrant:
Qdrant collection is created on backend startup. Check logs for:
```
Qdrant Cloud collection created
```

### 4. Test Modal Labs:
```bash
# Test face detection
curl -X POST https://your-modal-app--detect-faces.modal.run \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","eventId":"test","imageKey":"test.jpg","bucket":"saylani-moments"}'
```

---

## 📊 Usage Limits (Free Tiers)

| Service | Free Tier Limit | Your Usage Estimate |
|---------|----------------|---------------------|
| **Cloudflare R2** | 10GB storage | ~5GB for 50 events |
| **Upstash Redis** | 10K commands/day | ~100-500/day typical |
| **Qdrant Cloud** | 1GB cluster | ~10MB for 50 events |
| **Modal Labs** | 30 GPU hours/month | ~5-10 hours for batch uploads |
| **MongoDB Atlas** | 512MB storage | Already configured |

**Conclusion:** All services have generous free tiers for personal use. You're unlikely to hit limits with sporadic event uploads.

---

## 🔐 Security Best Practices

1. **Never commit `.env` file to Git**
   ```bash
   echo ".env" >> .gitignore
   ```

2. **Generate strong secrets:**
   ```bash
   # For MODAL_WEBHOOK_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Restrict API keys:**
   - Cloudflare R2: Use bucket-specific tokens
   - Qdrant: Use read/write access only
   - Upstash: Enable TLS

---

## 🚨 Troubleshooting

### Backend won't start:
- Check all `.env` variables are set
- Verify MongoDB connection string
- Check Qdrant URL and API key

### Modal deployment fails:
- Run `modal token new` again
- Check secrets are created: `modal secret list`
- Verify Python dependencies in `modal_app.py`

### R2 uploads fail:
- Check bucket permissions (public read enabled)
- Verify API token has write access
- Check bucket name matches `.env`

### Upstash Redis connection fails:
- Verify URL starts with `rediss://` (note the double 's')
- Check firewall isn't blocking port 6379
- Test connection: `redis-cli -u $UPSTASH_REDIS_URL ping`

### Qdrant initialization fails:
- Check cluster is active in dashboard
- Verify API key is correct
- Ensure QDRANT_URL includes `https://`

---

## 📈 Monitoring Usage

### Cloudflare R2:
- Dashboard → R2 → Analytics
- Monitor storage usage and requests

### Upstash Redis:
- Console → Database → Metrics
- Monitor daily command count

### Qdrant Cloud:
- Dashboard → Cluster → Metrics
- Monitor storage and query performance

### Modal Labs:
- Dashboard → Usage
- Track GPU hours consumed

---

## ✅ Setup Checklist

- [ ] Cloudflare R2 bucket created and configured
- [ ] Upstash Redis database created
- [ ] Qdrant Cloud cluster created
- [ ] Modal Labs account setup and authenticated
- [ ] Modal secrets created
- [ ] Modal app deployed
- [ ] Backend `.env` updated with all credentials
- [ ] Backend dependencies installed
- [ ] Backend starts without errors
- [ ] Qdrant collection initialized
- [ ] Test upload workflow

**Once all checked, you're ready to use the app!** 🎉
