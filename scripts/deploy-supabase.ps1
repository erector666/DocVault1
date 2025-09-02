# Supabase Deployment Script for DocVault
# This script deploys the complete Supabase infrastructure

param(
    [string]$Environment = "production",
    [switch]$DryRun,
    [switch]$Local
)

Write-Host "🚀 Starting Supabase deployment for DocVault..." -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Set working directory
Set-Location $PSScriptRoot/..

if ($Local) {
    Write-Host "🔧 Setting up local Supabase development environment..." -ForegroundColor Blue
    
    # Start local Supabase
    Write-Host "Starting local Supabase services..." -ForegroundColor Yellow
    supabase start
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Local Supabase started successfully" -ForegroundColor Green
        Write-Host "Dashboard: http://localhost:54323" -ForegroundColor Cyan
        Write-Host "API: http://localhost:54321" -ForegroundColor Cyan
        Write-Host "DB: postgresql://postgres:postgres@localhost:54322/postgres" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Failed to start local Supabase" -ForegroundColor Red
        exit 1
    }
    
    # Apply migrations
    Write-Host "Applying database migrations..." -ForegroundColor Yellow
    supabase db reset
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database migrations applied successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to apply database migrations" -ForegroundColor Red
        exit 1
    }
    
    # Seed data
    Write-Host "Seeding initial data..." -ForegroundColor Yellow
    supabase db seed
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Initial data seeded successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to seed initial data" -ForegroundColor Red
    }
    
} else {
    Write-Host "🌐 Deploying to remote Supabase project..." -ForegroundColor Blue
    
    # Check if linked to a project
    try {
        $projectInfo = supabase projects list --json | ConvertFrom-Json
        if ($projectInfo) {
            Write-Host "✅ Connected to Supabase project" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Not connected to a Supabase project" -ForegroundColor Yellow
        Write-Host "Please run: supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor Cyan
        exit 1
    }
    
    if ($DryRun) {
        Write-Host "🔍 DRY RUN MODE - No changes will be made" -ForegroundColor Yellow
        
        # Validate configuration
        Write-Host "Validating Supabase configuration..." -ForegroundColor Yellow
        supabase config validate
        
        # Show what would be deployed
        Write-Host "Migration files to be applied:" -ForegroundColor Yellow
        Get-ChildItem "supabase/migrations" -Filter "*.sql" | ForEach-Object {
            Write-Host "  - $($_.Name)" -ForegroundColor Cyan
        }
        
        Write-Host "Edge functions to be deployed:" -ForegroundColor Yellow
        Get-ChildItem "supabase/functions" -Directory | ForEach-Object {
            Write-Host "  - $($_.Name)" -ForegroundColor Cyan
        }
        
    } else {
        # Deploy database migrations
        Write-Host "Deploying database migrations..." -ForegroundColor Yellow
        supabase db push
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database migrations deployed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to deploy database migrations" -ForegroundColor Red
            exit 1
        }
        
        # Deploy edge functions
        Write-Host "Deploying edge functions..." -ForegroundColor Yellow
        supabase functions deploy
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Edge functions deployed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to deploy edge functions" -ForegroundColor Red
        }
        
        # Deploy storage policies
        Write-Host "Deploying storage policies..." -ForegroundColor Yellow
        supabase storage deploy
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Storage policies deployed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to deploy storage policies" -ForegroundColor Red
        }
    }
}

# Verify deployment
Write-Host "🔍 Verifying deployment..." -ForegroundColor Blue

if ($Local) {
    # Test local connection
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:54321/rest/v1/" -Method GET
        Write-Host "✅ Local API is responding" -ForegroundColor Green
    } catch {
        Write-Host "❌ Local API is not responding" -ForegroundColor Red
    }
} else {
    # Test remote connection
    try {
        $projectUrl = supabase status --output json | ConvertFrom-Json | Select-Object -ExpandProperty API
        $response = Invoke-RestMethod -Uri "$projectUrl/rest/v1/" -Method GET
        Write-Host "✅ Remote API is responding" -ForegroundColor Green
    } catch {
        Write-Host "❌ Remote API is not responding" -ForegroundColor Red
    }
}

Write-Host "🎉 Supabase deployment completed!" -ForegroundColor Green

if ($Local) {
    Write-Host "Local development environment is ready!" -ForegroundColor Cyan
    Write-Host "Run 'supabase stop' to stop local services" -ForegroundColor Yellow
} else {
    Write-Host "Remote deployment completed successfully!" -ForegroundColor Cyan
}
