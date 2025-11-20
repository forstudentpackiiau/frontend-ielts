#!/bin/bash

# IELTS Exam System - Quick Deploy Script
# This script helps you deploy to Vercel quickly

echo "🚀 IELTS Exam System - Vercel Deployment Helper"
echo "================================================"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    echo "   Download from: https://git-scm.com"
    exit 1
fi

# Check if this is a git repository
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - IELTS Exam System"
    echo "✅ Git repository initialized"
    echo ""
fi

# Check if remote is set
if ! git remote | grep -q origin; then
    echo "⚠️  No remote repository found."
    echo ""
    echo "Please follow these steps:"
    echo "1. Go to https://github.com/new"
    echo "2. Create a new repository (don't add README, .gitignore, or license)"
    echo "3. Copy the repository URL"
    echo "4. Run: git remote add origin YOUR_REPO_URL"
    echo "5. Run: git push -u origin main"
    echo ""
    echo "After that, you can deploy to Vercel:"
    echo "1. Go to https://vercel.com/dashboard"
    echo "2. Click 'Add New Project'"
    echo "3. Import your GitHub repository"
    echo "4. Follow the DEPLOYMENT_GUIDE.md for detailed instructions"
    exit 0
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git add .
git commit -m "Prepare for Vercel deployment - $(date +%Y-%m-%d\ %H:%M:%S)"
git push

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub"
    echo ""
    echo "Next steps:"
    echo "1. Go to https://vercel.com/dashboard"
    echo "2. Click 'Add New Project'"
    echo "3. Import your GitHub repository"
    echo "4. Follow the DEPLOYMENT_GUIDE.md for detailed instructions"
    echo ""
    echo "📚 See DEPLOYMENT_GUIDE.md for complete instructions"
else
    echo "❌ Failed to push to GitHub"
    echo "Please check your remote repository and try again"
fi
