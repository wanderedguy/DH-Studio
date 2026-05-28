import React, { useState } from 'react';
import { Search, ShoppingCart, Heart, User as UserIcon, LogIn, Sparkles, ShoppingBag, Sun, Moon, HelpCircle } from 'lucide-react';
import { User, CartItem } from '../types';

interface HeaderProps {
  user: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  cart: CartItem[];
  wishlist: string[];
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAdmin: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenBot: () => void;
}

export default function Header({
  user,
  onOpenLogin,
  onLogout,
  cart,
  wishlist,
  onOpenCart,
  onOpenWishlist,
  onOpenAdmin,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategorySelect,
  darkMode,
  setDarkMode,
  onOpenBot
}: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const categories = ["All", "Men", "Women", "Accessories", "Multi-purpose"];

  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-all ${
      darkMode 
        ? "bg-slate-900/95 border-slate-850 text-white" 
        : "bg-white/95 border-slate-200 text-slate-800"
    } shadow-xs`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo Branding */}
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => onCategorySelect("All")}>
            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-amber-500 shadow-md">
              <img 
                src="https://i.ibb.co/6Jc30YhF/Whats-App-Image-2026-05-28-at-4-41-10-PM.jpg" 
                alt="DH² Studio Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="hidden sm:block">
              <span className="font-sans font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-orange-500 to-blue-500">
                DH² STUDIO
              </span>
              <p className="text-[9px] font-mono tracking-widest text-slate-400 uppercase">
                Wear Your Identity
              </p>
            </div>
          </div>

          {/* Search bar with Filters */}
          <div className="flex-1 max-w-xl relative">
            <div className="relative">
              <input
                id="search-input"
                type="text"
                placeholder="Search premium apparel, linen shirts, travel gears..."
                className={`w-full py-2.5 pl-10 pr-4 rounded-full text-sm font-sans focus:outline-hidden transition-all border ${
                  darkMode 
                    ? "bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-400 focus:border-amber-500/50" 
                    : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-orange-500/50"
                }`}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* Dark Mode toggle */}
            <button
              id="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full transition-colors ${
                darkMode ? "hover:bg-slate-800 text-amber-400" : "hover:bg-slate-100 text-slate-600"
              }`}
              title="Toggle Theme Mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* AI Assistant quick-link */}
            <button
              id="ai-spark-shortcut"
              onClick={onOpenBot}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden md:inline">Ask DH² Spark</span>
            </button>

            {/* Wishlist */}
            <button
              id="wishlist-btn"
              onClick={onOpenWishlist}
              className={`p-2 rounded-full relative transition-colors ${
                darkMode ? "hover:bg-slate-800 text-rose-400" : "hover:bg-slate-100 text-rose-500"
              }`}
            >
              <Heart className="w-5.5 h-5.5" />
              {wishlist.length > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-rose-600 text-white text-[10px] font-sans font-bold px-1.5 py-0.5 rounded-full">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Status */}
            <button
              id="cart-btn"
              onClick={onOpenCart}
              className={`p-2 rounded-full relative transition-colors ${
                darkMode ? "hover:bg-slate-800 text-blue-400" : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              <ShoppingCart className="w-5.5 h-5.5" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-amber-500 text-slate-955 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User workspace */}
            <div className="relative">
              {user ? (
                <div>
                  <button
                    id="user-profile-menu-btn"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full transition-colors border ${
                      darkMode 
                        ? "border-slate-700 hover:bg-slate-800 text-slate-200" 
                        : "border-slate-200 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-linear-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold uppercase shadow-inner">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-xs font-medium hidden md:inline max-w-[100px] truncate">
                      {user.name}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className={`absolute right-0 mt-2.5 w-52 rounded-xl shadow-xl py-2 border select-none transition-all z-50 ${
                      darkMode 
                        ? "bg-slate-800 border-slate-750 text-slate-100" 
                        : "bg-white border-slate-150 text-slate-800"
                    }`}>
                      <div className="px-4 py-2 border-b border-slate-700/20 text-xs font-sans text-slate-400">
                        Logged in as <p className="font-semibold truncate text-slate-300">{user.email}</p>
                      </div>
                      
                      {/* Admin panel redirect */}
                      {user.role === 'admin' ? (
                        <button
                          onClick={() => {
                            onOpenAdmin();
                            setShowUserMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs font-bold text-amber-500 hover:bg-slate-750 transition-colors flex items-center gap-2`}
                        >
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          Admin Console
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            // Point client-side to profile screen (handled in main view state)
                            onOpenAdmin(); // Will display user orders profile instead of Admin console if user is customer!
                            setShowUserMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2`}
                        >
                          <ShoppingBag className="w-4 h-4 text-slate-400" />
                          My Orders
                        </button>
                      )}

                      <hr className="my-1 border-slate-700/20" />
                      <button
                        onClick={() => {
                          onLogout();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-500 hover:bg-rose-50/10 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  id="login-trigger-btn"
                  onClick={onOpenLogin}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-700 dark:hover:bg-white transition-all shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Categories strip */}
        <div className="flex items-center justify-start gap-1 pb-3 overflow-x-auto no-scrollbar scroll-smooth">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategorySelect(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-sans font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-amber-500 text-slate-950 font-semibold scale-102 shadow-xs"
                  : darkMode
                    ? "text-slate-330 hover:bg-slate-800"
                    : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {cat === "All" ? "🏡 All Store" : cat === "Men" ? "👔 Men's Wardrobe" : cat === "Women" ? "👗 Ladies' Fashion" : cat === "Accessories" ? "🎒 Accessories" : "🔌 Smart Utilities"}
            </button>
          ))}
        </div>

      </div>
    </header>
  );
}
