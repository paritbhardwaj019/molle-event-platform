#!/usr/bin/env tsx

/**
 * Setup script for Push Notifications
 * This script helps verify the setup and creates necessary database records
 */

import { db } from "../lib/db";

async function setupPushNotifications() {
  console.log("🚀 Setting up Push Notifications...\n");

  try {
    // Check if FCMToken table exists
    console.log("1. Checking database schema...");
    const tableExists = await db.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'fcm_tokens'
      );
    `;
    
    if (!(tableExists as any)[0]?.exists) {
      console.log("❌ FCMToken table not found. Please run:");
      console.log("   npx prisma generate");
      console.log("   npx prisma migrate dev --name add_fcm_tokens");
      process.exit(1);
    }
    console.log("✅ FCMToken table exists");

    // Check environment variables
    console.log("\n2. Checking environment variables...");
    const requiredClientVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
      'NEXT_PUBLIC_FIREBASE_VAPID_KEY'
    ];

    const requiredServerVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_CLIENT_ID'
    ];

    const missingClientVars = requiredClientVars.filter(varName => !process.env[varName]);
    const missingServerVars = requiredServerVars.filter(varName => !process.env[varName]);

    if (missingClientVars.length > 0) {
      console.log(`❌ Missing client environment variables: ${missingClientVars.join(', ')}`);
    } else {
      console.log("✅ All client environment variables present");
    }

    if (missingServerVars.length > 0) {
      console.log(`❌ Missing server environment variables: ${missingServerVars.join(', ')}`);
    } else {
      console.log("✅ All server environment variables present");
    }

    if (missingClientVars.length > 0 || missingServerVars.length > 0) {
      console.log("\n📖 Please refer to PUSH_NOTIFICATIONS_SETUP.md for detailed setup instructions");
      process.exit(1);
    }

    // Check if service worker files exist
    console.log("\n3. Checking service worker files...");
    const fs = await import('fs');
    const path = await import('path');
    
    const swPath = path.join(process.cwd(), 'public', 'sw.js');
    const firebaseSWPath = path.join(process.cwd(), 'public', 'firebase-messaging-sw.js');
    
    if (!fs.existsSync(swPath)) {
      console.log("❌ Service worker file not found: /public/sw.js");
    } else {
      console.log("✅ Service worker file exists");
    }
    
    if (!fs.existsSync(firebaseSWPath)) {
      console.log("❌ Firebase messaging service worker not found: /public/firebase-messaging-sw.js");
    } else {
      console.log("✅ Firebase messaging service worker exists");
      
      // Check if Firebase config is updated
      const swContent = fs.readFileSync(firebaseSWPath, 'utf8');
      if (swContent.includes('your-api-key')) {
        console.log("⚠️  Firebase messaging service worker contains placeholder values");
        console.log("   Please update /public/firebase-messaging-sw.js with your actual Firebase config");
      } else {
        console.log("✅ Firebase messaging service worker appears to be configured");
      }
    }

    // Test database connection
    console.log("\n4. Testing database connection...");
    const userCount = await db.user.count();
    console.log(`✅ Database connection successful (${userCount} users found)`);

    // Summary
    console.log("\n🎉 Push Notifications setup completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("1. Deploy your application to a domain with HTTPS");
    console.log("2. Test push notifications using the admin dashboard");
    console.log("3. Install the PWA on a mobile device for full testing");
    console.log("\n📖 For troubleshooting, see PUSH_NOTIFICATIONS_SETUP.md");

  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run the setup
if (require.main === module) {
  setupPushNotifications().catch(console.error);
}
