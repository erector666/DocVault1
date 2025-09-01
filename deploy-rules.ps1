# Deploy Firebase Security Rules
# This script deploys both Firestore and Storage security rules

Write-Host "Deploying Firebase Security Rules..." -ForegroundColor Green

# Deploy Firestore rules
Write-Host "Deploying Firestore rules..." -ForegroundColor Yellow
firebase deploy --only firestore:rules

# Deploy Storage rules
Write-Host "Deploying Storage rules..." -ForegroundColor Yellow
firebase deploy --only storage

Write-Host "Firebase Security Rules deployment completed!" -ForegroundColor Green
Write-Host "You may need to wait a few minutes for the rules to take effect." -ForegroundColor Yellow
