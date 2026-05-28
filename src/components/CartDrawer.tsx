import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, Tag, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { CartItem, Coupon } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, amount: number, size?: string) => void;
  onRemoveItem: (productId: string, size?: string) => void;
  onApplyCouponCode: (code: string) => Promise<boolean>;
  activeCoupon: Coupon | null;
  onRemoveCoupon: () => void;
  onTriggerCheckout: () => void;
  darkMode: boolean;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onApplyCouponCode,
  activeCoupon,
  onRemoveCoupon,
  onTriggerCheckout,
  darkMode
}: CartDrawerProps) {
  const [couponInput, setCouponInput] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  if (!isOpen) return null;

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.product.discountedPrice * item.quantity), 0);

  // Apply Coupon discount
  let discountAmount = 0;
  if (activeCoupon) {
    discountAmount = Math.round(subtotal * (activeCoupon.discountPercentage / 100));
  }

  // Free shipping rule: buy above ₹1499, else delivery is ₹99
  const FREE_SHIPPING_THRESHOLD = 1499;
  const deliveryCharge = (subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0) ? 0 : 99;
  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryCharge);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    
    setIsValidating(true);
    setCouponMessage("");
    setIsError(false);

    try {
      const isOk = await onApplyCouponCode(couponInput);
      if (isOk) {
        setCouponMessage(`Promo code "${couponInput.toUpperCase()}" applied successfully!`);
        setCouponInput("");
      } else {
        setIsError(true);
        setCouponMessage(`Error: Check minimum order value or validity.`);
      }
    } catch (err: any) {
      setIsError(true);
      setCouponMessage(err.message || "Invalid coupon structure.");
    } finally {
      setIsValidating(false);
    }
  };

  const amountNeededForFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className={`w-screen max-w-md flex flex-col justify-between shadow-2xl relative ${
          darkMode ? "bg-slate-900 text-white" : "bg-white text-slate-850"
        }`}>
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-700/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight uppercase">Your Shopping Bags</span>
              <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-bold">
                {cart.length} item(s)
              </span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800/10 dark:hover:bg-slate-850 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Contents */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            
            {/* Free shipping banner */}
            {subtotal > 0 && (
              <div className={`p-3.5 rounded-xl border text-xs flex flex-col gap-1.5 ${
                deliveryCharge === 0 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                  : "bg-amber-500/5 border-amber-500/20 text-slate-400"
              }`}>
                {deliveryCharge === 0 ? (
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Free Shipping unlocked! Bluedart Express routing enabled.</span>
                  </div>
                ) : (
                  <div>
                    <span className="font-semibold text-amber-500">Add {formatINR(amountNeededForFreeShipping)} more</span> to unlock free delivery!
                    {/* Linear progress gauge */}
                    <div className="w-full bg-slate-700/35 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div 
                        className="bg-amber-500 h-1.5 rounded-full" 
                        style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty Screen */}
            {cart.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-linear-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white mx-auto shadow-md">
                  <Trash2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Shopping Bags are empty</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                    Check out premium Linen Shirts or Ladies fashion categories to define your custom look. Slogan: Wear Your Identity!
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold transition-all shadow-md mt-2"
                >
                  Start Fitting Clothes
                </button>
              </div>
            ) : (
              // List items
              <div className="space-y-4">
                {cart.map((item, index) => {
                  const itemKey = `${item.product.id}-${item.selectedSize || "nosize"}`;
                  return (
                    <div 
                      key={itemKey} 
                      className={`flex gap-3 p-3.5 rounded-2xl border transition-all ${
                        darkMode ? "bg-slate-850/65 border-slate-800" : "bg-slate-50 border-slate-150"
                      }`}
                    >
                      {/* Thumbnail photo */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800/10 shrink-0">
                        <img 
                          src={item.product.image} 
                          alt={item.product.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      
                      {/* Descriptions */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h5 className="font-bold text-xs truncate max-w-[180px]" title={item.product.name}>
                              {item.product.name}
                            </h5>
                            <button 
                              onClick={() => onRemoveItem(item.product.id, item.selectedSize)}
                              className="text-slate-450 hover:text-rose-500 transition-colors"
                              title="Discard"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          {/* Sizing display */}
                          {item.selectedSize && (
                            <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-sm font-bold font-sans">
                              Size: {item.selectedSize}
                            </span>
                          )}
                        </div>

                        {/* Modifiers & Quantities */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, -1, item.selectedSize)}
                              disabled={item.quantity <= 1}
                              className={`p-1 rounded-md border text-slate-400 ${
                                item.quantity <= 1 
                                  ? "opacity-50 cursor-not-allowed" 
                                  : darkMode 
                                    ? "hover:bg-slate-700 border-slate-700" 
                                    : "hover:bg-slate-200 border-slate-200"
                              }`}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-mono font-bold w-5 text-center">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, 1, item.selectedSize)}
                              className={`p-1 rounded-md border text-slate-400 ${
                                darkMode ? "hover:bg-slate-700 border-slate-700" : "hover:bg-slate-200 border-slate-200"
                              }`}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          
                          {/* Cost */}
                          <span className="text-xs font-bold text-slate-300">
                            {formatINR(item.product.discountedPrice * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Checkout Breakdown & Codes */}
          {cart.length > 0 && (
            <div className={`p-6 border-t ${
              darkMode ? "bg-slate-950/70 border-slate-800" : "bg-slate-100/50 border-slate-150"
            } space-y-4`}>
              
              {/* Promo validation form */}
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="coupon-entry-field"
                      type="text"
                      className={`w-full py-2.5 pl-9 pr-3 rounded-xl text-xs uppercase border text-slate-250 focus:outline-hidden focus:border-amber-500/50 ${
                        darkMode ? "bg-slate-900 border-slate-750 text-white" : "bg-white border-slate-200 text-slate-800"
                      }`}
                      placeholder="ENTER PROMO (e.g. FESTIVE30)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                    />
                    <Tag className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  </div>
                  <button
                    id="apply-coupon-btn"
                    type="submit"
                    disabled={isValidating}
                    className="px-4 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-700 text-center transition-colors disabled:opacity-50"
                  >
                    {isValidating ? "Verifying..." : "Apply"}
                  </button>
                </div>
                
                {/* Coupon result message */}
                {couponMessage && (
                  <div className={`p-2 rounded-lg text-[10px] font-sans flex items-center gap-1.5 border ${
                    isError 
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  }`}>
                    {isError ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <Tag className="w-3.5 h-3.5 shrink-0" />}
                    <span>{couponMessage}</span>
                  </div>
                )}
              </form>

              {/* Display Valid Coupon Tag */}
              {activeCoupon && (
                <div className="p-2.5 rounded-lg bg-linear-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-bounce" />
                    <div>
                      <span className="font-bold">{activeCoupon.code}</span>
                      <p className="text-[10px] text-slate-400">{activeCoupon.discountPercentage}% Discount Authorized!</p>
                    </div>
                  </div>
                  <button 
                    onClick={onRemoveCoupon}
                    className="text-[10px] hover:underline font-bold text-slate-450"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Invoice structure */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-430">
                  <span>Items Subtotal</span>
                  <span className="font-mono">{formatINR(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-500">
                    <span>Discount Code Applied</span>
                    <span className="font-mono font-semibold">-{formatINR(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-430">
                  <span>Shipping & Delivery Fee</span>
                  <span className="font-mono">{deliveryCharge === 0 ? "FREE" : formatINR(deliveryCharge)}</span>
                </div>
                <hr className="border-slate-800 my-1" />
                <div className="flex justify-between text-base font-bold text-slate-100">
                  <span>Total Payable Price</span>
                  <span className="font-mono tracking-tight text-emerald-400">{formatINR(grandTotal)}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                id="drawer-checkout-cta"
                onClick={onTriggerCheckout}
                className="w-full mt-4 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-slate-950 text-xs font-bold rounded-xl text-center shadow-lg transform active:scale-98 transition-all"
              >
                Proceed to Secure Checkout
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
