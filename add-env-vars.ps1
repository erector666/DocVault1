# Add Firebase environment variables to Vercel
Write-Host "Adding Firebase environment variables to Vercel..."

# REACT_APP_FIREBASE_STORAGE_BUCKET
Write-Host "Adding REACT_APP_FIREBASE_STORAGE_BUCKET..."
echo "gpt1-77ce0.firebasestorage.app" | vercel env add REACT_APP_FIREBASE_STORAGE_BUCKET

# REACT_APP_FIREBASE_MESSAGING_SENDER_ID
Write-Host "Adding REACT_APP_FIREBASE_MESSAGING_SENDER_ID..."
echo "887480132482" | vercel env add REACT_APP_FIREBASE_MESSAGING_SENDER_ID

# REACT_APP_FIREBASE_APP_ID
Write-Host "Adding REACT_APP_FIREBASE_APP_ID..."
echo "1:887480132482:web:7f8d166d0d36d4f058e59b" | vercel env add REACT_APP_FIREBASE_APP_ID

# REACT_APP_FIREBASE_MEASUREMENT_ID
Write-Host "Adding REACT_APP_FIREBASE_MEASUREMENT_ID..."
echo "G-XTCDJJGTD2" | vercel env add REACT_APP_FIREBASE_MEASUREMENT_ID

# REACT_APP_FUNCTIONS_BASE_URL
Write-Host "Adding REACT_APP_FUNCTIONS_BASE_URL..."
echo "https://us-central1-gpt1-77ce0.cloudfunctions.net" | vercel env add REACT_APP_FUNCTIONS_BASE_URL

Write-Host "All environment variables added successfully!"
Write-Host "Now running deployment..."

# Deploy to production
vercel --prod
