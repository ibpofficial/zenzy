"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import {
  Search,
  ShoppingCart,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle,
  Star,
  Sparkles,
  Wrench,
  Brush,
  Cpu,
  Shield,
  LayoutGrid,
  Copy,
  Check,
  QrCode,
  Wallet,
  ArrowRight,
  ArrowLeft
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  category: string;
  image: string;
  rating?: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function ShopPage() {
  const router = useRouter();
  const { user, userData, openAuthModal } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [detailQty, setDetailQty] = useState(1);

  // Artificial mounting loader buffer for buttery smooth loading experience
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popularity");
  const [maxPriceFilter, setMaxPriceFilter] = useState(2000);
  const [visibleCount, setVisibleCount] = useState(6);
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  
  // Checkout Details States
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [isDirectBuy, setIsDirectBuy] = useState(false); // If true, checking out a single item (Buy Now)
  
  const [orderName, setOrderName] = useState("");
  const [orderPhone, setOrderPhone] = useState("");
  const [orderAddress, setOrderAddress] = useState("");
  const [orderPayment, setOrderPayment] = useState("COD");
  const [transactionId, setTransactionId] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  // Site config for UPI payments
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [shopConfig, setShopConfig] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // Pre-load products from sessionStorage cache to save resource reads
  useEffect(() => {
    const cached = sessionStorage.getItem("zenzy_shop_products_cache");
    if (cached) {
      try {
        setProducts(JSON.parse(cached));
      } catch (e) {}
    }
  }, []);

  // Sync products and configs
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, "shopProducts"), (snap) => {
      const list: Product[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      setProducts(list);
      sessionStorage.setItem("zenzy_shop_products_cache", JSON.stringify(list));
    });

    const unsubConfig = onSnapshot(doc(db, "settings", "siteConfig"), (snap) => {
      if (snap.exists()) setSiteConfig(snap.data());
    });

    const unsubShopConfig = onSnapshot(doc(db, "settings", "shopConfig"), (snap) => {
      if (snap.exists()) setShopConfig(snap.data());
    });

    return () => {
      unsubProducts();
      unsubConfig();
      unsubShopConfig();
    };
  }, []);

  // Reset visibleCount count when filter criteria changes
  useEffect(() => {
    setVisibleCount(6);
  }, [selectedCategory, searchQuery, maxPriceFilter]);

  // Pre-fill user details
  useEffect(() => {
    if (userData) {
      setOrderName(userData.name || "");
      if (userData.phone) {
        setOrderPhone(userData.phone.replace(/\D/g, "").slice(0, 10));
      }
    }
  }, [userData]);

  // Sync Cart with Local Storage
  useEffect(() => {
    const savedCart = localStorage.getItem("zenzy_shop_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {}
    }
  }, []);

  const saveCartToStorage = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    localStorage.setItem("zenzy_shop_cart", JSON.stringify(updatedCart));
  };

  // Handle click outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add Item to Cart
  const handleAddToCart = (product: Product, silence = false) => {
    if (product.stock <= 0) {
      showToast("Sorry, this item is out of stock!");
      return;
    }
    
    const existing = cart.find((item) => item.product.id === product.id);
    let updated: CartItem[];
    if (existing) {
      if (existing.quantity >= product.stock) {
        showToast(`Only ${product.stock} units are currently available.`);
        return;
      }
      updated = cart.map((item) =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updated = [...cart, { product, quantity: 1 }];
    }
    saveCartToStorage(updated);
    if (!silence) {
      showToast(`${product.name} added to cart!`);
    }
  };

  // Buy Now (Direct Checkout)
  const handleBuyNow = (product: Product) => {
    if (!user) {
      openAuthModal("login");
      return;
    }
    if (product.stock <= 0) {
      showToast("Sorry, this item is out of stock!");
      return;
    }
    setCheckoutItems([{ product, quantity: 1 }]);
    setIsDirectBuy(true);
    setOrderPayment("COD");
    setTransactionId("");
    setCheckoutOpen(true);
  };

  // Adjust quantity in Cart
  const handleUpdateQty = (productId: string, delta: number) => {
    const updated = cart
      .map((item) => {
        if (item.product.id === productId) {
          const productRef = products.find((p) => p.id === productId);
          const maxStock = productRef ? productRef.stock : 10;
          const newQty = item.quantity + delta;
          if (newQty > maxStock) {
            showToast(`Only ${maxStock} units of this item are in stock.`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);
    saveCartToStorage(updated);
  };

  const handleRemoveFromCart = (productId: string) => {
    const updated = cart.filter((item) => item.product.id !== productId);
    saveCartToStorage(updated);
    showToast("Item removed from cart.");
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(siteConfig?.upiId || "zenzy@upi");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Process github video links to direct raw permalinks
  const getDirectVideoUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("github.com") && url.includes("/blob/")) {
      return url
        .replace("github.com", "raw.githubusercontent.com")
        .replace("/blob/", "/");
    }
    return url;
  };

  // Filter and Sort calculations
  const filteredProducts = React.useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesPrice = p.price <= maxPriceFilter;

        return matchesCategory && matchesSearch && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.price - b.price;
        if (sortBy === "price_desc") return b.price - a.price;
        return (b.rating || 5.0) - (a.rating || 5.0);
      });
  }, [products, selectedCategory, searchQuery, sortBy, maxPriceFilter]);

  // Window scroll handler for lazy/infinite loader
  useEffect(() => {
    const handleScroll = () => {
      const threshold = 120;
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - threshold
      ) {
        setVisibleCount((prev) => Math.min(prev + 6, filteredProducts.length));
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [filteredProducts.length]);

  // Suggestions list
  const searchSuggestions = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 5);
  }, [products, searchQuery]);

  // Checkout calculation helpers
  const calculateInvoice = (items: CartItem[]) => {
    const sub = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const delivery = sub > 499 || sub === 0 ? 0 : 79;
    const tax = Math.round(sub * 0.18);
    const total = sub + delivery + tax;
    return { subtotal: sub, deliveryFee: delivery, taxAmount: tax, grandTotal: total };
  };

  const cartInvoice = calculateInvoice(cart);
  const activeInvoice = calculateInvoice(checkoutItems);

  // Open general checkout for full cart
  const handleOpenCartCheckout = () => {
    if (!user) {
      openAuthModal("login");
      return;
    }
    if (cart.length === 0) return;
    setCheckoutItems(cart);
    setIsDirectBuy(false);
    setOrderPayment("COD");
    setTransactionId("");
    setCheckoutOpen(true);
  };

  // Checkout order submission
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkoutItems.length === 0) return;
    if (!orderName.trim() || !orderPhone.trim() || !orderAddress.trim()) {
      showToast("Please fill in all checkout fields.");
      return;
    }
    
    // Strict 10-digit validation: no more, no less
    if (!/^\d{10}$/.test(orderPhone.trim())) {
      alert("Validation Error: Please enter exactly a 10-digit mobile number (e.g. 9999011222).");
      return;
    }

    if (orderPayment === "UPI QR") {
      const trimmedTx = transactionId.trim();
      if (!/^\d{12}$/.test(trimmedTx)) {
        alert("Please enter a valid 12-digit UPI Transaction reference ID (digits only).");
        return;
      }
    }

    setSubmittingOrder(true);
    try {
      const orderRef = collection(db, "shopOrders");
      const orderPayload = {
        customerName: orderName.trim(),
        customerPhone: orderPhone.trim(),
        customerAddress: orderAddress.trim(),
        paymentMethod: orderPayment,
        transactionId: orderPayment === "UPI QR" ? transactionId.trim() : "",
        paymentStatus: orderPayment === "COD" ? "Pending Approval (COD)" : "Pending Verification (QR)",
        customerId: user?.uid || "guest",
        items: checkoutItems.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity
        })),
        subtotal: activeInvoice.subtotal,
        deliveryFee: activeInvoice.deliveryFee,
        tax: activeInvoice.taxAmount,
        totalAmount: activeInvoice.grandTotal,
        status: "Pending",
        createdAt: new Date().toISOString()
      };
      
      await addDoc(orderRef, orderPayload);

      for (const item of checkoutItems) {
        const productRef = doc(db, "shopProducts", item.product.id);
        const newStock = Math.max(0, item.product.stock - item.quantity);
        await updateDoc(productRef, { stock: newStock });
      }

      setOrderSuccess(true);
      saveCartToStorage([]);
    } catch (err) {
      console.error(err);
      showToast("Checkout failed. Please try again.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  const categoriesList = [
    { name: "All", icon: LayoutGrid },
    { name: "Tools", icon: Wrench },
    { name: "Cleaning", icon: Brush },
    { name: "Smart Home", icon: Cpu },
    { name: "Safety", icon: Shield }
  ];

  if (loading) {
    return <LoadingScreen autoDismiss={false} />;
  }

  if (selectedProduct) {
    const originalPrice = Math.round(selectedProduct.price * 1.35);
    const savings = originalPrice - selectedProduct.price;
    
    // Generate mock thumbnails showing close-ups
    const productImages = [
      selectedProduct.image,
      selectedProduct.image,
      selectedProduct.image
    ];

    return (
      <div className="relative flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300 overflow-hidden">
        {/* Premium ambient glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none z-0" />
        
        {/* Dot Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none z-0" />
        
        <Navbar />

        <main className="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 pt-28 pb-16 flex-grow animate-fade-in">
          {/* Breadcrumb & Back */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSelectedProduct(null)}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-lg shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Shop
            </button>
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:block">
              Shop &gt; {selectedProduct.category} &gt; <span className="text-slate-655 dark:text-slate-300">{selectedProduct.name}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-4">
            {/* Left: Product Media Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center group shadow-xs">
                <img
                  src={productImages[selectedImageIdx]}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  alt={selectedProduct.name}
                />
                <span className="absolute top-4 left-4 bg-emerald-500 text-white font-black text-[9.5px] uppercase tracking-widest px-3 py-1 rounded-full shadow-md animate-pulse">
                  Save 25%
                </span>
              </div>
              
              {/* Image Select Thumbnails */}
              <div className="flex gap-3">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden transition cursor-pointer relative bg-slate-100 dark:bg-slate-900 ${
                      selectedImageIdx === idx 
                        ? "ring-2 ring-emerald-500 shadow-md" 
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Product Details Showcase */}
            <div className="flex flex-col justify-between space-y-6 lg:space-y-0">
              <div className="space-y-5">
                <div className="space-y-2">
                  <span className="bg-slate-150 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                    {selectedProduct.category}
                  </span>
                  <h1 className="text-2.5xl sm:text-3.5xl font-black tracking-tight leading-tight text-slate-900 dark:text-white">
                    {selectedProduct.name}
                  </h1>
                  <div className="flex items-center gap-3">
                    <span className="text-gold font-bold text-sm flex items-center gap-0.5">
                      ★ {selectedProduct.rating || 4.8}
                    </span>
                    <span className="text-xs font-bold text-slate-400">· 120 Customer Ratings</span>
                    <span className="text-xs font-bold text-slate-400">· 18 Answered Questions</span>
                  </div>
                </div>

                <div className="py-4 border-b dark:border-slate-800/80 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Special Discount Price</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/5 px-2.5 py-0.5 rounded">
                      25% OFF
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      ₹{selectedProduct.price.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-slate-400 dark:text-slate-500 line-through">
                      ₹{originalPrice.toLocaleString()}
                    </span>
                    <span className="text-xs font-extrabold text-slate-400">
                      (You save ₹{savings.toLocaleString()})
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Description</span>
                  <p className="text-xs sm:text-sm text-slate-655 dark:text-slate-355 leading-relaxed font-semibold">
                    {selectedProduct.description} This professional-grade supply has been standard checked by Zenzy partner technicians. Perfect for residential or workplace applications, ensuring long durability, high compatibility, and optimal performance under all standard usage conditions.
                  </p>
                </div>

                {/* Spec details grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 text-xs font-semibold text-slate-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>1 Year Standard Warranty</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Fast Dispatch (24h)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>7 Days Easy Replacement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Zenzy Quality Checked</span>
                  </div>
                </div>
              </div>

              {/* Quantity Selector & Cart CTA Row */}
              <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-455">Quantity Selector</span>
                  <span className={selectedProduct.stock > 0 ? "text-emerald-500" : "text-red-500"}>
                    {selectedProduct.stock > 0 ? `In Stock (${selectedProduct.stock} units available)` : "Out of Stock"}
                  </span>
                </div>
                
                <div className="flex gap-4 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDetailQty(prev => Math.max(1, prev - 1))}
                      className="w-10 h-10 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer text-slate-750 dark:text-slate-300 font-extrabold text-sm border-none bg-transparent"
                    >
                      -
                    </button>
                    <span className="text-sm font-black text-slate-800 dark:text-white min-w-[20px] text-center">
                      {detailQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDetailQty(prev => Math.min(selectedProduct.stock || 10, prev + 1))}
                      className="w-10 h-10 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer text-slate-750 dark:text-slate-300 font-extrabold text-sm border-none bg-transparent"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (!user) {
                        openAuthModal("login");
                        return;
                      }
                      setCheckoutItems([{ product: selectedProduct, quantity: detailQty }]);
                      setIsDirectBuy(true);
                      setOrderPayment("COD");
                      setTransactionId("");
                      setCheckoutOpen(true);
                    }}
                    disabled={selectedProduct.stock <= 0}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-905 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed py-3 px-6 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all duration-150 shadow-sm cursor-pointer hover:scale-[1.01] active:scale-97 border-none bg-slate-950"
                  >
                    <ShoppingBag className="w-4.5 h-4.5" />
                    <span>Buy Now</span>
                  </button>

                  <button
                    onClick={() => {
                      for (let i = 0; i < detailQty; i++) {
                        handleAddToCart(selectedProduct, true);
                      }
                      showToast(`${detailQty}x ${selectedProduct.name} added to cart!`);
                    }}
                    disabled={selectedProduct.stock <= 0}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-250 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed py-3 px-6 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all duration-150 shadow-sm cursor-pointer hover:scale-[1.01] active:scale-97 border-none"
                  >
                    <ShoppingCart className="w-4.5 h-4.5" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Floating Alert Toast */}
        {toast && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-6 py-4 rounded-full font-bold text-[13px] shadow-float flex items-center gap-2.5 animate-fade-up">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            {toast}
          </div>
        )}

        <div className="hidden md:block">
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300 overflow-hidden">
      {/* Premium ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none z-0" />
      
      {/* Dot Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none z-0" />
      
      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 pt-28 pb-16 flex-grow">
        
        {/* Hero Banner with Clear, Professional looping video backdrop */}
        <div className="relative bg-slate-950 dark:bg-slate-950 border dark:border-slate-850 rounded-xl p-8 sm:p-12 text-white overflow-hidden mb-8 shadow-lg min-h-[220px] flex flex-col justify-center">
          <video
            autoPlay
            loop
            muted
            playsInline
            key={shopConfig?.videoUrl || "default"}
            className="absolute inset-0 w-full h-full object-cover opacity-50 z-0"
            src={getDirectVideoUrl(shopConfig?.videoUrl) || "https://assets.mixkit.co/videos/preview/mixkit-interior-designer-working-on-a-sketch-40087-large.mp4"}
          />
          {/* Subtle gradient filter to keep text readable without muddying the video */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/30 to-transparent z-0" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none z-0" />
          
          <div className="relative z-10 max-w-2xl space-y-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black tracking-wider uppercase bg-white/10 border border-white/10 text-emerald-450 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" /> Zenzy E-Store
            </span>
            <h1 className="text-3.5xl sm:text-5xl font-black tracking-tight leading-none text-white animate-fade-in">
              Marketplace Supplies
            </h1>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  const element = document.getElementById("supplies-grid");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all duration-200 shadow-md hover:scale-[1.03] active:scale-95 flex items-center gap-2 cursor-pointer border-none"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Top Control Bar with Centered Search Suggestions & Right Cart Summary */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 px-6 py-4 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 mb-8 mt-2 relative z-30">
          <div className="flex items-center gap-2.5 shrink-0">
            <ShoppingBag className="w-5 h-5 text-emerald-500" />
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-white">Zenzy Store</h2>
          </div>
          
          {/* Centered Modern Search Bar with Suggestion Dropdown */}
          <div className="flex-1 max-w-xl w-full relative" ref={searchContainerRef}>
            <div className="relative flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all duration-200 shadow-sm">
              <Search className="w-4.5 h-4.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search premium tools, cleaning sprays, smart devices..."
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                className="w-full bg-transparent border-none outline-none px-3 py-3.5 text-xs font-semibold text-slate-850 dark:text-white placeholder-slate-400 dark:placeholder-slate-550"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setShowSuggestions(false); }} className="text-slate-400 hover:text-slate-655 dark:hover:text-white transition p-1">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
 
            {/* Smart Suggestions Modal Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {searchSuggestions.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => {
                      setSearchQuery(prod.name);
                      setShowSuggestions(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-850 transition text-left cursor-pointer font-bold text-xs"
                  >
                    <span className="text-slate-900 dark:text-white truncate pr-4">{prod.name}</span>
                    <span className="text-[9.5px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded uppercase font-semibold shrink-0">{prod.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
 
          {/* Cart Summary & Track Orders Trigger Buttons */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {user && (
              <Link
                href="/dashboard"
                onClick={() => {
                  localStorage.setItem("zenzy_active_tab", "shop_orders");
                }}
                className="flex items-center gap-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-4.5 py-3 rounded-md hover:rounded-xl font-bold text-xs transition-all duration-200 shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer border-none"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Track Orders</span>
              </Link>
            )}
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 bg-slate-950 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 px-4.5 py-3 rounded-md hover:rounded-xl font-bold text-xs transition-all duration-200 shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer border-none"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Cart Summary</span>
              {cart.length > 0 && (
                <span className="bg-emerald-500 text-white text-[9.5px] font-black px-2 py-0.5 rounded-full shrink-0">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
 
        {/* E-Commerce Grid Container */}
        <div id="supplies-grid" className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Side: Advanced Filters */}
          <aside className="lg:col-span-1 space-y-6">
            
            {/* Smart Category Filter with Premium list design */}
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 p-5 rounded-xl shadow-sm space-y-2">
              <h3 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 block">Categories</h3>
              {categoriesList.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 font-bold text-xs transition-all duration-250 cursor-pointer border-none ${
                      isSelected
                        ? "bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-xl shadow-sm"
                        : "bg-transparent text-slate-505 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-md hover:rounded-xl"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-500 dark:text-emerald-400" : "text-slate-400"}`} />
                      <span>{cat.name}</span>
                    </div>
                    <span className={`text-[9.5px] px-2 py-0.5 rounded font-bold ${
                      isSelected ? "bg-white/20 text-white dark:bg-slate-100 dark:text-slate-950" : "bg-slate-150 dark:bg-slate-800 text-slate-500"
                    }`}>
                      {cat.name === "All"
                        ? products.length
                        : products.filter((p) => p.category === cat.name).length}
                    </span>
                  </button>
                );
              })}
            </div>



            {/* Price Range Slider */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850/80 p-5 rounded-xl shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Max Price</h3>
                <span className="text-xs font-black text-slate-900 dark:text-white">₹{maxPriceFilter.toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={maxPriceFilter}
                  onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 dark:accent-emerald-450"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                  <span>Min: ₹100</span>
                  <span>Max: ₹2000</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Side: Products Grid */}
          <div className="lg:col-span-3 min-w-0 space-y-6">
            
            {/* Top Toolbar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-6 py-4 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-550">
                Showing <strong className="text-slate-850 dark:text-white">{filteredProducts.length}</strong> supplies matches
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-550 shrink-0">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-lg text-xs font-bold outline-none cursor-pointer text-slate-800 dark:text-white"
                >
                  <option value="popularity">Popularity / Top Rated</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm space-y-4">
                <ShoppingBag className="w-12 h-12 text-slate-350 mx-auto opacity-30 animate-bounce" />
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">No products match your filters</h3>
                <p className="text-slate-450 text-xs font-semibold max-w-xs mx-auto leading-relaxed">
                  Try adjusting filters, categories, price brackets, or clear the search criteria.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setSearchQuery("");
                    setMaxPriceFilter(2000);
                  }}
                  className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-fade-in">
                  {filteredProducts.slice(0, visibleCount).map((prod) => (
                    <article
                      key={prod.id}
                      onClick={() => {
                        setSelectedProduct(prod);
                        setSelectedImageIdx(0);
                        setDetailQty(1);
                      }}
                      className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-emerald-500/50 dark:hover:border-emerald-500/40 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(16,185,129,0.08)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300 group cursor-pointer"
                    >
                      <div>
                        {/* Image Frame */}
                        <div className="relative h-44 bg-slate-50 dark:bg-slate-950 overflow-hidden border-b border-slate-100 dark:border-slate-850">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-300"
                          />
                          <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                            {prod.category}
                          </span>
                          {prod.stock <= 0 && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white text-xs font-black uppercase tracking-widest">
                              🚫 Out of Stock
                            </div>
                          )}
                          {prod.stock > 0 && prod.stock <= 5 && (
                            <span className="absolute bottom-3 right-3 bg-red-600 text-white px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-widest animate-pulse">
                              Only {prod.stock} Left
                            </span>
                          )}
                        </div>

                        {/* Info Frame */}
                        <div className="p-5 space-y-2">
                          <div className="flex justify-between items-start gap-3">
                            <h4 className="font-extrabold text-[13px] text-slate-900 dark:text-white leading-snug line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-450 transition-colors">
                              {prod.name}
                            </h4>
                            <span className="text-gold font-bold text-xs shrink-0 flex items-center gap-0.5">
                              ★ {prod.rating || 4.5}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold line-clamp-2">
                            {prod.description}
                          </p>
                        </div>
                      </div>

                      {/* Price and Action CTAs */}
                      <div className="p-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3 bg-slate-50/30 dark:bg-slate-950/10">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Price</span>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 dark:text-slate-550 line-through mr-1.5 font-semibold">
                              ₹{Math.round(prod.price * 1.35).toLocaleString()}
                            </span>
                            <span className="text-lg font-black text-slate-900 dark:text-white">₹{prod.price.toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(prod);
                          }}
                          disabled={prod.stock <= 0}
                          className="w-full flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all duration-150 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95 border-none"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {filteredProducts.length > visibleCount && (
                  <div className="py-10 border-t border-slate-100 dark:border-slate-850 flex justify-center items-center gap-2.5 text-slate-400 dark:text-slate-500 text-xs font-bold animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>Scrolling down to load more supplies...</span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </main>

      {/* ═══════ SHOPPING CART SHEET (RIGHT SIDE SLIDE-IN - CLEAN INTERFACE) ═══════ */}
      {cartOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fade-in">
          {/* Backdrop click close */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setCartOpen(false)} />
          
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md h-full flex flex-col shadow-2xl border-l dark:border-slate-800 animate-slide-left">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="w-4.5 h-4.5 text-slate-900 dark:text-white" />
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight uppercase">Shopping Cart</h4>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black px-2 py-0.5 rounded">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </span>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-150 dark:border-slate-855 text-slate-405 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/20 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-32 text-slate-400 font-semibold text-xs space-y-2">
                  <ShoppingBag className="w-8 h-8 opacity-20 mx-auto" />
                  <p>Your shopping cart is empty</p>
                  <p className="text-[10px] text-slate-405">Browse supplies and add them to cart.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4 shadow-xs"
                  >
                    <img src={item.product.image} className="w-12 h-12 rounded-lg object-cover border shrink-0 bg-slate-50" alt="" />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">{item.product.name}</h5>
                      <span className="text-[10px] text-slate-505 dark:text-slate-400 block mt-0.5">₹{item.product.price} each</span>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.product.id, -1)}
                          className="w-5 h-5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer text-slate-655"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-xs font-bold text-slate-800 dark:text-white min-w-[12px] text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.product.id, 1)}
                          className="w-5 h-5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer text-slate-655"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="text-slate-400 hover:text-red-500 transition p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer summary */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-150 dark:border-slate-805 bg-white dark:bg-slate-900 shrink-0 space-y-4">
                <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-350">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-slate-900 dark:text-white font-bold">₹{cartInvoice.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST Tax (18%):</span>
                    <span className="text-slate-900 dark:text-white font-bold">₹{cartInvoice.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span className="text-slate-900 dark:text-white font-bold">{cartInvoice.deliveryFee === 0 ? "FREE" : `₹${cartInvoice.deliveryFee}`}</span>
                  </div>
                  <div className="border-t dark:border-slate-800 my-2 pt-2 flex justify-between text-sm font-bold text-slate-900 dark:text-white">
                    <span>Grand Total:</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">₹{cartInvoice.grandTotal.toLocaleString()}</span>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setCartOpen(false);
                    handleOpenCartCheckout();
                  }}
                  className="w-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 py-3.5 rounded-xl font-bold uppercase transition cursor-pointer text-center block text-xs tracking-wider"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ CHECKOUT FORM MODAL WITH ONLINE VERIFICATION ═══════ */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`bg-white dark:bg-slate-900 w-full rounded-2xl overflow-hidden shadow-2xl relative border dark:border-slate-800 transition-all duration-305 animate-fade-up ${
            orderPayment === "UPI QR" ? "max-w-[720px]" : "max-w-[440px]"
          }`}>
            {/* Header */}
            <div className="p-6 bg-slate-950 text-white relative flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-lg tracking-tight">Checkout Order Details</h3>
                <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">Order amount: ₹{activeInvoice.grandTotal.toLocaleString()}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCheckoutOpen(false);
                  setOrderSuccess(false);
                }}
                className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {orderSuccess ? (
              <div className="p-8 text-center space-y-5">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="font-black text-slate-900 dark:text-white text-base">Order Placed Successfully!</h4>
                <p className="text-slate-400 text-xs font-semibold leading-relaxed max-w-sm mx-auto">
                  Your order payload was registered in Firestore. {orderPayment === "UPI QR" ? "Our admin is verifying your UPI Transaction reference ID. " : ""}Stocks have been deducted.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link
                    href="/dashboard"
                    onClick={() => {
                      setCheckoutOpen(false);
                      setOrderSuccess(false);
                    }}
                    className="flex-1 bg-slate-950 dark:bg-white text-white dark:text-slate-950 py-3 rounded-lg font-bold uppercase transition text-center text-xs tracking-wider block"
                  >
                    Track Your Order
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutOpen(false);
                      setOrderSuccess(false);
                    }}
                    className="flex-1 border border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 py-3 rounded-lg font-bold uppercase transition text-xs tracking-wider text-slate-700 dark:text-slate-200"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x dark:divide-slate-800 max-h-[80vh] overflow-y-auto">
                {/* Form fields */}
                <form onSubmit={handlePlaceOrder} className="flex-1 p-6 space-y-4 text-xs font-semibold">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={orderName}
                      onChange={(e) => setOrderName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:border-slate-900 dark:focus:border-slate-100 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number (10 Digits Only) *</label>
                    <input
                      type="tel"
                      required
                      value={orderPhone}
                      onChange={(e) => setOrderPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="e.g. 9999011222"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:border-slate-900 dark:focus:border-slate-100 text-slate-800 dark:text-white font-semibold"
                    />
                    <span className="text-[9.5px] text-slate-400 block font-medium mt-0.5">Enforces exactly 10 digits. No country prefixes.</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Delivery Address *</label>
                    <textarea
                      required
                      rows={3}
                      value={orderAddress}
                      onChange={(e) => setOrderAddress(e.target.value)}
                      placeholder="Flat, block, street, pin address..."
                      className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl outline-none focus:border-slate-900 dark:focus:border-slate-100 text-slate-800 dark:text-white resize-none font-semibold text-xs leading-relaxed"
                    />
                  </div>

                  {/* Payment selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Payment Method</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "COD", label: "Cash on Delivery", icon: Wallet },
                        { id: "UPI QR", label: "UPI QR Payment", icon: QrCode }
                      ].map((method) => {
                        const Icon = method.icon;
                        const isSelected = orderPayment === method.id;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => {
                              setOrderPayment(method.id);
                              setTransactionId("");
                            }}
                            className={`py-3 px-2.5 rounded-xl font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? "border-emerald-650 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-655 dark:text-emerald-455"
                                : "border-slate-200 dark:border-slate-850 text-slate-500 hover:border-slate-300 dark:hover:border-slate-800"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{method.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* UPI QR verification form field if QR is selected */}
                  {orderPayment === "UPI QR" && (
                    <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-4 border border-slate-150 dark:border-slate-850 rounded-xl animate-fade-up">
                      <label className="text-[10px] font-black text-rose-605 dark:text-rose-400 uppercase block">12-Digit UPI Transaction ID *</label>
                      <input
                        type="text"
                        required
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value.replace(/\D/g, "").slice(0, 12))}
                        placeholder="Enter 12-digit transaction ID"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono font-bold outline-none text-slate-800 dark:text-white focus:border-slate-900 dark:focus:border-slate-100"
                      />
                      <span className="text-[9px] text-slate-400 font-semibold block mt-1">Digits only. Standard UPI ID format check.</span>
                    </div>
                  )}

                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-155 dark:border-slate-855 p-3.5 rounded-xl space-y-1 mt-2 text-slate-500">
                    <div className="flex justify-between">
                      <span>Items Subtotal:</span>
                      <span>₹{activeInvoice.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-805 dark:text-white font-black text-[12.5px]">
                      <span>Grand Total (with Tax):</span>
                      <span>₹{activeInvoice.grandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingOrder}
                    className="w-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 py-3.5 rounded-xl font-bold uppercase transition shadow-lg cursor-pointer"
                  >
                    {submittingOrder ? "Confirming Order..." : "Place Shop Order"}
                  </button>
                </form>

                {/* Right side: UPI QR scan instructions if online payment */}
                {orderPayment === "UPI QR" && (
                  <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 md:max-w-[300px] gap-4">
                    <div className="text-center space-y-1">
                      <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        UPI QR Code
                      </span>
                      <p className="text-[10px] text-slate-550 font-bold">Scan to complete payment</p>
                    </div>

                    <div className="relative w-44 h-44 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm flex items-center justify-center">
                      {/* Corner borders */}
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-slate-900 dark:border-white rounded-tl"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-slate-900 dark:border-white rounded-tr"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-slate-900 dark:border-white rounded-bl"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-slate-900 dark:border-white rounded-br"></div>
                      
                      {siteConfig?.qrCode ? (
                        <img src={siteConfig.qrCode} className="w-full h-full object-contain" alt="Store Payment QR" />
                      ) : (
                        <div className="text-center text-slate-450 dark:text-slate-500 flex flex-col items-center justify-center gap-1 p-2">
                          <QrCode className="w-8 h-8 opacity-30 text-slate-500" />
                          <span className="text-[9px] font-bold">QR Pending Upload</span>
                        </div>
                      )}
                    </div>

                    {siteConfig?.upiId && (
                      <div className="w-full text-center space-y-1.5">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Store UPI ID</span>
                        <div className="flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-2 rounded-lg gap-2 text-xs font-mono font-black text-slate-805 dark:text-slate-200">
                          <span>{siteConfig.upiId}</span>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="text-slate-400 hover:text-slate-655 dark:hover:text-white transition"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Alert Toast */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-6 py-4 rounded-full font-bold text-[13px] shadow-float flex items-center gap-2.5 animate-fade-up">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          {toast}
        </div>
      )}

      <Footer />
    </div>
  );
}
