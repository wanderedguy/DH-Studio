import React from 'react';
import { X, CheckCircle2, Circle, Clock, MapPin, Truck, HelpCircle, PackageCheck } from 'lucide-react';
import { Order } from '../types';

interface TrackerModalProps {
  order: Order;
  onClose: () => void;
  darkMode: boolean;
}

export default function TrackerModal({
  order,
  onClose,
  darkMode
}: TrackerModalProps) {
  
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const statusList = [
    "Order Placed",
    "Processing",
    "Shipped",
    "Out for Delivery",
    "Delivered"
  ];

  const currentStatusIndex = statusList.indexOf(order.status);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 font-sans">
      <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className={`relative max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl border p-6 flex flex-col gap-5 ${
        darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
      }`}>
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-800/10 dark:hover:bg-slate-800 text-slate-400">
          <X className="w-5 h-5" />
        </button>

        <div>
          <span className="text-[10px] font-mono tracking-widest text-amber-500 font-bold uppercase">
            📦 DHL / BLUEDART REAL-TIME LOGISTICS
          </span>
          <h3 className="text-lg font-black tracking-tight uppercase mt-0.5">
            Track Shipment {order.id}
          </h3>
          <p className="text-[10px] text-slate-450 mt-1">
            Registered on DH² network on {new Date(order.orderDate).toLocaleString("en-IN")}
          </p>
        </div>

        {/* Visual Line Progress Graph */}
        <div className="relative flex flex-col gap-4 py-2">
          {statusList.map((stat, id) => {
            const isCompleted = id < currentStatusIndex;
            const isCurrent = id === currentStatusIndex;
            const isRemaining = id > currentStatusIndex;

            return (
              <div key={stat} className="flex gap-4 items-start relative select-none">
                
                {/* Connecting lines */}
                {id < statusList.length - 1 && (
                  <div className={`absolute left-3.5 top-6 bottom-0 w-0.5 -ml-[1px] ${
                    id < currentStatusIndex 
                      ? "bg-emerald-500" 
                      : "bg-slate-700/40"
                  }`} />
                )}

                {/* State Bullet Indicators */}
                <div className="relative shrink-0 mt-0.5">
                  {isCompleted && (
                    <CheckCircle2 className="w-7 h-7 text-emerald-500 fill-emerald-500/10" />
                  )}
                  {isCurrent && (
                    <Clock className="w-7 h-7 text-amber-500 fill-amber-500/10 animate-pulse" />
                  )}
                  {isRemaining && (
                    <Circle className="w-7 h-7 text-slate-600" />
                  )}
                </div>

                {/* State Label */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold leading-tight ${
                      isCurrent ? "text-amber-500" : isCompleted ? "text-slate-300" : "text-slate-500"
                    }`}>
                      {stat}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] bg-amber-500/15 text-amber-500 font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                        ACTIVE STAGE
                      </span>
                    )}
                  </div>
                  
                  {/* Detailed descriptions */}
                  <p className="text-[11px] text-slate-450 font-sans mt-0.5">
                    {order.trackingUpdates.find(u => u.status === stat)?.description || 
                      (isRemaining ? "Awaiting completion of previous logistic stage." : "Logistic hub processing coordinates verified.")}
                  </p>
                </div>

              </div>
            );
          })}
        </div>

        {/* Parcel Metadata */}
        <div className={`p-4 rounded-xl border space-y-3 ${
          darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-150"
        }`}>
          <div className="flex items-start gap-2 text-xs">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-slate-400 text-[10px] uppercase">Destination Address</span>
              <p className="text-[11px] text-slate-350 leading-relaxed font-sans">{order.shippingAddress}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/15">
            <div>
              <span className="font-bold text-slate-400 text-[10px] uppercase block">Recipients Telephone</span>
              <span className="font-mono text-[11px] text-slate-350">{order.shippingPhone}</span>
            </div>
            <div>
              <span className="font-bold text-slate-400 text-[10px] uppercase block">Subtotal Value Paid</span>
              <span className="font-mono text-[11px] text-emerald-400 font-bold">{formatINR(order.total)}</span>
            </div>
          </div>
        </div>

        {/* WhatsApp Notification CTA Link */}
        <a
          href={`https://api.whatsapp.com/send?phone=919941188519&text=${encodeURIComponent(
            `*DH² Studio - New Order placed!* 🛍️\n\n` +
            `*Order ID:* ${order.id}\n` +
            `*Customer Name:* ${order.customerName}\n` +
            `*Mobile:* ${order.shippingPhone}\n` +
            `*Delivery Address:* ${order.shippingAddress}\n` +
            `*Payment Method:* ${order.paymentMethod}\n\n` +
            `*Items Ordered:*\n` +
            order.items.map(item => `- ${item.quantity}x ${item.product.name}${item.selectedSize ? ` (Size: ${item.selectedSize})` : ""} - ₹${item.product.discountedPrice * item.quantity}`).join("\n") +
            `\n\n*Total Payable:* ₹${order.total}\n\nThank you for shopping with DH² Studio!`
          )}`}
          target="_blank"
          rel="noreferrer"
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl text-center shadow-md active:scale-97 transition-all flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
        >
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Send Details to WhatsApp (+91 9941188519)
        </a>

        {/* Support Help */}
        <div className="text-center">
          <p className="text-[10px] text-slate-450 leading-relaxed font-sans">
            Need urgent changes? Talk to our AI chatbot **DH² Spark** right away or contact tracking support: **support@dh2studio.com**.
          </p>
        </div>

      </div>
    </div>
  );
}
