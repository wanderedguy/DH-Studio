import React, { useState } from 'react';
import { X, Star, Calendar, MessageSquare, ShieldCheck, Truck, RefreshCw, Send } from 'lucide-react';
import { Product, Review } from '../types';

interface ProductDetailsModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (p: Product, size?: string) => void;
  onPostReview: (productId: string, userName: string, rating: number, comment: string) => Promise<void>;
  darkMode: boolean;
}

export default function ProductDetailsModal({
  product,
  onClose,
  onAddToCart,
  onPostReview,
  darkMode
}: ProductDetailsModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const allImages = [product.image, ...(product.images || [])].filter((img, idx, self) => img && self.indexOf(img) === idx);
  const activeImage = allImages[activeIndex] || product.image;

  const [reviewName, setReviewName] = useState<string>("");
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState<string>("");

  const clothingSizes = ["S", "M", "L", "XL", "XXL"];
  const isClothing = product.category === "Men" || product.category === "Women" || product.subcategory.toLowerCase().includes("shirts") || product.subcategory.toLowerCase().includes("dress");

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleReviewFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) return;
    
    setIsSubmittingReview(true);
    try {
      await onPostReview(product.id, reviewName, reviewRating, reviewComment);
      setReviewSuccessMessage("Thank you! Your experience review has been published on the DH² server.");
      setReviewName("");
      setReviewComment("");
      setReviewRating(5);
      setTimeout(() => setReviewSuccessMessage(""), 5000);
    } catch (err) {
      console.error("Failed to post review", err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Overlay Backdrop */}
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" onClick={onClose}></div>

      {/* Modal Card Content */}
      <div className={`relative max-w-4xl w-full rounded-3xl overflow-hidden shadow-2xl transition-all border flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh] ${
        darkMode 
          ? "bg-slate-900 border-slate-800 text-white" 
          : "bg-white border-slate-100 text-slate-800"
      }`}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 z-10 p-2.5 rounded-full transition-colors ${
            darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-650"
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. IMAGE PORTION */}
        <div className="w-full md:w-1/2 relative bg-slate-800/10 md:h-full overflow-hidden flex flex-col justify-center items-center">
          <div className="w-full flex-1 flex items-center justify-center relative overflow-hidden">
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-cover max-h-[350px] md:max-h-[460px]"
              referrerPolicy="no-referrer"
            />
            {product.discountPercentage > 0 && (
              <span className="absolute top-4 left-4 bg-orange-600 text-white text-xs font-black font-sans px-3 py-1.5 rounded-full z-10 shadow-md">
                {product.discountPercentage}% OFF ORIGINAL PRICE
              </span>
            )}
          </div>
          
          {/* Gallery Thumbnails List */}
          {allImages.length > 1 && (
            <div className={`w-full p-3 flex gap-2 overflow-x-auto justify-center border-t shrink-0 ${
              darkMode ? "bg-slate-950/45 border-slate-800" : "bg-slate-50 border-slate-100"
            }`}>
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    activeIndex === idx 
                      ? "border-amber-500 scale-105 shadow-sm" 
                      : darkMode 
                        ? "border-transparent opacity-50 hover:opacity-100" 
                        : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                  title={`View image angle ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt={`Preview thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. SPEC SHEET & CONTROLS */}
        <div className="w-full md:w-1/2 p-6 overflow-y-auto flex flex-col gap-5 justify-between">
          <div>
            <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">
              {product.category} &rsaquo; {product.subcategory}
            </span>
            <h2 className="text-xl md:text-2xl font-sans font-extrabold tracking-tight mt-1 lines-clamp-2">
              {product.name}
            </h2>

            {/* Price Line */}
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-2xl font-black text-emerald-500">
                {formatINR(product.discountedPrice)}
              </span>
              {product.discountPercentage > 0 && (
                <span className="text-sm text-slate-400 line-through">
                  Original: {formatINR(product.price)}
                </span>
              )}
            </div>

            {/* Ratings Overview */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center text-amber-400">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-bold ml-1">{product.rating}</span>
              </div>
              <span className="text-xs text-slate-400">
                based on {product.ratingsCount} customer reviews
              </span>
              <span className={`text-[10px] ml-2 px-2 py-0.5 rounded-sm font-bold uppercase ${
                product.stock > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
              }`}>
                {product.stock > 0 ? `In Stock (${product.stock})` : "Sold Out"}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-4 leading-relaxed font-sans">
              {product.description}
            </p>

            {/* Features lists */}
            {product.features && product.features.length > 0 && (
              <div className="mt-4">
                <span className="text-xs font-mono font-semibold text-slate-400 block uppercase mb-1">
                  SPECIFICATION HIGHLIGHTS:
                </span>
                <ul className="text-xs text-slate-300 space-y-1">
                  {product.features.map((feat, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">&bull;</span>
                      <span className="font-sans text-slate-400">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Apparel Sizes Selection */}
            {isClothing && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider">SELECT SIZE:</span>
                  <span className="text-slate-500 text-[10px]">Standard Indian Wardrobe Sizing</span>
                </div>
                <div className="flex gap-2">
                  {clothingSizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`w-9 h-9 rounded-lg text-xs font-bold font-sans transition-all border ${
                        selectedSize === sz
                          ? "bg-amber-500 border-amber-500 text-slate-900 shadow-xs scale-102"
                          : darkMode
                            ? "border-slate-750 bg-slate-800 hover:bg-slate-700 text-slate-300"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-650"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cart Button */}
            <div className="mt-5">
              <button
                disabled={product.stock <= 0}
                onClick={() => onAddToCart(product, isClothing ? selectedSize : undefined)}
                className={`w-full py-3.5 rounded-xl text-xs font-bold font-sans text-center transition-all flex items-center justify-center gap-2 shadow-md ${
                  product.stock <= 0
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-amber-550 hover:bg-amber-500 text-slate-950 active:scale-98"
                }`}
              >
                Buy Now &bull; Add identity to Cart
              </button>
            </div>
          </div>

          {/* Quick value props */}
          <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-slate-700/20 text-[10px] text-slate-400 text-center font-sans mt-3">
            <div className="flex flex-col items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <span>100% Genuine Studio Pick</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Truck className="w-5 h-5 text-amber-500" />
              <span>Express BLUEDART Shipping</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <RefreshCw className="w-5 h-5 text-amber-500" />
              <span>7-Day Easy Returns Guarantee</span>
            </div>
          </div>

          {/* 3. REVIEWS BLOCK */}
          <div className="mt-4">
            <span className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase block mb-2">
              REVIEWS & EXPERIENCES ({product.reviews.length})
            </span>

            {/* List Reviews */}
            <div className="space-y-3 max-h-[140px] overflow-y-auto mb-4 pr-1 scrollbar-thin">
              {product.reviews.length === 0 ? (
                <p className="text-xs text-slate-500 italic font-sans py-1">
                  Be the first one to review this DH² piece! Write your thoughts below.
                </p>
              ) : (
                product.reviews.map((rev) => (
                  <div key={rev.id} className={`p-2.5 rounded-xl text-xs font-sans ${
                    darkMode ? "bg-slate-800/40" : "bg-slate-50"
                  }`}>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-slate-300">{rev.userName}</span>
                      <div className="flex items-center gap-1">
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                        <span className="text-[9px] font-mono text-slate-500">{rev.date}</span>
                      </div>
                    </div>
                    <p className="text-slate-450 leading-relaxed italic">"{rev.comment}"</p>
                  </div>
                ))
              )}
            </div>

            {/* Custom Review Add Form */}
            <form onSubmit={handleReviewFormSubmit} className="space-y-2 border-t border-slate-700/20 pt-3">
              <span className="text-xs font-bold text-slate-400 block font-sans">WRITE A REVIEW:</span>
              
              {reviewSuccessMessage && (
                <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-[11px] font-sans">
                  {reviewSuccessMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    className={`w-full p-2 rounded-lg focus:outline-hidden transition-all border ${
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[10px] text-slate-400 font-mono">Rating:</span>
                  <select
                    className={`p-1.5 rounded-lg border text-xs focus:outline-hidden ${
                      darkMode ? "bg-slate-850 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                    value={reviewRating}
                    onChange={(e) => setReviewRating(parseInt(e.target.value))}
                  >
                    <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                    <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                    <option value="3">⭐⭐⭐ 3 Stars</option>
                    <option value="2">⭐⭐ 2 Stars</option>
                    <option value="1">⭐ 1 Star</option>
                  </select>
                </div>
              </div>

              <div className="relative">
                <textarea
                  required
                  placeholder="Share details of your experience with this premium fabric fit..."
                  rows={2}
                  className={`w-full p-2 pr-10 rounded-lg text-xs focus:outline-hidden transition-all border ${
                    darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="absolute right-2 bottom-3 p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg transition-colors active:scale-95 disabled:opacity-50"
                  title="Submit Review"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
