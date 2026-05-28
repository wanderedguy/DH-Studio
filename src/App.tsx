import React, { useState, useEffect } from 'react';
import { Sparkles, ShoppingBag, Tag, ArrowRight, Heart, Star, CheckCircle, Bell, VolumeX, Mail } from 'lucide-react';

// Subcomponents
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import ProductDetailsModal from './components/ProductDetailsModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import TrackerModal from './components/TrackerModal';
import AdminDashboard from './components/AdminDashboard';
import AIChatbot from './components/AIChatbot';
import LoginModal from './components/LoginModal';

import { Product, CartItem, Order, User, Coupon, ChatMessage } from './types';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme-mode') === 'dark';
  });

  // DB States
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // User Authentication State
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('dh2-session-user');
    return saved ? JSON.parse(saved) : null;
  });

  // Cart & Wishlist State
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('dh2-cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    return user?.wishlist || [];
  });

  // UI Drawer/Modal Flags
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  
  // Selection overlays
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<Order | null>(null);

  // Search & Navigation States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Dynamic Promo Code State
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);

  // Chatbot conversation Log
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Promo Carousel State
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  // Load and refresh core data
  const loadData = async () => {
    try {
      const prodRes = await fetch("/api/products");
      if (prodRes.ok) {
        const prodData = await prodRes.ok ? await prodRes.json() : [];
        setProducts(prodData);
      }

      const notiRes = await fetch("/api/notifications");
      if (notiRes.ok) {
        setNotifications(await notiRes.json());
      }

      if (user) {
        const ordRes = await fetch(`/api/orders?userId=${user.id}`);
        if (ordRes.ok) {
          setOrders(await ordRes.json());
        }
      } else {
        const ordRes = await fetch("/api/orders");
        if (ordRes.ok) {
          setOrders(await ordRes.json());
        }
      }
    } catch (err) {
      console.error("Error loading products and orders api", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Sync Cart to localStorage
  useEffect(() => {
    localStorage.setItem('dh2-cart', JSON.stringify(cart));
  }, [cart]);

  // Sync theme-mode to body node classes
  useEffect(() => {
    const rootNode = document.documentElement;
    if (darkMode) {
      rootNode.classList.add('dark');
      localStorage.setItem('theme-mode', 'dark');
    } else {
      rootNode.classList.remove('dark');
      localStorage.setItem('theme-mode', 'light');
    }
  }, [darkMode]);

  // Banners Auto Carousel timer
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => (prev === 2 ? 0 : prev + 1));
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------

  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setWishlist(authenticatedUser.wishlist || []);
    localStorage.setItem('dh2-session-user', JSON.stringify(authenticatedUser));
    
    // Add positive welcome prompt to chatbot immediately
    setChatMessages([
      {
        id: "chat-sys-" + Date.now(),
        sender: "assistant",
        text: `Welcome back, **${authenticatedUser.name}**! Happy styling at DH² Studio today. Feel free to ask me to search tailored picks for you!`,
        timestamp: new Date().toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' })
      }
    ]);
  };

  const handleLogout = () => {
    setUser(null);
    setWishlist([]);
    setActiveCoupon(null);
    localStorage.removeItem('dh2-session-user');
    setIsAdminOpen(false);
    setChatMessages([]);
  };

  const handleAddToCart = (product: Product, size?: string) => {
    setCart((prevCart) => {
      // If we need size selector matching
      const targetIndex = prevCart.findIndex(
        (item) => item.product.id === product.id && item.selectedSize === size
      );

      if (targetIndex > -1) {
        const updated = [...prevCart];
        updated[targetIndex].quantity += 1;
        return updated;
      } else {
        return [...prevCart, { product, quantity: 1, selectedSize: size }];
      }
    });

    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, amount: number, size?: string) => {
    setCart((prevCart) => {
      const idx = prevCart.findIndex(
        (item) => item.product.id === productId && item.selectedSize === size
      );
      if (idx === -1) return prevCart;

      const updated = [...prevCart];
      updated[idx].quantity = Math.max(1, updated[idx].quantity + amount);
      return updated;
    });
  };

  const handleRemoveItem = (productId: string, size?: string) => {
    setCart((prevCart) => {
      return prevCart.filter(
        (item) => !(item.product.id === productId && item.selectedSize === size)
      );
    });
  };

  const handleToggleWishlist = async (productId: string) => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }

    try {
      const res = await fetch("/api/auth/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, productId })
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setWishlist(data.user.wishlist || []);
        localStorage.setItem('dh2-session-user', JSON.stringify(data.user));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyCouponCode = async (code: string): Promise<boolean> => {
    // Math sum subtotal
    const subtotal = cart.reduce((acc, item) => acc + (item.product.discountedPrice * item.quantity), 0);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, amount: subtotal })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveCoupon(data.coupon);
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handlePlaceOrder = async (orderForm: any) => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }

    const payload = {
      userId: user.id,
      customerName: user.name,
      customerEmail: user.email,
      items: cart,
      couponCode: activeCoupon?.code || undefined,
      ...orderForm
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        // Reset states
        setCart([]);
        setActiveCoupon(null);
        setIsCheckoutOpen(false);
        
        // Show tracker overlay for the newly completed order right away!
        setSelectedOrderForTracking(data.order);
        
        // Try automatic dispatch redirect
        try {
          const itemsTxt = data.order.items.map((item: any) => `- ${item.quantity}x ${item.product.name}${item.selectedSize ? ` (Size: ${item.selectedSize})` : ""} - ₹${item.product.discountedPrice * item.quantity}`).join("\n");
          const waMsg = `*DH² Studio - New Order placed!* 🛍️\n\n` +
            `*Order ID:* ${data.order.id}\n` +
            `*Customer Name:* ${data.order.customerName}\n` +
            `*Mobile:* ${data.order.shippingPhone}\n` +
            `*Delivery Address:* ${data.order.shippingAddress}\n` +
            `*Payment Method:* ${data.order.paymentMethod}\n\n` +
            `*Items Ordered:*\n` + itemsTxt +
            `\n\n*Total Payable:* ₹${data.order.total}\n\nThank you for shopping with DH² Studio!`;
          
          const waUrl = `https://api.whatsapp.com/send?phone=919941188519&text=${encodeURIComponent(waMsg)}`;
          window.open(waUrl, '_blank');
        } catch (we) {
          console.warn("Automated popup redirect blocked or failed:", we);
        }

        // Refresh products catalog limits and order timelines log
        loadData();
      } else {
        alert("Failed to submit order to express pipeline. Please retry.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostReview = async (productId: string, userName: string, rating: number, comment: string) => {
    try {
      const res = await fetch(`/api/products/${productId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, rating, comment })
      });

      if (res.ok) {
        const data = await res.json();
        // Update selected product modal specs on-screen
        setSelectedProduct(data.product);
        // Refresh catalog lists
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddProductAdmin = async (formData: any): Promise<boolean> => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleEditProductAdmin = async (id: string, formData: any): Promise<boolean> => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleDeleteProductAdmin = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE"
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleUpdateOrderStatusAdmin = async (id: string, status: string, description: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, description })
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleSendChatbotMessage = async (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: ChatMessage = {
      id: "chat-u-" + Date.now(),
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' })
    };

    const currentMsgHistory = [...chatMessages, userMsg];
    setChatMessages(currentMsgHistory);

    try {
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: currentMsgHistory })
      });

      if (res.ok) {
        const data = await res.json();
        const supportBotMessage: ChatMessage = {
          id: "chat-b-" + Date.now(),
          sender: "assistant",
          text: data.text,
          timestamp: new Date().toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' })
        };
        setChatMessages([...currentMsgHistory, supportBotMessage]);
      }
    } catch (err) {
      console.error(err);
      const offlineMsg: ChatMessage = {
        id: "chat-err-" + Date.now(),
        sender: "assistant",
        text: "Apologies, I hit a snag querying the DH² Studio. Try typing 'promo codes' or double check your session servers status.",
        timestamp: new Date().toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' })
      };
      setChatMessages([...currentMsgHistory, offlineMsg]);
    }
  };

  // Filter derivations
  const filteredProducts = products.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.subcategory.toLowerCase().includes(query) ||
      (item.features && item.features.some(f => f.toLowerCase().includes(query)));

    return matchesCategory && matchesSearch;
  });

  // Hot Similar Category matches for recomended products drawer
  const recommendedPicks = selectedProduct 
    ? products
        .filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id)
        .slice(0, 3)
    : products.slice(0, 3);

  // Custom static banners for carousel
  const banners = [
    {
      subtitle: "IDENTITY EXPOSURE &bull; LINEN SEASON",
      title: "Classic Men's Organic Linen Oxford Fitting Shirts",
      highlights: "₹1,999 Special Sale Prices",
      desc: "Experience tailored comfort. Made from 100% hypoallergenic natural fibers.",
      actionText: "Check Shirts Wardrobe",
      category: "Men",
      search: "linen",
      gradient: "from-amber-600 via-orange-650 to-blue-700"
    },
    {
      subtitle: "FESTIVE SALE UNBLOCKED &bull; 30% PRICE DROP",
      title: "Ladies Floral Summer Outfits & Camel Coats",
      highlights: "Coupon active: Use FESTIVE30",
      desc: "Wrap yourself in elegant linen dresses designed for Indian summers and luxury evening parties.",
      actionText: "Shop Ladies Fashion",
      category: "Women",
      search: "",
      gradient: "from-pink-600 via-purple-650 to-slate-900"
    },
    {
      subtitle: "HIGH-GRADE LIFESTYLE ACCESSORIES",
      title: "Explorer Ballistic Backpacks & Quartz Steel Chronometers",
      highlights: "Up to 40% VIP Discount applied",
      desc: "Waterproof canvas packs and Japanese Miyota movement watches with rapid clasps.",
      actionText: "Equip Travel Gear",
      category: "Accessories",
      search: "",
      gradient: "from-blue-600 via-emerald-650 to-slate-900"
    }
  ];

  return (
    <div className={`min-h-screen font-sans flex flex-col justify-between transition-colors duration-300 ${
      darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"
    }`}>

      {/* Top flash coupon notification string banner ticker */}
      <div className="bg-linear-to-r from-amber-500 via-orange-500 to-blue-500 text-slate-950 px-4 py-1.5 text-center text-[10px] font-bold tracking-wider uppercase flex items-center justify-center gap-2 select-none shrink-0 border-b border-amber-400/20">
        <Tag className="w-3.5 h-3.5" />
        <span>LIMITED PERIOD: Apply coupon "FESTIVE30" at secure checkout for extra 30% savings on orders above ₹2,999!</span>
      </div>

      {/* 1. BRAND NAVIGATION HEADER */}
      <Header
        user={user}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        cart={cart}
        wishlist={wishlist}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => {
          // Open Wishlist view simply by showing a quick filtered category or dialog
          setIsWishlistOpen(true);
        }}
        onOpenAdmin={() => setIsAdminOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategorySelect={(cat) => {
          setSelectedCategory(cat);
          setSearchTerm("");
        }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenBot={() => setIsBotOpen(true)}
      />

      {/* 2. MAIN APPLICATION CONTENT TRAY */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-8">
        
        {/* HERO PROMOTION AUTOPLAY CAROUSEL BANNERS */}
        {selectedCategory === 'All' && searchTerm === '' && (
          <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[21/9] min-h-[220px]">
            {banners.map((ban, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 bg-linear-to-r ${ban.gradient} p-8 flex flex-col justify-center transition-all duration-700 ease-in-out ${
                  idx === activeBannerIndex ? "opacity-100 z-10 translate-x-0" : "opacity-0 z-0 translate-x-12"
                }`}
              >
                <div className="max-w-xl text-white space-y-2">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 block uppercase" dangerouslySetInnerHTML={{ __html: ban.subtitle }}></span>
                  <h1 className="text-xl sm:text-2xl md:text-3.5xl font-extrabold tracking-tight leading-none">
                    {ban.title}
                  </h1>
                  <span className="inline-block bg-orange-650/40 border border-orange-400/30 text-xs font-sans font-bold px-3 py-1 rounded-full text-amber-300">
                    {ban.highlights}
                  </span>
                  <p className="text-xs text-slate-205 leading-relaxed hidden sm:block max-w-md font-sans">
                    {ban.desc}
                  </p>
                  <div className="pt-3">
                    <button
                      onClick={() => {
                        setSelectedCategory(ban.category);
                        if (ban.search) setSearchTerm(ban.search);
                      }}
                      className="px-5 py-2.5 bg-white text-slate-950 hover:bg-slate-100 text-xs font-black rounded-full flex items-center gap-1.5 transition-all shadow-md active:scale-97"
                    >
                      <span>{ban.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Decorative absolute logo layout watermark to look exceptionally branded */}
                <div className="absolute right-10 bottom-6 opacity-8 flex items-center gap-1">
                  <span className="text-slate-150 font-black text-6xl tracking-tighter uppercase font-sans">DH²</span>
                </div>
              </div>
            ))}

            {/* Manual indicators dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveBannerIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === activeBannerIndex ? "bg-white w-5" : "bg-white/40"
                  }`}
                  title={`Carousel page ${i + 1}`}
                ></button>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Notification Pop Alerts list */}
        {notifications.length > 0 && selectedCategory === 'All' && searchTerm === '' && (
          <div className={`p-4 rounded-2xl border flex items-start gap-3.5 animate-pulse ${
            darkMode ? "bg-slate-850/40 border-slate-800" : "bg-white border-slate-203 shadow-xs"
          }`}>
            <Bell className="w-5.5 h-5.5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-wider block">DH² Studio Live Alerts updates:</span>
              <h4 className="font-sans font-bold text-xs mt-0.5 truncate">{notifications[0].title}</h4>
              <p className="text-[11px] text-slate-450 leading-relaxed font-sans">{notifications[0].description}</p>
            </div>
          </div>
        )}

        {/* PRODUCTS CATALOG SECTION VIEW */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-slate-450 uppercase">DH² Boutique Collection</span>
              <h2 className="text-xl font-extrabold tracking-tight uppercase">
                {selectedCategory === "All" ? "🏡 Complete Catalog Collections" : `🎁 Exclusive curated ${selectedCategory}`}
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Listing {filteredProducts.length} premium products
            </span>
          </div>

          {/* Fallback Screen */}
          {filteredProducts.length === 0 ? (
            <div className={`p-16 text-center space-y-4 rounded-3xl border ${
              darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="w-12 h-12 bg-linear-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white mx-auto shadow-md">
                <ShoppingBag className="w-5.5 h-5.5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">No coordinate products detected</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                  Apologies! We couldn't find matches for "{searchTerm}" in category scope "{selectedCategory}". Seek advice from our assistantbot!
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchTerm("");
                }}
                className="px-5 py-2 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-bold transition-all"
              >
                Reset catalog
              </button>
            </div>
          ) : (
            // Grid Layout
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onSelect={(p) => setSelectedProduct(p)}
                  isInWishlist={wishlist.includes(prod.id)}
                  onToggleWishlist={handleToggleWishlist}
                  onAddToCart={handleAddToCart}
                  darkMode={darkMode}
                />
              ))}
            </div>
          )}
        </section>

        {/* Similar & Recommended picks highlights drawer section */}
        {selectedProduct && (
          <section className={`p-6 rounded-3xl border space-y-4 ${
            darkMode ? "bg-slate-950/45 border-slate-850" : "bg-white border-slate-206 shadow-xs"
          }`}>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-amber-500 font-bold uppercase block">DESIGN MATCHING SERVICES</span>
              <h3 className="font-black text-sm uppercase">Similar or matching products recommended by DH² Spark</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recommendedPicks.map((pick) => (
                <div 
                  key={pick.id}
                  onClick={() => setSelectedProduct(pick)}
                  className={`p-3 rounded-2xl border flex gap-3 items-center cursor-pointer transition-all hover:scale-102 ${
                    darkMode ? "bg-slate-900 hover:bg-slate-800 border-slate-800" : "bg-slate-50 hover:bg-slate-100 border-slate-150"
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-800/10">
                    <img src={pick.image} alt={pick.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs truncate">{pick.name}</h5>
                    <span className="font-mono text-emerald-400 text-xs font-bold font-sans">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(pick.discountedPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* 3. STATIC LANDING LEGAL FOOTER */}
      <footer className={`border-t py-10 transition-colors ${
        darkMode ? "bg-slate-950 border-slate-850 text-slate-400" : "bg-white border-slate-200 text-slate-500"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-xs font-sans space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-800/15 pb-6">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-200 bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-blue-500">
                DH² STUDIO
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block border-l pl-2 border-slate-705">Wear Your Identity</span>
            </div>
            <div className="flex gap-4 items-center">
              <button onClick={() => setIsRefundOpen(true)} className="hover:underline hover:text-amber-500 cursor-pointer text-left bg-transparent border-0 p-0 text-xs font-sans text-slate-400">Refund Terms</button>
              <a href="https://bluedart.com/tracking" target="_blank" rel="noreferrer" className="hover:underline hover:text-amber-500">Bluedart Track logistics</a>
              <a href="https://dh2infotech.vercel.app/" target="_blank" rel="noreferrer" className="hover:underline hover:text-amber-500">Contact Developer</a>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[11px] text-slate-450">
            <div>
              <span className="block mb-1">&copy; {new Date().getFullYear()} DH² Studio Inc. Website created by <strong className="font-semibold text-slate-300 dark:text-white">DH² Infotech</strong></span>
              <div className="flex flex-col sm:flex-row sm:gap-4 text-slate-500">
                <span>DH² Infotech Official Website: <a href="https://dh2infotech.vercel.app/" target="_blank" rel="noreferrer" className="text-amber-500 hover:underline">https://dh2infotech.vercel.app/</a></span>
                <span>Mail ID: <a href="mailto:team.dh2infotech@gmail.com" className="text-amber-500 hover:underline">team.dh2infotech@gmail.com</a></span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* 4. OVERLAYS, MODALS, DRAWERS STREAM CHANNELS */}

      {/* Product Details overlay sheet */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onPostReview={handlePostReview}
          darkMode={darkMode}
        />
      )}

      {/* Shopping Cart Drawer overlay slider */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onApplyCouponCode={handleApplyCouponCode}
        activeCoupon={activeCoupon}
        onRemoveCoupon={() => setActiveCoupon(null)}
        onTriggerCheckout={() => {
          if (!user) {
            setIsLoginOpen(true);
          } else {
            setIsCartOpen(false);
            setIsCheckoutOpen(true);
          }
        }}
        darkMode={darkMode}
      />

      {/* Checkout modal form */}
      {isCheckoutOpen && (
        <CheckoutModal
          onClose={() => setIsCheckoutOpen(false)}
          cart={cart}
          userInfo={user}
          activeCoupon={activeCoupon}
          onPlaceOrder={handlePlaceOrder}
          darkMode={darkMode}
        />
      )}

      {/* Real-time Order track status log modal timeline */}
      {selectedOrderForTracking && (
        <TrackerModal
          order={selectedOrderForTracking}
          onClose={() => setSelectedOrderForTracking(null)}
          darkMode={darkMode}
        />
      )}

      {/* Secure Auth modal overlay */}
      {isLoginOpen && (
        <LoginModal
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          darkMode={darkMode}
        />
      )}

      {/* Administrative Dashboard Console workspace modal */}
      {isAdminOpen && user && (
        <AdminDashboard
          user={user}
          onClose={() => setIsAdminOpen(false)}
          products={products}
          orders={orders}
          onRefreshData={loadData}
          onAddProduct={handleAddProductAdmin}
          onEditProduct={handleEditProductAdmin}
          onDeleteProduct={handleDeleteProductAdmin}
          onUpdateOrderStatus={handleUpdateOrderStatusAdmin}
          onOpenTracker={(ord) => setSelectedOrderForTracking(ord)}
          darkMode={darkMode}
        />
      )}

      {/* Floating Spark Customer interactive AI chatbot tray */}
      <AIChatbot
        isOpen={isBotOpen}
        onClose={() => setIsBotOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendChatbotMessage}
        onResetChat={() => setChatMessages([])}
        darkMode={darkMode}
      />

      {/* Simple toggle overlay wishlist manager */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/75" onClick={() => setIsWishlistOpen(false)} />
          <div className={`relative max-w-md w-full rounded-2xl overflow-hidden shadow-2xl border p-5 ${
            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <button onClick={() => setIsWishlistOpen(false)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-800 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-extrabold uppercase mb-4 tracking-wider text-rose-500">❤️ Your Identities Wishlists ({wishlist.length})</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {wishlist.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6 font-sans">No items added yet. Click Heart icons on catalog cards to keep styling.</p>
              ) : (
                products
                  .filter(p => wishlist.includes(p.id))
                  .map(p => (
                    <div key={p.id} className="flex gap-3 justify-between items-center border-b border-slate-800/15 pb-2 text-xs">
                      <div className="flex gap-2 items-center">
                        <div className="w-10 h-10 rounded overflow-hidden">
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold truncate max-w-[150px]">{p.name}</span>
                      </div>
                      <div className="flex gap-1.5 shrink-0 items-center">
                        <span className="font-mono text-emerald-400 font-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p.discountedPrice)}</span>
                        <button
                          onClick={() => handleAddToCart(p)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-405 text-slate-955 text-[10px] font-bold rounded-md"
                        >
                          Buy
                        </button>
                        <button
                          onClick={() => handleToggleWishlist(p.id)}
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Refund & Return Policy Modal */}
      {isRefundOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs" onClick={() => setIsRefundOpen(false)} />
          <div className={`relative max-w-xl w-full rounded-2xl overflow-hidden shadow-2xl border p-6 max-h-[85vh] flex flex-col ${
            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <button 
              onClick={() => setIsRefundOpen(false)} 
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-800/10 dark:hover:bg-slate-755 text-slate-400 cursor-pointer"
              title="Close Refund Rules"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="border-b border-slate-700/20 pb-3 mb-4 pr-6 shrink-0">
              <span className="text-[10px] font-mono tracking-widest text-amber-500 font-bold uppercase block">DH² STUDIO SERVICES</span>
              <h3 className="text-base font-black uppercase tracking-tight">Refund & Return Policy</h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs leading-relaxed font-sans scrollbar-thin">
              <p className="text-slate-400">
                Welcome to <strong>DH² Studio</strong>.<br />
                We want you to have a smooth shopping experience. Please read our basic refund and return terms below.
              </p>

              <div className="space-y-3">
                <div className={`p-3 rounded-xl border ${darkMode ? "bg-slate-950/30 border-slate-800" : "bg-slate-50 border-slate-150"}`}>
                  <h4 className="font-bold text-slate-300 dark:text-amber-400 mb-1">1. Return Eligibility</h4>
                  <p className="text-slate-400">Products can be returned within <strong>7 days</strong> from the date of delivery.</p>
                  <p className="text-slate-400 mt-1">Items must be:</p>
                  <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-slate-450">
                    <li>Unused and unwashed</li>
                    <li>In original packaging</li>
                    <li>With tags and invoice intact</li>
                  </ul>
                </div>

                <div className={`p-3 rounded-xl border ${darkMode ? "bg-slate-950/30 border-slate-800" : "bg-slate-50 border-slate-150"}`}>
                  <h4 className="font-bold text-rose-400 mb-1">2. Non-Returnable Items</h4>
                  <p className="text-slate-400">The following items are not eligible for return:</p>
                  <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-slate-405">
                    <li>Innerwear</li>
                    <li>Customized products</li>
                    <li>Used or damaged items caused by customers</li>
                    <li>Products without original tags</li>
                  </ul>
                </div>

                <div className={`p-3 rounded-xl border ${darkMode ? "bg-slate-950/30 border-slate-800" : "bg-slate-50 border-slate-150"}`}>
                  <h4 className="font-bold text-emerald-400 mb-1">3. Refund Process</h4>
                  <p className="text-slate-400">Once the returned item is received and inspected, the refund will be processed.</p>
                  <p className="text-slate-400 mt-1">Refund amount will be credited within <strong>5–7 business days</strong> to the original payment method or bank account.</p>
                </div>

                <div className={`p-3 rounded-xl border ${darkMode ? "bg-slate-950/30 border-slate-800" : "bg-slate-50 border-slate-150"}`}>
                  <h4 className="font-bold text-blue-400 mb-1">4. Exchange Policy</h4>
                  <p className="text-slate-400">Size exchange is allowed based on stock availability.</p>
                  <p className="text-slate-400 mt-1">Customers can request exchange within <strong>7 days</strong> after delivery.</p>
                </div>

                <div className={`p-3 rounded-xl border ${darkMode ? "bg-slate-950/30 border-slate-800" : "bg-slate-50 border-slate-150"}`}>
                  <h4 className="font-bold text-amber-500 mb-1">5. Damaged or Wrong Products</h4>
                  <p className="text-slate-400">If you receive:</p>
                  <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-slate-450">
                    <li>Damaged product</li>
                    <li>Wrong item</li>
                    <li>Missing item</li>
                  </ul>
                  <p className="text-slate-400 mt-1.5 font-medium">Please contact us within <strong>48 hours</strong> with:</p>
                  <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-slate-455">
                    <li>Order ID</li>
                    <li>Product photos</li>
                    <li>Unboxing video (if available)</li>
                  </ul>
                </div>

                <div className={`p-3 rounded-xl border ${darkMode ? "bg-slate-950/30 border-slate-800" : "bg-slate-50 border-slate-150"}`}>
                  <h4 className="font-bold text-purple-400 mb-1">6. Cancellation Policy</h4>
                  <p className="text-slate-405">Orders can be cancelled before shipping.</p>
                  <p className="text-slate-405 mt-0.5">Once shipped, cancellation may not be possible.</p>
                </div>

                <div className={`p-4 rounded-xl border border-dashed ${darkMode ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-250"}`}>
                  <h4 className="font-bold text-amber-500 mb-1 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    📬 7. Contact Information
                  </h4>
                  <p className="text-slate-400">For return, refund, or support queries, please send a message directly to our dedicated desk:</p>
                  <p className="text-xs font-bold text-slate-300 dark:text-white mt-2 flex items-center gap-1.5 select-all">
                    <span>📧 Email:</span>
                    <a href="mailto:team.dh2infotech@gmail.com" className="text-amber-500 hover:underline">team.dh2infotech@gmail.com</a>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/20 text-right shrink-0">
              <button 
                onClick={() => setIsRefundOpen(false)}
                className="px-5 py-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-bold hover:opacity-90 rounded-xl text-xs active:scale-97 transition-all cursor-pointer"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Inline Close utility helper
function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
