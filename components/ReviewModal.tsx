"use client";

import React, { useState } from "react";
import { Star, X } from "lucide-react";
import { doc, getDoc, updateDoc, collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerId: string;
  onReviewSubmitted: () => void;
}

export default function ReviewModal({ isOpen, onClose, workerId, onReviewSubmitted }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !comment) return;

    setSubmitting(true);
    try {
      // 1. Add review doc under collections/reviews
      const reviewData = {
        workerId,
        userName: name,
        rating,
        comment,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "reviews"), reviewData);

      // 2. Fetch all reviews for this worker to recalculate rating
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

      // 3. Update worker doc stars and review count
      const workerRef = doc(db, "workers", workerId);
      const workerSnap = await getDoc(workerRef);
      if (workerSnap.exists()) {
        await updateDoc(workerRef, {
          stars: averageRating,
          reviewsCount: count,
          lastScoreUpdate: new Date().toISOString()
        });
      }

      setName("");
      setComment("");
      setRating(5);
      onReviewSubmitted();
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-[440px] rounded-[2rem] overflow-hidden shadow-float relative border border-slate-100 animate-fade-up">
        
        {/* Header decoration */}
        <div className="h-28 w-full bg-gradient-to-br from-primary-50 to-slate-50 relative overflow-hidden flex items-end px-8 pb-4">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white shadow-sm text-slate-400 flex items-center justify-center hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="relative z-10">
            <h3 className="font-extrabold text-2xl text-slate-900 tracking-tight">Write a Trust Report</h3>
            <p className="text-[12px] text-slate-500 font-semibold mt-0.5">Share your feedback to guide others</p>
          </div>
        </div>

        {/* Form area */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* Star selector */}
          <div className="flex flex-col items-center gap-2 pb-2">
            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Your Rating</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((num) => {
                const isLit = hoverRating !== null ? num <= hoverRating : num <= rating;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRating(num)}
                    onMouseEnter={() => setHoverRating(num)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star 
                      className={`w-8 h-8 ${
                        isLit ? "fill-gold text-gold" : "text-slate-200"
                      }`} 
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Your Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white transition text-[15px] font-semibold text-slate-900 placeholder-slate-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Detailed Comment</label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe your experience with this professional..."
              className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white transition text-[15px] font-semibold text-slate-900 placeholder-slate-400 resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-[15px] hover:bg-slate-800 disabled:bg-slate-400 transition shadow-[0_8px_20px_rgba(15,23,42,0.15)] flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? "Submitting..." : "Submit Trust Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
