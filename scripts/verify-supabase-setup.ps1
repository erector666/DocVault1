# Supabase Setup Verification Script for DocVault
# This script verifies that all Supabase components are properly configured

Write-Host "🔍 Verifying Supabase setup for DocVault..." -ForegroundColor Green

# Check if we're in the right directory
$projectRoot = Get-Location
Write-Host "Project root: $projectRoot" -ForegroundColor Cyan

# Check for Supabase CLI
Write-Host "`n📋 Checking Supabase CLI..." -ForegroundColor Yellow
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found" -ForegroundColor Red
    Write-Host "Install with: npm install -g supabase" -ForegroundColor Yellow
}

# Check Supabase configuration files
Write-Host "`n📁 Checking Supabase configuration files..." -ForegroundColor Yellow

$requiredFiles = @(
    "supabase/config.toml",
    "supabase/migrations/001_initial_schema.sql",
    "supabase/seed.sql"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file - Missing" -ForegroundColor Red
        $allFilesExist = $false
    }
}

# Check email templates
Write-Host "`n📧 Checking email templates..." -ForegroundColor Yellow
$templateDir = "supabase/templates"
if (Test-Path $templateDir) {
    $templates = Get-ChildItem $templateDir -Filter "*.html"
    Write-Host "✅ Found $($templates.Count) email templates" -ForegroundColor Green
    foreach ($template in $templates) {
        Write-Host "  - $($template.Name)" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ Email templates directory missing" -ForegroundColor Red
    $allFilesExist = $false
}

# Check deployment scripts
Write-Host "`n🚀 Checking deployment scripts..." -ForegroundColor Yellow
$deploymentScripts = @(
    "scripts/deploy-supabase.ps1",
    "scripts/deploy-supabase.sh"
)

foreach ($script in $deploymentScripts) {
    if (Test-Path $script) {
        Write-Host "✅ $script" -ForegroundColor Green
    } else {
        Write-Host "❌ $script - Missing" -ForegroundColor Red
        $allFilesExist = $false
    }
}

# Check edge functions
Write-Host "`n⚡ Checking edge functions..." -ForegroundColor Yellow
$functionsDir = "supabase/functions"
if (Test-Path $functionsDir) {
    $functions = Get-ChildItem $functionsDir -Directory
    Write-Host "✅ Found $($functions.Count) edge functions" -ForegroundColor Green
    foreach ($function in $functions) {
        Write-Host "  - $($function.Name)" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ Edge functions directory missing" -ForegroundColor Red
    $allFilesExist = $false
}

# Check documentation
Write-Host "`n📚 Checking documentation..." -ForegroundColor Yellow
$docs = @(
    "SUPABASE_SETUP.md",
    "CI_CD_SETUP_GUIDE.md",
    "CI_CD_SUMMARY.md"
)

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Write-Host "✅ $doc" -ForegroundColor Green
    } else {
        Write-Host "❌ $doc - Missing" -ForegroundColor Red
        $allFilesExist = $false
    }
}

# Check for Firebase remnants
Write-Host "`n🚫 Checking for Firebase remnants..." -ForegroundColor Yellow
$firebaseFiles = Get-ChildItem -Recurse -Include "*firebase*" -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notlike "*node_modules*" }
if ($firebaseFiles.Count -eq 0) {
    Write-Host "✅ No Firebase files found" -ForegroundColor Green
} else {
    Write-Host "⚠️  Found $($firebaseFiles.Count) Firebase-related files:" -ForegroundColor Yellow
    foreach ($file in $firebaseFiles) {
        Write-Host "  - $($file.FullName)" -ForegroundColor Cyan
    }
}

# Check package.json for Firebase dependencies
Write-Host "`n📦 Checking package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $packageContent = Get-Content "package.json" -Raw
    if ($packageContent -match "firebase") {
        Write-Host "⚠️  Firebase dependencies found in package.json" -ForegroundColor Yellow
    } else {
        Write-Host "✅ No Firebase dependencies in package.json" -ForegroundColor Green
    }
} else {
    Write-Host "❌ package.json not found" -ForegroundColor Red
}

# Summary
Write-Host "`n📊 Setup Verification Summary" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

if ($allFilesExist) {
    Write-Host "🎉 Supabase setup is complete and ready for deployment!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Install Supabase CLI: npm install -g supabase" -ForegroundColor White
    Write-Host "2. Create project at supabase.com" -ForegroundColor White
    Write-Host "3. Link project: supabase link --project-ref YOUR_REF" -ForegroundColor White
    Write-Host "4. Deploy: .\scripts\deploy-supabase.ps1" -ForegroundColor White
} else {
    Write-Host "⚠️  Some components are missing. Please check the errors above." -ForegroundColor Yellow
}

Write-Host "`n🔍 Verification completed!" -ForegroundColor Green
