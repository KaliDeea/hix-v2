import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import admin from "firebase-admin";
import firebaseConfig from "./src/firebase-applet-config.json" assert { type: "json" };

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = admin.firestore();
if (firebaseConfig.firestoreDatabaseId) {
  // Note: In some versions of firebase-admin, you might need to specify the databaseId differently
  // but for many cases, the default database is used or it's handled via the projectId.
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      // For demo purposes, we'll allow a fallback if key is missing, 
      // but in production this should throw.
      console.warn("STRIPE_SECRET_KEY is missing. Stripe features will fail.");
      stripeClient = new Stripe("sk_test_placeholder", { apiVersion: "2025-01-27.acacia" });
    } else {
      stripeClient = new Stripe(key, { apiVersion: "2025-01-27.acacia" });
    }
  }
  return stripeClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", name: "HiX API" });
  });

  // Stripe Checkout Session
  app.post("/api/stripe/create-checkout-session", async (req, res) => {
    try {
      const { listingId, buyerId, quantity, co2Savings, sellerId, amount } = req.body;
      const stripe = getStripe();
      
      // Fetch platform settings for commission rates
      const settingsDoc = await db.collection("platform_settings").doc("branding").get();
      const settings = settingsDoc.exists ? settingsDoc.data() : {};
      const buyerRate = settings?.buyerCommission ?? 3;
      const sellerRate = settings?.sellerCommission ?? 7;
      const maintenanceMode = settings?.maintenanceMode ?? false;

      if (maintenanceMode) {
        throw new Error("Platform is currently in maintenance mode. Transactions are disabled.");
      }
      
      // In a real app, you'd fetch the listing from Firestore here to get the price
      // For now, we'll assume a fixed price or pass it in (less secure)
      const unitAmount = (amount ? amount * 100 : 45000); 
      
      // Commission logic
      const buyerCommission = Math.round(unitAmount * (buyerRate / 100));
      const totalAmount = unitAmount + buyerCommission;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: `Industrial Asset Trade (ID: ${listingId})`,
                description: "Hartlepool Industrial Exchange Transaction",
              },
              unit_amount: totalAmount,
            },
            quantity: quantity || 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.APP_URL || "http://localhost:3000"}/dashboard?session_id={CHECKOUT_SESSION_ID}&listing_id=${listingId}&co2=${co2Savings}&seller=${sellerId}&amount=${amount}&buyer_rate=${buyerRate}&seller_rate=${sellerRate}`,
        cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/marketplace`,
        metadata: {
          listingId,
          buyerId,
          sellerId,
          co2Savings: String(co2Savings),
          amount: String(amount),
          buyerRate: String(buyerRate),
          sellerRate: String(sellerRate),
          type: "hix_trade"
        }
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe Subscription Session
  app.post("/api/stripe/create-subscription-session", async (req, res) => {
    try {
      const { priceId, userId, email, planName } = req.body;
      const stripe = getStripe();

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.APP_URL || "http://localhost:3000"}/dashboard?session_id={CHECKOUT_SESSION_ID}&plan=${planName}`,
        cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/pricing`,
        customer_email: email,
        metadata: {
          userId,
          planName,
          type: "hix_subscription"
        }
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe Subscription Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe webhook placeholder
  app.post("/api/webhooks/stripe", express.raw({ type: 'application/json' }), (req, res) => {
    res.json({ received: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send("Production build found but index.html is missing. Please run npm run build.");
        }
      });
    } else {
      app.get('*', (req, res) => {
        res.status(500).send("Production mode enabled but 'dist' directory is missing. Please run npm run build or set NODE_ENV=development.");
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
