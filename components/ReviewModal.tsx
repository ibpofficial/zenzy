"use client";

import React, { useState, useRef, useEffect } from "react";
import { Star, X, Check, User, MessageSquare, Sparkles, ThumbsUp } from "lucide-react";
import { doc, getDoc, updateDoc, collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerId: string;
  onReviewSubmitted: () => void;
  workerName?: string;
}

export default function ReviewModal({
  isOpen,
  onClose,
  workerId,
  onReviewSubmitted,
  workerName
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setComment("");
      setRating(0);
      setIsSubmitted(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim() || rating === 0) return;

    setSubmitting(true);
    try {
      const reviewData = {
        workerId,
        userName: name.trim(),
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, "reviews"), reviewData);

      const reviewsSnapshot = await getDocs(collection(db, "reviews"));
      let totalRating = rating;
      let count = 1;

      reviewsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.workerId === workerId) {
          totalRating += data.rating;
          count += 1;
        }
      });

      const averageRating = parseFloat((totalRating / count).toFixed(1));

      const workerRef = doc(db, "workers", workerId);
      const workerSnap = await getDoc(workerRef);
      if (workerSnap.exists()) {
        await updateDoc(workerRef, {
          stars: averageRating,
          reviewsCount: count,
          lastScoreUpdate: new Date().toISOString()
        });
      }

      setIsSubmitted(true);
      setTimeout(() => {
        setName("");
        setComment("");
        setRating(0);
        setIsSubmitted(false);
        onReviewSubmitted();
        onClose();
      }, 2000);

    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const ratingLabels = [
    "Terrible",
    "Poor",
    "Average",
    "Good",
    "Excellent"
  ];

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        className="bg-white w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Premium Header - Compact */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 pt-5 pb-4">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-400/20 to-transparent rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-blue-400/10 to-transparent rounded-full blur-xl" />

          <button
            onClick={handleClose}
            type="button"
            disabled={submitting}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm text-white/60 hover:text-white hover:bg-white/20 transition-all duration-200 flex items-center justify-center group ${submitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            aria-label="Close modal"
          >
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
          </button>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 bg-white/10 backdrop-blur-sm rounded-lg">
                <Sparkles className="w-4 h-4 text-primary-400" />
              </div>
              <span className="text-[10px] font-semibold text-primary-300 uppercase tracking-wider">
                Share Experience
              </span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Write a Review
            </h3>
            {workerName && (
              <p className="text-xs text-white/60 mt-0.5">
                for <span className="text-white font-medium">{workerName}</span>
              </p>
            )}
          </div>
        </div>

        {/* Form Area - Compact Spacing */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Rating Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Your Rating
              </label>
              {rating > 0 && (
                <span className="text-xs font-bold text-primary-600 animate-in fade-in duration-200">
                  {ratingLabels[rating - 1]}
                </span>
              )}
            </div>

            <div className="flex items-center gap-0.5 justify-between bg-slate-50 rounded-xl p-1.5">
              {[1, 2, 3, 4, 5].map((num) => {
                const isLit = hoverRating !== null ? num <= hoverRating : num <= rating;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRating(num)}
                    onMouseEnter={() => setHoverRating(num)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="flex-1 py-1.5 px-1 rounded-lg transition-all duration-150 hover:bg-white/50 group"
                    aria-label={`Rate ${num} stars`}
                  >
                    <Star
                      className={`w-6 h-6 mx-auto transition-all duration-150 ${isLit
                        ? "fill-amber-400 text-amber-400 scale-110"
                        : "text-slate-300 group-hover:text-slate-400"
                        }`}
                    />
                  </button>
                );
              })}
            </div>

            {rating === 0 && (
              <p className="text-[10px] text-red-400 font-medium animate-in fade-in duration-200">
                Please select a rating
              </p>
            )}
          </div>

          {/* Name Input - Compact */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3 h-3" />
              Your Name
            </label>
            <input
              ref={nameInputRef}
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Comment Input - Compact */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" />
              Your Review
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all text-sm text-slate-900 placeholder:text-slate-400 resize-none"
            />
            <div className="flex justify-end">
              <span className="text-[10px] text-slate-400">
                {comment.length} chars
              </span>
            </div>
          </div>

          {/* Submit Button - Compact */}
          <button
            type="submit"
            disabled={submitting || rating === 0 || !name.trim() || !comment.trim()}
            className="w-full bg-gradient-to-r from-slate-900 to-slate-800 text-white py-3 rounded-xl font-semibold text-sm hover:from-slate-800 hover:to-slate-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 group"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : isSubmitted ? (
              <>
                <Check className="w-4 h-4" />
                Submitted!
              </>
            ) : (
              "Submit Review"
            )}
          </button>

          {/* Trust Badge - Compact */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <div className="flex items-center gap-1.5">
              <ThumbsUp className="w-3 h-3 text-green-500" />
              <span className="text-[10px] text-slate-400">100% Anonymous</span>
            </div>
            <span className="w-px h-3 bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-green-500" />
              <span className="text-[10px] text-slate-400">Trusted Reviews</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}