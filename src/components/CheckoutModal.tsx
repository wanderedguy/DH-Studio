import React, { useState } from 'react';
import { X, MapPin, Phone, CreditCard, Banknote, ShieldAlert, Sparkles, Building } from 'lucide-react';
import { CartItem, Coupon } from '../types';

interface CheckoutModalProps {
  onClose: () => void;
  cart: CartItem[];
  userInfo: { name: string; email: string; phone?: string; savedAddresses?: string[] } | null;
  activeCoupon: Coupon | null;
  onPlaceOrder: (details: {
    shippingAddress: string;
    shippingPhone: string;
    paymentMethod: 'UPI' | 'Card' | 'Net Banking' | 'Cash on Delivery';
    paymentDetails?: { upiId?: string; cardNumber?: string; bankName?: string };
    subtotal: number;
    discount: number;
    deliveryCharge: number;
    total: number;
  }) => Promise<void>;
  darkMode: boolean;
}

export default function CheckoutModal({
  onClose,
  cart,
  userInfo,
  activeCoupon,
  onPlaceOrder,
  darkMode
}: CheckoutModalProps) {
  // Input states
  const [fullName, setFullName] = useState(userInfo?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(userInfo?.phone || "");
  const [address, setAddress] = useState(userInfo?.savedAddresses?.[0] || "");
  
  // Payment States
  const [payMethod, setPayMethod] = useState<'UPI' | 'Card' | 'Net Banking' | 'Cash on Delivery'>('UPI');
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [selectedBank, setSelectedBank] = useState("State Bank of India");

  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Math Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.product.discountedPrice * item.quantity), 0);
  let discountAmount = 0;
  if (activeCoupon) {
    discountAmount = Math.round(subtotal * (activeCoupon.discountPercentage / 100));
  }
  const deliveryCharge = subtotal >= 1499 ? 0 : 99;
  const totalPayable = Math.max(0, subtotal - discountAmount + deliveryCharge);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !phoneNumber || !fullName) return;

    setIsSubmittingOrder(true);
    
    let paymentDetails: any = {};
    if (payMethod === 'UPI') {
      paymentDetails = { upiId: upiId || `${fullName.toLowerCase().replace(/\s+/g, '')}@upi` };
    } else if (payMethod === 'Card') {
      paymentDetails = { cardNumber: cardNumber.replace(/\d(?=\d{4})/g, "*") }; // Save masked
    } else if (payMethod === 'Net Banking') {
      paymentDetails = { bankName: selectedBank };
    }

    try {
      await onPlaceOrder({
        shippingAddress: address,
        shippingPhone: phoneNumber,
        paymentMethod: payMethod,
        paymentDetails,
        subtotal,
        discount: discountAmount,
        deliveryCharge,
        total: totalPayable
      });
    } catch (err) {
      console.error("Order submit failed", err);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const populateSavedAddress = (addr: string) => {
    setAddress(addr);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 font-sans">
      <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity" onClick={onClose}></div>

      <div className={`relative max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl transition-all border p-6 flex flex-col md:flex-row gap-6 max-h-[92vh] ${
        darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
      }`}>
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-800/10 dark:hover:bg-slate-800 text-slate-400">
          <X className="w-5 h-5" />
        </button>

        {/* Form panel */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto pr-1">
          <h3 className="text-lg font-black tracking-tight uppercase border-b border-slate-700/20 pb-2">
            Secure Checkout Wizard
          </h3>

          {/* Delivery Coordinates */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
              1. SHIPPING COORDINATES
            </span>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Full Delivery Name</label>
              <input
                type="text"
                required
                className={`w-full p-2.5 rounded-xl text-xs focus:outline-hidden border ${
                  darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
                placeholder="E.g. Harish Dynamo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Contact Mobile Number</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    className={`w-full p-2.5 pl-9 rounded-xl text-xs focus:outline-hidden border ${
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                    placeholder="E.g. 9876543210 (10 digits)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <Phone className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
              
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Delivery PIN Code</label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className={`w-full p-2.5 rounded-xl text-xs focus:outline-hidden border ${
                    darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                  placeholder="E.g. 110001 (6 digits)"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Detailed Street Address</label>
              <div className="relative">
                <textarea
                  required
                  rows={2}
                  className={`w-full p-2.5 pl-9 rounded-xl text-xs focus:outline-hidden border ${
                    darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                  placeholder="Flat No, Wing, Sector, Society, Land Mark..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <MapPin className="absolute left-3 top-3.5 w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* Saved Address helper */}
              {userInfo?.savedAddresses && userInfo.savedAddresses.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Saved Profile Addresses:</span>
                  {userInfo.savedAddresses.map((addr, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => populateSavedAddress(addr)}
                      className={`text-[9px] px-2 py-0.5 rounded-sm truncate max-w-[200px] border font-sans ${
                        darkMode ? "bg-slate-800 hover:bg-slate-750 border-slate-700" : "bg-slate-100 hover:bg-slate-200 border-slate-200"
                      }`}
                      title={addr}
                    >
                      Address {index + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Secure Payments Gateway */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
              2. SECURE PAYMENT ENGINE
            </span>

            {/* Selector Grid */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'UPI', label: 'UPI IP' },
                { key: 'Card', label: 'Card' },
                { key: 'Net Banking', label: 'NetBank' },
                { key: 'Cash on Delivery', label: 'CoD' }
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPayMethod(item.key as any)}
                  className={`p-2 rounded-xl border text-[11px] font-bold font-sans transition-all text-center flex flex-col items-center justify-center gap-1 leading-none ${
                    payMethod === item.key
                      ? "bg-amber-500 border-amber-500 text-slate-900 font-semibold"
                      : darkMode
                        ? "border-slate-850 bg-slate-800 hover:bg-slate-750 text-slate-300"
                        : "border-slate-150 bg-slate-50 hover:bg-slate-100/50 text-slate-650"
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Card Panel Details view */}
            <div className={`p-4 rounded-xl border ${
              darkMode ? "bg-slate-850/60 border-slate-800" : "bg-slate-50 border-slate-150"
            }`}>
              
              {payMethod === 'UPI' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-500 uppercase">Pay instantly with Mobile UPI</span>
                    <span className="text-[9px] text-slate-400">BHIM / Phonpay / GPay</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      className={`w-full p-2.5 pl-9 rounded-xl text-xs focus:outline-hidden border ${
                        darkMode ? "bg-slate-900 border-slate-750 text-white" : "bg-white border-slate-200 text-slate-800"
                      }`}
                      placeholder="Enter UPI ID (e.g. name@upi)"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                    <Sparkles className="absolute left-3 top-3.5 w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <span className="text-[10px] text-slate-400 block font-sans">
                    * If left blank, we will generate a secure mock descriptor under your name.
                  </span>
                </div>
              )}

              {payMethod === 'Card' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-500 uppercase">Input Credit or Debit Card Specs</span>
                    <CreditCard className="w-4 h-4 text-slate-400" />
                  </div>
                  
                  <input
                    type="text"
                    required
                    pattern="[0-9\s]{16,19}"
                    maxLength={19}
                    className={`w-full p-2.5 rounded-xl text-xs focus:outline-hidden border ${
                      darkMode ? "bg-slate-900 border-slate-755 text-white" : "bg-white border-slate-200 text-slate-800"
                    }`}
                    placeholder="16-Digit Card Number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      maxLength={5}
                      className={`w-full p-2.5 rounded-xl text-xs focus:outline-hidden border ${
                        darkMode ? "bg-slate-900 border-slate-755 text-white" : "bg-white border-slate-200 text-slate-800"
                      }`}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                    />
                    <input
                      type="password"
                      required
                      placeholder="CVV"
                      maxLength={3}
                      className={`w-full p-2.5 rounded-xl text-xs focus:outline-hidden border ${
                        darkMode ? "bg-slate-900 border-slate-755 text-white" : "bg-white border-slate-200 text-slate-800"
                      }`}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {payMethod === 'Net Banking' && (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-amber-500 uppercase">Select NetBanking Channel Partner</span>
                    <Building className="w-4 h-4 text-slate-400" />
                  </div>
                  <select
                    className={`w-full p-2.5 rounded-xl text-xs focus:outline-hidden border ${
                      darkMode ? "bg-slate-900 border-slate-755 text-white" : "bg-white border-slate-200 text-slate-850"
                    }`}
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                  >
                    <option value="State Bank of India">State Bank of India (SBI)</option>
                    <option value="HDFC Bank">HDFC Bank Premium</option>
                    <option value="ICICI Bank">ICICI Bank Dynamic</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}

              {payMethod === 'Cash on Delivery' && (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-500 font-bold uppercase text-[10px]">
                    <Banknote className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>Cash on Delivery Confirmation</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                    Choose this mode to pay cash content to the BLUEDART delivery associate upon actual home arrival. We charge ₹50 COD convenience fees (waived on this build).
                  </p>
                </div>
              )}

            </div>
          </div>

          <button
            id="modal-place-order-btn"
            type="submit"
            disabled={isSubmittingOrder}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-blue-500 text-slate-950 text-xs font-black rounded-xl text-center shadow-lg active:scale-98 transition-all disabled:opacity-50 uppercase tracking-widest"
          >
            {isSubmittingOrder ? "Registering identity..." : "Authorization & Pay"}
          </button>
        </form>

        {/* Invoice breakdown summary */}
        <div className={`w-full md:w-64 p-4 rounded-xl flex flex-col justify-between ${
          darkMode ? "bg-slate-950/50 border border-slate-800" : "bg-slate-100 border border-slate-200"
        }`}>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-800 pb-1.5">
              Identities Cart Summary
            </h4>

            <div className="space-y-2 font-sans max-h-[140px] overflow-y-auto mb-4 pr-1">
              {cart.map((item, id) => (
                <div key={id} className="text-[11px] flex justify-between gap-2 text-slate-350">
                  <span className="truncate flex-1">
                    {item.quantity}x &bull; {item.product.name}
                  </span>
                  <span className="font-mono text-[10px] shrink-0 font-medium">
                    {formatINR(item.product.discountedPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-xs py-3 border-t border-slate-800">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Items Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-500 text-[11px]">
                  <span>Promo Code</span>
                  <span>-{formatINR(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Logistics Delivery</span>
                <span>{deliveryCharge === 0 ? "FREE" : formatINR(deliveryCharge)}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-center md:text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Total Payable price</span>
            <span className="text-xl font-black text-emerald-400 font-mono tracking-tight">{formatINR(totalPayable)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
