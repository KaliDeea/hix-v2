import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";

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
      
      // In a real app, you'd fetch the listing from Firestore here to get the price
      // For now, we'll assume a fixed price or pass it in (less secure)
      // We'll use the price passed from client or fallback to £450 (45000 cents)
      const unitAmount = (amount ? amount * 100 : 45000); 
      
      // Commission logic: 3% buyer commission
      const buyerCommission = Math.round(unitAmount * 0.03);
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
        success_url: `${process.env.APP_URL || "http://localhost:3000"}/dashboard?session_id={CHECKOUT_SESSION_ID}&listing_id=${listingId}&co2=${co2Savings}&seller=${sellerId}&amount=${amount}`,
        cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/marketplace`,
        metadata: {
          listingId,
          buyerId,
          sellerId,
          co2Savings: String(co2Savings),
          amount: String(amount),
          type: "hix_trade"
        }
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe Error:", error);
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
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
