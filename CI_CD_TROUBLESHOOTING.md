# 🚨 CI/CD Pipeline Troubleshooting Guide

## **Current Issues & Solutions**

### **❌ ISSUE 1: Firebase Authentication Failed**
**Error:** `Request had invalid authentication credentials. Expected OAuth 2 access token`

**SOLUTION: Use Service Account Key Instead of Deprecated Token**

#### **Step 1: Get Your Service Account Key**
1. **Go to:** [Firebase Console](https://console.firebase.google.com/project/gpt1-77ce0)
2. **Click:** Project Settings (gear icon)
3. **Click:** Service Accounts tab
4. **Click:** "Generate new private key"
5. **Download:** The JSON file

#### **Step 2: Add to GitHub Secrets**
1. **Go to:** `https://github.com/erector666/DocVault1/settings/secrets/actions`
2. **Click:** "New repository secret"
3. **Name:** `FIREBASE_SERVICE_ACCOUNT`
4. **Value:** Copy the ENTIRE content of your service account JSON file

**⚠️ IMPORTANT:** Copy the entire JSON content, not just the file!

---

### **❌ ISSUE 2: Vercel Environment Variables Missing**
**Error:** `Environment Variable "REACT_APP_FIREBASE_API_KEY" references Secret "react_app_firebase_api_key", which does not exist`

**SOLUTION: Add Environment Variables to Vercel**

#### **Step 1: Go to Vercel Dashboard**
1. **Visit:** [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Click:** Your `docvault1` project
3. **Click:** Settings tab
4. **Click:** Environment Variables

#### **Step 2: Add These Variables**
**Copy and paste each one:**

```
Name: REACT_APP_FIREBASE_API_KEY
Value: AIzaSyAXBPuFnMNl6UDUrz75h-KFk92pMTtEuis
Environment: Production
```

```
Name: REACT_APP_FIREBASE_AUTH_DOMAIN
Value: gpt1-77ce0.firebaseapp.com
Environment: Production
```

```
Name: REACT_APP_FIREBASE_PROJECT_ID
Value: gpt1-77ce0
Environment: Production
```

```
Name: REACT_APP_FIREBASE_STORAGE_BUCKET
Value: gpt1-77ce0.firebasestorage.app
Environment: Production
```

```
Name: REACT_APP_FIREBASE_MESSAGING_SENDER_ID
Value: 887480132482
Environment: Production
```

```
Name: REACT_APP_FIREBASE_APP_ID
Value: 1:887480132482:web:7f8d166d0d36d4f058e59b
Environment: Production
```

```
Name: REACT_APP_FIREBASE_MEASUREMENT_ID
Value: G-XTCDJJGTD2
Environment: Production
```

```
Name: REACT_APP_FUNCTIONS_BASE_URL
Value: https://us-central1-gpt1-77ce0.cloudfunctions.net
Environment: Production
```

```
Name: NODE_ENV
Value: production
Environment: Production
```

```
Name: REACT_APP_ENV
Value: production
Environment: Production
```

**⚠️ CRITICAL:** Set Environment to **Production** for ALL variables!

---

## **🔧 UPDATED GITHUB SECRETS REQUIRED**

**Replace the old `FIREBASE_TOKEN` with:**

```
Name: FIREBASE_SERVICE_ACCOUNT
Value: [Your entire service account JSON content]
```

**Keep these existing secrets:**
- `VERCEL_TOKEN` = `a44a3P4reINJLOAdCN3NJbhs`
- `VERCEL_ORG_ID` = `a44a3P4reINJLOAdCN3NJbhs`
- `VERCEL_PROJECT_ID` = `prj_x48D62HTN3gWUKSV5ix48dseZ7dF`
- `GOOGLE_TRANSLATE_API_KEY` = `AIzaSyB9-fp3cRPul2gSP9QKEOykzJoox9q9cFY`
- `GOOGLE_LANGUAGE_API_KEY` = `AIzaSyB9-fp3cRPul2gSP9QKEOykzJoox9q9cFY`

---

## **🚀 AFTER FIXING BOTH ISSUES:**

1. **Push any code change** to trigger the pipeline
2. **Monitor GitHub Actions** for successful deployment
3. **Your app will deploy to production!**

---

## **📞 NEED HELP?**

**If you still encounter issues:**
1. **Check GitHub Actions logs** for specific error messages
2. **Verify all secrets** are correctly added
3. **Ensure Vercel environment variables** are set to Production
4. **Make sure service account JSON** is complete and valid

---

**🎯 Once both issues are fixed, your DocVault app will automatically deploy to production!**
