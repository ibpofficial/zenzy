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
  ArrowLeft,
  Truck,
  ShieldCheck,
  RefreshCw,
  Zap,
  Headphones,
  MessageSquare,
  Send,
  Brain,
  Loader2
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

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

// ═══════ FLASH SALE TIMER COMPONENT ═══════
const ProductTimer = ({ productId }: { productId: string }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    // Pseudo-random seed based on product ID characters
    const seed = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Only show timer for ~33% of products
    if (seed % 3 !== 0) {
      setTimeLeft(0);
      return;
    }

    const localStorageKey = `zenzy_timer_expiry_${productId}`;
    let expiry = localStorage.getItem(localStorageKey);
    let expiryTime = 0;

    if (expiry) {
      expiryTime = Number(expiry);
    } else {
      const initialTime = (seed % 14400) + 3600;
      expiryTime = Date.now() + initialTime * 1000;
      localStorage.setItem(localStorageKey, String(expiryTime));
    }

    const calculateTimeLeft = () => {
      const diff = Math.floor((expiryTime - Date.now()) / 1000);
      return diff > 0 ? diff : 0;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const left = calculateTimeLeft();
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [productId]);

  if (timeLeft === null || timeLeft === 0) return null;

  const h = Math.floor(timeLeft / 3600).toString().padStart(2, '0');
  const m = Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0');
  const s = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="absolute bottom-3 left-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/50 dark:border-slate-800 text-slate-900 dark:text-white px-3 py-1.5 rounded-lg flex items-center justify-between shadow-lg animate-fade-up z-10">
      <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1">
        <Zap className="w-3 h-3 fill-current" /> Flash Sale
      </span>
      <span className="text-[10px] font-mono font-bold tracking-widest">{h}:{m}:{s}</span>
    </div>
  );
};

export default function ShopPage() {
  const router = useRouter();
  const { user, userData, role, openAuthModal } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [detailQty, setDetailQty] = useState(1);

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
  const [maxPriceFilter, setMaxPriceFilter] = useState(100000);
  const [visibleCount, setVisibleCount] = useState(24);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Zen AI State
  const [zenAiOpen, setZenAiOpen] = useState(false);
  const [aiInputValue, setAiInputValue] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi there! I'm Zen AI. Need help finding a specific tool, tracking an order, or comparing supplies?"
    }
  ]);
  const [aiIsTyping, setAiIsTyping] = useState(false);
  const [aiTypingText, setAiTypingText] = useState("");
  const [aiCurrentTypingIndex, setAiCurrentTypingIndex] = useState(0);
  const [aiDisplayedMessage, setAiDisplayedMessage] = useState("");
  const [aiQueriesUsed, setAiQueriesUsed] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [loadingStatusIdx, setLoadingStatusIdx] = useState(0);

  const loadingStatuses = [
    "Connecting to ZEN AI...",
    "Scanning product catalog...",
    "Verifying stock & availability...",
    "Reviewing store shipping guidelines...",
    "Formulating response..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (aiLoading && !aiIsTyping) {
      setLoadingStatusIdx(0);
      interval = setInterval(() => {
        setLoadingStatusIdx(prev => (prev + 1) % loadingStatuses.length);
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [aiLoading, aiIsTyping]);

  const handleStopResponse = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (aiIsTyping) {
      setAiIsTyping(false);
      setAiTypingText("");
      setAiMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
          lastMessage.content = aiDisplayedMessage || "Response stopped.";
        }
        return newMessages;
      });
    }
    setAiLoading(false);
  };

  // Subscribe to current user's usage count
  useEffect(() => {
    if (!user) {
      setAiQueriesUsed(0);
      return;
    }
    const collName = role === "worker" ? "workers" : "users";
    const userDocRef = doc(db, collName, user.uid);
    const unsubUser = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        setAiQueriesUsed(snap.data().zenQueriesCount || 0);
      }
    });
    return () => unsubUser();
  }, [user, role]);

  // Typing animation effect
  useEffect(() => {
    if (aiIsTyping && aiTypingText) {
      if (aiCurrentTypingIndex < aiTypingText.length) {
        const timeout = setTimeout(() => {
          setAiDisplayedMessage(prev => prev + aiTypingText[aiCurrentTypingIndex]);
          setAiCurrentTypingIndex(prev => prev + 1);
        }, 10);
        return () => clearTimeout(timeout);
      } else {
        setAiIsTyping(false);
        setAiCurrentTypingIndex(0);
        setAiTypingText("");
        setAiMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === "assistant") {
            lastMessage.content = aiDisplayedMessage;
          }
          return newMessages;
        });
      }
    }
  }, [aiIsTyping, aiTypingText, aiCurrentTypingIndex, aiDisplayedMessage]);

  const aiChatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (zenAiOpen) {
      aiChatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [aiMessages, aiIsTyping, zenAiOpen]);

  // Helper response formatter
  const renderMessageContent = (content: string, role: string) => {
    if (role === "user") return content;

    const formatted = content.split("\n").map((line, index) => {
      if (line.startsWith("✦") && line.endsWith("✦")) {
        return <div key={index} className="text-center font-bold text-emerald-600 dark:text-emerald-450 text-sm py-1">{line}</div>;
      }
      if (line.startsWith("▸") || line.startsWith("▪") || line.startsWith("•") || line.startsWith("◦") || line.startsWith("›")) {
        return <div key={index} className="flex items-start gap-2 ml-1 py-0.5">
          <span className="text-emerald-500 dark:text-emerald-400 font-bold">▹</span>
          <span>{line.replace(/^[▸▪•◦›]\s*/, "").trim()}</span>
        </div>;
      }
      if (line.includes("━")) {
        return <div key={index} className="text-center text-slate-350 dark:text-slate-600 text-xs">{line}</div>;
      }
      if (line.startsWith("⚠️")) {
        return <div key={index} className="bg-amber-50 dark:bg-amber-955/30 border-l-4 border-amber-500 p-2 rounded text-amber-800 dark:text-amber-200 text-xs">{line}</div>;
      }
      if (line.trim() === "") return <br key={index} />;
      return <div key={index} className="py-0.5">{line}</div>;
    });

    return <>{formatted}</>;
  };

  const handleAiSend = async (e: React.FormEvent | null, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptText = (customPrompt || aiInputValue).trim();
    if (!promptText || aiLoading) return;

    if (!user) {
      openAuthModal("login");
      return;
    }

    const aiUsageLimit = siteConfig?.aiUsageLimit ?? 10;
    const isUnlimitedUser = !!(user?.email && [
      "ishantpbupadhyay@gmail.com",
      "25tec2cs089@vgu.ac.in",
      "ibpoffecial@gmail.com"
    ].includes(user.email.toLowerCase()));

    if (aiQueriesUsed >= aiUsageLimit && !isUnlimitedUser) {
      setAiMessages(prev => [
        ...prev,
        { role: "user", content: promptText },
        {
          role: "assistant",
          content: `⚠️ You have reached your ZEN AI limit of ${aiUsageLimit} questions. Please contact the administrator to adjust your usage limits.`
        }
      ]);
      setAiInputValue("");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setAiInputValue("");
    setAiLoading(true);

    // Append user message
    setAiMessages(prev => [...prev, { role: "user", content: promptText }]);

    try {
      // Increment query count
      const collName = role === "worker" ? "workers" : "users";
      await updateDoc(doc(db, collName, user.uid), {
        zenQueriesCount: aiQueriesUsed + 1
      });

      // Prepare shop items context
      const prodListText = products.slice(0, 15).map(p => 
        `- ${p.name} (Category: ${p.category}, Price: ₹${p.price}, Stock: ${p.stock} units, Rating: ${p.rating || 4.5}★): ${p.description.slice(0, 120)}`
      ).join("\n");

      const shopDetailsContext = `
Available Products in Zenzy Marketplace:
${prodListText}

Shop General Policies & Info:
- 1 Year Warranty on all professional supplies.
- Fast Dispatch within 24 hours.
- 7 Days Replacement guarantee.
- Quality Check: All items are standard checked by Zenzy partner technicians.
- Shipping: Free delivery on orders above ₹499. For orders under ₹499, a flat delivery fee of ₹79 applies.
- Tax: 18% GST is added to all shop order subtotals.
- Payment Methods: Cash on Delivery (COD) or UPI / QR code payment scan (UPI ID: ${siteConfig?.upiId || "zenzy@upi"}).
      `;

      const systemPrompt = `You are ZEN, the premium AI query assistant for Zenzy's Shop section.
Your goal is to help users browse products, make purchase decisions, answer product stock or price questions, and explain shipping or payment policies.
Zenzy connects clients directly to verified service professionals and hosts a curated marketplace for tools, cleaning agents, smart home items, and safety equipment.

Shop Context:
${shopDetailsContext}

Current User Context:
- User Name: ${userData?.name || user.displayName || user.email || "Guest"}
- User Email: ${user.email}
- User Role: ${role || "Customer"}

AI Assistant Rules:
1. Always present yourself as ZEN, a helpful, polite, and witty AI companion.
2. Keep responses SHORT and CONCISE (maximum 3-4 bullet points).
3. Use emojis sparingly but effectively.
4. Format responses in bullet points with symbols like ▸, ▪, •, ◦, ›.
5. If the user asks about specific items, mention pricing, ratings, and stock. If they ask about items not in the list, politely state that it's currently not in stock but they can search the catalog.
6. Never use ** or any markdown bold/italic formatting.
7. Keep it professional yet friendly.`;

      const aiApiKey = siteConfig?.aiApiKey;
      if (!aiApiKey) {
        throw new Error("AI configuration is missing. OpenRouter API key has not been configured by the admin.");
      }

      const apiHistory = aiMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${aiApiKey}`,
          "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://zenzy.com",
          "X-Title": "Zenzy Shop AI Assistant"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            ...apiHistory,
            { role: "user", content: promptText }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error (Status ${response.status})`);
      }

      const resData = await response.json();
      const aiReply = resData.choices?.[0]?.message?.content || "I couldn't process that query. Please try again.";

      // Start typing animation
      setAiTypingText(aiReply);
      setAiDisplayedMessage("");
      setAiCurrentTypingIndex(0);
      setAiIsTyping(true);
      setAiMessages(prev => [...prev, { role: "assistant", content: "" }]);

    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Fetch aborted");
        return;
      }
      console.error("Shop ZEN AI error:", error);
      setAiMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `❌ ZEN is currently offline: ${error.message || "An unexpected connection issue occurred. Please check back later."}`
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [isDirectBuy, setIsDirectBuy] = useState(false);

  const [orderName, setOrderName] = useState("");
  const [orderPhone, setOrderPhone] = useState("");
  const [orderAddress, setOrderAddress] = useState("");
  const [orderPayment, setOrderPayment] = useState("COD");
  const [transactionId, setTransactionId] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [shopConfig, setShopConfig] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  useEffect(() => {
    const cached = sessionStorage.getItem("zenzy_shop_products_cache");
    if (cached) {
      try {
        setProducts(JSON.parse(cached));
      } catch (e) { }
    }
  }, []);

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

  useEffect(() => {
    setVisibleCount(6);
  }, [selectedCategory, searchQuery, maxPriceFilter]);

  useEffect(() => {
    if (userData) {
      setOrderName(userData.name || "");
      if (userData.phone) {
        setOrderPhone(userData.phone.replace(/\D/g, "").slice(0, 10));
      }
    }
  }, [userData]);

  useEffect(() => {
    const savedCart = localStorage.getItem("zenzy_shop_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) { }
    }
  }, []);

  const saveCartToStorage = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    localStorage.setItem("zenzy_shop_cart", JSON.stringify(updatedCart));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const getDirectVideoUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("github.com") && url.includes("/blob/")) {
      return url
        .replace("github.com", "raw.githubusercontent.com")
        .replace("/blob/", "/");
    }
    return url;
  };

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

  const searchSuggestions = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 5);
  }, [products, searchQuery]);

  const calculateInvoice = (items: CartItem[]) => {
    const sub = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const delivery = sub > 499 || sub === 0 ? 0 : 79;
    const tax = Math.round(sub * 0.18);
    const total = sub + delivery + tax;
    return { subtotal: sub, deliveryFee: delivery, taxAmount: tax, grandTotal: total };
  };

  const cartInvoice = calculateInvoice(cart);
  const activeInvoice = calculateInvoice(checkoutItems);

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

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkoutItems.length === 0) return;
    if (!orderName.trim() || !orderPhone.trim() || !orderAddress.trim()) {
      showToast("Please fill in all checkout fields.");
      return;
    }

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

  // ==== PRODUCT DETAIL PAGE RENDER ====
  if (selectedProduct) {
    const originalPrice = Math.round(selectedProduct.price * 1.35);
    const savings = originalPrice - selectedProduct.price;
    const productImages: string[] = (selectedProduct as any).images && (selectedProduct as any).images.length > 0
      ? (selectedProduct as any).images
      : [selectedProduct.image];

    return (
      <div className="relative flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-400/5 dark:bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="absolute top-1/3 right-1/4 w-[800px] h-[800px] bg-blue-400/5 dark:bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

        <Navbar />

        <main className="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 pt-28 pb-20 flex-grow animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSelectedProduct(null)}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Shop
            </button>
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:block">
              Shop &gt; {selectedProduct.category} &gt; <span className="text-slate-900 dark:text-slate-300">{selectedProduct.name}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-2">
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center group shadow-sm border border-slate-100 dark:border-slate-800">
                <img
                  src={productImages[selectedImageIdx]}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt={selectedProduct.name}
                />
                <span className="absolute top-4 left-4 bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-md shadow-lg shadow-emerald-500/30 animate-pulse">
                  Save 25%
                </span>

                {/* Include Product Timer inside Detail Image too */}
                <ProductTimer productId={selectedProduct.id} />
              </div>

              <div className="flex gap-4">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer relative bg-white dark:bg-slate-900 ${selectedImageIdx === idx
                        ? "ring-2 ring-emerald-500 shadow-md scale-[1.02]"
                        : "opacity-60 hover:opacity-100 border border-slate-200 dark:border-slate-800"
                      }`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center space-y-6 lg:space-y-0">
              <div className="space-y-5">
                <div className="space-y-3">
                  <span className="inline-flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-600 dark:text-slate-400 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                    {selectedProduct.category}
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-slate-900 dark:text-white">
                    {selectedProduct.name}
                  </h1>
                  <div className="flex items-center gap-3">
                    <span className="text-amber-500 font-bold text-xs flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-current" /> {selectedProduct.rating || 4.8}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span className="text-xs font-semibold text-slate-500">120 Ratings</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span className="text-xs font-semibold text-slate-500">18 Questions</span>
                  </div>
                </div>

                <div className="py-5 border-y border-slate-200/60 dark:border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Special Price</span>
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-md">
                      25% OFF
                    </span>
                  </div>
                  <div className="flex items-baseline gap-4 flex-wrap">
                    <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      ₹{selectedProduct.price.toLocaleString()}
                    </span>
                    <span className="text-base font-bold text-slate-400 dark:text-slate-500 line-through">
                      ₹{originalPrice.toLocaleString()}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      Save ₹{savings.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Description</span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {selectedProduct.description} This professional-grade supply has been standard checked by Zenzy partner technicians. Perfect for residential or workplace applications, ensuring long durability, high compatibility, and optimal performance under all standard usage conditions.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>1 Year Warranty</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Fast Dispatch (24h)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>7 Days Replacement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Zenzy Quality Check</span>
                  </div>
                </div>
              </div>

              <div className="space-y-5 pt-6">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">Quantity</span>
                  <span className={selectedProduct.stock > 0 ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-550/10 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider" : "text-red-500 bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider animate-pulse"}>
                    {selectedProduct.stock > 0 ? (selectedProduct.stock <= 5 ? `⚠️ Only ${selectedProduct.stock} Left` : `✓ In Stock (${selectedProduct.stock} available)`) : "🚫 Out of Stock"}
                  </span>
                </div>

                <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shrink-0 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setDetailQty(prev => Math.max(1, prev - 1))}
                      className="w-10 h-10 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer text-slate-700 dark:text-slate-300 font-extrabold text-sm"
                    >
                      -
                    </button>
                    <span className="text-sm font-black text-slate-900 dark:text-white min-w-[20px] text-center">
                      {detailQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDetailQty(prev => Math.min(selectedProduct.stock || 10, prev + 1))}
                      className="w-10 h-10 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer text-slate-700 dark:text-slate-300 font-extrabold text-sm"
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
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed py-3.5 px-5 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all duration-300 shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border-none"
                  >
                    <ShoppingBag className="w-4 h-4" />
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
                    className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed py-3.5 px-5 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {toast && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-5 py-3.5 rounded-xl font-bold text-xs shadow-xl flex items-center gap-2 animate-fade-up">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            {toast}
          </div>
        )}

        <div className="hidden md:block mt-8">
          <Footer />
        </div>
      </div>
    );
  }

  // ==== MAIN SHOP RENDER ====
  return (
    <div className="relative flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300 overflow-hidden">

      <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-emerald-400/5 dark:bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-1/3 right-1/4 w-[1000px] h-[1000px] bg-blue-400/5 dark:bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 pt-24 pb-20 flex-grow">

        {/* HERO SECTION (Fully Mobile Optimized, Zen AI button integrated) */}
        <section className="relative w-full rounded-2xl overflow-hidden mb-12 shadow-lg shadow-slate-200/50 dark:shadow-none min-h-[180px] sm:min-h-[240px] md:min-h-[280px] flex flex-col justify-center animate-fade-in group">
          <video
            autoPlay
            loop
            muted
            playsInline
            key={shopConfig?.videoUrl || "default"}
            className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-1000 group-hover:scale-105"
            src={getDirectVideoUrl(shopConfig?.videoUrl) || "https://assets.mixkit.co/videos/preview/mixkit-interior-designer-working-on-a-sketch-40087-large.mp4"}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/70 to-slate-900/10 z-0" />
          <div className="absolute top-1/2 left-0 w-80 h-80 bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none z-0" />

          <div className="relative z-10 p-4 sm:p-10 max-w-2xl space-y-2 sm:space-y-4">
            <h1 className="text-xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              The Zenzy <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Marketplace</span>
            </h1>
            <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm font-medium max-w-md leading-relaxed">
              Equip your home and workspace with certified professional tools, smart devices, and supplies. Delivered fast.
            </p>
            <div className="pt-1.5 flex flex-row items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  const element = document.getElementById("supplies-grid");
                  if (element) {
                    const yOffset = -100;
                    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                  }
                }}
                className="flex-grow sm:flex-grow-0 bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-1.5 cursor-pointer border-none"
              >
                <span>Shop Supplies</span>
                <ArrowRight className="w-3 h-3 shrink-0" />
              </button>

              {/* Permanent Zen AI Button */}
              <button
                type="button"
                onClick={() => setZenAiOpen(true)}
                className="flex-grow sm:flex-grow-0 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-1.5 cursor-pointer border-none"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current text-white shrink-0" />
                <span>Ask Zen AI</span>
              </button>
            </div>
          </div>
        </section>

        {/* CLEAN INLINE SEARCH BAR & ACTIONS ROW */}
        <section className="flex flex-col md:flex-row items-center justify-between gap-5 mb-10 relative z-30">

          <div className="flex-1 w-full max-w-2xl relative" ref={searchContainerRef}>
            <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-xl p-1.5 shadow-sm border border-slate-200/60 dark:border-slate-800 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all duration-300 group">
              <div className="pl-3 pr-2">
                <Search className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 shrink-0 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search tools, smart devices, safety gear..."
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                className="w-full bg-transparent border-none outline-none py-2.5 sm:py-2 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setShowSuggestions(false); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition p-2 sm:p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg mr-1.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button className="hidden sm:block bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all shadow-sm cursor-pointer ml-auto border-none">
                Search
              </button>
            </div>

            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60">
                {searchSuggestions.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => {
                      setSearchQuery(prod.name);
                      setShowSuggestions(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-left cursor-pointer font-bold text-xs"
                  >
                    <span className="text-slate-900 dark:text-white truncate pr-4">{prod.name}</span>
                    <span className="text-[9.5px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">{prod.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {user && (
              <Link
                href="/dashboard"
                onClick={() => {
                  localStorage.setItem("zenzy_active_tab", "shop_orders");
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-5 py-3 rounded-xl font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-300 shadow-sm border border-slate-200/60 dark:border-slate-800 hover:shadow-md hover:-translate-y-0.5 cursor-pointer shrink-0"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Orders</span>
              </Link>
            )}
            <button
              onClick={() => setCartOpen(true)}
              className="flex-1 sm:flex-none relative flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-5 py-3 rounded-xl font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-300 shadow-md shadow-slate-900/10 hover:-translate-y-0.5 cursor-pointer shrink-0 border-none"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Cart</span>
              {cart.length > 0 && (
                <span className="bg-emerald-500 text-white text-[9.5px] font-black px-1.5 py-0.5 rounded-md shrink-0">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </section>

        <div id="supplies-grid" className="flex flex-col lg:flex-row gap-10 lg:gap-12">

          <aside className="lg:w-60 shrink-0 space-y-10 lg:sticky lg:top-28 h-fit">

            <div className="space-y-3">
              <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">Categories</h3>
              <div className="flex flex-col gap-1 flex-wrap sm:flex-nowrap flex-row sm:flex-col overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 hide-scrollbar">
                {categoriesList.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`shrink-0 sm:w-full flex items-center justify-between px-3.5 py-2.5 font-bold text-xs transition-all duration-200 cursor-pointer rounded-xl ${isSelected
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-white sm:bg-transparent border border-slate-200 sm:border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                      <div className="flex items-center gap-2.5 mr-3 sm:mr-0">
                        <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-500" : "text-slate-400"}`} />
                        <span>{cat.name}</span>
                      </div>
                      <span className={`text-[9.5px] px-2 py-0.5 rounded-md font-bold hidden sm:block ${isSelected ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}>
                        {cat.name === "All"
                          ? products.length
                          : products.filter((p) => p.category === cat.name).length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 px-1 hidden sm:block">
              <div className="flex justify-between items-end">
                <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500">Max Price</h3>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  ₹{Math.min(maxPriceFilter, products.length > 0 ? Math.max(2000, ...products.map(p => p.price)) : 2000).toLocaleString()}
                </span>
              </div>
              <div className="space-y-2.5">
                <input
                  type="range"
                  min="100"
                  max={products.length > 0 ? Math.max(2000, ...products.map(p => p.price)) : 2000}
                  step="50"
                  value={Math.min(maxPriceFilter, products.length > 0 ? Math.max(2000, ...products.map(p => p.price)) : 2000)}
                  onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Min: ₹100</span>
                  <span>Max: ₹{(products.length > 0 ? Math.max(2000, ...products.map(p => p.price)) : 2000).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0 flex flex-col space-y-6">

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800/80">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-full sm:w-auto text-left">
                Showing <strong className="text-slate-900 dark:text-white">{filteredProducts.length}</strong> supplies
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-xs font-bold outline-none cursor-pointer text-slate-800 dark:text-white transition-colors border-none"
                >
                  <option value="popularity">Top Rated / Popular</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-5 text-center">
                <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800">
                  <ShoppingBag className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">No matching products</h3>
                  <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed">
                    We couldn't find any supplies matching your current filters. Try adjusting categories or clearing the search.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setSearchQuery("");
                    setMaxPriceFilter(100000);
                  }}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition hover:-translate-y-0.5 shadow-sm cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                  {filteredProducts.slice(0, visibleCount).map((prod) => (
                    <article
                      key={prod.id}
                      onClick={() => {
                        setSelectedProduct(prod);
                        setSelectedImageIdx(0);
                        setDetailQty(1);
                      }}
                      className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-emerald-500/50 dark:hover:border-emerald-500/40 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(16,185,129,0.06)] dark:hover:shadow-[0_15px_30px_rgba(0,0,0,0.3)] transition-all duration-300 group cursor-pointer"
                    >
                      <div>
                        {/* Image Frame with Embedded Sale Timer */}
                        <div className="relative h-44 bg-slate-50 dark:bg-slate-950 overflow-hidden border-b border-slate-100 dark:border-slate-850">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider z-10">
                            {prod.category}
                          </span>

                          {/* Flash Sale Component Overlay */}
                          <ProductTimer productId={prod.id} />

                          {prod.stock <= 0 && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white text-xs font-black uppercase tracking-widest z-20">
                              🚫 Out of Stock
                            </div>
                          )}
                          {prod.stock > 0 && prod.stock <= 5 && (
                            <span className="absolute top-3 right-3 bg-red-600 text-white px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-widest animate-pulse z-10">
                              Only {prod.stock} Left
                            </span>
                          )}
                        </div>

                        <div className="p-5 space-y-2">
                          <div className="flex justify-between items-start gap-3">
                            <h4 className="font-extrabold text-[13px] text-slate-900 dark:text-white leading-snug line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-450 transition-colors">
                              {prod.name}
                            </h4>
                            <span className="text-amber-500 font-bold text-xs shrink-0 flex items-center gap-0.5">
                              ★ {prod.rating || 4.5}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold line-clamp-2">
                            {prod.description}
                          </p>
                        </div>
                      </div>

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
                  <div className="py-10 border-t border-slate-200/50 dark:border-slate-800 flex flex-col items-center justify-center gap-4 text-slate-500 dark:text-slate-400 text-xs font-bold animate-fade-up">
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>Scroll or click below to load more supplies...</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => Math.min(prev + 12, filteredProducts.length))}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold uppercase tracking-wider transition hover:-translate-y-0.5 shadow-md cursor-pointer border-none"
                    >
                      Load More Products
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-20 pt-10 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-2 md:grid-cols-5 gap-6 text-center animate-fade-up">
          <div className="flex flex-col items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 group-hover:scale-105 group-hover:shadow-sm transition-all duration-300">
              <Truck className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Free Shipping</span>
          </div>
          <div className="flex flex-col items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 group-hover:scale-105 group-hover:shadow-sm transition-all duration-300">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Secure Payments</span>
          </div>
          <div className="flex flex-col items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 group-hover:scale-105 group-hover:shadow-sm transition-all duration-300">
              <RefreshCw className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Easy Returns</span>
          </div>
          <div className="flex flex-col items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 group-hover:scale-105 group-hover:shadow-sm transition-all duration-300">
              <Zap className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Fast Delivery</span>
          </div>
          <div className="flex flex-col items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 group-hover:scale-105 group-hover:shadow-sm transition-all duration-300">
              <Headphones className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">24/7 Support</span>
          </div>
        </div>

      </main>

      {/* ═══════ ZEN AI CHAT MODAL ═══════ */}
      {zenAiOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setZenAiOpen(false)} />

          <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm h-full flex flex-col shadow-2xl border-l border-slate-200/50 dark:border-slate-800 animate-slide-left">

            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-100 dark:border-emerald-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white tracking-tight">Zen AI Assistant</h4>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Always here to help</p>
                </div>
              </div>
              <button
                onClick={() => setZenAiOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 bg-[#F8FAFC] dark:bg-slate-950/50 space-y-4">
              {aiMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 max-w-[85%] ${m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      m.role === "user"
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        : "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white"
                    }`}
                  >
                    {m.role === "user" ? "U" : "Z"}
                  </div>
                  <div
                    className={`p-2.5 rounded-xl text-xs font-medium leading-relaxed ${
                      m.role === "user"
                        ? "bg-emerald-600 text-white rounded-tr-none"
                        : "bg-white dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 rounded-tl-none"
                    }`}
                    style={m.role === "user" ? { backgroundColor: "#10b981", color: "#ffffff" } : undefined}
                  >
                    {m.role === "assistant" && m.content === "" && aiIsTyping ? (
                      <div className="text-emerald-600 dark:text-emerald-400 whitespace-pre-wrap">
                        {aiDisplayedMessage}
                        <span className="inline-block w-0.5 h-3 bg-emerald-500 animate-pulse ml-0.5"></span>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {renderMessageContent(m.content, m.role)}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {aiLoading && !aiIsTyping && (
                <div className="flex gap-2.5 max-w-[85%] mr-auto animate-fade-in">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-sm">
                    ZN
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900/80 rounded-2xl rounded-tl-none border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 shrink-0">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider animate-pulse">
                        {loadingStatuses[loadingStatusIdx]}
                      </span>
                    </div>
                    {/* Shimmering loader text preview lines */}
                    <div className="space-y-1.5 w-36 sm:w-48 pt-1">
                      <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full w-full animate-pulse"></div>
                      <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full w-[85%] animate-pulse"></div>
                      <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full w-[60%] animate-pulse"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={aiChatEndRef} />

              {/* Optional: Add user query suggestions */}
              {aiMessages.length === 1 && (
                <div className="flex flex-wrap gap-2 pt-2 animate-fade-up" style={{ animationDelay: '100ms' }}>
                  <button
                    onClick={(e) => handleAiSend(e, "Where is my order?")}
                    className="text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-400 hover:text-emerald-500 hover:border-emerald-500 transition-colors"
                  >
                    Where is my order?
                  </button>
                  <button
                    onClick={(e) => handleAiSend(e, "Find best tools")}
                    className="text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-400 hover:text-emerald-500 hover:border-emerald-500 transition-colors"
                  >
                    Find best tools
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
              {(aiLoading || aiIsTyping) && (
                <div className="flex justify-center pb-2.5 bg-transparent shrink-0">
                  <button
                    type="button"
                    onClick={handleStopResponse}
                    className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 border border-rose-200 dark:border-rose-800/60 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer border-none"
                  >
                    <span className="w-1.5 h-1.5 bg-rose-650 rounded-sm animate-pulse"></span>
                    Stop Generating
                  </button>
                </div>
              )}
              {!user ? (
                <div className="text-center space-y-2 py-1">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Authenticate to use ZEN AI</p>
                  <button
                    onClick={() => openAuthModal("login")}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer border-none"
                  >
                    Log In
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => handleAiSend(e)} className="relative flex items-center bg-slate-50 dark:bg-slate-950 rounded-xl p-1.5 border border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 transition-colors">
                  <input
                    type="text"
                    placeholder={
                      (aiQueriesUsed >= (siteConfig?.aiUsageLimit ?? 10) && !((user?.email && [
                        "ishantpbupadhyay@gmail.com",
                        "25tec2cs089@vgu.ac.in",
                        "ibpoffecial@gmail.com"
                      ].includes(user.email.toLowerCase()))))
                        ? "Limit reached"
                        : "Ask Zen AI..."
                    }
                    disabled={(aiQueriesUsed >= (siteConfig?.aiUsageLimit ?? 10) && !((user?.email && [
                      "ishantpbupadhyay@gmail.com",
                      "25tec2cs089@vgu.ac.in",
                      "ibpoffecial@gmail.com"
                    ].includes(user.email.toLowerCase())))) || aiLoading}
                    value={aiInputValue}
                    onChange={(e) => setAiInputValue(e.target.value)}
                    className="w-full bg-transparent px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                  />
                  <button 
                    type="submit"
                    disabled={!aiInputValue.trim() || aiLoading || (aiQueriesUsed >= (siteConfig?.aiUsageLimit ?? 10) && !((user?.email && [
                      "ishantpbupadhyay@gmail.com",
                      "25tec2cs089@vgu.ac.in",
                      "ibpoffecial@gmail.com"
                    ].includes(user.email.toLowerCase()))))}
                    className="p-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-emerald-500 dark:hover:bg-emerald-500 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0 border-none shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {aiLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ═══════ SHOPPING CART SHEET ═══════ */}
      {cartOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setCartOpen(false)} />

          <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm h-full flex flex-col shadow-2xl border-l border-slate-200/50 dark:border-slate-800 animate-slide-left">

            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="w-4.5 h-4.5 text-slate-900 dark:text-white" />
                <h4 className="font-black text-base text-slate-900 dark:text-white tracking-tight">Your Cart</h4>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black px-2 py-0.5 rounded-md">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC] dark:bg-slate-950/50 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-24 text-slate-500 font-medium text-xs space-y-3 flex flex-col items-center">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-1">
                    <ShoppingBag className="w-5 h-5 opacity-40" />
                  </div>
                  <p>Your shopping cart is empty</p>
                  <button onClick={() => setCartOpen(false)} className="text-emerald-600 font-bold hover:underline">Continue shopping</button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-sm"
                  >
                    <img src={item.product.image} className="w-12 h-12 rounded-lg object-cover border border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50" alt="" />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">{item.product.name}</h5>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 font-semibold">₹{item.product.price.toLocaleString()} each</span>
                    </div>

                    <div className="flex flex-col items-end gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="text-slate-400 hover:text-red-500 transition p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.product.id, -1)}
                          className="w-5 h-5 rounded-md hover:bg-white dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer text-slate-600 dark:text-slate-400"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-[11px] font-black text-slate-900 dark:text-white min-w-[14px] text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.product.id, 1)}
                          className="w-5 h-5 rounded-md hover:bg-white dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer text-slate-600 dark:text-slate-400"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-5 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] dark:shadow-none">
                <div className="space-y-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-slate-900 dark:text-white font-bold">₹{cartInvoice.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18%)</span>
                    <span className="text-slate-900 dark:text-white font-bold">₹{cartInvoice.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{cartInvoice.deliveryFee === 0 ? "FREE" : `₹${cartInvoice.deliveryFee}`}</span>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 my-3 pt-3 flex justify-between items-end">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">Total</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">₹{cartInvoice.grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCartOpen(false);
                    handleOpenCartCheckout();
                  }}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-xl font-black uppercase transition cursor-pointer text-center block text-xs tracking-widest shadow-md shadow-slate-900/10 hover:-translate-y-0.5"
                >
                  Checkout Securely
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ CHECKOUT FORM MODAL ═══════ */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`bg-white dark:bg-slate-900 w-full rounded-2xl overflow-hidden shadow-2xl relative transition-all duration-300 animate-fade-up ${orderPayment === "UPI QR" ? "max-w-[700px]" : "max-w-[420px]"
            }`}>
            <div className="p-5 bg-slate-900 border-b border-white/10 text-white relative flex justify-between items-center">
              <div>
                <h3 className="font-black text-base tracking-tight">Complete Order</h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Total to pay: <span className="text-emerald-400">₹{activeInvoice.grandTotal.toLocaleString()}</span></p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCheckoutOpen(false);
                  setOrderSuccess(false);
                }}
                className="w-8 h-8 rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {orderSuccess ? (
              <div className="p-8 text-center space-y-5">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-lg mb-1.5">Order Confirmed!</h4>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-[280px] mx-auto">
                    Your order has been successfully placed. {orderPayment === "UPI QR" ? "We are verifying your transaction ID." : "Prepare cash on delivery."}
                  </p>
                </div>
                <div className="flex flex-col gap-2.5 pt-3 max-w-[240px] mx-auto">
                  <Link
                    href="/dashboard"
                    onClick={() => {
                      setCheckoutOpen(false);
                      setOrderSuccess(false);
                    }}
                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-xl font-bold uppercase transition text-center text-xs tracking-widest shadow-sm hover:-translate-y-0.5"
                  >
                    Track Order
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutOpen(false);
                      setOrderSuccess(false);
                    }}
                    className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 py-3.5 rounded-xl font-bold uppercase transition text-xs tracking-widest text-slate-700 dark:text-slate-200"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x border-slate-200 dark:divide-slate-800 dark:border-slate-800 max-h-[85vh] overflow-y-auto">
                <form onSubmit={handlePlaceOrder} className="flex-1 p-6 space-y-4 text-xs font-medium">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Full Name</label>
                    <input
                      type="text"
                      required
                      value={orderName}
                      onChange={(e) => setOrderName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-slate-900 dark:text-white transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Phone (10 Digits)</label>
                    <input
                      type="tel"
                      required
                      value={orderPhone}
                      onChange={(e) => setOrderPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="9999011222"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-slate-900 dark:text-white transition-all font-semibold tracking-wide"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Delivery Address</label>
                    <textarea
                      required
                      rows={3}
                      value={orderAddress}
                      onChange={(e) => setOrderAddress(e.target.value)}
                      placeholder="Flat, building, street, PIN code..."
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-slate-900 dark:text-white resize-none transition-all leading-relaxed"
                    />
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Payment Method</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: "COD", label: "Cash on Delivery", icon: Wallet },
                        { id: "UPI QR", label: "UPI / QR Code", icon: QrCode }
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
                            className={`py-3 px-2 rounded-xl font-bold border-2 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${isSelected
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm"
                                : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:border-slate-200 dark:hover:border-slate-700"
                              }`}
                          >
                            <Icon className="w-4.5 h-4.5" />
                            <span className="text-[10px]">{method.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {orderPayment === "UPI QR" && (
                    <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-xl animate-fade-up mt-3">
                      <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block">12-Digit Reference ID *</label>
                      <input
                        type="text"
                        required
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value.replace(/\D/g, "").slice(0, 12))}
                        placeholder="Enter exactly 12 digits"
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono font-bold outline-none text-slate-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-500 transition-all tracking-widest"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingOrder}
                    className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-3.5 mt-4 rounded-xl font-black uppercase transition-all shadow-md hover:-translate-y-0.5 cursor-pointer tracking-widest text-xs"
                  >
                    {submittingOrder ? "Processing..." : `Pay ₹${activeInvoice.grandTotal.toLocaleString()}`}
                  </button>
                </form>

                {orderPayment === "UPI QR" && (
                  <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 md:max-w-[280px] gap-5">
                    <div className="text-center space-y-1.5">
                      <span className="bg-emerald-500 text-white text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm">
                        Secure UPI Payment
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Scan to pay from any UPI app</p>
                    </div>

                    <div className="relative w-40 h-40 bg-white p-3 rounded-xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 flex items-center justify-center">
                      <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-emerald-500 rounded-br-lg"></div>

                      {siteConfig?.qrCode ? (
                        <img src={siteConfig.qrCode} className="w-full h-full object-contain rounded-md" alt="Store Payment QR" />
                      ) : (
                        <div className="text-center text-slate-400 flex flex-col items-center gap-1.5">
                          <QrCode className="w-8 h-8 opacity-30" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">QR Not Configured</span>
                        </div>
                      )}
                    </div>

                    {siteConfig?.upiId && (
                      <div className="w-full text-center space-y-1.5">
                        <span className="text-[9px] text-slate-400 block font-black uppercase tracking-widest">Store UPI ID</span>
                        <div className="flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-2 px-3 rounded-xl gap-2 text-xs font-mono font-black text-slate-800 dark:text-slate-200 shadow-sm">
                          <span>{siteConfig.upiId}</span>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="text-slate-400 hover:text-emerald-500 transition-colors p-1"
                          >
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
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

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-5 py-3.5 rounded-xl font-bold text-xs shadow-xl flex items-center gap-2 animate-fade-up">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          {toast}
        </div>
      )}

      <Footer />
    </div>
  );
}