import React from 'react';
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string;
  product: Product;
  onSelect: (p: Product) => void;
  isInWishlist: boolean;
  onToggleWishlist: (id: string) => void | Promise<void>;
  onAddToCart: (p: Product, size?: string) => void;
  darkMode: boolean;
}

export default function ProductCard({
  product,
  onSelect,
  isInWishlist,
  onToggleWishlist,
  onAddToCart,
  darkMode
}: ProductCardProps) {
  // Safe default formatting for Currency
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const isOutOfStock = product.stock <= 0;

  return (
    <div className={`group relative rounded-2xl overflow-hidden transition-all duration-350 transform hover:-translate-y-2 border ${
      darkMode 
        ? "bg-slate-800/40 border-slate-750 hover:border-amber-500/30 text-white" 
        : "bg-white border-slate-100 hover:border-orange-500/30 text-slate-800"
    } shadow-xs hover:shadow-lg`}>
      
      {/* Discount badge */}
      {product.discountPercentage > 0 && (
        <span className="absolute top-3 left-3 z-10 bg-linear-to-r from-orange-500 to-amber-500 text-white text-[10px] font-sans font-black px-2.5 py-1 rounded-full shadow-xs">
          {product.discountPercentage}% OFF
        </span>
      )}

      {/* Wishlist Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleWishlist(product.id);
        }}
        className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-all duration-300 backdrop-blur-xs ${
          isInWishlist 
            ? "bg-rose-500 text-white shadow-md scale-110" 
            : darkMode
              ? "bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-rose-400"
              : "bg-white/80 hover:bg-white text-slate-500 hover:text-rose-500"
        }`}
        title={isInWishlist ? "Remove from Identity Wishlist" : "Save to Wishlist"}
      >
        <Heart className={`w-4 h-4 ${isInWishlist ? "fill-current" : ""}`} />
      </button>

      {/* Picture Frame */}
      <div 
        className="aspect-square w-full overflow-hidden bg-slate-800/10 cursor-pointer relative group-hover:scale-102 transition-transform duration-350"
        onClick={() => onSelect(product)}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        {/* Quick view mask hover */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button 
            className="flex items-center gap-1.5 bg-white text-slate-900 px-4 py-2 rounded-full text-xs font-bold font-sans shadow-md transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
            onClick={() => onSelect(product)}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Premium Details</span>
          </button>
        </div>
      </div>

      {/* Card Content & Price tags */}
      <div className="p-4 flex flex-col justify-between min-h-[160px] gap-2">
        <div>
          {/* Subcategory */}
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
            {product.category} &bull; {product.subcategory}
          </span>
          {/* Title */}
          <h3 
            className="font-sans font-bold text-sm tracking-tight line-clamp-2 mt-1 cursor-pointer hover:text-amber-500 transition-colors"
            onClick={() => onSelect(product)}
            title={product.name}
          >
            {product.name}
          </h3>
        </div>

        {/* Ratings block */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-md text-xs font-bold font-sans">
            <Star className="w-3 h-3 fill-current" />
            <span>{product.rating}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            ({product.ratingsCount} reviews)
          </span>
        </div>

        {/* Prices & Add to unit */}
        <div className="flex items-center justify-between mt-1 gap-2">
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-emerald-500">
              {formatINR(product.discountedPrice)}
            </span>
            {product.discountPercentage > 0 && (
              <span className="text-xs font-sans text-slate-400 line-through">
                {formatINR(product.price)}
              </span>
            )}
          </div>

          {/* Stock state */}
          <div className="flex flex-col items-end">
            {isOutOfStock ? (
              <span className="text-[10px] font-semibold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-sm uppercase tracking-wide">
                Out Of Stock
              </span>
            ) : product.stock <= 5 ? (
              <span className="text-[10px] font-semibold text-amber-500 bg-amber-550/10 px-2 py-1 rounded-sm uppercase tracking-wide animate-pulse">
                Only {product.stock} Left!
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-400 font-medium bg-slate-400/5 px-1.5 py-0.5 rounded-sm">
                In Stock ({product.stock})
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => !isOutOfStock && onAddToCart(product)}
          disabled={isOutOfStock}
          className={`w-full mt-2 py-2 rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-2 transition-all ${
            isOutOfStock
              ? "bg-slate-700/50 text-slate-400 cursor-not-allowed"
              : "bg-slate-800 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-900 shadow-xs active:scale-97"
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>{isOutOfStock ? "Unavailable" : "Add to Shopping Cart"}</span>
        </button>

      </div>
    </div>
  );
}
