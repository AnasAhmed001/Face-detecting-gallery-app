# Face-Tagging Gallery App

AI-powered face recognition gallery application with 100% free cloud infrastructure.

## 🎯 Overview

Upload event photos and let guests find themselves instantly with facial recognition. Built with InsightFace AI, deployed on free cloud services.

**Architecture:** React frontend + Node.js backend + Modal Labs serverless AI

**Cost:** $0/month (free tier services)

---

## 🏗️ Cloud Architecture

| Service | Provider | Purpose | Free Tier |
|---------|----------|---------|-----------|
| **Storage** | Cloudflare R2 | Image storage (S3-compatible) | 10GB/month |
| **Cache** | Upstash Redis | Face match caching | 10K commands/day |
| **Vectors** | Qdrant Cloud | Face similarity search | 1GB cluster |
| **Database** | MongoDB Atlas | Metadata storage | 512MB |
| **AI Processing** | Modal Labs | Face detection & matching | 30 GPU hours/month |

**Performance:**
- Face detection: 3-5 seconds (includes cold start)
- Face matching (cached): <100ms
- Image upload: Direct to CDN, instant

---

## 📁 Project Structure

```
Face-Tagging-Gallery-App/
├── frontend/                 # React app
│   ├── src/
│   └── package.json
├── backend/                  # Node.js API
│   ├── controllers/          # Route handlers
│   ├── lib/                  # Service clients
│   │   ├── storageService.js    # Cloudflare R2
│   │   ├── cacheService.js      # Upstash Redis
│   │   ├── qdrantService.js     # Qdrant Cloud
│   │   ├── mongoService.js      # MongoDB
│   │   └── jobQueue.js          # Modal Labs HTTP client
│   ├── models/               # MongoDB schemas
│   ├── routes/               # API routes
│   └── .env                  # Environment variables
├── modal_app.py              # Modal Labs face processing
├── deploy-modal.bat          # Windows deployment script
├── CLOUD-SETUP.md            # Detailed setup guide
└── MIGRATION-COMPLETE.md     # Architecture overview
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.12+ (for Modal CLI only)
- Git

### 1. Clone & Install
```bash
git clone <your-repo>
cd Face-Tagging-Gallery-App

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Setup Cloud Services (30-45 minutes)

Follow the detailed guide: **[CLOUD-SETUP.md](./CLOUD-SETUP.md)**

You'll set up:
1. Cloudflare R2 (storage)
2. Upstash Redis (cache)
3. Qdrant Cloud (vectors)
4. Modal Labs (AI processing)

### 3. Deploy Modal Labs Functions

```bash
# Windows
deploy-modal.bat

# Linux/Mac
bash deploy-modal.sh
```

### 4. Configure Environment

```bash
cd backend
cp .env.example .env
# Fill in all cloud service credentials
```

### 5. Start Development

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## 📖 Documentation

- **[CLOUD-SETUP.md](./CLOUD-SETUP.md)** - Step-by-step cloud service setup
- **[MIGRATION-COMPLETE.md](./MIGRATION-COMPLETE.md)** - Architecture & migration details
- **[backend/.env.example](./backend/.env.example)** - Environment variables template

---

## 🔑 Environment Variables

All services require API keys. See `.env.example` for the complete list:

```bash
# Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...

# Upstash Redis
UPSTASH_REDIS_URL=...

# Qdrant Cloud
QDRANT_URL=...
QDRANT_API_KEY=...

# Modal Labs
MODAL_FUNCTION_URL=...
MODAL_WEBHOOK_SECRET=...
```

---

## 🎨 Features

### For Photographers
- Upload event photos in batches
- Automatic face detection
- Create shareable event galleries
- Download high-res originals

### For Guests
- Upload selfie to find their photos
- No account required
- Instant face matching
- Download personal photos

### Technical Features
- AI-powered face recognition (InsightFace)
- Vector similarity search (Qdrant)
- Smart caching (30-minute TTL)
- Auto-scaling serverless AI
- CDN-accelerated delivery

---

## 🔄 How It Works

### Upload Flow
```
Photographer uploads → Cloudflare R2
                    ↓
Backend triggers → Modal Labs
                 ↓
Modal Labs:
  • Detects faces (InsightFace)
  • Creates derivatives (thumb/medium)
  • Stores embeddings (Qdrant)
  • Saves metadata (MongoDB)
```

### Guest Matching Flow
```
Guest uploads selfie → Backend checks cache
                    ↓
Cache miss → Modal Labs
          ↓
Modal Labs:
  • Detects face in selfie
  • Searches Qdrant (>75% similarity)
  • Returns matching photos
          ↓
Backend caches results (30 min)
Backend returns to guest (<100ms on cache hit)
```

---

## 📊 Free Tier Limits

| Service | Monthly Limit | Estimated Usage |
|---------|---------------|-----------------|
| Cloudflare R2 | 10GB storage | ~5GB (50 events) |
| Upstash Redis | 10K commands/day | ~100-500/day |
| Qdrant Cloud | 1GB vectors | ~10MB (50 events) |
| Modal Labs | 30 GPU hours | ~10 hours (batch uploads) |
| MongoDB Atlas | 512MB data | Sufficient for metadata |

**Conclusion:** Free tiers are more than enough for personal/small business use.

---

## 🛠️ Development

### Backend API
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Key Endpoints:**
- `POST /api/s3/generate-presigned-post` - Get upload URL
- `POST /api/faceMatch/:eventId` - Match selfie to event photos
- `GET /api/events/:userId` - List user events
- `GET /api/images/:userId/:eventId` - Get event photos

### Frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### Modal Labs
```bash
# Test locally
modal run modal_app.py

# Deploy to production
modal deploy modal_app.py

# View logs
modal app logs face-processing-service
```

---

## 🧪 Testing

### Test Modal Functions
```bash
# Test face detection
curl -X POST https://your-username--face-processing-service-detect-faces.modal.run \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","eventId":"test","imageKey":"test.jpg","bucket":"saylani-moments"}'
```

### Test Backend
```bash
# Health check
curl http://localhost:5000/

# Generate presigned URL
curl -X POST http://localhost:5000/api/s3/generate-presigned-post \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","eventId":"event456"}'
```

---

## 🐛 Troubleshooting

### Modal deployment fails
- Run `modal token new` to re-authenticate
- Check secrets: `modal secret list`
- Verify Python 3.12+ installed

### Backend won't start
- Check all `.env` variables are set
- Verify MongoDB connection string
- Ensure Qdrant URL includes `https://`

### Face detection slow
- **First request:** 10-30 second cold start (normal)
- **Subsequent requests:** 3-5 seconds
- Consider keeping Modal warm with scheduled pings

### Cache not working
- Check Upstash Redis URL format: `rediss://` (double 's')
- Verify Redis connection: `redis-cli -u $UPSTASH_REDIS_URL ping`

---

## 📈 Monitoring

### View Usage Dashboards
- **Cloudflare R2:** https://dash.cloudflare.com/ → R2 → Analytics
- **Upstash Redis:** https://console.upstash.com/ → Database → Metrics
- **Qdrant Cloud:** https://cloud.qdrant.io/ → Cluster → Metrics
- **Modal Labs:** https://modal.com/dashboard → Usage

### Check Logs
```bash
# Backend logs
cd backend
npm run dev

# Modal Labs logs
modal app logs face-processing-service

# MongoDB logs
# Check MongoDB Atlas dashboard
```

---

## 🚢 Production Deployment

### Backend (Options)
1. **Railway:** Free tier, easy Node.js deployment
2. **Render:** Free tier with auto-sleep
3. **Fly.io:** Free tier with global edge

### Frontend (Options)
1. **Vercel:** Free tier, optimized for React
2. **Netlify:** Free tier with CDN
3. **Cloudflare Pages:** Free tier, fast global delivery

### Modal Labs
Already deployed globally with auto-scaling!

---

## 💡 Tips

### Reduce Costs (Already Free!)
- All services are free tier
- No credit card required initially
- Monitor usage dashboards

### Improve Performance
- Enable Cloudflare CDN for images
- Add warming pings to Modal (keep functions warm)
- Optimize cache TTL based on usage patterns

### Scale Up (When Needed)
- Modal Labs: Auto-scales, pay per GPU second
- Cloudflare R2: $0.015/GB after 10GB
- Upstash Redis: $10/month for unlimited
- Qdrant: Upgrade cluster size

---

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

---

## 📄 License

MIT License - Feel free to use for your own projects!

---

## 🙏 Credits

**Technologies Used:**
- [InsightFace](https://github.com/deepinsight/insightface) - Face recognition AI
- [Modal Labs](https://modal.com/) - Serverless ML platform
- [Cloudflare R2](https://www.cloudflare.com/products/r2/) - Object storage
- [Upstash Redis](https://upstash.com/) - Serverless Redis
- [Qdrant](https://qdrant.tech/) - Vector database
- [MongoDB Atlas](https://www.mongodb.com/atlas) - Cloud database

---

## 📞 Support

For setup help, see **[CLOUD-SETUP.md](./CLOUD-SETUP.md)**

For architecture details, see **[MIGRATION-COMPLETE.md](./MIGRATION-COMPLETE.md)**

---

**Ready to get started? Follow [CLOUD-SETUP.md](./CLOUD-SETUP.md) to set up your free cloud services!** 🚀
