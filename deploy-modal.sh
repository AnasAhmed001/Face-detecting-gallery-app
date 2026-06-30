#!/bin/bash
# Modal Labs deployment script for face-processing-service

echo "🚀 Deploying Face Processing Service to Modal Labs"
echo ""

# Check if modal CLI is installed
if ! command -v modal &> /dev/null; then
    echo "❌ Modal CLI not found. Installing..."
    pip install modal
    echo ""
fi

# Check if authenticated
echo "🔑 Checking authentication..."
if ! modal token list &> /dev/null 2>&1; then
    echo "⚠️  Not authenticated. Running authentication..."
    modal token new
    echo ""
else
    echo "✅ Already authenticated"
    echo ""
fi

# Check if secrets exist
echo "📋 Checking secrets..."
if ! modal secret list 2>&1 | grep -q "face-processing-secrets"; then
    echo "⚠️  Secrets 'face-processing-secrets' not found."
    echo ""
    echo "You need to create them first with this command:"
    echo ""
    echo "modal secret create face-processing-secrets \\"
    echo '  MONGO_URI="your_mongodb_uri" \'
    echo '  R2_ACCOUNT_ID="your_account_id" \'
    echo '  R2_ACCESS_KEY_ID="your_r2_access_key" \'
    echo '  R2_SECRET_ACCESS_KEY="your_r2_secret" \'
    echo '  R2_BUCKET="saylani-moments" \'
    echo '  QDRANT_URL="https://xxxxx.qdrant.io" \'
    echo '  QDRANT_API_KEY="your_qdrant_api_key"'
    echo ""
    echo "Get credentials from:"
    echo "  - MongoDB: MongoDB Atlas dashboard"
    echo "  - R2: Cloudflare R2 dashboard → API Tokens"
    echo "  - Qdrant: Qdrant Cloud dashboard → API Keys"
    echo ""
    exit 1
else
    echo "✅ Secrets found"
    echo ""
fi

# Deploy
echo "📦 Deploying Modal app (this may take 2-3 minutes on first deploy)..."
echo ""
modal deploy modal_app.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Copy the function URLs from above"
    echo "2. Add to backend/.env:"
    echo "   MODAL_FUNCTION_URL=https://your-username--face-processing-service-detect-faces.modal.run"
    echo ""
    echo "3. Generate webhook secret:"
    echo '   node -e "console.log(require('"'"'crypto'"'"').randomBytes(32).toString('"'"'hex'"'"'))"'
    echo ""
    echo "4. Add webhook secret to backend/.env:"
    echo "   MODAL_WEBHOOK_SECRET=your_generated_secret"
    echo ""
else
    echo ""
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi
