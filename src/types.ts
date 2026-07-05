export interface Review {
  id: string;
  userName: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPercentage: number;
  discountedPrice: number; // Price after discount
  category: 'Men' | 'Women' | 'Unisex' | 'Accessories' | 'Multi-purpose';
  subcategory: string;
  image: string; // Image link
  images?: string[]; // Optional multiple images
  stock: number;
  rating: number; // e.g. 4.5
  ratingsCount: number;
  reviews: Review[];
  features?: string[];
  trending?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  paymentMethod: 'UPI' | 'Card' | 'Net Banking' | 'Cash on Delivery';
  paymentDetails?: {
    upiId?: string;
    cardNumber?: string;
    bankName?: string;
  };
  couponCode?: string;
  shippingAddress: string;
  shippingPhone: string;
  status: 'Order Placed' | 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  orderDate: string;
  trackingUpdates: { status: string; date: string; description: string }[];
}

export interface Coupon {
  code: string;
  discountPercentage: number;
  minPurchaseAmount: number;
  description: string;
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  phone?: string;
  savedAddresses?: string[];
  wishlist: string[]; // Product IDs
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
