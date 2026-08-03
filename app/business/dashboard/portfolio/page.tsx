"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProPortfolioAlbum } from "@/lib/schema";
import { createPortfolioAlbum, updatePortfolioAlbum } from "@/lib/proSuite";
import {
  Image as ImageIcon,
  Plus,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Eye,
  CheckCircle2,
  X,
  Upload,
  Video,
  Layers,
  Sparkles
} from "lucide-react";

export default function ProPortfolioPage() {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<ProPortfolioAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Interior Design");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [cost, setCost] = useState("");
  const [duration, setDuration] = useState("");
  const [beforeUrl, setBeforeUrl] = useState("");
  const [afterUrl, setAfterUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState("5");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [submitting, setSubmitting] = useState(false);

  // Sync Albums
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "pro_portfolio_albums"),
      where("professionalId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: ProPortfolioAlbum[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ProPortfolioAlbum));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setAlbums(list);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setSubmitting(true);
    try {
      const beforeAfterPairs = [];
      if (beforeUrl.trim() && afterUrl.trim()) {
        beforeAfterPairs.push({
          id: `pair_${Date.now()}`,
          beforeUrl: beforeUrl.trim(),
          afterUrl: afterUrl.trim(),
          caption: "Before & After Transformation"
        });
      }

      await createPortfolioAlbum({
        professionalId: user.uid,
        title: title.trim(),
        category,
        description: description.trim(),
        location: location.trim(),
        cost: parseFloat(cost) || 0,
        duration: duration.trim(),
        beforeAfterPairs,
        videoUrls: videoUrl.trim() ? [videoUrl.trim()] : [],
        rating: parseFloat(rating) || 5,
        reviewText: reviewText.trim() || undefined,
        status
      });

      setModalOpen(false);
      setTitle("");
      setDescription("");
      setLocation("");
      setCost("");
      setDuration("");
      setBeforeUrl("");
      setAfterUrl("");
      setVideoUrl("");
      setReviewText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (album: ProPortfolioAlbum) => {
    const nextStatus = album.status === "published" ? "draft" : "published";
    try {
      await updatePortfolioAlbum(album.id, { status: nextStatus });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            <span>Portfolio Manager</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Showcase before/after transformations, project costs, video walkthroughs, and client ratings on your profile
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Project Album</span>
        </button>
      </div>

      {/* Album Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Loading portfolio albums...</div>
      ) : albums.length === 0 ? (
        <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Portfolio Albums Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create project showcase albums with before/after photos and project metrics to build client trust.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {albums.map((album) => (
            <div
              key={album.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Before / After Preview */}
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  {album.beforeAfterPairs && album.beforeAfterPairs.length > 0 ? (
                    <div className="grid grid-cols-2 h-full gap-0.5">
                      <div className="relative h-full">
                        <img
                          src={album.beforeAfterPairs[0].beforeUrl}
                          className="w-full h-full object-cover"
                          alt="Before"
                        />
                        <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Before
                        </span>
                      </div>
                      <div className="relative h-full">
                        <img
                          src={album.beforeAfterPairs[0].afterUrl}
                          className="w-full h-full object-cover"
                          alt="After"
                        />
                        <span className="absolute top-2 right-2 bg-emerald-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                          After
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      No Media Uploaded
                    </div>
                  )}

                  <span
                    className={`absolute bottom-2 left-2 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-xs ${
                      album.status === "published"
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-700 text-slate-200"
                    }`}
                  >
                    {album.status}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">{album.title}</h3>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold uppercase">
                      {album.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2">{album.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-slate-800">₹{album.cost?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{album.duration}</span>
                    </div>
                    {album.location && (
                      <div className="flex items-center gap-1 col-span-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{album.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{album.rating || "5.0"}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleTogglePublish(album)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    album.status === "published"
                      ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      : "bg-blue-600 text-white hover:bg-blue-500"
                  }`}
                >
                  {album.status === "published" ? "Unpublish" : "Publish to Profile"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Album */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>Create Project Album</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlbum} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Album Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Modern Minimalist Villa Renovation"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Interior Design">Interior Design</option>
                    <option value="House Construction">House Construction</option>
                    <option value="Modular Kitchen">Modular Kitchen</option>
                    <option value="Civil Renovation">Civil Renovation</option>
                    <option value="Commercial Office">Commercial Office</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Golf Course Road, Gurgaon"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Cost (₹)</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="e.g. 1250000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 45 Days"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of work scope, materials used, architectural highlights..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Before & After Photo Links */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800">Before & After Photo Pair</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="url"
                    value={beforeUrl}
                    onChange={(e) => setBeforeUrl(e.target.value)}
                    placeholder="Before Image URL"
                    className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                  <input
                    type="url"
                    value={afterUrl}
                    onChange={(e) => setAfterUrl(e.target.value)}
                    placeholder="After Image URL"
                    className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Walkthrough Video Link (Optional)</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs"
                >
                  {submitting ? "Publishing..." : "Create Album"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
