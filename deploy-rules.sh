#!/bin/bash

# Deploy Firebase Security Rules
# This script deploys both Firestore and Storage security rules

echo "Deploying Firebase Security Rules..."

# Deploy Firestore rules
echo "Deploying Firestore rules..."
firebase deploy --only firestore:rules

# Deploy Storage rules
echo "Deploying Storage rules..."
firebase deploy --only storage

echo "Firebase Security Rules deployment completed!"
echo "You may need to wait a few minutes for the rules to take effect."
