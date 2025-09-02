#!/bin/bash

# Supabase Deployment Script for DocVault
# This script deploys the complete Supabase infrastructure

set -e

ENVIRONMENT=${1:-"production"}
DRY_RUN=false
LOCAL=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --local)
            LOCAL=true
            shift
            ;;
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "🚀 Starting Supabase deployment for DocVault..."
echo "Environment: $ENVIRONMENT"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

SUPABASE_VERSION=$(supabase --version)
echo "✅ Supabase CLI found: $SUPABASE_VERSION"

# Set working directory
cd "$(dirname "$0")/.."

if [ "$LOCAL" = true ]; then
    echo "🔧 Setting up local Supabase development environment..."
    
    # Start local Supabase
    echo "Starting local Supabase services..."
    if supabase start; then
        echo "✅ Local Supabase started successfully"
        echo "Dashboard: http://localhost:54323"
        echo "API: http://localhost:54321"
        echo "DB: postgresql://postgres:postgres@localhost:54322/postgres"
    else
        echo "❌ Failed to start local Supabase"
        exit 1
    fi
    
    # Apply migrations
    echo "Applying database migrations..."
    if supabase db reset; then
        echo "✅ Database migrations applied successfully"
    else
        echo "❌ Failed to apply database migrations"
        exit 1
    fi
    
    # Seed data
    echo "Seeding initial data..."
    if supabase db seed; then
        echo "✅ Initial data seeded successfully"
    else
        echo "❌ Failed to seed initial data"
    fi
    
else
    echo "🌐 Deploying to remote Supabase project..."
    
    # Check if linked to a project
    if supabase projects list --json > /dev/null 2>&1; then
        echo "✅ Connected to Supabase project"
    else
        echo "⚠️  Not connected to a Supabase project"
        echo "Please run: supabase link --project-ref YOUR_PROJECT_REF"
        exit 1
    fi
    
    if [ "$DRY_RUN" = true ]; then
        echo "🔍 DRY RUN MODE - No changes will be made"
        
        # Validate configuration
        echo "Validating Supabase configuration..."
        supabase config validate
        
        # Show what would be deployed
        echo "Migration files to be applied:"
        for file in supabase/migrations/*.sql; do
            if [ -f "$file" ]; then
                echo "  - $(basename "$file")"
            fi
        done
        
        echo "Edge functions to be deployed:"
        for dir in supabase/functions/*/; do
            if [ -d "$dir" ]; then
                echo "  - $(basename "$dir")"
            fi
        done
        
    else
        # Deploy database migrations
        echo "Deploying database migrations..."
        if supabase db push; then
            echo "✅ Database migrations deployed successfully"
        else
            echo "❌ Failed to deploy database migrations"
            exit 1
        fi
        
        # Deploy edge functions
        echo "Deploying edge functions..."
        if supabase functions deploy; then
            echo "✅ Edge functions deployed successfully"
        else
            echo "❌ Failed to deploy edge functions"
        fi
        
        # Deploy storage policies
        echo "Deploying storage policies..."
        if supabase storage deploy; then
            echo "✅ Storage policies deployed successfully"
        else
            echo "❌ Failed to deploy storage policies"
        fi
    fi
fi

# Verify deployment
echo "🔍 Verifying deployment..."

if [ "$LOCAL" = true ]; then
    # Test local connection
    if curl -s "http://localhost:54321/rest/v1/" > /dev/null; then
        echo "✅ Local API is responding"
    else
        echo "❌ Local API is not responding"
    fi
else
    # Test remote connection
    PROJECT_URL=$(supabase status --output json | jq -r '.api')
    if curl -s "$PROJECT_URL/rest/v1/" > /dev/null; then
        echo "✅ Remote API is responding"
    else
        echo "❌ Remote API is not responding"
    fi
fi

echo "🎉 Supabase deployment completed!"

if [ "$LOCAL" = true ]; then
    echo "Local development environment is ready!"
    echo "Run 'supabase stop' to stop local services"
else
    echo "Remote deployment completed successfully!"
fi
