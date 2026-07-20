"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, getDocs, collection, addDoc, query, where, limit } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import {
  CheckCircle,
  Award,
  Star,
  Zap,
  Wrench,
  Sparkles,
  Phone,
  MessageSquare,
  MapPin,
  FileText,
  Send,
  Upload,
  ShieldCheck,
  ArrowLeft,
  X,
  Plus,
  ChevronRight,
  ChevronLeft,
  Camera,
  Home,
  User,
  Calendar,
  Clock,
  DollarSign,
  ClipboardList,
  Image,
  Paperclip,
  AlertCircle
} from "lucide-react";

export default function ProfileInquiryPage() {
  const routeParams = useParams();
  const slug = routeParams?.slug as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedService = searchParams?.get("service") || "";

  const { user, userData, openAuthModal, loading: authLoading } = useAuth();

  const [worker, setWorker] = useState<any>(null);
  const [workerId, setWorkerId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Inquiry steps: 1. Service, 2. Location & Details, 3. Photos, 4. Confirm
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [wizardService, setWizardService] = useState("");
  const [wizardCustomService, setWizardCustomService] = useState("");
  const [wizardAddress, setWizardAddress] = useState("");
  const [wizardPhone, setWizardPhone] = useState("");
  const [wizardProblemDesc, setWizardProblemDesc] = useState("");
  const [wizardPhotos, setWizardPhotos] = useState<string[]>([]);

  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Load Worker details by slug
  useEffect(() => {
    if (!slug) return;
    async function fetchWorker() {
      try {
        setLoading(true);
        const workersQuery = query(
          collection(db, "workers"),
          where("slug", "==", slug),
          limit(1)
        );
        const querySnap = await getDocs(workersQuery);

        if (!querySnap.empty) {
          const docId = querySnap.docs[0].id;
          const workerData = querySnap.docs[0].data();
          setWorker({ id: docId, ...workerData });
          setWorkerId(docId);
        } else {
          const docRef = doc(db, "workers", slug);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setWorker({ id: docSnap.id, ...docSnap.data() });
            setWorkerId(docSnap.id);
          }
        }
      } catch (err) {
        console.error("Error loading professional:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchWorker();
  }, [slug]);

  useEffect(() => {
    if (preSelectedService) {
      setWizardService(preSelectedService);
      setWizardCustomService("");
    }
  }, [preSelectedService]);

  useEffect(() => {
    if (userData?.phone) {
      setWizardPhone(userData.phone);
    }
  }, [userData]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingPhotos(true);
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          let fileToUpload: Blob | File = file;
          if (file.type.startsWith("image/")) {
            try {
              const { compressImageToBlob } = await import("@/lib/imageUtils");
              fileToUpload = await compressImageToBlob(file, 1200, 0.8, 250);
            } catch (err) {
              console.error("Image compression failed", err);
            }
          }
          const fileExtension = file.name.split(".").pop() || "jpg";
          const storageRef = ref(storage, `inquiry_photos/${user?.uid || "guest"}/${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${fileExtension}`);
          await uploadBytes(storageRef, fileToUpload);
          return await getDownloadURL(storageRef);
        })
      );
      setWizardPhotos((prev) => [...prev, ...urls]);
    } catch (err) {
      console.error("Photo upload failed:", err);
      alert("Failed to upload photos. Please try again.");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setWizardPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitInquiry = async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    setSubmitting(true);
    try {
      const selectedService = wizardService || wizardCustomService || "General Consultation";
      const payload = {
        workerId: worker.id,
        workerName: worker.name,
        customerName: userData?.name || "Customer",
        customerId: user.uid,
        customerEmail: user.email || "",
        customerPhone: wizardPhone,
        serviceTitle: selectedService,
        date: "Flexible",
        time: "Flexible",
        address: wizardAddress,
        description: wizardProblemDesc,
        photos: wizardPhotos,
        status: "Pending",
        amount: 0,
        price: 0,
        type: "Inquiry",
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "bookings"), payload);

      await addDoc(collection(db, "notifications"), {
        userId: worker.id,
        title: "New Project Inquiry",
        text: `Client ${userData?.name || "User"} sent you a new project inquiry: "${selectedService}"`,
        read: false,
        createdAt: new Date().toISOString()
      });

      alert(`Project inquiry submitted successfully! Direct connection established with ${worker.name}.`);
      router.push("/dashboard");
    } catch (err) {
      console.error("Inquiry submission failed:", err);
      alert("Failed to submit inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  if (!worker) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col justify-between">
        <Navbar />
        <main className="max-w-md mx-auto px-6 py-32 text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 flex items-center justify-center mx-auto shadow-xl">
            <X className="w-10 h-10 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Professional Not Found</h1>
          <p className="text-slate-500 text-sm">The profile you're looking for doesn't exist or has been removed.</p>
          <Link href="/services" className="inline-block bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl">
            Browse Professionals
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col justify-between">
        <Navbar />
        <main className="max-w-md mx-auto px-6 py-32 text-center space-y-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 flex items-center justify-center mx-auto shadow-xl">
            <ShieldCheck className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Start Your Project</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Sign in to submit your project inquiry and get connected with <span className="font-semibold text-slate-900">{worker.name}</span>
          </p>
          <button
            onClick={() => openAuthModal()}
            className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white py-4 rounded-xl font-semibold shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <User className="w-5 h-5" />
            Sign In to Continue
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-4xl">

          {/* Back Button */}
          <div className="mb-6">
            <Link
              href={`/${slug}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-slate-400 transition-all shadow-sm">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span>Back to Profile</span>
            </Link>
          </div>

          {/* Main Card - Like a Modal/Popup */}
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={worker.avatar}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
                    alt={worker.name}
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg tracking-tight">New Project Inquiry</h2>
                  <p className="text-slate-400 text-sm">
                    Working with <span className="text-white font-semibold">{worker.name}</span>
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-xl">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4].map((num) => (
                    <div
                      key={num}
                      className={`w-2 h-2 rounded-full transition-all ${num < step ? 'bg-emerald-400' :
                          num === step ? 'bg-white w-4' : 'bg-white/30'
                        }`}
                    />
                  ))}
                </div>
                <span className="text-white/70 text-xs font-medium ml-2">
                  Step {step} of 4
                </span>
              </div>
            </div>

            {/* Progress Steps - Desktop */}
            <div className="hidden sm:flex px-8 py-4 bg-slate-50/80 border-b border-slate-100">
              <div className="flex items-center justify-between w-full">
                {[
                  { num: 1, label: "Service", icon: ClipboardList },
                  { num: 2, label: "Details", icon: MapPin },
                  { num: 3, label: "Photos", icon: Image },
                  { num: 4, label: "Review", icon: CheckCircle }
                ].map((s) => (
                  <div key={s.num} className="flex items-center gap-3">
                    <div className={`flex items-center gap-2.5 ${step >= s.num ? 'text-slate-900' : 'text-slate-400'}`}>
                      <div className={`
                        w-9 h-9 rounded-xl flex items-center justify-center transition-all
                        ${step === s.num ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' :
                          step > s.num ? 'bg-emerald-100 text-emerald-600' :
                            'bg-slate-100 text-slate-400'}
                      `}>
                        {step > s.num ? <CheckCircle className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                      </div>
                      <span className={`text-xs font-medium ${step === s.num ? 'text-slate-900' : 'text-slate-400'}`}>
                        {s.label}
                      </span>
                    </div>
                    {s.num < 4 && (
                      <ChevronRight className={`w-4 h-4 ${step > s.num ? 'text-emerald-400' : 'text-slate-300'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Progress */}
            <div className="sm:hidden px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Step {step} of 4
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map((num) => (
                  <div
                    key={num}
                    className={`h-1.5 rounded-full transition-all ${num < step ? 'bg-emerald-400 w-6' :
                        num === step ? 'bg-slate-900 w-8' : 'bg-slate-200 w-4'
                      }`}
                  />
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="p-8 max-h-[500px] overflow-y-auto">

              {/* STEP 1: SERVICE */}
              {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Choose Your Service</h3>
                      <p className="text-xs text-slate-500">Select a service package or describe your custom needs</p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {(worker.marketplaceItems && worker.marketplaceItems.length > 0
                      ? worker.marketplaceItems
                      : [
                        { id: "default-1", title: `${worker.category || "Service"} Consultation`, description: "Initial review, diagnostics, and planning session" },
                        { id: "default-2", title: "Full Project Execution", description: "End-to-end management, sourcing, and delivery" }
                      ]
                    ).map((pkg: any) => (
                      <div
                        key={pkg.id || pkg.title}
                        onClick={() => {
                          setWizardService(pkg.title);
                          setWizardCustomService("");
                        }}
                        className={`
                          p-4 rounded-2xl border-2 cursor-pointer transition-all
                          ${wizardService === pkg.title
                            ? "border-slate-900 bg-slate-50 shadow-md"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`
                            w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                            ${wizardService === pkg.title ? "border-slate-900 bg-slate-900" : "border-slate-300"}
                          `}>
                            {wizardService === pkg.title && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 text-sm">{pkg.title}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">{pkg.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-3 bg-white text-slate-400 font-medium">or</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Describe Your Custom Needs</label>
                    <input
                      type="text"
                      value={wizardCustomService}
                      onChange={(e) => {
                        setWizardCustomService(e.target.value);
                        setWizardService("");
                      }}
                      placeholder="e.g. Design blueprint for a 3-bedroom villa"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 text-sm focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: DETAILS */}
              {step === 2 && (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Location & Details</h3>
                      <p className="text-xs text-slate-500">Provide your project address and contact information</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-medium text-slate-600">Project Address <span className="text-red-500">*</span></label>
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition((pos) => {
                                setWizardAddress(`GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
                              });
                            }
                          }}
                          className="text-[10px] font-medium text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" />
                          Use Current Location
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        required
                        value={wizardAddress}
                        onChange={(e) => setWizardAddress(e.target.value)}
                        placeholder="Enter your full project address..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 text-sm focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600">Phone Number <span className="text-red-500">*</span></label>
                      <input
                        type="tel"
                        required
                        value={wizardPhone}
                        onChange={(e) => setWizardPhone(e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 text-sm focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600">Project Notes</label>
                      <textarea
                        rows={3}
                        value={wizardProblemDesc}
                        onChange={(e) => setWizardProblemDesc(e.target.value)}
                        placeholder="Describe your requirements, preferences, or any specific details..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 text-sm focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: PHOTOS */}
              {step === 3 && (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <Image className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Upload Files</h3>
                      <p className="text-xs text-slate-500">Add photos, blueprints, or documents for reference</p>
                    </div>
                  </div>

                  <div
                    className={`
                      border-2 border-dashed rounded-2xl p-8 text-center transition-all
                      ${isDragging ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}
                      ${wizardPhotos.length > 0 ? 'bg-slate-50/50' : 'bg-white'}
                    `}
                    onDragEnter={() => setIsDragging(true)}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const files = Array.from(e.dataTransfer.files);
                      if (files.length) {
                        const input = document.getElementById('inquiryPhotosInput') as HTMLInputElement;
                        const dt = new DataTransfer();
                        files.forEach(f => dt.items.add(f));
                        input.files = dt.files;
                        input.dispatchEvent(new Event('change'));
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">Drop files here or click to browse</p>
                        <p className="text-xs text-slate-400 mt-0.5">Supports images, PDFs, and documents</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="inquiryPhotosInput"
                        disabled={uploadingPhotos}
                      />
                      <label
                        htmlFor="inquiryPhotosInput"
                        className={`
                          inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all
                          ${uploadingPhotos ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20'}
                        `}
                      >
                        {uploadingPhotos ? (
                          <>
                            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Choose Files
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {wizardPhotos.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-3">
                        {wizardPhotos.length} file{wizardPhotos.length > 1 ? 's' : ''} uploaded
                      </p>
                      <div className="grid grid-cols-4 gap-3">
                        {wizardPhotos.map((img, idx) => {
                          const isPdf = img.includes(".pdf") || img.includes(".doc");
                          return (
                            <div key={idx} className="relative group">
                              <div className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                {isPdf ? (
                                  <div className="w-full h-full flex items-center justify-center bg-red-50">
                                    <FileText className="w-8 h-8 text-red-500" />
                                  </div>
                                ) : (
                                  <img src={img} className="w-full h-full object-cover" alt="" />
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(idx)}
                                className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: REVIEW */}
              {step === 4 && (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Review & Submit</h3>
                      <p className="text-xs text-slate-500">Verify your inquiry details before submitting</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl border border-slate-200 divide-y divide-slate-200 overflow-hidden">
                    <div className="p-4 flex justify-between items-center">
                      <span className="text-xs text-slate-500">Professional</span>
                      <span className="text-sm font-semibold text-slate-900">{worker.name}</span>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                      <span className="text-xs text-slate-500">Service</span>
                      <span className="text-sm font-semibold text-indigo-600 text-right max-w-[200px] break-words">
                        {wizardService || wizardCustomService || "General Inquiry"}
                      </span>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                      <span className="text-xs text-slate-500">Contact</span>
                      <span className="text-sm font-medium text-slate-900">{wizardPhone}</span>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                      <span className="text-xs text-slate-500">Address</span>
                      <span className="text-sm font-medium text-slate-900 text-right max-w-[200px] break-words">{wizardAddress}</span>
                    </div>
                    {wizardProblemDesc && (
                      <div className="p-4">
                        <span className="text-xs text-slate-500 block mb-1">Project Notes</span>
                        <p className="text-sm text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                          {wizardProblemDesc}
                        </p>
                      </div>
                    )}
                    {wizardPhotos.length > 0 && (
                      <div className="p-4">
                        <span className="text-xs text-slate-500 block mb-2">Attachments ({wizardPhotos.length})</span>
                        <div className="flex gap-2">
                          {wizardPhotos.slice(0, 4).map((img, idx) => (
                            <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
                              {img.includes(".pdf") ? (
                                <div className="w-full h-full flex items-center justify-center bg-red-50">
                                  <FileText className="w-5 h-5 text-red-500" />
                                </div>
                              ) : (
                                <img src={img} className="w-full h-full object-cover" alt="" />
                              )}
                            </div>
                          ))}
                          {wizardPhotos.length > 4 && (
                            <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-500">
                              +{wizardPhotos.length - 4}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <AlertCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-indigo-900">No payment required</p>
                      <p className="text-xs text-indigo-700/70 mt-0.5">
                        This is a project inquiry. {worker.name} will review your request and provide a quote.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Actions */}
            <div className="px-8 py-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((prev) => (prev - 1) as any)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-medium text-sm text-slate-600 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1 && !wizardService && !wizardCustomService) {
                      alert("Please select a service or describe your custom needs.");
                      return;
                    }
                    if (step === 2 && (!wizardAddress || !wizardPhone)) {
                      alert("Please provide your project address and contact number.");
                      return;
                    }
                    setStep((prev) => (prev + 1) as any);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all shadow-lg shadow-slate-900/20"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmitInquiry}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-semibold text-sm transition-all shadow-xl shadow-slate-900/30 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Inquiry
                    </>
                  )}
                </button>
              )}
            </div>

          </div>

          {/* Trust Badge */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Secure & Private</span>
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Response within 24h</span>
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>No commitment</span>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}