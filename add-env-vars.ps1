# Add Supabase environment variables to Vercel
Write-Host "Adding Supabase environment variables to Vercel..."

# REACT_APP_SUPABASE_URL
Write-Host "Adding REACT_APP_SUPABASE_URL..."
echo "https://your-project.supabase.co" | vercel env add REACT_APP_SUPABASE_URL

# REACT_APP_SUPABASE_ANON_KEY
Write-Host "Adding REACT_APP_SUPABASE_ANON_KEY..."
echo "your-supabase-anon-key-here" | vercel env add REACT_APP_SUPABASE_ANON_KEY

# NODE_ENV
Write-Host "Adding NODE_ENV..."
echo "production" | vercel env add NODE_ENV

# REACT_APP_ENV
Write-Host "Adding REACT_APP_ENV..."
echo "production" | vercel env add REACT_APP_ENV

# REACT_APP_ENABLE_ANALYTICS
Write-Host "Adding REACT_APP_ENABLE_ANALYTICS..."
echo "true" | vercel env add REACT_APP_ENABLE_ANALYTICS

# REACT_APP_ENABLE_LOGGING
Write-Host "Adding REACT_APP_ENABLE_LOGGING..."
echo "true" | vercel env add REACT_APP_ENABLE_LOGGING

Write-Host "✅ All Supabase environment variables added successfully!"
Write-Host "Remember to update the actual values in your Vercel project settings."
