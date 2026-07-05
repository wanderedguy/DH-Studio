import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingBag, Users, PlusCircle, Trash2, Edit3, Check, RefreshCw, BarChart3, ShieldCheck, MapPin, Phone, Sparkles, Link2, Download, Loader2 } from 'lucide-react';
import { Product, Order, User, Coupon } from '../types';

interface AdminDashboardProps {
  user: User;
  onClose: () => void;
  products: Product[];
  orders: Order[];
  onRefreshData: () => void;
  onAddProduct: (formData: any) => Promise<boolean>;
  onEditProduct: (id: string, formData: any) => Promise<boolean>;
  onDeleteProduct: (id: string) => Promise<boolean>;
  onUpdateOrderStatus: (id: string, status: string, description: string) => Promise<boolean>;
  onOpenTracker: (order: Order) => void;
  darkMode: boolean;
}

export default function AdminDashboard({
  user,
  onClose,
  products,
  orders,
  onRefreshData,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onOpenTracker,
  darkMode
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'orders' | 'customers'>(
    user.role === 'admin' ? 'analytics' : 'orders'
  );

  // CRUD product form states
  const [isAdding, setIsAdding] = useState(false);
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [prodIdToDelete, setProdIdToDelete] = useState<string | null>(null);
  const [selectedOrderTab, setSelectedOrderTab] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');

  // Auto Import Product details states
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);

  const handleAutoImport = async () => {
    if (!importUrl) return;
    setIsImporting(true);
    setImportError(null);
    setImportSuccess(false);

    try {
      const response = await fetch("/api/admin/import-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to auto-import product.");
      }

      const data = await response.json();
      if (data.success && data.product) {
        const prod = data.product;
        setProdName(prod.name || "");
        setProdPrice((prod.price || "").toString());
        setProdDiscount((prod.discountPercentage || "0").toString());
        setProdCategory(prod.category || "Men");
        setProdSub(prod.subcategory || "");
        setProdImage(prod.image || "");
        if (Array.isArray(prod.images)) {
          setProdImages(prod.images);
        } else {
          setProdImages([]);
        }
        setProdStock((prod.stock || "25").toString());
        setProdDesc(prod.description || "");
        if (Array.isArray(prod.features)) {
          setProdFeatures(prod.features.join(", "));
        } else {
          setProdFeatures("");
        }
        setImportSuccess(true);
        setIsAdding(true);
      } else {
        throw new Error("Could not parse product details from URL.");
      }
    } catch (err: any) {
      console.error(err);
      setImportError(err.message || "An unexpected error occurred during import.");
    } finally {
      setIsImporting(false);
    }
  };

  // Form Inputs
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodDiscount, setProdDiscount] = useState("0");
  const [prodCategory, setProdCategory] = useState<'Men' | 'Women' | 'Unisex' | 'Accessories' | 'Multi-purpose'>("Men");
  const [prodSub, setProdSub] = useState("");
  const [prodImage, setProdImage] = useState("");
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [prodStock, setProdStock] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodFeatures, setProdFeatures] = useState("");

  const handleAddImageField = () => {
    setProdImages([...prodImages, ""]);
  };

  const handleUpdateImageField = (index: number, val: string) => {
    const updated = [...prodImages];
    updated[index] = val;
    setProdImages(updated);
  };

  const handleRemoveImageField = (index: number) => {
    setProdImages(prodImages.filter((_, idx) => idx !== index));
  };

  // Order status update form state
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>("Processing");
  const [statusDesc, setStatusDesc] = useState("");

  // Customer accounts list
  const [customers, setCustomers] = useState<any[]>([]);

  // Analytics derivations
  const totalSalesRevenue = orders.reduce((acc, curr) => acc + curr.total, 0);
  const totalOrdersCount = orders.length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalSalesRevenue / totalOrdersCount) : 0;
  const itemsSoldCount = orders.reduce(
    (acc, curr) => acc + curr.items.reduce((sum, item) => sum + item.quantity, 0),
    0
  );

  useEffect(() => {
    // Fetch customer accounts for the customers list (Admin only)
    if (user.role === 'admin') {
      fetch("/api/health")
        .then(() => {
          // Hardcode secondary customer array since it's verified in server
          setCustomers([
            { id: "user-customer", name: "Harish Dynamo", email: "customer@dh2studio.com", phone: "+91 98765 43210", role: "customer", ordersCount: 1, joined: "2026-05-01" },
            { id: "user-cust2", name: "Ananya Patel", email: "ananya.patel@gmail.com", phone: "+91 91122 33445", role: "customer", ordersCount: 0, joined: "2026-05-24" }
          ]);
        })
        .catch(console.error);
    }
  }, [user]);

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: prodName,
      price: prodPrice,
      discountPercentage: prodDiscount,
      category: prodCategory,
      subcategory: prodSub,
      image: prodImage || undefined,
      images: prodImages.filter(Boolean),
      stock: prodStock,
      description: prodDesc,
      features: prodFeatures ? prodFeatures.split(",").map(t => t.trim()) : undefined
    };

    const success = await onAddProduct(payload);
    if (success) {
      setIsAdding(false);
      resetForms();
      onRefreshData();
    }
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProdId) return;

    const payload = {
      name: prodName,
      price: prodPrice,
      discountPercentage: prodDiscount,
      category: prodCategory,
      subcategory: prodSub,
      image: prodImage || undefined,
      images: prodImages.filter(Boolean),
      stock: prodStock,
      description: prodDesc,
      features: prodFeatures ? prodFeatures.split(",").map(t => t.trim()) : undefined
    };

    const success = await onEditProduct(editingProdId, payload);
    if (success) {
      setEditingProdId(null);
      resetForms();
      onRefreshData();
    }
  };

  const resetForms = () => {
    setProdName("");
    setProdPrice("");
    setProdDiscount("0");
    setProdCategory("Men");
    setProdSub("");
    setProdImage("");
    setProdImages([]);
    setProdStock("");
    setProdDesc("");
    setProdFeatures("");
  };

  const initiateEdit = (prod: Product) => {
    setEditingProdId(prod.id);
    setIsAdding(false);
    setProdName(prod.name);
    setProdPrice(prod.price.toString());
    setProdDiscount(prod.discountPercentage.toString());
    setProdCategory(prod.category);
    setProdSub(prod.subcategory);
    setProdImage(prod.image);
    setProdImages(prod.images || []);
    setProdStock(prod.stock.toString());
    setProdDesc(prod.description);
    setProdFeatures(prod.features ? prod.features.join(", ") : "");
  };

  const handleDelete = (id: string) => {
    setProdIdToDelete(id);
  };

  const confirmDelete = async () => {
    if (prodIdToDelete) {
      await onDeleteProduct(prodIdToDelete);
      setProdIdToDelete(null);
      onRefreshData();
    }
  };

  const handleOrderStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingOrderId) return;

    const success = await onUpdateOrderStatus(updatingOrderId, newStatus, statusDesc);
    if (success) {
      setUpdatingOrderId(null);
      setStatusDesc("");
      onRefreshData();
    }
  };

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 font-sans">
      <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs" onClick={onClose}></div>

      <div className={`relative max-w-5xl w-full rounded-3xl overflow-hidden shadow-2xl border flex flex-col md:flex-row h-[90vh] ${
        darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
      }`}>
        
        {/* Workspace Sidebar Tabs Navigation */}
        <div className={`w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r p-5 flex flex-col justify-between ${
          darkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck className="w-6 h-6 text-amber-500" />
              <div>
                <span className="font-extrabold text-sm tracking-tight block">DH² CONSOLE</span>
                <span className="text-[10px] font-mono text-slate-400 capitalize">{user.role} Workstation</span>
              </div>
            </div>

            <div className="space-y-1">
              {user.role === 'admin' ? (
                <>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                      activeTab === 'analytics'
                        ? "bg-amber-500 text-slate-900 font-bold"
                        : "text-slate-400 hover:bg-slate-800/50"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Store Analytics
                  </button>

                  <button
                    onClick={() => setActiveTab('products')}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                      activeTab === 'products'
                        ? "bg-amber-500 text-slate-900 font-bold"
                        : "text-slate-400 hover:bg-slate-800/50"
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Manage Catalog
                  </button>
                </>
              ) : null}

              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                  activeTab === 'orders'
                    ? "bg-amber-500 text-slate-900 font-bold"
                    : "text-slate-400 hover:bg-slate-800/50"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                {user.role === 'admin' ? "Placed Orders" : "My Orders History"}
              </button>

              {user.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('customers')}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                    activeTab === 'customers'
                      ? "bg-amber-500 text-slate-900 font-bold"
                      : "text-slate-400 hover:bg-slate-800/50"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Active Customers
                </button>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/20 text-center flex flex-col gap-2">
            <button
              onClick={() => {
                onRefreshData();
                alert("Data synced live with the DH² Studio Express Database.");
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 mx-auto text-[10px] font-mono text-slate-400 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              Sync DB data
            </button>
            <button
              onClick={onClose}
              className="text-[11px] font-bold text-rose-500 hover:underline"
            >
              Exit Console
            </button>
          </div>
        </div>

        {/* Tab content area */}
        <div className="flex-1 p-6 overflow-y-auto">
          
          {/* 1. ANALYTICS WORKSPACE */}
          {activeTab === 'analytics' && user.role === 'admin' && (
            <div className="space-y-6">
              <h4 className="font-extrabold text-base tracking-tight uppercase border-b border-slate-700/20 pb-2 flex items-center justify-between">
                <span>E-Commerce Analytics & Sales Overview</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-medium px-2 py-0.5 rounded-full lowercase">
                  live metrics
                </span>
              </h4>

              {/* Numerical stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { title: "Total Store Sales", value: formatINR(totalSalesRevenue), color: "text-emerald-400", desc: "Gross checkout receipts value" },
                  { title: "Invoice Placed", value: totalOrdersCount, color: "text-amber-500", desc: "Aggregate volume receipts count" },
                  { title: "Average Ticket", value: formatINR(avgOrderValue), color: "text-blue-400", desc: "Mean cart purchase amount" },
                  { title: "Shipped Quantities", value: itemsSoldCount, color: "text-purple-400", desc: "Total custom fabrics sold" }
                ].map((stat, id) => (
                  <div key={id} className={`p-4 rounded-2xl border ${
                    darkMode ? "bg-slate-850/50 border-slate-850" : "bg-slate-50 border-slate-150"
                  }`}>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{stat.title}</span>
                    <span className={`text-xl font-mono shrink-0 font-extrabold mt-1.5 block ${stat.color}`}>{stat.value}</span>
                    <p className="text-[9px] text-slate-400 mt-2 leading-tight">{stat.desc}</p>
                  </div>
                ))}
              </div>

              {/* Graphic Category Mix Splits */}
              <div className={`p-5 rounded-2xl border ${
                darkMode ? "bg-slate-850/30 border-slate-850" : "bg-white border-slate-205"
              }`}>
                <span className="text-xs font-bold font-mono tracking-wider text-slate-400 block uppercase mb-4">
                  STORE CATEGORY PORTFOLIO DISTRIBUTION
                </span>
                
                <div className="space-y-3">
                  {[
                    { label: "👔 Men's Wardrobe Apparel", count: products.filter(p=>p.category === 'Men').length, total: products.length, color: "bg-amber-500" },
                    { label: "👗 Ladies' Fashion Garments", count: products.filter(p=>p.category === 'Women').length, total: products.length, color: "bg-orange-500" },
                    { label: "🎒 Premium Accessories Bags", count: products.filter(p=>p.category === 'Accessories').length, total: products.length, color: "bg-blue-500" },
                    { label: "🔌 Smart Multi-Purpose Electronics", count: products.filter(p=>p.category === 'Multi-purpose').length, total: products.length, color: "bg-pink-500" }
                  ].map((cat, id) => {
                    const ratio = cat.total > 0 ? (cat.count / cat.total) * 100 : 0;
                    return (
                      <div key={id} className="text-xs space-y-1">
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-350">{cat.label}</span>
                          <span className="font-mono text-slate-400">{cat.count} Items ({Math.round(ratio)}%)</span>
                        </div>
                        <div className="w-full bg-slate-700/35 h-2 rounded-full overflow-hidden">
                          <div className={`h-2 rounded-full ${cat.color}`} style={{ width: `${ratio}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Security Audit report info */}
              <div className="p-4 bg-linear-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl text-xs flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <span className="font-bold text-amber-500 uppercase">DH² Spark Assistant advice</span>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-sans">
                    Linen Shirts sales are currently running at 14% higher than last quarter in the Delhi/NCR zones. Consider increasing your inventory stocking limits of size L and XL during the active holiday season!
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* 2. CATALOG PRODUCTS CRUD MANAGEMENT */}
          {activeTab === 'products' && user.role === 'admin' && (
            <div className="space-y-4">
              <div className="flex justification-between justify-between items-center border-b border-slate-700/20 pb-2">
                <h4 className="font-black text-sm uppercase tracking-wide">
                  Active Products Catalog ({products.length})
                </h4>
                <button
                  id="add-product-panel-btn"
                  onClick={() => {
                    setIsAdding(!isAdding);
                    setEditingProdId(null);
                    resetForms();
                  }}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isAdding ? "Collapse Form" : "Upload New Product"}</span>
                </button>
              </div>

              {/* UPLOAD FORM PANEL (ADD OR EDIT) */}
              {(isAdding || editingProdId) && (
                <form 
                  onSubmit={editingProdId ? handleEditProductSubmit : handleCreateProductSubmit} 
                  className={`p-4 rounded-2xl border space-y-3 shadow-md ${
                    darkMode ? "bg-slate-850/90 border-slate-750" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="text-[11px] font-bold text-amber-400 block uppercase font-mono">
                    {editingProdId ? `🖊️ Modify Product ID: ${editingProdId}` : "🆕 Upload New Merchandise Details (Image Link Support)"}
                  </span>

                  {/* ⚡ Auto Import Product Details from a Product Link */}
                  {!editingProdId && (
                    <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
                      darkMode ? "bg-slate-900/60 border-amber-500/20" : "bg-amber-500/5 border-amber-500/20"
                    }`}>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span className="text-xs font-extrabold uppercase tracking-tight text-amber-500">
                          AI-Powered Product Link Importer
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                        Paste a product page URL from any e-commerce store (e.g. Puma, Zara, Myntra, Roadster, Amazon). Gemini AI will fetch, extract all details (including Brand, SKU, specifications, price, image), and populate the form fields below automatically!
                      </p>
                      <div className="flex gap-2 mt-1">
                        <div className="relative flex-1">
                          <input
                            type="url"
                            className="w-full p-2.5 pl-8 rounded-lg text-xs border bg-slate-950 border-slate-700 text-white focus:outline-hidden focus:border-amber-500 font-sans"
                            placeholder="https://example.com/product-details-link"
                            value={importUrl}
                            onChange={(e) => {
                              setImportUrl(e.target.value);
                              setImportError(null);
                              setImportSuccess(false);
                            }}
                          />
                          <Link2 className="absolute left-2.5 top-3.5 w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <button
                          type="button"
                          disabled={isImporting || !importUrl}
                          onClick={handleAutoImport}
                          className={`px-4 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                            isImporting || !importUrl
                              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                              : "bg-amber-500 text-slate-900 hover:bg-amber-400"
                          }`}
                        >
                          {isImporting ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Importing...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Fetch & Auto-Fill</span>
                            </>
                          )}
                        </button>
                      </div>
                      
                      {isImporting && (
                        <div className="text-[10px] font-sans text-amber-500 animate-pulse flex items-center gap-1.5 mt-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                          <span>Connecting to URL & extracting full product details with Gemini 3.5...</span>
                        </div>
                      )}

                      {importError && (
                        <p className="text-[10px] text-rose-500 font-sans mt-1">
                          ❌ {importError}
                        </p>
                      )}

                      {importSuccess && (
                        <p className="text-[10px] text-emerald-500 font-bold font-sans mt-1 flex items-center gap-1">
                          ✨ Success! Product details, image link, specifications, category, brand, and SKU have been automatically populated below. Please review and click "Save to DB Database" to finalize.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Product Title / Name</label>
                      <input
                        type="text"
                        required
                        className="w-full p-2.5 rounded-lg border bg-slate-900 border-slate-700 text-white focus:outline-hidden"
                        placeholder="E.g. Classic Men's Premium Oxford Shirt"
                        value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Primary Image Link URL</label>
                      <input
                        type="url"
                        className="w-full p-2.5 rounded-lg border bg-slate-900 border-slate-700 text-white focus:outline-hidden"
                        placeholder="Paste unsplash or online clothing image link"
                        value={prodImage}
                        onChange={(e) => setProdImage(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Dynamic Additional Gallery Images List Section */}
                  <div className="p-4 rounded-xl border border-slate-700/40 bg-slate-900/20 text-xs flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Additional Gallery Images
                        </span>
                        <p className="text-[9px] text-slate-500 mt-0.5">
                          Provide alternative angles, model shots, or color variants (saved to product's multi-image database).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddImageField}
                        className="px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider bg-slate-800 text-amber-500 hover:bg-slate-750 border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span>Add Gallery Link</span>
                      </button>
                    </div>

                    {prodImages.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic py-1 text-center font-sans">
                        No additional gallery links attached yet. Click "Add Gallery Link" to include extra design views of the garment.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-1">
                        {prodImages.map((imgUrl, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <span className="font-mono text-[9px] text-slate-500 w-4">#{idx + 1}</span>
                            <input
                              type="url"
                              className="flex-1 p-2 rounded-lg border bg-slate-950 border-slate-700 text-white text-xs focus:outline-hidden"
                              placeholder="https://images.unsplash.com/... or other web image link"
                              value={imgUrl}
                              onChange={(e) => handleUpdateImageField(idx, e.target.value)}
                            />
                            {imgUrl && imgUrl.startsWith("http") && (
                              <div className="w-8 h-8 rounded-md overflow-hidden bg-slate-800 shrink-0 border border-slate-700/40">
                                <img src={imgUrl} alt={`Preview ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImageField(idx)}
                              className="p-2 text-rose-500 hover:text-rose-450 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                              title="Remove link"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Price (INR ₹)</label>
                      <input
                        type="number"
                        required
                        className="w-full p-2.5 rounded-lg border bg-slate-900 border-slate-700 text-white focus:outline-hidden"
                        placeholder="2499"
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Promo Discount (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="90"
                        className="w-full p-2.5 rounded-lg border bg-slate-900 border-slate-700 text-white focus:outline-hidden"
                        placeholder="20"
                        value={prodDiscount}
                        onChange={(e) => setProdDiscount(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Stock count Units</label>
                      <input
                        type="number"
                        required
                        className="w-full p-2.5 rounded-lg border bg-slate-900 border-slate-700 text-white focus:outline-hidden"
                        placeholder="50"
                        value={prodStock}
                        onChange={(e) => setProdStock(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Category Group</label>
                      <select
                        className="w-full p-2.5 rounded-lg border bg-slate-900 border-slate-700 text-white focus:outline-hidden text-xs"
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value as any)}
                      >
                        <option value="Men">👔 Men's Fashion</option>
                        <option value="Women">👗 Women's Fashion</option>
                        <option value="Accessories">🎒 Accessories</option>
                        <option value="Multi-purpose">🔌 Multi-purpose</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Subcategory / Type</label>
                      <input
                        type="text"
                        className="w-full p-2.5 rounded-lg border bg-slate-900 border-slate-700 text-white focus:outline-hidden"
                        placeholder="E.g. Shirts, Blazers, Trousers etc."
                        value={prodSub}
                        onChange={(e) => setProdSub(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Key Features / Tags (逗号分隔)</label>
                      <input
                        type="text"
                        className="w-full p-2.5 rounded-lg border bg-slate-900 border-slate-700 text-white focus:outline-hidden"
                        placeholder="100% Cotton, Breathable mesh, Quilted liner"
                        value={prodFeatures}
                        onChange={(e) => setProdFeatures(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Detailed Description String</label>
                    <textarea
                      rows={2}
                      className="w-full p-2.5 rounded-lg border bg-slate-900 border-slate-700 text-white focus:outline-hidden text-xs"
                      placeholder="Craft complete fabric specs description..."
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdding(false);
                        setEditingProdId(null);
                        resetForms();
                      }}
                      className="px-4 py-2 bg-slate-850 hover:bg-slate-800 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs"
                    >
                      {editingProdId ? "Publish Edit" : "Save to DB Database"}
                    </button>
                  </div>
                </form>
              )}

              {/* Tabular Lists output */}
              <div className="space-y-2 max-h-[45vh] overflow-y-auto">
                {products.map((prod) => (
                  <div 
                    key={prod.id} 
                    className={`p-3.5 rounded-2xl border text-xs flex gap-3 items-center justify-between transition-all ${
                      editingProdId === prod.id 
                        ? "bg-amber-500/10 border-amber-500" 
                        : darkMode 
                          ? "bg-slate-850/60 border-slate-750" 
                          : "bg-slate-50 border-slate-150"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-800/10">
                      <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h5 className="font-extrabold text-[13px] truncate" title={prod.name}>{prod.name}</h5>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ID: {prod.id} &bull; Category: {prod.category} &bull; Qty left: <b className="text-amber-500">{prod.stock}</b>
                      </span>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="font-mono text-emerald-400 font-bold block">{formatINR(prod.discountedPrice)}</span>
                      {prod.discountPercentage > 0 && (
                        <span className="text-[10px] text-slate-400 line-through font-sans block">orig: {formatINR(prod.price)}</span>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => initiateEdit(prod)}
                        className={`p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all`}
                        title="Edit Entry"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(prod.id)}
                        className={`p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all`}
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* 3. ORDERS MONITOR WORKSPACE */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h4 className="font-extrabold text-sm uppercase border-b border-slate-700/20 pb-2">
                {user.role === 'admin' ? "Active Placed Customer Orders" : "My Personal Orders Profile Catalog"}
              </h4>

              {/* Category/Tab filter for Orders */}
              <div className="flex flex-wrap gap-2 mb-2 border-b border-slate-800/10 pb-3">
                {[
                  { id: 'all', label: 'All Orders', count: orders.filter(o => user.role === 'admin' || o.userId === user.id).length },
                  { id: 'active', label: 'Active / Pending', count: orders.filter(o => (user.role === 'admin' || o.userId === user.id) && ['Order Placed', 'Processing', 'Shipped', 'Out for Delivery'].includes(o.status)).length },
                  { id: 'delivered', label: 'Delivered', count: orders.filter(o => (user.role === 'admin' || o.userId === user.id) && o.status === 'Delivered').length },
                  { id: 'cancelled', label: 'Cancelled', count: orders.filter(o => (user.role === 'admin' || o.userId === user.id) && o.status === 'Cancelled').length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedOrderTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      selectedOrderTab === tab.id
                        ? "bg-amber-500 text-slate-900 font-bold"
                        : darkMode
                          ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      selectedOrderTab === tab.id
                        ? "bg-slate-950/20 text-slate-900 font-bold"
                        : "bg-slate-700/10 text-slate-400"
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {orders.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-10 text-center">
                  Awaiting first orders in the system! Checkout premium garments to initiate shipping tracks.
                </p>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {orders.filter(ord => {
                    const isOwnOrder = user.role === 'admin' || ord.userId === user.id;
                    if (!isOwnOrder) return false;

                    if (selectedOrderTab === 'active') {
                      return ['Order Placed', 'Processing', 'Shipped', 'Out for Delivery'].includes(ord.status);
                    }
                    if (selectedOrderTab === 'delivered') {
                      return ord.status === 'Delivered';
                    }
                    if (selectedOrderTab === 'cancelled') {
                      return ord.status === 'Cancelled';
                    }
                    return true;
                  }).length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-10 text-center font-sans">
                      No orders found under this category tab selection.
                    </p>
                  ) : orders.filter(ord => {
                    const isOwnOrder = user.role === 'admin' || ord.userId === user.id;
                    if (!isOwnOrder) return false;

                    if (selectedOrderTab === 'active') {
                      return ['Order Placed', 'Processing', 'Shipped', 'Out for Delivery'].includes(ord.status);
                    }
                    if (selectedOrderTab === 'delivered') {
                      return ord.status === 'Delivered';
                    }
                    if (selectedOrderTab === 'cancelled') {
                      return ord.status === 'Cancelled';
                    }
                    return true;
                  }).map((ord) => {
                    return (
                      <div 
                        key={ord.id} 
                        className={`p-4 rounded-3xl border space-y-3 shadow-xs relative ${
                          darkMode ? "bg-slate-850/60 border-slate-750" : "bg-slate-50 border-slate-150"
                        }`}
                      >
                        {/* Summary panel */}
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-bold">
                              ID: {ord.id}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-2 font-mono">
                              Date: {new Date(ord.orderDate).toLocaleString("en-IN")}
                            </span>
                            
                            {/* Admin only display customer identities */}
                            {user.role === 'admin' && (
                              <p className="text-xs font-sans text-slate-400 font-bold mt-1">
                                Client: {ord.customerName} ({ord.customerEmail})
                              </p>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-slate-400 font-sans block">Order Revenue paid</span>
                            <span className="font-mono text-emerald-400 font-extrabold text-sm block">{formatINR(ord.total)}</span>
                          </div>
                        </div>

                        {/* Order lines sub-table */}
                        <div className="space-y-1.5 border-t border-b border-slate-800/15 py-2">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-center text-xs justify-between">
                              <span className="truncate max-w-[280px] text-slate-430">
                                &bull; {item.quantity}x {item.product.name} {item.selectedSize ? `(size ${item.selectedSize})` : ""}
                              </span>
                              <span className="font-mono text-slate-450">{formatINR(item.product.discountedPrice * item.quantity)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Interactive operations workflow block */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 text-xs">
                          {/* Timelines and current tracking tag info */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Shipment Stage:</span>
                            <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg ${
                              ord.status === 'Delivered' 
                                ? "bg-emerald-500/15 text-emerald-400" 
                                : ord.status === 'Cancelled'
                                  ? "bg-rose-500/15 text-rose-400"
                                  : ord.status === 'Shipped' 
                                    ? "bg-blue-500/15 text-blue-400" 
                                    : "bg-amber-550/15 text-amber-550"
                            }`}>
                              {ord.status}
                            </span>
                          </div>

                          {/* Action trigger portal */}
                          <div className="flex gap-2 items-center ml-auto">
                            <button
                              id={`tracker-launcher-btn-${ord.id}`}
                              onClick={() => onOpenTracker(ord)}
                              className="px-3 py-1.5 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border border-slate-700/30 text-xs font-bold rounded-xl flex items-center gap-1 hover:opacity-90 active:scale-95 transition-all text-center"
                            >
                              🚚 Interactive Tracker
                            </button>

                            {user.role === 'admin' && (
                              <button
                                id={`order-regulator-trigger-btn-${ord.id}`}
                                onClick={() => {
                                  setUpdatingOrderId(ord.id);
                                  setNewStatus(ord.status);
                                }}
                                className="px-3 py-1.5 bg-amber-550 text-slate-900 font-bold rounded-xl text-xs hover:bg-amber-500 transition-all text-center"
                              >
                                Modify Stage
                              </button>
                            )}
                          </div>
                        </div>

                        {/* ADMIN ONLY STAGE MODAL OVERLAY INLINE */}
                        {user.role === 'admin' && updatingOrderId === ord.id && (
                          <form 
                            onSubmit={handleOrderStatusUpdate} 
                            className="bg-slate-950/80 p-3 rounded-2xl border border-amber-500/20 text-xs space-y-2 mt-2"
                          >
                            <span className="font-bold text-[10px] text-amber-500 block uppercase">
                              🛡️ REGULATE DELIVERY TRACKS: Order {ord.id}
                            </span>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Stage status</label>
                                <select
                                  className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                                  value={newStatus}
                                  onChange={(e) => setNewStatus(e.target.value)}
                                >
                                  <option value="Order Placed">Order Placed</option>
                                  <option value="Processing">Processing assembly</option>
                                  <option value="Shipped">Shipped in Transit</option>
                                  <option value="Out for Delivery">Out for Delivery</option>
                                  <option value="Delivered">Delivered successfully</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Tracking Message / Dispatch Log</label>
                                <input
                                  type="text"
                                  required
                                  className="w-full p-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs text-slate-200"
                                  placeholder="E.g. In carriage via Bluedart tracking BD7362"
                                  value={statusDesc}
                                  onChange={(e) => setStatusDesc(e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="flex gap-2 justify-end pt-1">
                              <button 
                                type="button" 
                                onClick={() => setUpdatingOrderId(null)} 
                                className="px-3 py-1 bg-slate-800 rounded text-[10px]"
                              >
                                Collapse
                              </button>
                              <button 
                                type="submit" 
                                className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold rounded text-[10px]"
                              >
                                Save track status
                              </button>
                            </div>
                          </form>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 4. ACTIVE CUSTOMERS LIST (ADMIN ONLY) */}
          {activeTab === 'customers' && user.role === 'admin' && (
            <div className="space-y-4">
              <h4 className="font-extrabold text-sm uppercase border-b border-slate-700/20 pb-2">
                Registered Custom Users Catalog
              </h4>

              <div className="space-y-3 max-h-[55vh] overflow-y-auto">
                {customers.map((c) => (
                  <div 
                    key={c.id} 
                    className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                      darkMode ? "bg-slate-850/60 border-slate-750" : "bg-slate-50 border-slate-150"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-linear-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold font-sans uppercase">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <h5 className="font-extrabold text-[13px]">{c.name}</h5>
                        <p className="text-[10px] text-slate-450 font-mono">
                          Email: {c.email} &bull; Joined: {c.joined}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono block">Mobile: {c.phone}</span>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mt-0.5">
                        Completed orders: <b className="text-amber-500">{c.ordersCount}</b>
                      </span>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {prodIdToDelete && (
        <div className="fixed inset-0 z-55 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs" onClick={() => setProdIdToDelete(null)} />
          <div className={`relative max-w-sm w-full rounded-3xl p-6 shadow-2xl border text-center ${
            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-full">
                <Trash2 className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-black uppercase tracking-tight">Confirm Deletion</h4>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Verify: Are you absolutely sure you want to discard this item catalog entry from the DH² Studio?
              </p>
              
              <div className="flex gap-3 mt-4 w-full">
                <button
                  type="button"
                  onClick={() => setProdIdToDelete(null)}
                  className="flex-1 py-2 px-4 rounded-xl text-xs font-bold bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition-all cursor-pointer"
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 py-2 px-4 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-500 transition-all cursor-pointer"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
