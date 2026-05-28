import { Product } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Classic Men's Slim Fit Linen Shirt",
    description: "Premium pure linen slim fit shirt from DH² Studio. Breathable fabric and precise stitching ensure comfort and elegance. Perfect for casual semi-formal outings and summers. Slogan certified: Wear Your Identity.",
    price: 2499,
    discountPercentage: 20,
    discountedPrice: 1999,
    category: "Men",
    subcategory: "Shirts",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800",
    stock: 45,
    rating: 4.6,
    ratingsCount: 124,
    features: [
      "100% Breathable Organic Linen",
      "Tailor fit styling",
      "Handcrafted mother of pearl buttons",
      "Single patch chest pocket"
    ],
    trending: true,
    reviews: [
      { id: "rev-1-1", userName: "Aarav Sharma", rating: 5, comment: "Fabulous linen quality! Fits exactly like bespoke tailoring. Sizing is spot on.", date: "2026-05-15" },
      { id: "rev-1-2", userName: "John Doe", rating: 4, comment: "Very breathable, perfect for summer premium parties.", date: "2026-05-20" }
    ]
  },
  {
    id: "prod-2",
    name: "Women's Elegant Floral Summer Dress",
    description: "A gorgeous premium flowy floral summer dress crafted with love. Features a delicate waist tie, V-neckline, and detailed hand-block printed visuals. Express your custom look at high status.",
    price: 3999,
    discountPercentage: 25,
    discountedPrice: 2999,
    category: "Women",
    subcategory: "Dresses",
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800",
    stock: 18,
    rating: 4.8,
    ratingsCount: 89,
    features: [
      "Ultra-soft premium rayon chiffon mix",
      "Adjustable wrap waist tie",
      "Ruffled sleeves & flowing silhouette",
      "Hypoallergenic organic vegetable dyes"
    ],
    trending: true,
    reviews: [
      { id: "rev-2-1", userName: "Priya Patel", rating: 5, comment: "Stunning dress! Got so many compliments at a brunch. Lightweight and beautiful print.", date: "2026-05-12" }
    ]
  },
  {
    id: "prod-3",
    name: "Men's Urban Canvas Bomber Jacket",
    description: "A rugged, dual-purpose street jacket combining functional utility with premium styling. Heavyweight canvas exterior with a signature windproof inner-liner. High contrast branding coordinates.",
    price: 4999,
    discountPercentage: 30,
    discountedPrice: 3499,
    category: "Men",
    subcategory: "Jackets",
    image: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?auto=format&fit=crop&q=80&w=800",
    stock: 12,
    rating: 4.5,
    ratingsCount: 56,
    features: [
      "Authentic heavy-duty duck canvas",
      "YKK heavy metal zip closures",
      "Quilted windproof premium insulation",
      "Secret inner zip safety pocket"
    ],
    trending: false,
    reviews: [
      { id: "rev-3-1", userName: "Rahul Verma", rating: 4, comment: "Extremely heavy-duty! Works beautifully in winter evening bike rides.", date: "2026-04-20" }
    ]
  },
  {
    id: "prod-4",
    name: "Classic Camel Wool Trench Coat",
    description: "Elegant double-breasted heavy wool trench coat for women. Complete with structured shoulder lines, a deep double lapel collar, and matching heavy-buckle waist-cinching belt.",
    price: 8999,
    discountPercentage: 15,
    discountedPrice: 7649,
    category: "Women",
    subcategory: "Jackets",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=800",
    stock: 8,
    rating: 4.9,
    ratingsCount: 42,
    features: [
      "80% Pure camel hair & merino wool blend",
      "Luxury satin interior branding lining",
      "Deep storm flap protection cover",
      "Premium structured shoulder pads"
    ],
    trending: true,
    reviews: [
      { id: "rev-4-1", userName: "Meera Sen", rating: 5, comment: "Absolute luxury! The fit is incredible and the material is heavy and warm.", date: "2026-05-18" }
    ]
  },
  {
    id: "prod-5",
    name: "DH² Signature Explorer Multi-Backpack",
    description: "Ultimate water-proof high-grade modular backpack. Features an integrated USB tech-charge connector, designated hard-shell security compartments, and 180-degree flat opening for ease of security clearance.",
    price: 3499,
    discountPercentage: 40,
    discountedPrice: 2099,
    category: "Accessories",
    subcategory: "Bags",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800",
    stock: 75,
    rating: 4.7,
    ratingsCount: 310,
    features: [
      "Premium 1680D high ballistic nylon",
      "Shockproof specialized 16-inch laptop panel",
      "Ergonomic mesh back breathable pads",
      "Dual hidden security passport side openings"
    ],
    trending: true,
    reviews: [
      { id: "rev-5-1", userName: "Vikram Malhotra", rating: 5, comment: "I travel every single week, and this bag easily holds 3 days of clothes plus all my dev gadgets.", date: "2026-05-22" }
    ]
  },
  {
    id: "prod-6",
    name: "DH² Chronos Minimalist Quartz Watch",
    description: "Sleek and professional watch from DH² Studio. Minimalist watch face with high-contrast hands, encased in premium aircraft steel. Fitted with an genuine Italian top-grain hand-crafted leather strap.",
    price: 5999,
    discountPercentage: 35,
    discountedPrice: 3899,
    category: "Accessories",
    subcategory: "Watches",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800",
    stock: 25,
    rating: 4.4,
    ratingsCount: 78,
    features: [
      "Japanese Miyota Quartz exact movement",
      "Hardened anti-scratch mineral display glass",
      "5 ATM waterproof rating",
      "Custom fast-release interchangeable clasp"
    ],
    trending: false,
    reviews: [
      { id: "rev-6-1", userName: "Arjun Dev", rating: 4, comment: "Very elegant design. Looks excellent with suits as well as casual shirts.", date: "2026-05-01" }
    ]
  },
  {
    id: "prod-7",
    name: "Multi-purpose Portable Fabric Steam Iron",
    description: "An absolute essential travel companion to keep your identity sharp and crease-free. Extremely fast dual steam generator heats up under 25 seconds. Ideal for wool, linen, rayon, silk and canvas clothes.",
    price: 2999,
    discountPercentage: 33,
    discountedPrice: 1999,
    category: "Multi-purpose",
    subcategory: "Electronics",
    image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=800",
    stock: 35,
    rating: 4.6,
    ratingsCount: 156,
    features: [
      "Super-fast 25-second rapid steam output",
      "Leakproof multi-angle steam glide",
      "Dual volcanic steam pressure options",
      "Detachable high capacity easy-fill water tank"
    ],
    trending: true,
    reviews: [
      { id: "rev-7-1", userName: "Swati Rao", rating: 5, comment: "Game changer for travel. De-wrinkles shirts in minutes. Highly recommended for premium linen!", date: "2026-05-19" }
    ]
  },
  {
    id: "prod-8",
    name: "Women's Soft Knitted Cloud Cardigan",
    description: "Indulge in absolute cloud comfort. Hand-crafted knit design using rich, soft, pastel cloud-like threads. Easy layering piece for premium office lounging or spring outdoor walks.",
    price: 3499,
    discountPercentage: 20,
    discountedPrice: 2799,
    category: "Women",
    subcategory: "Sweaters",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=800",
    stock: 5,
    rating: 4.7,
    ratingsCount: 29,
    features: [
      "Ultra comfort alpaca wool texture touch",
      "Custom matching tortoise shell style vintage buttons",
      "Elegant oversized cozy boyfriend styling design",
      "Ribbed sleeve cuffs & deep pockets"
    ],
    trending: false,
    reviews: [
      { id: "rev-8-1", userName: "Ananya Iyer", rating: 5, comment: "So soft! It literally feels like wearing a cloud. Hand-washes wonderfully too.", date: "2026-05-24" }
    ]
  }
];
