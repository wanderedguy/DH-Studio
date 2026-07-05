import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { INITIAL_PRODUCTS } from "./src/data/initialProducts.js"; // Use js extension for ESM compatibility
import { Product, Order, Coupon, User, Review } from "./src/types";

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json());

// Initialize Local JSON database file
const DB_FILE = path.join(process.cwd(), "database.json");

// Default initial state
const defaultDb = {
  products: INITIAL_PRODUCTS,
  users: [
    {
      id: "user-admin",
      name: "DH2 Admin",
      email: "admin@dh2studio.com",
      password: "admin", // Simple password for demonstration
      role: "admin" as const,
      phone: "+91 99999 88888",
      savedAddresses: ["DH2 Studio Corporate HQ, New Delhi, India"],
      wishlist: []
    },
    {
      id: "user-harishdynamo",
      name: "Harish Dynamo",
      email: "harishdynamo@gmail.com",
      password: "Devashri@1723",
      role: "admin" as const,
      phone: "+91 98765 43210",
      savedAddresses: ["H-204, Green Meadows, Sector 45, Gurgaon, HR"],
      wishlist: []
    },
    {
      id: "user-customer",
      name: "Harish Dynamo",
      email: "customer@dh2studio.com",
      password: "customer", // Simple password
      role: "customer" as const,
      phone: "+91 98765 43210",
      savedAddresses: ["H-204, Green Meadows, Sector 45, Gurgaon, HR"],
      wishlist: ["prod-1", "prod-4"]
    }
  ],
  orders: [
    {
      id: "ord-88392",
      userId: "user-customer",
      customerName: "Harish Dynamo",
      customerEmail: "customer@dh2studio.com",
      items: [
        {
          product: INITIAL_PRODUCTS[0], // Classic Men's Linen Shirt
          quantity: 1,
          selectedSize: "L"
        },
        {
          product: INITIAL_PRODUCTS[5], // Classic Quartz Watch
          quantity: 1
        }
      ],
      subtotal: 8498,
      discount: 1000,
      deliveryCharge: 0,
      total: 7498,
      paymentMethod: "UPI" as const,
      paymentDetails: { upiId: "harish@upi" },
      couponCode: "DH2WELCOME",
      shippingAddress: "H-204, Green Meadows, Sector 45, Gurgaon, HR",
      shippingPhone: "+91 98765 43210",
      status: "Shipped" as const,
      orderDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
      trackingUpdates: [
        { status: "Order Placed", date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), description: "Your order has been placed successfully." },
        { status: "Processing", date: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), description: "We are packed and assembling your selected identities." },
        { status: "Shipped", date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), description: "In transit from Delhi gateway Hub via Bluedart tracking ID BD773628." }
      ]
    }
  ],
  coupons: [
    {
      code: "DH2WELCOME",
      discountPercentage: 15,
      minPurchaseAmount: 1499,
      description: "Welcome offer of 15% off for new studio customers!",
      isActive: true
    },
    {
      code: "FESTIVE30",
      discountPercentage: 30,
      minPurchaseAmount: 2999,
      description: "Elevate your identity - Special 30% discount on orders above ₹2,999",
      isActive: true
    },
    {
      code: "CODERSPECIAL",
      discountPercentage: 50,
      minPurchaseAmount: 999,
      description: "Developer appreciation offer - Flat 50% discount",
      isActive: true
    }
  ],
  notifications: [
    {
      id: "nt-1",
      title: "🔥 Summer Wardrobe Mega Sale",
      description: "Get up to 40% discount on Men's Premium Linen Shirts and Women's Designer Floral Summer collection. Valid this week!",
      date: new Date().toISOString()
    },
    {
      id: "nt-2",
      title: "📦 Order BD773628 Shipped",
      description: "Your DH² Studio clothing package is on its way. Expect tracking to updates shortly.",
      date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    }
  ]
};

// Database read/write helpers
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2));
      return defaultDb;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    let updated = false;
    if (parsed.users) {
      const harishUser = parsed.users.find((u: any) => u.email.toLowerCase() === "harishdynamo@gmail.com");
      if (harishUser && harishUser.password !== "Devashri@1723") {
        harishUser.password = "Devashri@1723";
        updated = true;
      }
    }
    if (updated) {
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
    }
    return parsed;
  } catch (err) {
    console.error("Error reading db.json, returning default", err);
    return defaultDb;
  }
}

function writeDb(data: typeof defaultDb) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error saving to database.json", err);
  }
}

// Ensure database file is initialized when server starts
readDb();

// -----------------------------------------------------------------
// GEMINI SDK CLIENT SETUP
// -----------------------------------------------------------------
let ai: GoogleGenAI | null = null;
const geminiKey = process.env.GEMINI_API_KEY;

if (geminiKey && geminiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (e) {
    console.error("Could not construct Gemini client", e);
  }
} else {
  console.warn("GEMINI_API_KEY is not defined in the environment. AI Chatbot will run in offline mode.");
}

// -----------------------------------------------------------------
// API ENDPOINTS
// -----------------------------------------------------------------

// Live state query log
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", time: new Date().toISOString() });
});

// 1. PRODUCTS ROUTER
app.get("/api/products", (req, res) => {
  const db = readDb();
  res.json(db.products);
});

// Admin product create
app.post("/api/products", (req, res) => {
  const db = readDb();
  const rawBody = req.body;
  
  if (!rawBody.name || !rawBody.price || !rawBody.category) {
    return res.status(400).json({ error: "Missing required fields (name, price, category)" });
  }

  const discountVal = parseFloat(rawBody.discountPercentage) || 0;
  const originalPrice = parseFloat(rawBody.price);
  const calculatedOfferPrice = Math.round(originalPrice * (1 - discountVal / 100));

  const newProduct: Product = {
    id: "prod-" + Date.now(),
    name: rawBody.name,
    description: rawBody.description || "Premium designer merchandise from DH² Studio. Brand slogan: Wear Your Identity.",
    price: originalPrice,
    discountPercentage: discountVal,
    discountedPrice: calculatedOfferPrice,
    category: rawBody.category,
    subcategory: rawBody.subcategory || "General",
    image: rawBody.image || "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800",
    images: Array.isArray(rawBody.images) ? rawBody.images : [],
    stock: parseInt(rawBody.stock) || 10,
    rating: 5.0,
    ratingsCount: 1,
    features: rawBody.features || ["Authentic Studio Quality Designer Fit"],
    trending: !!rawBody.trending,
    reviews: []
  };

  db.products.push(newProduct);
  writeDb(db);
  res.status(201).json({ success: true, product: newProduct });
});

app.put("/api/products/:id", (req, res) => {
  const db = readDb();
  const prodId = req.params.id;
  const targetIndex = db.products.findIndex((p: Product) => p.id === prodId);

  if (targetIndex === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  const current = db.products[targetIndex];
  const updateBody = req.body;

  const originalPrice = updateBody.price !== undefined ? parseFloat(updateBody.price) : current.price;
  const discountVal = updateBody.discountPercentage !== undefined ? parseFloat(updateBody.discountPercentage) : current.discountPercentage;
  const calculatedOfferPrice = Math.round(originalPrice * (1 - discountVal / 100));

  const updatedProduct: Product = {
    ...current,
    ...updateBody,
    price: originalPrice,
    discountPercentage: discountVal,
    discountedPrice: calculatedOfferPrice,
    stock: updateBody.stock !== undefined ? parseInt(updateBody.stock) : current.stock,
  };

  db.products[targetIndex] = updatedProduct;
  writeDb(db);
  res.json({ success: true, product: updatedProduct });
});

app.delete("/api/products/:id", (req, res) => {
  const db = readDb();
  const prodId = req.params.id;
  const initialLength = db.products.length;
  
  db.products = db.products.filter((p: Product) => p.id !== prodId);
  
  if (db.products.length === initialLength) {
    return res.status(404).json({ error: "Product not found" });
  }

  writeDb(db);
  res.json({ success: true, message: `Product ${prodId} deleted.` });
});

// Auto-import product details from a URL
app.post("/api/admin/import-product", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "Product URL is required" });
  }

  try {
    let htmlContent = "";
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5"
        },
        signal: AbortSignal.timeout(6000)
      });
      if (response.ok) {
        htmlContent = await response.text();
      }
    } catch (fetchErr) {
      console.warn("Failed to fetch product URL content directly:", fetchErr);
    }

    let cleanedHtml = "";
    if (htmlContent) {
      cleanedHtml = htmlContent
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
        .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "")
        .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
        .replace(/<\/?[a-z0-9]+[^>]*>/gi, (match) => {
          if (match.startsWith("</")) return match;
          const tagNameMatch = match.match(/^<([a-z0-9]+)/i);
          if (!tagNameMatch) return "";
          const tagName = tagNameMatch[1].toLowerCase();
          
          const keepAttrs = ["src", "href", "alt", "title", "content", "property"];
          const attrs: string[] = [];
          for (const attr of keepAttrs) {
            const regex = new RegExp(`\\b${attr}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
            const m = match.match(regex);
            if (m) {
              const val = m[1] || m[2] || m[3];
              if (val) attrs.push(`${attr}="${val.replace(/"/g, '&quot;')}"`);
            }
          }
          return `<${tagName}${attrs.length ? " " + attrs.join(" ") : ""}>`;
        })
        .replace(/\s+/g, " ")
        .substring(0, 30000);
    }

    if (!ai) {
      // Fallback if Gemini key is missing: extract from URL
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const host = urlObj.hostname;
      const parts = pathname.split("/").filter(Boolean);
      const lastPart = parts[parts.length - 1] || "imported-product";
      const name = lastPart
        .replace(/[-_]+/g, " ")
        .replace(/\.[a-z0-9]+$/i, "")
        .replace(/\b[a-z]/g, (char) => char.toUpperCase());

      const priceMatch = cleanedHtml.match(/(?:Rs\.?|₹|INR|\$)\s*([\d,]+(?:\.\d{2})?)/i);
      const parsedPrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, "")) : 1899;

      const fallbackProduct = {
        name: name || "Imported Premium Apparel",
        description: `Premium garment imported from ${host}. Tailored with absolute precision using premium cotton and durable stitch layouts. Perfect addition to any modern casual or formal wardrobe.`,
        price: parsedPrice,
        discountPercentage: 15,
        discountedPrice: Math.round(parsedPrice * 0.85),
        category: "Men",
        subcategory: "Shirts",
        image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800",
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800",
          "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=800"
        ],
        stock: 25,
        rating: 4.6,
        ratingsCount: 14,
        features: [
          `Brand: ${host.replace("www.", "").split(".")[0].toUpperCase()}`,
          "SKU: DH-IMP-" + Math.floor(Math.random() * 90000 + 10000),
          "Variants: S, M, L, XL, XXL",
          "Material: 100% Premium Stretch Cotton",
          "Style: Casual collar comfort stitch layout"
        ]
      };
      return res.json({ success: true, product: fallbackProduct, mode: "fallback" });
    }

    const systemPrompt = `You are a precise data extraction specialist for the DH² Studio boutique e-commerce application.
Your task is to analyze the provided URL and optional HTML content of a product detail page, and extract or deduce the product details into a structured JSON response matching the following constraints:

Product fields to return:
- name: The full, clean title/name of the product (e.g. "Roadster Men Black Solid Casual Shirt").
- description: A beautiful, detailed, professional sales description of the product. Minimum 2 sentences. Include materials or style highlights. Mention brand and SKU if found.
- price: The regular/original price of the product as a number (e.g. 2499). If only one price is found, use that. Ensure it is in Indian Rupees (INR) or a reasonable clothing price range (e.g., ₹499 to ₹9999).
- discountPercentage: The discount percentage as an integer (e.g., 20). If no discount is specified, default to 15.
- discountedPrice: The price after discount as an integer (calculated as price * (1 - discountPercentage/100)).
- category: Must be strictly one of these values: "Men", "Women", "Unisex", "Accessories", "Multi-purpose". Select the best match based on product gender or type.
- subcategory: The subcategory of the item (e.g. "Shirts", "T-Shirts", "Jeans", "Dresses", "Watches", "Wallets").
- image: A valid image URL from the page content (e.g., looking at src attributes in the HTML). If none of the image URLs look high quality or none exist, use a gorgeous placeholder from Unsplash matching the product type (e.g. for shirts, dresses, etc.).
- images: An array of 2 to 4 other valid product image URLs found on the page, or relevant high-quality Unsplash placeholder image URLs of similar apparel.

Analyze the URL: "${url}"
And HTML context: "${cleanedHtml}"

Respond with ONLY a clean JSON object containing the fields specified above, and nothing else. No markdown block formatting around the JSON, no backticks, just raw JSON.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: "The full, clean title/name of the product (e.g. 'Roadster Men Black Solid Casual Shirt')."
        },
        description: {
          type: Type.STRING,
          description: "A beautiful, detailed, professional sales description of the product. Minimum 2 sentences. Include materials or style highlights. Mention brand and SKU if found."
        },
        price: {
          type: Type.NUMBER,
          description: "The regular/original price of the product as a number (e.g. 2499). Ensure it is in Indian Rupees (INR) or a reasonable clothing price range (e.g. ₹499 to ₹9999)."
        },
        discountPercentage: {
          type: Type.INTEGER,
          description: "The discount percentage as an integer (e.g. 20). Default to 15 if not obvious."
        },
        discountedPrice: {
          type: Type.INTEGER,
          description: "The price after discount as an integer."
        },
        category: {
          type: Type.STRING,
          description: "Must be strictly one of these values: 'Men', 'Women', 'Unisex', 'Accessories', 'Multi-purpose'."
        },
        subcategory: {
          type: Type.STRING,
          description: "The subcategory of the item (e.g. 'Shirts', 'T-Shirts', 'Jeans', 'Dresses', 'Watches', 'Wallets')."
        },
        image: {
          type: Type.STRING,
          description: "A valid image URL from the page content. If none of the image URLs look high quality or none exist, use a gorgeous placeholder from Unsplash matching the product type."
        },
        images: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          },
          description: "An array of 2 to 4 other valid product image URLs, or high-quality Unsplash image URLs of similar apparel."
        },
        stock: {
          type: Type.INTEGER,
          description: "A reasonable stock quantity as an integer (e.g. 25)."
        },
        features: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          },
          description: "An array of 3 to 5 bullet points listing specifications, materials, fit, or product highlights. Include 'Brand: <Value>', 'SKU: <Value>', and 'Variants: <Value>' as separate elements if possible."
        }
      },
      required: ["name", "description", "price", "discountPercentage", "discountedPrice", "category", "subcategory", "image", "images", "stock", "features"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const textOutput = response.text?.trim() || "";
    let parsedProduct;

    // Robust JSON extraction and fallback cleaning helper
    try {
      parsedProduct = JSON.parse(textOutput);
    } catch (firstErr) {
      console.warn("Direct JSON.parse failed. Attempting robust parsing...", firstErr);
      try {
        const firstBrace = textOutput.indexOf("{");
        const lastBrace = textOutput.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const jsonSubstring = textOutput.substring(firstBrace, lastBrace + 1);
          parsedProduct = JSON.parse(jsonSubstring);
        } else {
          throw firstErr;
        }
      } catch (substringErr) {
        console.error("Substring parsing failed. Trying markdown block clean...", substringErr);
        try {
          const cleanedText = textOutput
            .replace(/^```json\s*/i, "")
            .replace(/```\s*$/, "")
            .trim();
          parsedProduct = JSON.parse(cleanedText);
        } catch (markdownErr) {
          throw new Error("Unable to parse Gemini output as structured JSON. Raw output: " + textOutput.substring(0, 200));
        }
      }
    }

    if (parsedProduct) {
      if (!parsedProduct.name) parsedProduct.name = "Premium Imported Item";
      parsedProduct.price = parseFloat(parsedProduct.price) || 1499;
      parsedProduct.discountPercentage = parseInt(parsedProduct.discountPercentage) || 15;
      parsedProduct.discountedPrice = Math.round(parsedProduct.price * (1 - parsedProduct.discountPercentage / 100));
      const allowedCats = ["Men", "Women", "Unisex", "Accessories", "Multi-purpose"];
      if (!allowedCats.includes(parsedProduct.category)) {
        parsedProduct.category = "Men";
      }
      if (!parsedProduct.subcategory) parsedProduct.subcategory = "Apparel";
      if (!parsedProduct.image || !parsedProduct.image.startsWith("http")) {
        parsedProduct.image = "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800";
      }
      if (!Array.isArray(parsedProduct.images)) {
        parsedProduct.images = [];
      }
      parsedProduct.images = parsedProduct.images.filter((img: any) => typeof img === "string" && img.startsWith("http"));
      if (parsedProduct.images.length === 0) {
        parsedProduct.images = [
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800",
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800",
          "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=800"
        ];
      }
      if (!parsedProduct.stock) parsedProduct.stock = 25;
      
      // Ensure the requested fields SKU, Brand, and Variants exist in features or append them
      if (!Array.isArray(parsedProduct.features)) {
        parsedProduct.features = [];
      }
      const hasBrand = parsedProduct.features.some((f: string) => f.toLowerCase().startsWith("brand:"));
      const hasSku = parsedProduct.features.some((f: string) => f.toLowerCase().startsWith("sku:"));
      const hasVariants = parsedProduct.features.some((f: string) => f.toLowerCase().startsWith("variants:"));
      
      if (!hasBrand) {
        const host = new URL(url).hostname.replace("www.", "").split(".")[0];
        parsedProduct.features.unshift(`Brand: ${host.charAt(0).toUpperCase() + host.slice(1)}`);
      }
      if (!hasSku) {
        parsedProduct.features.push(`SKU: DH-IMP-${Math.floor(Math.random() * 90000 + 10000)}`);
      }
      if (!hasVariants) {
        parsedProduct.features.push("Variants: S, M, L, XL, XXL");
      }
    }

    res.json({ success: true, product: parsedProduct, mode: "gemini" });

  } catch (err: any) {
    console.error("Error importing product:", err);
    res.status(500).json({ error: "Failed to automatically import product details: " + err.message });
  }
});

// Post review/comment
app.post("/api/products/:id/review", (req, res) => {
  const db = readDb();
  const prodId = req.params.id;
  const { userName, rating, comment } = req.body;

  if (!userName || !rating || !comment) {
    return res.status(400).json({ error: "Missing review fields (userName, rating, comment)" });
  }

  const targetIndex = db.products.findIndex((p: Product) => p.id === prodId);
  if (targetIndex === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  const product = db.products[targetIndex];
  const newReview: Review = {
    id: "rev-" + Date.now(),
    userName,
    rating: parseInt(rating),
    comment,
    date: new Date().toISOString().split("T")[0]
  };

  product.reviews.unshift(newReview);
  
  // Recalculate average rating
  const totalRatingSum = product.reviews.reduce((acc, curr) => acc + curr.rating, 0);
  product.ratingsCount = product.reviews.length;
  product.rating = parseFloat((totalRatingSum / product.reviews.length).toFixed(1));

  writeDb(db);
  res.json({ success: true, product });
});


// 2. AUTHENTICATION ROUTER
app.post("/api/auth/login", (req, res) => {
  const db = readDb();
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const foundUser = db.users.find(
    (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!foundUser) {
    return res.status(401).json({ error: "Invalid email credentials or password" });
  }

  // Omit sensitive password
  const { password: _, ...userNoPassword } = foundUser;
  res.json({ success: true, user: userNoPassword });
});

app.post("/api/auth/signup", (req, res) => {
  const db = readDb();
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required" });
  }

  const exists = db.users.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Email already exists in our system" });
  }

  const newUser = {
    id: "user-" + Date.now(),
    name,
    email: email.toLowerCase(),
    password,
    role: "customer" as const,
    phone: phone || "",
    savedAddresses: [],
    wishlist: []
  };

  db.users.push(newUser);
  writeDb(db);

  const { password: _, ...userNoPassword } = newUser;
  res.status(201).json({ success: true, user: userNoPassword });
});

app.post("/api/auth/wishlist", (req, res) => {
  const db = readDb();
  const { userId, productId } = req.body;
  if (!userId || !productId) return res.status(400).json({ error: "Missing parameters" });

  const idx = db.users.findIndex((u: any) => u.id === userId);
  if (idx === -1) return res.status(404).json({ error: "User not found" });

  const user = db.users[idx];
  if (!user.wishlist) user.wishlist = [];

  const wishIdx = user.wishlist.indexOf(productId);
  if (wishIdx > -1) {
    user.wishlist.splice(wishIdx, 1); // toggle: remove
  } else {
    user.wishlist.push(productId); // toggle: add
  }

  writeDb(db);
  const { password: _, ...userNoPassword } = user;
  res.json({ success: true, user: userNoPassword });
});


// 3. ORDERS ROUTER
app.get("/api/orders", (req, res) => {
  const db = readDb();
  const { userId } = req.query;

  if (userId) {
    const userOrders = db.orders.filter((o: Order) => o.userId === userId);
    return res.json(userOrders);
  }

  res.json(db.orders);
});

app.post("/api/orders", (req, res) => {
  const db = readDb();
  const {
    userId,
    customerName,
    customerEmail,
    items,
    subtotal,
    discount,
    deliveryCharge,
    total,
    paymentMethod,
    paymentDetails,
    couponCode,
    shippingAddress,
    shippingPhone
  } = req.body;

  if (!items || items.length === 0 || !shippingAddress || !shippingPhone) {
    return res.status(400).json({ error: "Missing critical order specs (items, address, or phone)" });
  }

  const newOrder: Order = {
    id: "ord-" + Math.floor(10000 + Math.random() * 90000), // Random 5 digit ID
    userId: userId || "guest",
    customerName: customerName || "Guest shopper",
    customerEmail: customerEmail || "guest@dh2studio.com",
    items,
    subtotal,
    discount: discount || 0,
    deliveryCharge: deliveryCharge || 0,
    total,
    paymentMethod,
    paymentDetails,
    couponCode,
    shippingAddress,
    shippingPhone,
    status: "Order Placed",
    orderDate: new Date().toISOString(),
    trackingUpdates: [
      {
        status: "Order Placed",
        date: new Date().toISOString(),
        description: "Your order has been recorded in the DH² Studio network."
      }
    ]
  };

  db.orders.unshift(newOrder);

  // Reduce product stock counters safely
  items.forEach((item: any) => {
    const pIdx = db.products.findIndex((p: Product) => p.id === item.product.id);
    if (pIdx > -1) {
      db.products[pIdx].stock = Math.max(0, db.products[pIdx].stock - item.quantity);
    }
  });

  // Create notifications of placing order
  db.notifications.unshift({
    id: "nt-" + Date.now(),
    title: `📦 Order ${newOrder.id} Placed`,
    description: `Thank you, ${newOrder.customerName}. Your clothing and merchandise packages of ₹${newOrder.total} are being prepared.`,
    date: new Date().toISOString()
  });

  writeDb(db);
  res.status(201).json({ success: true, order: newOrder });
});

// Admin change order status
app.put("/api/orders/:id/status", (req, res) => {
  const db = readDb();
  const orderId = req.params.id;
  const { status, description } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status field is required" });
  }

  const oIdx = db.orders.findIndex((o: Order) => o.id === orderId);
  if (oIdx === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  const order = db.orders[oIdx];
  order.status = status;
  order.trackingUpdates.push({
    status,
    date: new Date().toISOString(),
    description: description || `Order delivery status updated to ${status}.`
  });

  // Trigger app notification
  db.notifications.unshift({
    id: "nt-" + Date.now(),
    title: `🚚 Order ${order.id} update`,
    description: `Your order is now: ${status}. Desc: ${description || "In transit"}`,
    date: new Date().toISOString()
  });

  writeDb(db);
  res.json({ success: true, order });
});

// 4. COUPONS ROUTER
app.get("/api/coupons", (req, res) => {
  const db = readDb();
  res.json(db.coupons);
});

// Validate coupon endpoint
app.post("/api/coupons/validate", (req, res) => {
  const db = readDb();
  const { code, amount } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Coupon code is required" });
  }

  const coupon = db.coupons.find(
    (c: Coupon) => c.code.toUpperCase() === code.toUpperCase() && c.isActive
  );

  if (!coupon) {
    return res.status(404).json({ error: "Invalid, expired or inactive coupon code." });
  }

  if (amount < coupon.minPurchaseAmount) {
    return res.status(400).json({ 
      error: `Coupon minimum checkout cart value required is ₹${coupon.minPurchaseAmount}. Your subtotal is ₹${amount}.` 
    });
  }

  res.json({ success: true, coupon });
});


// 5. NOTIFICATIONS ROUTER
app.get("/api/notifications", (req, res) => {
  const db = readDb();
  res.json(db.notifications);
});


// 6. GEMINI CUSTOMER CHATBOT AGENT
app.post("/api/gemini/chat", async (req, res) => {
  const db = readDb();
  const { messages } = req.body; // array of: { sender: 'user'|'assistant', text: string }

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  const userQuery = messages[messages.length - 1].text;

  // Format products list dynamically so the bot has fully updated real data
  const shortProductsContext = db.products.map((p: Product) => {
    return `- [ID: ${p.id}] "${p.name}" | Category: ${p.category} -> ${p.subcategory} | Price: ₹${p.discountedPrice} (Original: ₹${p.price}, ${p.discountPercentage}% off) | Rating: ⭐${p.rating} (${p.ratingsCount} reviews) | Stock left: ${p.stock} | Features: ${p.features?.join(", ") || "None"}.`;
  }).join("\n");

  const promoCodeContext = db.coupons.map((c: Coupon) => {
    return `- CODE: "${c.code}" | ${c.discountPercentage}% discount | Min order size: ₹${c.minPurchaseAmount} | Description: ${c.description}.`;
  }).join("\n");

  const chatbotSystemPrompt = `You are "DH² Spark", the helpful, brilliant, visual, and energetic AI Assistant for "DH² Studio" premium clothes & multi-purpose store.
Your main personality characteristics are: professional customer focus, high-class styling support, and warm hospitality.
Our brand slogan is "Wear Your Identity" (WEAR YOUR IDENTITY).
Your knowledge includes a local copy of our products catalog and active promo codes. Talk nicely about these real products! Do not lie or invent arbitrary products. Suggest similar/recommended options from this list if an item matches.

Here is our live DH² Studio products catalog:
${shortProductsContext}

Here are the active promo / coupon codes:
${promoCodeContext}

IMPORTANT PROCEDURAL RULES:
1. If the user asks for suggestions or styling, suggest actual products from the list above and mention their price, original price, discount percentage and stock!
2. Do not reveal raw IDs to the customer directly like "prod-1", but format them beautifully. For example: "Classic Men's Slim Fit Linen Shirt" for ₹1,999 (₹2,499 with 20% Off).
3. Be supportive on orders tracking (tell them to check their profile or track status using their order order tracker block), return/refund policies (DH2 Studio has a 7-day hassle-free return policy), and checkout assistance.
4. Keep answers relatively concise, readable, and structured using clean light markdown or bullet points. Avoid dry paragraphs of text.
`;

  if (!ai) {
    // Offline mode response if API key is missing
    const offlineBotResponse = getOfflineBotResponse(userQuery, db.products);
    return res.json({ text: offlineBotResponse });
  }

  try {
    // Map conversation history over to Gemini format
    const contents = messages.map((m: any) => {
      return {
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      };
    });

    // Make API Call in recommended setup (3.5-flash)
    const chatResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: chatbotSystemPrompt,
        temperature: 0.7
      }
    });

    res.json({ text: chatResponse.text });
  } catch (err: any) {
    console.error("Gemini chatbot error, falling back to heuristic answers:", err);
    const fallbackResponse = getOfflineBotResponse(userQuery, db.products);
    res.json({ text: fallbackResponse });
  }
});

// A robust local response selector in case the user has no Gemini Key set up yet!
function getOfflineBotResponse(query: string, products: Product[]): string {
  const qLower = query.toLowerCase();
  
  if (qLower.includes("hello") || qLower.includes("hi") || qLower.includes("hey")) {
    return "Hello there! Welcome to **DH² Studio** where you can *Wear Your Identity*. I am your friendly companion **DH² Spark**. How can I assist you with your fashion search or orders today?";
  }
  
  if (qLower.includes("coupon") || qLower.includes("promo") || qLower.includes("discount") || qLower.includes("code")) {
    return "We have wonderful deals active right now! \n\n" +
      "1. **DH2WELCOME**: Get **15% Off** for newly registered customers (Min order: ₹1,499).\n" +
      "2. **FESTIVE30**: **30% Off** on all studio picks above ₹2,999!\n" +
      "3. **CODERSPECIAL**: **50% Off** appreciation discount! \n\nYou can apply any of these at the checkout screen before placing your order.";
  }

  if (qLower.includes("men") || qLower.includes("shirt") || qLower.includes("boy") || qLower.includes("jacket")) {
    const menProds = products.filter(p => p.category === "Men");
    let response = "Based on our Men's apparel list, here are some elegant DH² options to *Wear Your Identity*: \n\n";
    menProds.forEach(p => {
      response += `- **${p.name}**: ₹${p.discountedPrice} (Save ${p.discountPercentage}%! Original ₹${p.price}). It is perfect for ${p.subcategory}. \n`;
    });
    return response;
  }

  if (qLower.includes("women") || qLower.includes("dress") || qLower.includes("girl") || qLower.includes("cardigan")) {
    const womenProds = products.filter(p => p.category === "Women");
    let response = "Here are our signature designer pieces curated for women: \n\n";
    womenProds.forEach(p => {
      response += `- **${p.name}**: Special Price of ₹${p.discountedPrice} (${p.discountPercentage}% Off!). Highly rated at ⭐${p.rating}/5. \n`;
    });
    return response;
  }

  if (qLower.includes("tracker") || qLower.includes("track") || qLower.includes("order") || qLower.includes("where is my")) {
    return "You can track any active package directly in real-time! Simply go to your **User Profile > Orders History** tab and click on the 'Interactive Tracker' button. It displays stage-by-stage routing updates instantly.";
  }

  // Default response listing popular categories
  return "Thanks for asking! I can help you find premium Men's & Women's clothing, travel bags, chronometers or lifestyle multi-purpose electronics. Feel free to search using our high-contrast search bar or type specific products like 'Summer Dress', 'Linen Shirt', or ask about 'promo codes'!";
}


// -----------------------------------------------------------------
// VITE OR STATIC ASSETS ROUTING
// -----------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in Development Mode (with Vite live middleware Proxy)");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in Production Mode (serving compiled static assets)");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DH² Studio Full-Stack app running at http://localhost:${PORT}`);
  });
}

startServer();
