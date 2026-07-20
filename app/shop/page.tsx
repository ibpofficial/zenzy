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
  updateDoc,
  query,
  where,
  getDocs,
  setDoc,
  deleteDoc,
  getDoc
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
  Loader2,
  Heart,
  Eye,
  SlidersHorizontal,
  Info,
  Award,
  Calendar,
  TrendingUp,
  Clock,
  Percent,
  Gift,
  Users,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  Grid3x3,
  List,
  Filter,
  DollarSign,
  Tag,
  Package,
  MapPin,
  Phone,
  Mail,
  User,
  AlertCircle,
  Compass,
  BadgeCheck,
  Gem
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
  variants?: { name: string; options: string[] }[];
}

interface CartItem {
  product: Product;
  quantity: number;
  selectedVariants?: Record<string, string>;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

// ═══════ FLASH SALE TIMER COMPONENT ═══════
const ProductTimer = ({ productId }: { productId: string }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const seed = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

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
    <div className="absolute bottom-3 left-3 right-3 bg-gradient-to-r from-rose-500/95 to-rose-600/95 backdrop-blur-md text-white px-3 py-1.5 rounded-lg flex items-center justify-between shadow-lg shadow-rose-500/25 animate-fade-up z-10 border border-rose-400/30">
      <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
        <Zap className="w-3 h-3 fill-current" /> Flash Deal
      </span>
      <span className="text-[10px] font-mono font-bold tracking-widest bg-white/20 px-2 py-0.5 rounded">{h}:{m}:{s}</span>
    </div>
  );
};

// ═══════ SPOTLIGHT ITEMS FOR HERO SHOWCASE ═══════
const spotlightItems = [
  {
    id: "smart-valve",
    name: "ZenSmart AquaValve Controller",
    price: 3499,
    description: "Automatic water shutoff valve with smart Wi-Fi scheduling and leak sensor synchronization. Vetted professional grade.",
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    category: "Smart Home"
  },
  {
    id: "drill-kit",
    name: "VoltMaster 20V Cordless Hammer Drill",
    price: 4899,
    description: "Brushless high-torque motor with 2x lithium-ion battery packs, 32-piece bits case. Ideal for masonry and metal.",
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    category: "Tools"
  },
  {
    id: "safety-suit",
    name: "AeroShield Premium Harness Kit",
    price: 1899,
    description: "Full body construction safety harness with shock-absorbing lanyard, double locking rebar hooks. certified ANSI compliant.",
    image: "https://images.unsplash.com/photo-1589939705384-5185138a04b9?auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    category: "Safety"
  }
];

export default function ShopPage() {
  const router = useRouter();
  const { user, userData, role, openAuthModal } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [detailQty, setDetailQty] = useState(1);

  const [wishlist, setWishlist] = useState<string[]>([]);
  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [userPurchasedProduct, setUserPurchasedProduct] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState("");

  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [cartAnimProductId, setCartAnimProductId] = useState<string | null>(null);

  const [trackPhone, setTrackPhone] = useState("");
  const [trackingResult, setTrackingResult] = useState<any | null>(null);
  const [trackingError, setTrackingError] = useState("");

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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  const [activeSpotlightIdx, setActiveSpotlightIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSpotlightIdx((prev) => (prev + 1) % spotlightItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const renderMessageContent = (content: string, role: string) => {
    if (role === "user") return content;

    const formatted = content.split("\n").map((line, index) => {
      if (line.startsWith("✦") && line.endsWith("✦")) {
        return <div key={index} className="text-center font-bold text-teal-650 text-sm py-1">{line}</div>;
      }
      if (line.startsWith("▸") || line.startsWith("▪") || line.startsWith("•") || line.startsWith("◦") || line.startsWith("›")) {
        return <div key={index} className="flex items-start gap-2 ml-1 py-0.5">
          <span className="text-teal-500 font-bold">▹</span>
          <span>{line.replace(/^[▸▪•◦›]\s*/, "").trim()}</span>
        </div>;
      }
      if (line.includes("━")) {
        return <div key={index} className="text-center text-slate-350 text-xs">{line}</div>;
      }
      if (line.startsWith("⚠️")) {
        return <div key={index} className="bg-amber-50 border-l-4 border-amber-500 p-2 rounded text-amber-800 text-xs">{line}</div>;
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
      "ibpoffecial@gmail.com",
      "ibpofficial@gmail.com"
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

    setAiMessages(prev => [...prev, { role: "user", content: promptText }]);

    try {
      const collName = role === "worker" ? "workers" : "users";
      await updateDoc(doc(db, collName, user.uid), {
        zenQueriesCount: aiQueriesUsed + 1
      });

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
    if (!user) {
      setWishlist([]);
      return;
    }
    const unsub = onSnapshot(doc(db, "wishlists", user.uid), (snap) => {
      if (snap.exists()) {
        setWishlist(snap.data().productIds || []);
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!selectedProduct) {
      setProductReviews([]);
      setUserPurchasedProduct(false);
      return;
    }

    const qReviews = query(
      collection(db, "productReviews"),
      where("productId", "==", selectedProduct.id)
    );
    const unsubReviews = onSnapshot(qReviews, (snap) => {
      const list: any[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setProductReviews(list);
    });

    if (!user) {
      setUserPurchasedProduct(false);
      return () => unsubReviews();
    }

    const qOrders = query(
      collection(db, "shopOrders"),
      where("customerId", "==", user.uid)
    );
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      let purchased = false;
      snap.forEach((d) => {
        const order = d.data();
        if (order.items && Array.isArray(order.items)) {
          if (order.items.some((item: any) => item.productId === selectedProduct.id)) {
            purchased = true;
          }
        }
      });
      setUserPurchasedProduct(purchased);
    });

    return () => {
      unsubReviews();
      unsubOrders();
    };
  }, [user, selectedProduct]);

  useEffect(() => {
    if (selectedProduct) {
      try {
        const list = JSON.parse(localStorage.getItem("zenzy_recent_products") || "[]");
        const updated = [selectedProduct.id, ...list.filter((id: string) => id !== selectedProduct.id)].slice(0, 6);
        localStorage.setItem("zenzy_recent_products", JSON.stringify(updated));
        setRecentlyViewedIds(updated);
      } catch (err) { }
    } else {
      try {
        const list = JSON.parse(localStorage.getItem("zenzy_recent_products") || "[]");
        setRecentlyViewedIds(list);
      } catch (err) { }
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedProduct) {
      const defaultVars: Record<string, string> = {};
      if (selectedProduct.variants && Array.isArray(selectedProduct.variants)) {
        selectedProduct.variants.forEach((v: any) => {
          if (v.options && v.options.length > 0) {
            defaultVars[v.name] = v.options[0];
          }
        });
      }
      setSelectedVariants(defaultVars);
    }
  }, [selectedProduct]);

  const handleToggleWishlist = async (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) {
      openAuthModal("login");
      return;
    }
    const isWishlisted = wishlist.includes(productId);
    const updated = isWishlisted
      ? wishlist.filter(id => id !== productId)
      : [...wishlist, productId];
    setWishlist(updated);
    try {
      await setDoc(doc(db, "wishlists", user.uid), { productIds: updated }, { merge: true });
      showToast(isWishlisted ? "Removed from wishlist" : "Added to wishlist!");
    } catch (err) {
      console.error("Wishlist toggle error:", err);
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProduct) return;
    if (!newReviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      const reviewPayload = {
        productId: selectedProduct.id,
        customerId: user.uid,
        customerName: userData?.name || "Customer",
        rating: newReviewRating,
        comment: newReviewComment.trim(),
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "productReviews"), reviewPayload);

      const newReviewsList = [...productReviews, reviewPayload];
      const avg = parseFloat((newReviewsList.reduce((sum, r) => sum + r.rating, 0) / newReviewsList.length).toFixed(1));
      await updateDoc(doc(db, "shopProducts", selectedProduct.id), { rating: avg });

      setNewReviewComment("");
      setNewReviewRating(5);
      showToast("Review submitted successfully!");
    } catch (err) {
      console.error("Post review error:", err);
      showToast("Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleApplyCoupon = async () => {
    setCouponError("");
    if (!couponCode.trim()) return;
    try {
      const q = query(
        collection(db, "coupons"),
        where("code", "==", couponCode.toUpperCase().trim())
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setCouponError("Invalid coupon code.");
        setAppliedCoupon(null);
        return;
      }
      const cDoc = snap.docs[0];
      const coupon = { id: cDoc.id, ...cDoc.data() } as any;
      if (!coupon.active) {
        setCouponError("This coupon is no longer active.");
        setAppliedCoupon(null);
        return;
      }
      if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
        setCouponError("This coupon has expired.");
        setAppliedCoupon(null);
        return;
      }
      if (activeInvoice.subtotal < (coupon.minOrderValue || 0)) {
        setCouponError(`Minimum order value of ₹${coupon.minOrderValue} required.`);
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon(coupon);
      showToast(`Coupon "${coupon.code}" applied!`);
    } catch (err) {
      console.error("Apply coupon error:", err);
      setCouponError("Failed to apply coupon.");
    }
  };

  const handleNotifyMe = async (productId: string, productName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) {
      openAuthModal("login");
      return;
    }
    try {
      await addDoc(collection(db, "stockAlerts"), {
        productId,
        productName,
        customerId: user.uid,
        customerName: userData?.name || "Customer",
        customerEmail: user.email || "",
        createdAt: new Date().toISOString(),
        notified: false
      });
      showToast("We will notify you once this item is restocked!");
    } catch (err) {
      console.error("Notify me error:", err);
      showToast("Failed to schedule alert.");
    }
  };

  const handleTrackOrder = async () => {
    setTrackingError("");
    setTrackingResult(null);
    if (!/^\d{10}$/.test(trackPhone.trim())) {
      setTrackingError("Enter a valid 10-digit mobile number.");
      return;
    }
    try {
      const q = query(
        collection(db, "shopOrders"),
        where("customerPhone", "==", trackPhone.trim())
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setTrackingError("No orders found for this phone number.");
        return;
      }
      const list = snap.docs.map(d => d.data());
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTrackingResult(list[0]);
    } catch (err) {
      console.error("Order tracking error:", err);
      setTrackingError("Failed to look up order.");
    }
  };

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

  const handleAddToCart = (product: Product, silence = false, customVariants?: Record<string, string>) => {
    if (product.stock <= 0) {
      showToast("Sorry, this item is out of stock!");
      return;
    }

    const vars = customVariants || (selectedProduct?.id === product.id ? selectedVariants : {});
    const existingIndex = cart.findIndex((item) =>
      item.product.id === product.id &&
      JSON.stringify(item.selectedVariants || {}) === JSON.stringify(vars)
    );

    let updated: CartItem[];
    if (existingIndex > -1) {
      const existing = cart[existingIndex];
      if (existing.quantity >= product.stock) {
        showToast(`Only ${product.stock} units are currently available.`);
        return;
      }
      updated = cart.map((item, idx) =>
        idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updated = [...cart, { product, quantity: 1, selectedVariants: vars }];
    }
    saveCartToStorage(updated);

    setCartAnimProductId(product.id);
    setTimeout(() => {
      setCartAnimProductId(null);
    }, 1500);

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
    const vars = selectedProduct?.id === product.id ? selectedVariants : {};
    setCheckoutItems([{ product, quantity: 1, selectedVariants: vars }]);
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
        const matchesCategory =
          selectedCategory === "All" ||
          (selectedCategory === "Wishlist" ? wishlist.includes(p.id) : p.category === selectedCategory);
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
  }, [products, selectedCategory, searchQuery, sortBy, maxPriceFilter, wishlist]);

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

  const getBundleSuggestion = () => {
    if (cart.length === 0) return null;
    const firstItem = cart[0];
    const category = firstItem.product.category;
    return products.find(p => p.category === category && p.id !== firstItem.product.id && p.stock > 0 && !cart.some(c => c.product.id === p.id));
  };

  const calculateInvoice = (items: CartItem[]) => {
    const sub = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const delivery = sub >= 499 || sub === 0 ? 0 : 79;
    const tax = Math.round(sub * 0.18);

    let discount = 0;
    if (appliedCoupon && items === checkoutItems) {
      if (appliedCoupon.type === "percent") {
        discount = Math.round(sub * (appliedCoupon.value / 100));
      } else if (appliedCoupon.type === "flat") {
        discount = appliedCoupon.value;
      }
    }

    const total = Math.max(0, sub + delivery + tax - discount);
    return { subtotal: sub, deliveryFee: delivery, taxAmount: tax, discount, grandTotal: total };
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
          quantity: item.quantity,
          selectedVariants: item.selectedVariants || null
        })),
        subtotal: activeInvoice.subtotal,
        deliveryFee: activeInvoice.deliveryFee,
        tax: activeInvoice.taxAmount,
        discountAmount: activeInvoice.discount,
        couponCode: appliedCoupon ? appliedCoupon.code : "",
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
      setAppliedCoupon(null);
      setCouponCode("");
      setCouponError("");
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
    { name: "Safety", icon: Shield },
    ...(user ? [{ name: "Wishlist", icon: Heart }] : [])
  ];

  // ==== PRODUCT DETAIL PAGE RENDER ====
  if (selectedProduct) {
    const originalPrice = Math.round(selectedProduct.price * 1.35);
    const savings = originalPrice - selectedProduct.price;
    const productImages: string[] = (selectedProduct as any).images && (selectedProduct as any).images.length > 0
      ? (selectedProduct as any).images
      : [selectedProduct.image];

    const averageRating = productReviews.length > 0
      ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)
      : selectedProduct.rating || "4.8";

    return (
      <div className="relative flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/80 text-slate-800 font-sans transition-colors duration-300 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="absolute top-1/3 right-1/4 w-[800px] h-[800px] bg-blue-400/5 rounded-full blur-[120px] pointer-events-none z-0" />

        <Navbar />

        <main className="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 pt-28 pb-20 flex-grow animate-fade-in">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSelectedProduct(null)}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition cursor-pointer bg-white/80 backdrop-blur-md border border-slate-200/60 px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Shop
            </button>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
              Shop &gt; {selectedProduct.category} &gt; <span className="text-slate-900">{selectedProduct.name}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-2">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div
                onClick={() => setZoomOpen(true)}
                className="relative aspect-square rounded-2xl overflow-hidden bg-white flex items-center justify-center group shadow-xl shadow-slate-200/50 border border-slate-100/80 cursor-zoom-in"
              >
                <img
                  src={productImages[selectedImageIdx]}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt={selectedProduct.name}
                />

                <button
                  type="button"
                  onClick={(e) => handleToggleWishlist(selectedProduct.id, e)}
                  className="absolute top-4 right-4 z-30 p-2.5 rounded-xl bg-white/95 text-slate-500 hover:text-rose-500 hover:scale-105 transition-all shadow-lg border border-slate-100/80"
                >
                  <Heart className={`w-4 h-4 ${wishlist.includes(selectedProduct.id) ? "fill-rose-500 text-rose-500" : "text-slate-450"}`} />
                </button>

                <span className="absolute top-4 left-4 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-md shadow-lg shadow-teal-500/25 animate-pulse">
                  Save 25%
                </span>

                <ProductTimer productId={selectedProduct.id} />
              </div>

              <div className="flex gap-4">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer relative bg-white ${selectedImageIdx === idx
                      ? "ring-2 ring-teal-500 shadow-lg scale-[1.02]"
                      : "opacity-60 hover:opacity-100 border border-slate-200"
                      }`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="flex flex-col justify-center space-y-6 lg:space-y-0">
              <div className="space-y-5">
                <div className="space-y-3">
                  <span className="inline-flex bg-white border border-slate-200 shadow-sm text-slate-600 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                    {selectedProduct.category}
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-slate-900">
                    {selectedProduct.name}
                  </h1>
                  <div className="flex items-center gap-3">
                    <span className="text-amber-500 font-bold text-xs flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-current" /> {selectedProduct.rating || 4.8}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-xs font-semibold text-slate-500">120 Ratings</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-xs font-semibold text-slate-500">18 Questions</span>
                  </div>
                </div>

                <div className="py-5 border-y border-slate-200/60 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Special Price</span>
                    <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-md">
                      25% OFF
                    </span>
                  </div>
                  <div className="flex items-baseline gap-4 flex-wrap">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      ₹{selectedProduct.price.toLocaleString()}
                    </span>
                    <span className="text-base font-bold text-slate-400 line-through">
                      ₹{originalPrice.toLocaleString()}
                    </span>
                    <span className="text-xs font-extrabold text-teal-600">
                      Save ₹{savings.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Description</span>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {selectedProduct.description} This professional-grade supply has been standard checked by Zenzy partner technicians. Perfect for residential or workplace applications, ensuring long durability, high compatibility, and optimal performance under all standard usage conditions.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 p-3 bg-teal-500/5 rounded-xl border border-teal-500/10 text-xs font-semibold text-slate-800">
                  <Truck className="w-4 h-4 text-teal-500 shrink-0 animate-pulse" />
                  <span>Estimated Delivery by <strong className="text-teal-600">{new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { weekday: 'long', month: 'short', day: 'numeric' })}</strong> (Free above ₹499)</span>
                </div>

                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="space-y-3.5 pt-1 border-t">
                    {selectedProduct.variants.map((v: any) => (
                      <div key={v.name} className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">{v.name}</span>
                        <div className="flex flex-wrap gap-2">
                          {v.options.map((opt: string) => {
                            const isSelected = selectedVariants[v.name] === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setSelectedVariants(prev => ({ ...prev, [v.name]: opt }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-205 cursor-pointer ${isSelected
                                  ? "bg-slate-900 text-white shadow-sm"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-2 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                    <span>1 Year Warranty</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                    <span>Fast Dispatch (24h)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                    <span>7 Days Replacement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                    <span>Zenzy Quality Check</span>
                  </div>
                </div>
              </div>

              <div className="space-y-5 pt-6">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">Quantity</span>
                  <span className={selectedProduct.stock > 0 ? "text-teal-600 bg-teal-50 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider" : "text-red-500 bg-red-50 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider animate-pulse"}>
                    {selectedProduct.stock > 0 ? (selectedProduct.stock <= 5 ? `⚠️ Only ${selectedProduct.stock} Left` : `✓ In Stock (${selectedProduct.stock} available)`) : "🚫 Out of Stock"}
                  </span>
                </div>

                <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-1 shrink-0 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setDetailQty(prev => Math.max(1, prev - 1))}
                      className="w-10 h-10 rounded-lg hover:bg-slate-50 flex items-center justify-center transition cursor-pointer text-slate-700 font-extrabold text-sm"
                    >
                      -
                    </button>
                    <span className="text-sm font-black text-slate-900 min-w-[20px] text-center">
                      {detailQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDetailQty(prev => Math.min(selectedProduct.stock || 10, prev + 1))}
                      className="w-10 h-10 rounded-lg hover:bg-slate-50 flex items-center justify-center transition cursor-pointer text-slate-700 font-extrabold text-sm"
                    >
                      +
                    </button>
                  </div>

                  {selectedProduct.stock <= 0 ? (
                    <button
                      type="button"
                      onClick={() => handleNotifyMe(selectedProduct.id, selectedProduct.name)}
                      className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 px-5 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all duration-300 shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border-none"
                    >
                      <Info className="w-4 h-4" />
                      <span>Notify Me when Restocked</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (!user) {
                            openAuthModal("login");
                            return;
                          }
                          setCheckoutItems([{ product: selectedProduct, quantity: detailQty, selectedVariants }]);
                          setIsDirectBuy(true);
                          setOrderPayment("COD");
                          setTransactionId("");
                          setCheckoutOpen(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white py-3.5 px-5 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all duration-300 shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border-none"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Buy Now</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          for (let i = 0; i < detailQty; i++) {
                            handleAddToCart(selectedProduct, true, selectedVariants);
                          }
                          showToast(`${detailQty}x ${selectedProduct.name} added to cart!`);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 py-3.5 px-5 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* You Might Also Like */}
          {products.filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id).length > 0 && (
            <section className="mt-16 pt-12 border-t border-slate-200/60 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">You Might Also Like</h3>
                <span className="text-[10px] text-slate-400 font-bold">Trending Now</span>
              </div>
              <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-4 -mx-5 px-5 sm:mx-0 sm:px-0">
                {products
                  .filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id)
                  .slice(0, 6)
                  .map(prod => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setSelectedProduct(prod);
                        setSelectedImageIdx(0);
                        setDetailQty(1);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="min-w-[200px] sm:min-w-[220px] bg-white/80 backdrop-blur-md p-4 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer text-left space-y-3 shrink-0 group"
                    >
                      <div className="h-32 bg-slate-50 rounded-lg overflow-hidden relative">
                        <img src={prod.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                        <span className="absolute top-2 left-2 bg-gradient-to-r from-teal-600 to-teal-500 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                          ₹{prod.price}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-900 line-clamp-1">{prod.name}</h4>
                      <span className="text-[10px] text-amber-550 font-bold block">★ {prod.rating || 4.5}</span>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section className="mt-16 pt-12 border-t border-slate-200/60 space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4 text-left">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">Customer Reviews</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-amber-500 font-extrabold text-sm">★ {averageRating}</span>
                  <span className="text-slate-400 text-xs font-semibold">({productReviews.length} reviews)</span>
                </div>
              </div>
            </div>

            {user && userPurchasedProduct && (
              <form onSubmit={handlePostReview} className="bg-white/80 backdrop-blur-md p-6 rounded-xl border border-slate-200/60 space-y-4 max-w-xl text-left shadow-sm">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Share your feedback</h4>
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Rating</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className={`text-lg transition cursor-pointer bg-transparent border-none ${star <= newReviewRating ? "text-amber-500 animate-bounce" : "text-slate-300"}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Your review</span>
                  <textarea
                    rows={3}
                    placeholder="Write a short review..."
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs outline-none text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer border-none disabled:opacity-50 transition-all hover:-translate-y-0.5 shadow-md"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            )}

            <div className="space-y-4 max-w-2xl text-left">
              {productReviews.length === 0 ? (
                <p className="text-xs text-slate-400 italic font-semibold">No reviews written for this supply yet. Be the first to try it!</p>
              ) : (
                productReviews.map((rev) => (
                  <div key={rev.id} className="bg-white/80 p-4 rounded-xl border border-slate-200/60 space-y-2 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-extrabold text-xs text-slate-900 block">{rev.customerName}</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className="bg-amber-500/10 text-amber-605 px-2.5 py-0.5 rounded-lg text-[10px] font-black">
                        ★ {rev.rating}
                      </span>
                    </div>
                    <p className="text-xs text-slate-655 font-medium leading-relaxed">{rev.comment}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          {zoomOpen && (
            <div
              className="fixed inset-0 z-[220] flex items-center justify-center bg-black/90 p-4 cursor-zoom-out"
              onClick={() => setZoomOpen(false)}
            >
              <img
                src={productImages[selectedImageIdx]}
                className="max-w-full max-h-full object-contain rounded-lg animate-scale-in"
                alt=""
              />
            </div>
          )}
        </main>

        {toast && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-5 py-3.5 rounded-xl font-bold text-xs shadow-xl flex items-center gap-2 animate-fade-up">
            <CheckCircle className="w-4 h-4 text-teal-500" />
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
    <div className="relative flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/80 text-slate-800 font-sans transition-colors duration-300 overflow-hidden">

      <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-1/3 right-1/4 w-[1000px] h-[1000px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 pt-24 pb-20 flex-grow">

        {/* ─── PREMIUM HERO BANNER ─── */}
        <section className="relative w-full rounded-2xl overflow-hidden mb-10 z-10 group border border-white/10 shadow-2xl shadow-slate-200/30" style={{ minHeight: '280px' }}>

          {shopConfig?.heroMediaType === "image" && shopConfig?.heroImageUrl ? (
            <div className="absolute inset-0 w-full h-full">
              <img
                src={shopConfig.heroImageUrl}
                alt="Shop hero"
                className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-[4000ms] ease-in-out"
              />
            </div>
          ) : (
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <video
                autoPlay loop muted playsInline
                key={shopConfig?.videoUrl || "default"}
                className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-[4000ms] ease-in-out"
                src={getDirectVideoUrl(shopConfig?.videoUrl) || "https://assets.mixkit.co/videos/preview/mixkit-worker-using-a-drill-on-a-wooden-surface-31950-large.mp4"}
              />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent z-[1]" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent z-[2]" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950/80 to-transparent z-[3]" />
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-teal-400/60 to-transparent z-[4]" />

          <div className="relative z-[5] flex flex-col justify-between px-8 sm:px-12 py-8" style={{ minHeight: '280px' }}>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-500/20 border border-teal-400/30 rounded-full text-[9px] font-black text-teal-300 uppercase tracking-[0.15em] backdrop-blur-sm">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Zenzy Premium Marketplace</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-[2.8rem] font-black tracking-tight text-white leading-[1.05] drop-shadow-lg">
                  Equip Smarter.{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400">
                    Build Better.
                  </span>
                </h1>
                <p className="text-slate-300 text-sm font-medium max-w-md leading-relaxed hidden sm:block drop-shadow">
                  Certified tools, smart devices &amp; safety supplies — shipped fast from verified trade professionals.
                </p>
              </div>

              <div className="flex flex-row sm:flex-col gap-3 shrink-0 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("supplies-grid");
                    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 100, behavior: 'smooth' });
                  }}
                  className="bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-lg flex items-center gap-2 cursor-pointer border-none whitespace-nowrap"
                >
                  Browse Supplies <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZenAiOpen(true)}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-extrabold text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-[0_0_30px_rgba(20,184,166,0.4)] flex items-center gap-2 cursor-pointer border-none whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-current" /> Ask Zen AI
                </button>
              </div>
            </div>

            <div className="flex items-center gap-8 sm:gap-12 pt-6 mt-auto border-t border-white/10">
              {[
                { label: "Products", value: products.length > 0 ? `${products.length}+` : "100+" },
                { label: "Categories", value: "12+" },
                { label: "Shipping", value: "24hr" },
                { label: "Verified", value: "100%" }
              ].map((stat) => (
                <div key={stat.label} className="text-left">
                  <div className="text-white font-black text-sm sm:text-base leading-none drop-shadow">{stat.value}</div>
                  <div className="text-teal-400/80 text-[9px] font-black uppercase tracking-widest mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ─── MODERN CENTERED SEARCH BAR ─── */}
        <div className="flex flex-col items-center justify-center w-full mb-12 -mt-2 relative z-30">
          <div className="w-full max-w-3xl relative" ref={searchContainerRef}>
            <div className="relative flex items-center bg-white/90 backdrop-blur-xl rounded-2xl p-1.5 shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-slate-200/50 focus-within:border-teal-500/60 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all duration-300 group hover:shadow-[0_8px_50px_rgba(13,148,136,0.08)]">
              <div className="pl-5 pr-3">
                <Search className="w-5 h-5 text-slate-400 group-focus-within:text-teal-500 shrink-0 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search for tools, smart devices, safety gear..."
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                className="w-full bg-transparent border-none outline-none py-3.5 sm:py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 tracking-wide"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setShowSuggestions(false); }}
                  className="text-slate-400 hover:text-slate-600 transition p-2.5 sm:p-2 bg-slate-50 hover:bg-slate-100 rounded-xl mr-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button className="hidden sm:flex bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:-translate-y-0.5 cursor-pointer ml-auto border-none">
                <Search className="w-4 h-4 mr-2" /> Search
              </button>
            </div>

            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100/60">
                {searchSuggestions.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => {
                      setSearchQuery(prod.name);
                      setShowSuggestions(false);
                    }}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/80 transition text-left cursor-pointer font-bold text-sm group"
                  >
                    <span className="text-slate-900 truncate pr-4">{prod.name}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-wider shrink-0 font-black group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                      {prod.category}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Quick category shortcuts */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {categoriesList.slice(0, 5).map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${selectedCategory === cat.name
                      ? "bg-teal-600 text-white shadow-lg shadow-teal-500/20"
                      : "bg-white/70 backdrop-blur-sm text-slate-600 hover:bg-teal-50 hover:text-teal-600 border border-slate-200/50"
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── STICKY CATEGORY BAR ─── */}
        <div className="sticky top-20 z-40 bg-white/90 backdrop-blur-lg border-y border-slate-200/50 py-3 mb-8 -mx-5 px-5 sm:mx-0 sm:px-0 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              <Link href="/" className="hover:text-slate-600 transition">Home</Link> &gt;{" "}
              <Link href="/shop" className="hover:text-slate-600 transition">Shop</Link> &gt;{" "}
              <span className="text-teal-500">{selectedCategory}</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar scroll-smooth shrink-0 py-0.5 max-w-[calc(100vw-140px)] sm:max-w-none">
                {categoriesList.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer shrink-0 ${selectedCategory === cat.name
                        ? "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md shadow-teal-500/20"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setFilterDrawerOpen(true)}
                className="lg:hidden flex items-center gap-1 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:opacity-90 active:scale-95 transition ml-auto border-none cursor-pointer"
              >
                <SlidersHorizontal className="w-3 h-3 text-teal-400" />
                <span>Filters</span>
              </button>
            </div>
          </div>
        </div>

        <div id="supplies-grid" className="flex flex-col lg:flex-row gap-10 lg:gap-12">

          {/* ─── SIDEBAR ─── */}
          <aside className="lg:w-60 shrink-0 space-y-8 lg:sticky lg:top-28 h-fit">

            <div className="space-y-3">
              <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" /> Categories
              </h3>
              <div className="flex flex-col gap-1 flex-wrap sm:flex-nowrap flex-row sm:flex-col overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 hide-scrollbar">
                {categoriesList.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`shrink-0 sm:w-full flex items-center justify-between px-3.5 py-2.5 font-bold text-xs transition-all duration-200 cursor-pointer rounded-xl ${isSelected
                          ? "bg-gradient-to-r from-teal-50 to-teal-100/80 text-teal-600 shadow-sm"
                          : "bg-white sm:bg-transparent border border-slate-200 sm:border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                      <div className="flex items-center gap-2.5 mr-3 sm:mr-0">
                        <Icon className={`w-4 h-4 ${isSelected ? "text-teal-550" : "text-slate-450"}`} />
                        <span>{cat.name}</span>
                      </div>
                      <span className={`text-[9.5px] px-2 py-0.5 rounded-md font-bold hidden sm:block ${isSelected ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500"
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
                <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5" /> Max Price
                </h3>
                <span className="text-xs font-black text-slate-900">
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
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Min: ₹100</span>
                  <span>Max: ₹{(products.length > 0 ? Math.max(2000, ...products.map(p => p.price)) : 2000).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Track Order */}
            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4 text-left hidden sm:block">
              <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-teal-500" />
                <span>Track My Order</span>
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter 10-digit Phone"
                  value={trackPhone}
                  onChange={(e) => setTrackPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none text-slate-850 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
                <button
                  type="button"
                  onClick={handleTrackOrder}
                  className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition active:scale-95 cursor-pointer border-none shadow-sm"
                >
                  Track Order
                </button>
              </div>

              {trackingResult && (
                <div className="bg-slate-50 p-3 rounded-lg border text-[11px] space-y-1.5 animate-fade-up shadow-sm">
                  <div className="flex justify-between font-bold">
                    <span>Status:</span>
                    <span className="text-indigo-650 font-extrabold">{trackingResult.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>₹{trackingResult.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400">
                    <span>Date:</span>
                    <span>{new Date(trackingResult.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
              {trackingError && (
                <p className="text-[10px] text-red-500 font-bold animate-pulse">{trackingError}</p>
              )}
            </div>
          </aside>

          {/* ─── PRODUCT GRID ─── */}
          <div className="flex-1 min-w-0 flex flex-col space-y-6">

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pb-3 border-b border-slate-200/60">
              <span className="text-xs font-semibold text-slate-500 w-full sm:w-auto text-left">
                Showing <strong className="text-slate-900">{filteredProducts.length}</strong> supplies
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <button
                  type="button"
                  onClick={() => setFilterDrawerOpen(true)}
                  className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 bg-white border rounded-lg text-xs font-bold text-slate-700 cursor-pointer shadow-sm"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-teal-500" />
                  <span>Filters</span>
                </button>

                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-md transition ${viewMode === "grid" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <Grid3x3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-md transition ${viewMode === "list" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 bg-transparent hover:bg-slate-100 rounded-lg text-xs font-bold outline-none cursor-pointer text-slate-800 transition-colors border-none"
                >
                  <option value="popularity">Top Rated</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                </select>
              </div>
            </div>

            {/* Filter Chips */}
            {(selectedCategory !== "All" || searchQuery || maxPriceFilter < 100000) && (
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedCategory !== "All" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-600 border border-teal-200/50 text-[10px] font-black uppercase tracking-wider rounded-lg">
                    Category: {selectedCategory}
                    <button onClick={() => setSelectedCategory("All")} className="hover:text-teal-800 ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200/50 text-[10px] font-black uppercase tracking-wider rounded-lg">
                    Search: "{searchQuery}"
                    <button onClick={() => setSearchQuery("")} className="hover:text-blue-800 ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {maxPriceFilter < 100000 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200/50 text-[10px] font-black uppercase tracking-wider rounded-lg">
                    Max Price: ₹{maxPriceFilter.toLocaleString()}
                    <button onClick={() => setMaxPriceFilter(100000)} className="hover:text-amber-800 ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("All");
                    setSearchQuery("");
                    setMaxPriceFilter(100000);
                  }}
                  className="text-[10px] text-slate-405 hover:text-slate-600 font-black uppercase tracking-wider px-2 py-1 cursor-pointer border-none bg-transparent"
                >
                  Clear All
                </button>
              </div>
            )}

            {loading ? (
              <div className={`grid ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-6`}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white/40 border border-slate-200/50 rounded-xl overflow-hidden flex flex-col h-[360px]">
                    <div className="relative h-44 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 overflow-hidden">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    </div>
                    <div className="p-5 space-y-3 flex-1">
                      <div className="h-3 w-16 bg-gradient-to-r from-slate-200 to-slate-150 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_0.1s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      </div>
                      <div className="h-4 w-3/4 bg-gradient-to-r from-slate-200 to-slate-150 rounded overflow-hidden relative">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_0.2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      </div>
                      <div className="h-3 w-full bg-slate-200/80 rounded overflow-hidden relative">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_0.3s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      </div>
                      <div className="h-3 w-5/6 bg-slate-200/80 rounded overflow-hidden relative">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_0.35s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      </div>
                    </div>
                    <div className="p-5 pt-4 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="h-5 w-20 bg-slate-200 rounded overflow-hidden relative">
                          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_0.4s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                        </div>
                        <div className="h-4 w-10 bg-amber-100 rounded overflow-hidden relative">
                          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_0.45s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        </div>
                      </div>
                      <div className="h-10 w-full bg-slate-200 rounded-xl overflow-hidden relative">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_0.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-5 text-center">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                  <ShoppingBag className="w-8 h-8 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">No matching products</h3>
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
                  className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition hover:-translate-y-0.5 shadow-sm cursor-pointer border-none"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-10">
                <div className={`grid ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-6 animate-fade-in`}>
                  {filteredProducts.slice(0, visibleCount).map((prod) => (
                    <article
                      key={prod.id}
                      onClick={() => {
                        setSelectedProduct(prod);
                        setSelectedImageIdx(0);
                        setDetailQty(1);
                      }}
                      className={`bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-xl overflow-hidden flex flex-col justify-between hover:border-teal-500/50 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(13,148,136,0.15)] transition-all duration-300 group cursor-pointer relative ${viewMode === "list" ? "flex-row items-center p-4" : ""
                        }`}
                    >
                      {viewMode === "list" ? (
                        // ── LIST VIEW ──
                        <>
                          <div className="relative h-32 w-32 shrink-0 bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                            <img src={prod.image} alt={prod.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            {prod.stock <= 0 && (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white text-[8px] font-black uppercase tracking-widest">
                                Out of Stock
                              </div>
                            )}
                          </div>
                          <div className="flex-1 p-4 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-1 group-hover:text-teal-600 transition-colors">
                                {prod.name}
                              </h4>
                              <span className="text-amber-500 font-bold text-xs shrink-0 flex items-center gap-0.5">
                                ★ {prod.rating || 4.5}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed font-semibold line-clamp-2">
                              {prod.description}
                            </p>
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-lg font-black text-slate-900">₹{prod.price.toLocaleString()}</span>
                              <span className="text-[10px] text-slate-400 line-through font-semibold">
                                ₹{Math.round(prod.price * 1.35).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="p-4 shrink-0">
                            {prod.stock <= 0 ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotifyMe(prod.id, prod.name, e);
                                }}
                                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-lg font-extrabold text-xs uppercase tracking-widest transition-all duration-150 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95 border-none"
                              >
                                <Info className="w-3.5 h-3.5" />
                                <span>Notify Me</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(prod);
                                }}
                                className="flex items-center justify-center gap-2 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white py-2 px-4 rounded-lg font-extrabold text-xs uppercase tracking-widest transition-all duration-150 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95 border-none"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>Add</span>
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        // ── GRID VIEW ──
                        <>
                          <div>
                            <div className="relative h-44 bg-slate-50 overflow-hidden border-b border-slate-100">
                              <img
                                src={prod.image}
                                alt={prod.name}
                                loading="lazy"
                                className={`w-full h-full object-cover transition-all duration-500 ${prod.variants && prod.variants.length > 0 && (prod as any).images && (prod as any).images.length > 1
                                  ? "group-hover:opacity-0 group-hover:scale-105"
                                  : "group-hover:scale-105"
                                  }`}
                              />
                              {(prod as any).images && (prod as any).images.length > 1 && (
                                <img
                                  src={(prod as any).images[1]}
                                  alt={prod.name}
                                  loading="lazy"
                                  className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-500 scale-100 group-hover:scale-105"
                                />
                              )}

                              <button
                                type="button"
                                onClick={(e) => handleToggleWishlist(prod.id, e)}
                                className="absolute top-3 right-3 z-30 p-2 rounded-lg bg-white/95 text-slate-500 hover:text-rose-500 hover:scale-105 transition-all duration-200 shadow-lg border border-slate-150"
                              >
                                <Heart className={`w-3.5 h-3.5 ${wishlist.includes(prod.id) ? "fill-rose-500 text-rose-500" : "text-slate-450"}`} />
                              </button>

                              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-300 z-20">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProduct(prod);
                                    setSelectedImageIdx(0);
                                    setDetailQty(1);
                                  }}
                                  className="p-2.5 rounded-xl bg-white text-slate-950 hover:bg-slate-50 transition transform translate-y-2 group-hover:translate-y-0 duration-300 shadow-lg flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider cursor-pointer border-none"
                                >
                                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Quick View</span>
                                </button>
                              </div>

                              <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                                <span className="bg-black/70 backdrop-blur-md text-white px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                                  {prod.category}
                                </span>
                                {prod.stock > 0 && prod.stock <= 5 && (
                                  <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-widest animate-pulse">
                                    Only {prod.stock} Left
                                  </span>
                                )}
                              </div>

                              <ProductTimer productId={prod.id} />

                              {prod.stock <= 0 && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white text-xs font-black uppercase tracking-widest z-20">
                                  🚫 Out of Stock
                                </div>
                              )}
                            </div>

                            <div className="p-5 space-y-2">
                              <div className="flex justify-between items-start gap-3">
                                <h4 className="font-extrabold text-[13px] text-slate-900 leading-snug line-clamp-1 group-hover:text-teal-600 transition-colors">
                                  {prod.name}
                                </h4>
                                <span className="text-amber-500 font-bold text-xs shrink-0 flex items-center gap-0.5">
                                  ★ {prod.rating || 4.5}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold line-clamp-2">
                                {prod.description}
                              </p>
                            </div>
                          </div>

                          <div className="p-5 pt-4 border-t border-slate-100 space-y-3 bg-slate-50/30">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price</span>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 line-through mr-1.5 font-semibold">
                                  ₹{Math.round(prod.price * 1.35).toLocaleString()}
                                </span>
                                <span className="text-lg font-black text-slate-900">₹{prod.price.toLocaleString()}</span>
                              </div>
                            </div>

                            {prod.stock <= 0 ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotifyMe(prod.id, prod.name, e);
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all duration-150 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95 border-none"
                              >
                                <Info className="w-4 h-4" />
                                <span>Notify Me</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(prod);
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white py-3 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all duration-150 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95 border-none"
                              >
                                {cartAnimProductId === prod.id ? (
                                  <span className="flex items-center gap-1.5 text-teal-400 font-black">
                                    <CheckCircle className="w-4 h-4 text-teal-400 animate-bounce" /> Added!
                                  </span>
                                ) : (
                                  <>
                                    <ShoppingCart className="w-4 h-4" />
                                    <span>Add to Cart</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </article>
                  ))}
                </div>

                {filteredProducts.length > visibleCount && (
                  <div className="py-10 border-t border-slate-200/50 flex flex-col items-center justify-center gap-4 text-slate-500 text-xs font-bold animate-fade-up">
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                      <span>Scroll or click below to load more supplies...</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => Math.min(prev + 12, filteredProducts.length))}
                      className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider transition hover:-translate-y-0.5 shadow-md cursor-pointer border-none"
                    >
                      Load More Products
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── TRUST BADGES ─── */}
        <div className="mt-20 pt-10 border-t border-slate-200/60 grid grid-cols-2 md:grid-cols-5 gap-6 text-center animate-fade-up">
          <div className="flex flex-col items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-slate-700 group-hover:text-teal-500 group-hover:scale-105 group-hover:shadow-lg transition-all duration-300">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Free Shipping</span>
          </div>
          <div className="flex flex-col items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-slate-700 group-hover:text-teal-500 group-hover:scale-105 group-hover:shadow-lg transition-all duration-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Secure Payments</span>
          </div>
          <div className="flex flex-col items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-slate-700 group-hover:text-teal-500 group-hover:scale-105 group-hover:shadow-lg transition-all duration-300">
              <RefreshCw className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Easy Returns</span>
          </div>
          <div className="flex flex-col items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-slate-700 group-hover:text-teal-500 group-hover:scale-105 group-hover:shadow-lg transition-all duration-300">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Fast Delivery</span>
          </div>
          <div className="flex flex-col items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-slate-700 group-hover:text-teal-500 group-hover:scale-105 group-hover:shadow-lg transition-all duration-300">
              <Headphones className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">24/7 Support</span>
          </div>
        </div>

      </main>

      {/* ─── ZEN AI CHAT MODAL ─── */}
      {zenAiOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setZenAiOpen(false)} />

          <div className="relative bg-white w-full max-w-sm h-full flex flex-col shadow-2xl border-l border-slate-200/50 animate-slide-left">

            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 tracking-tight">Zen AI Assistant</h4>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Always here to help</p>
                </div>
              </div>
              <button
                onClick={() => setZenAiOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 bg-gradient-to-br from-slate-50 to-white space-y-4">
              {aiMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex max-w-[82%] ${m.role === "user" ? "ml-auto" : "mr-auto"}`}
                >
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed text-left ${m.role === "user"
                      ? "bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-tr-none shadow-lg shadow-teal-500/20"
                      : "bg-white/80 backdrop-blur-md text-slate-800 rounded-tl-none shadow-sm border border-slate-100/80"
                      }`}
                    style={m.role === "user" ? { backgroundColor: "#0d9488", color: "#ffffff" } : undefined}
                  >
                    {m.role === "assistant" && m.content === "" && aiIsTyping ? (
                      <div className="text-teal-600 whitespace-pre-wrap">
                        {aiDisplayedMessage}
                        <span className="inline-block w-0.5 h-3 bg-teal-500 animate-pulse ml-0.5"></span>
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
                <div className="max-w-[85%] mr-auto p-3.5 bg-white/80 backdrop-blur-md rounded-2xl rounded-tl-none flex flex-col gap-2 animate-fade-in border border-slate-100/80 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 shrink-0">
                      <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-[9px] text-teal-600 font-extrabold uppercase tracking-wider animate-pulse">
                      {loadingStatuses[loadingStatusIdx]}
                    </span>
                  </div>
                  <div className="space-y-1.5 w-36 sm:w-48 pt-1">
                    <div className="h-1.5 bg-slate-200 rounded-full w-full animate-pulse"></div>
                    <div className="h-1.5 bg-slate-200 rounded-full w-[85%] animate-pulse"></div>
                    <div className="h-1.5 bg-slate-200 rounded-full w-[60%] animate-pulse"></div>
                  </div>
                </div>
              )}
              <div ref={aiChatEndRef} />

              {aiMessages.length === 1 && (
                <div className="flex flex-wrap gap-2 pt-2 animate-fade-up" style={{ animationDelay: '100ms' }}>
                  <button
                    onClick={(e) => handleAiSend(e, "Where is my order?")}
                    className="text-[10px] font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-full text-slate-600 hover:text-teal-500 hover:border-teal-500 transition-colors shadow-sm"
                  >
                    Where is my order?
                  </button>
                  <button
                    onClick={(e) => handleAiSend(e, "Find best tools")}
                    className="text-[10px] font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-full text-slate-600 hover:text-teal-500 hover:border-teal-500 transition-colors shadow-sm"
                  >
                    Find best tools
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
              {(aiLoading || aiIsTyping) && (
                <div className="flex justify-center pb-2.5 bg-transparent shrink-0">
                  <button
                    type="button"
                    onClick={handleStopResponse}
                    className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer border-none"
                  >
                    <span className="w-1.5 h-1.5 bg-rose-650 rounded-sm animate-pulse"></span>
                    Stop Generating
                  </button>
                </div>
              )}
              {!user ? (
                <div className="text-center space-y-2 py-1">
                  <p className="text-[10px] font-semibold text-slate-500">Authenticate to use ZEN AI</p>
                  <button
                    onClick={() => openAuthModal("login")}
                    className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer border-none shadow-sm"
                  >
                    Log In
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => handleAiSend(e)} className="relative flex items-center bg-slate-50 rounded-xl p-1.5 border border-slate-200 focus-within:border-teal-500 transition-all">
                  <input
                    type="text"
                    placeholder={
                      (aiQueriesUsed >= (siteConfig?.aiUsageLimit ?? 10) && !((user?.email && [
                        "ishantpbupadhyay@gmail.com",
                        "25tec2cs089@vgu.ac.in",
                        "ibpoffecial@gmail.com",
                        "ibpofficial@gmail.com"
                      ].includes(user.email.toLowerCase()))))
                        ? "Limit reached"
                        : "Ask Zen AI..."
                    }
                    disabled={(aiQueriesUsed >= (siteConfig?.aiUsageLimit ?? 10) && !((user?.email && [
                      "ishantpbupadhyay@gmail.com",
                      "25tec2cs089@vgu.ac.in",
                      "ibpoffecial@gmail.com",
                      "ibpofficial@gmail.com"
                    ].includes(user.email.toLowerCase())))) || aiLoading}
                    value={aiInputValue}
                    onChange={(e) => setAiInputValue(e.target.value)}
                    className="w-full bg-transparent px-3 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!aiInputValue.trim() || aiLoading || (aiQueriesUsed >= (siteConfig?.aiUsageLimit ?? 10) && !((user?.email && [
                      "ishantpbupadhyay@gmail.com",
                      "25tec2cs089@vgu.ac.in",
                      "ibpoffecial@gmail.com",
                      "ibpofficial@gmail.com"
                    ].includes(user.email.toLowerCase()))))}
                    className="p-2.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:from-teal-600 hover:to-teal-500 hover:text-white rounded-lg transition-all duration-200 cursor-pointer shrink-0 border-none shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
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

      {/* ─── SHOPPING CART SHEET ─── */}
      {cartOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setCartOpen(false)} />

          <div className="relative bg-white w-full max-w-sm h-full flex flex-col shadow-2xl border-l border-slate-200/50 animate-slide-left">

            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="w-4.5 h-4.5 text-slate-900" />
                <h4 className="font-black text-base text-slate-900 tracking-tight">Your Cart</h4>
                <span className="bg-slate-100 text-slate-650 text-[10px] font-black px-2 py-0.5 rounded-md">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-505 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-white space-y-4">
              {cart.length > 0 && cartInvoice.subtotal < 499 && (
                <div className="bg-teal-500/5 p-3.5 rounded-xl border border-teal-500/10 text-[10px] font-bold space-y-2 text-left">
                  <div className="flex justify-between text-slate-700">
                    <span>Add <strong className="text-slate-900">₹{(499 - cartInvoice.subtotal).toLocaleString()}</strong> more for free delivery</span>
                    <span>{Math.round((cartInvoice.subtotal / 499) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (cartInvoice.subtotal / 499) * 100)}%` }} />
                  </div>
                </div>
              )}

              {cart.length === 0 ? (
                <div className="text-center py-24 text-slate-500 font-medium text-xs space-y-3 flex flex-col items-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-1">
                    <ShoppingBag className="w-5 h-5 opacity-40" />
                  </div>
                  <p>Your shopping cart is empty</p>
                  <button onClick={() => setCartOpen(false)} className="text-teal-600 font-bold hover:underline cursor-pointer border-none bg-transparent">Continue shopping</button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="bg-white border border-slate-200/60 p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-all"
                      >
                        <img src={item.product.image} className="w-12 h-12 rounded-lg object-cover border border-slate-100 shrink-0 bg-slate-50" alt="" />
                        <div className="flex-1 min-w-0 text-left">
                          <h5 className="font-bold text-xs text-slate-900 truncate">{item.product.name}</h5>
                          <span className="text-[11px] text-slate-500 block mt-0.5 font-semibold">₹{item.product.price.toLocaleString()} each</span>
                        </div>

                        <div className="flex flex-col items-end gap-2.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.product.id)}
                            className="text-slate-400 hover:text-red-500 transition p-1 cursor-pointer bg-transparent border-none"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.product.id, -1)}
                              className="w-5 h-5 rounded-md hover:bg-white flex items-center justify-center transition cursor-pointer text-slate-600 border-none bg-transparent"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-[11px] font-black text-slate-900 min-w-[14px] text-center">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.product.id, 1)}
                              className="w-5 h-5 rounded-md hover:bg-white flex items-center justify-center transition cursor-pointer text-slate-600 border-none bg-transparent"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {(() => {
                    const bundleItem = getBundleSuggestion();
                    if (!bundleItem) return null;
                    return (
                      <div className="p-3.5 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-left space-y-2 animate-fade-up">
                        <span className="text-[9.5px] font-black uppercase tracking-widest text-indigo-650 block">Frequently Bought Together</span>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <img src={bundleItem.image} className="w-9 h-9 rounded-lg object-cover bg-slate-50 border" alt="" />
                            <div className="min-w-0">
                              <h6 className="font-extrabold text-[11px] text-slate-800 truncate max-w-[150px]">{bundleItem.name}</h6>
                              <span className="text-[10px] text-indigo-600 font-bold block">₹{bundleItem.price}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(bundleItem, false)}
                            className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border-none shadow-sm"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-white shrink-0 space-y-5 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
                <div className="space-y-2.5 text-xs font-semibold text-slate-650">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-slate-900 font-bold">₹{cartInvoice.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18%)</span>
                    <span className="text-slate-900 font-bold">₹{cartInvoice.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span className="text-teal-600 font-bold">{cartInvoice.deliveryFee === 0 ? "FREE" : `₹${cartInvoice.deliveryFee}`}</span>
                  </div>
                  <div className="border-t border-slate-100 my-3 pt-3 flex justify-between items-end">
                    <span className="font-bold text-slate-900 text-sm">Total</span>
                    <span className="text-xl font-black text-slate-900 tracking-tight">₹{cartInvoice.grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCartOpen(false);
                    handleOpenCartCheckout();
                  }}
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white py-4 rounded-xl font-black uppercase transition-all duration-200 cursor-pointer text-center block text-xs tracking-widest shadow-lg shadow-teal-500/20 hover:-translate-y-0.5 active:scale-[0.98] border-none"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── CHECKOUT MODAL ─── */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`bg-white w-full rounded-2xl overflow-hidden shadow-2xl relative transition-all duration-300 animate-fade-up ${orderPayment === "UPI QR" ? "max-w-[700px]" : "max-w-[420px]"
            }`}>
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-white/10 text-white relative flex justify-between items-center">
              <div>
                <h3 className="font-black text-base tracking-tight">Complete Order</h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Total to pay: <span className="text-teal-400">₹{activeInvoice.grandTotal.toLocaleString()}</span></p>
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
                <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-lg mb-1.5">Order Confirmed!</h4>
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
                    className="w-full bg-gradient-to-r from-slate-900 to-slate-800 text-white py-3.5 rounded-xl font-bold uppercase transition text-center text-xs tracking-widest shadow-sm hover:-translate-y-0.5"
                  >
                    Track Order
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutOpen(false);
                      setOrderSuccess(false);
                    }}
                    className="w-full bg-slate-50 hover:bg-slate-100 py-3.5 rounded-xl font-bold uppercase transition text-xs tracking-widest text-slate-700"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x border-slate-200 max-h-[85vh] overflow-y-auto">
                <form onSubmit={handlePlaceOrder} className="flex-1 p-6 space-y-4 text-xs font-medium">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <User className="w-3 h-3" /> Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={orderName}
                      onChange={(e) => setOrderName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-slate-900 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Phone className="w-3 h-3" /> Phone (10 Digits)
                    </label>
                    <input
                      type="tel"
                      required
                      value={orderPhone}
                      onChange={(e) => setOrderPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="9999011222"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-slate-900 transition-all font-semibold tracking-wide"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> Delivery Address
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={orderAddress}
                      onChange={(e) => setOrderAddress(e.target.value)}
                      placeholder="Flat, building, street, PIN code..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-slate-900 resize-none transition-all leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block flex items-center gap-1.5">
                      <Tag className="w-3 h-3" /> Coupon Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. SAVE10"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold uppercase tracking-wider text-slate-900 focus:border-teal-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 cursor-pointer border-none shadow-sm"
                      >
                        Apply
                      </button>
                    </div>
                    {appliedCoupon ? (
                      <p className="text-[10px] text-teal-650 font-bold flex items-center gap-1 mt-1 animate-pulse">
                        <Check className="w-3.5 h-3.5 text-teal-500" /> Coupon "{appliedCoupon.code}" applied! Saved ₹{activeInvoice.discount.toLocaleString()}
                      </p>
                    ) : couponError ? (
                      <p className="text-[10px] text-red-500 font-bold mt-1 animate-pulse">{couponError}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Payment Method</label>
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
                              ? "border-teal-500 bg-teal-50 text-teal-705 shadow-sm"
                              : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
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
                    <div className="space-y-2 bg-slate-50 p-4 border border-slate-200 rounded-xl animate-fade-up mt-3">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block">12-Digit Reference ID *</label>
                      <input
                        type="text"
                        required
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value.replace(/\D/g, "").slice(0, 12))}
                        placeholder="Enter exactly 12 digits"
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold outline-none text-slate-900 focus:border-teal-500 transition-all tracking-widest"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingOrder}
                    className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white py-4 mt-4 rounded-xl font-black uppercase transition-all shadow-lg shadow-teal-500/20 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer tracking-widest text-xs border-none"
                  >
                    {submittingOrder ? "Processing..." : `Place Order & Pay ₹${activeInvoice.grandTotal.toLocaleString()}`}
                  </button>
                </form>

                {orderPayment === "UPI QR" && (
                  <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-50 md:max-w-[280px] gap-5">
                    <div className="text-center space-y-1.5">
                      <span className="bg-gradient-to-r from-teal-600 to-teal-500 text-white text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm">
                        Secure UPI Payment
                      </span>
                      <p className="text-xs text-slate-600 font-medium">Scan to pay from any UPI app</p>
                    </div>

                    <div className="relative w-40 h-40 bg-white p-3 rounded-xl shadow-lg shadow-slate-200/50 border border-slate-100 flex items-center justify-center">
                      <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-teal-500 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-teal-500 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-teal-500 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-teal-500 rounded-br-lg"></div>

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
                        <div className="flex items-center justify-center bg-white border border-slate-200 py-2 px-3 rounded-xl gap-2 text-xs font-mono font-black text-slate-800 shadow-sm">
                          <span>{siteConfig.upiId}</span>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="text-slate-400 hover:text-teal-500 transition-colors p-1"
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
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-5 py-3.5 rounded-xl font-bold text-xs shadow-xl flex items-center gap-2 animate-fade-up">
          <CheckCircle className="w-4 h-4 text-teal-500" />
          {toast}
        </div>
      )}

      {/* ─── MOBILE FILTER SHEET ─── */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-955/60 backdrop-blur-sm sm:hidden flex items-end justify-center">
          <div className="bg-white w-full max-h-[85vh] overflow-y-auto rounded-t-2xl p-6 space-y-6 shadow-2xl border-t text-left">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-teal-500" /> Filter Options
              </h3>
              <button onClick={() => setFilterDrawerOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-transparent border-none">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-405 block">Category</span>
              <div className="grid grid-cols-2 gap-2">
                {categoriesList.map((cat) => {
                  const isSelected = selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.name);
                      }}
                      className={`px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${isSelected
                          ? "bg-gradient-to-r from-teal-600 to-teal-500 text-white border-none shadow-sm"
                          : "bg-slate-50 border text-slate-700 hover:bg-slate-100"
                        }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-405">Max Price</span>
                <span className="text-xs font-black text-slate-900">₹{maxPriceFilter.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="100"
                max={products.length > 0 ? Math.max(2000, ...products.map(p => p.price)) : 2000}
                step="50"
                value={Math.min(maxPriceFilter, products.length > 0 ? Math.max(2000, ...products.map(p => p.price)) : 2000)}
                onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
            </div>

            <button
              onClick={() => setFilterDrawerOpen(false)}
              className="w-full bg-gradient-to-r from-slate-900 to-slate-800 text-white py-3 rounded-xl font-extrabold text-xs uppercase tracking-widest active:scale-95 transition-all border-none cursor-pointer shadow-sm"
            >
              Apply Filters            </button>
          </div>
        </div>
      )}

      {/* ─── RECENTLY VIEWED ─── */}
      {!selectedProduct && recentlyViewedIds.length > 0 && (
        <section className="max-w-7xl mx-auto w-full px-5 sm:px-8 py-10 animate-fade-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-500" /> Recently Viewed
            </h3>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Your browsing history</span>
          </div>
          <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-4 -mx-5 px-5 sm:mx-0 sm:px-0">
            {products
              .filter(p => recentlyViewedIds.includes(p.id))
              .slice(0, 6)
              .map(prod => (
                <div
                  key={prod.id}
                  onClick={() => {
                    setSelectedProduct(prod);
                    setSelectedImageIdx(0);
                    setDetailQty(1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="min-w-[180px] bg-white/80 backdrop-blur-md p-4 rounded-xl border border-slate-200/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer text-left space-y-3 shrink-0 group"
                >
                  <div className="h-28 bg-slate-50 rounded-lg overflow-hidden relative">
                    <img src={prod.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                    <span className="absolute top-2 left-2 bg-gradient-to-r from-teal-600 to-teal-500 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                      ₹{prod.price}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 line-clamp-1">{prod.name}</h4>
                  <span className="text-[10px] text-amber-550 font-bold block">★ {prod.rating || 4.5}</span>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ─── COMPARE MODAL ─── */}
      {compareOpen && (
        <div className="fixed inset-0 z-[220] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl p-6 space-y-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto border">
            <div className="flex justify-between items-center border-b pb-3 text-left">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-teal-500" /> Compare Products ({compareIds.length})
              </h3>
              <button onClick={() => setCompareOpen(false)} className="text-slate-400 hover:text-slate-655 p-1 cursor-pointer bg-transparent border-none">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x border-slate-200">
              <div className="space-y-6 hidden md:block pt-32 text-xs font-black text-slate-405 uppercase tracking-widest leading-relaxed text-left pl-2">
                <div className="h-10">Name</div>
                <div className="h-6">Category</div>
                <div className="h-6">Price</div>
                <div className="h-6">Rating</div>
                <div className="h-12">Stock Status</div>
                <div className="pt-2">Actions</div>
              </div>

              {products
                .filter(p => compareIds.includes(p.id))
                .map(prod => (
                  <div key={prod.id} className="p-4 space-y-6 text-left">
                    <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden shadow-sm">
                      <img src={prod.image} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="text-xs font-bold space-y-6">
                      <div className="h-10 font-black text-slate-900 leading-tight line-clamp-2">{prod.name}</div>
                      <div className="h-6 font-semibold uppercase tracking-wider text-slate-500">{prod.category}</div>
                      <div className="h-6 text-teal-600 font-black text-sm">₹{prod.price}</div>
                      <div className="h-6 text-amber-500">★ {prod.rating || 4.5}</div>
                      <div className="h-12">
                        {prod.stock > 0 ? (
                          <span className="bg-teal-50 text-teal-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">In Stock ({prod.stock})</span>
                        ) : (
                          <span className="bg-red-50 text-red-500 px-2 py-0.5 rounded text-[10px] font-black uppercase">Out of Stock</span>
                        )}
                      </div>
                      <div className="pt-2 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            handleAddToCart(prod);
                            setCompareOpen(false);
                          }}
                          disabled={prod.stock <= 0}
                          className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white py-2 rounded-lg font-bold text-xs uppercase tracking-wide cursor-pointer border-none shadow-sm"
                        >
                          Add to Cart
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompareIds(prev => prev.filter(id => id !== prod.id))}
                          className="w-full bg-slate-50 hover:bg-slate-100 py-2 rounded-lg font-bold text-xs text-red-500 uppercase tracking-wide cursor-pointer border-none"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── FLOATING COMPARE BUTTON ─── */}
      {!selectedProduct && compareIds.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[140] bg-gradient-to-r from-slate-900 to-slate-800 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-4 animate-fade-up border border-white/10">
          <span className="text-xs font-black uppercase tracking-wider">{compareIds.length} items selected</span>
          <button
            type="button"
            onClick={() => setCompareOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-none shadow-sm"
          >
            Compare
          </button>
          <button
            type="button"
            onClick={() => setCompareIds([])}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white cursor-pointer border-none bg-transparent"
          >
            Clear
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}