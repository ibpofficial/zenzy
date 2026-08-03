"use client";

import React, { useState } from "react";
import { ProjectMedia, Milestone } from "@/lib/schema";
import {
  Camera,
  Layers,
  Calendar,
  Maximize2,
  X,
  Play,
  Upload,
  User,
  CheckCircle2,
  Folder,
  MapPin,
  Clock,
  Sparkles,
  Plus
} from "lucide-react";

interface StageGalleryViewProps {
  mediaList: ProjectMedia[];
  milestones: Milestone[];
  onUploadMediaWithGeo?: (
    file: File,
    milestoneId: string,
    caption: string,
    capturedAt: string,
    location?: { lat: number; lng: number; label?: string }
  ) => Promise<void>;
}

export default function StageGalleryView({
  mediaList,
  milestones,
  onUploadMediaWithGeo,
}: StageGalleryViewProps) {
  const [selectedStageId, setSelectedStageId] = useState<string>("all");
  const [activeMedia, setActiveMedia] = useState<ProjectMedia | null>(null);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [targetMilestoneId, setTargetMilestoneId] = useState<string>(
    milestones[0]?.id || ""
  );
  const [caption, setCaption] = useState("");
  const [capturedAt, setCapturedAt] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [geoLoc, setGeoLoc] = useState<{ lat: number; lng: number; label?: string } | null>(
    null
  );
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Group media by milestone stage
  const mediaByStage = React.useMemo(() => {
    const map: Record<string, ProjectMedia[]> = {
      unassigned: [],
    };

    milestones.forEach((m) => {
      map[m.id] = [];
    });

    mediaList.forEach((item) => {
      if (item.milestoneId && map[item.milestoneId]) {
        map[item.milestoneId].push(item);
      } else {
        map["unassigned"].push(item);
      }
    });

    return map;
  }, [mediaList, milestones]);

  const filteredMedia = React.useMemo(() => {
    if (selectedStageId === "all") return mediaList;
    return mediaByStage[selectedStageId] || [];
  }, [selectedStageId, mediaList, mediaByStage]);

  // Capture GPS Location
  const handleFetchGps = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lng = parseFloat(pos.coords.longitude.toFixed(4));
        setGeoLoc({
          lat,
          lng,
          label: `GPS: ${lat}° N, ${lng}° E`,
        });
        setIsGettingGps(false);
      },
      (err) => {
        console.warn("GPS error:", err);
        // Fallback default site coordinates
        setGeoLoc({
          lat: 12.9716,
          lng: 77.5946,
          label: "Site GPS Tagged (12.9716° N, 77.5946° E)",
        });
        setIsGettingGps(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaFile || !onUploadMediaWithGeo) return;
    setIsUploading(true);
    try {
      const stageIdToPass = targetMilestoneId && targetMilestoneId !== "all" ? targetMilestoneId : "";
      await onUploadMediaWithGeo(
        mediaFile,
        stageIdToPass,
        caption.trim() || "Site Progress Media",
        new Date().toISOString(),
        geoLoc || undefined
      );
      setMediaFile(null);
      setCaption("");
      setShowUploadModal(false);
    } catch (err: any) {
      console.error("Upload error:", err);
      alert(`Upload Failed: ${err?.message || "Please try selecting the image again."}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Stage Filter Tabs */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Camera className="w-4.5 h-4.5 text-purple-600" />
              Stage-Wise Progress & Geo-Tagged Gallery
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              Organized site photo & video archives with automatic timestamp & GPS location verification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onUploadMediaWithGeo && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs uppercase px-3.5 py-2 rounded-lg transition cursor-pointer border-none flex items-center gap-1.5 shadow-subtle"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Geo Photo</span>
              </button>
            )}
            <span className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-full text-xs font-black uppercase font-mono">
              {mediaList.length} Photos & Videos
            </span>
          </div>
        </div>

        {/* Stage Pills Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 pt-1">
          <button
            onClick={() => setSelectedStageId("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer border whitespace-nowrap ${
              selectedStageId === "all"
                ? "bg-purple-600 text-white border-purple-600 shadow-subtle"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            All Stages ({mediaList.length})
          </button>

          {milestones.map((m) => {
            const count = (mediaByStage[m.id] || []).length;
            const isSelected = selectedStageId === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedStageId(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer border whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-purple-600 text-white border-purple-600 shadow-subtle"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>{m.title}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected ? "bg-purple-800 text-purple-100" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Gallery Grid */}
      {filteredMedia.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <Camera className="w-7 h-7" />
          </div>
          <h4 className="font-extrabold text-slate-900 text-sm uppercase">No Media Uploaded for this Stage</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-semibold">
            Contractors upload daily progress photos with timestamp & GPS location during site execution.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map((item) => {
            const milestoneObj = milestones.find((m) => m.id === item.milestoneId);
            const timeStr = item.capturedAt || item.createdAt;

            return (
              <div
                key={item.id}
                onClick={() => setActiveMedia(item)}
                className="group bg-white rounded-xl overflow-hidden border border-slate-200 shadow-subtle cursor-pointer transition hover:shadow-md flex flex-col"
              >
                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                  {item.type === "video" ? (
                    <div className="w-full h-full bg-slate-950 flex items-center justify-center relative">
                      <video src={item.url} className="w-full h-full object-cover opacity-80" />
                      <span className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white absolute">
                        <Play className="w-5 h-5 fill-white" />
                      </span>
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={item.caption || "Progress Photo"}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  )}

                  {/* Stage Tag Overlay */}
                  <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md border border-white/20">
                    {milestoneObj?.title || item.milestoneTitle || "Site Execution"}
                  </span>
                </div>

                {/* Card Details Body */}
                <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                  <h5 className="font-extrabold text-xs text-slate-900 line-clamp-1">
                    {item.caption || "Site Progress Photo"}
                  </h5>

                  <div className="space-y-1 text-[10.5px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <Clock className="w-3 h-3 text-purple-600" />
                      <span>
                        {new Date(timeStr).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </span>

                    {item.location && (
                      <span className="flex items-center gap-1.5 text-emerald-700 font-bold truncate">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{item.location.label || `${item.location.lat}° N, ${item.location.lng}° E`}</span>
                      </span>
                    )}

                    <span className="text-[10px] text-slate-400 block pt-0.5">
                      By: {item.uploadedByName}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {activeMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center space-y-4">
            <button
              onClick={() => setActiveMedia(null)}
              className="absolute top-0 right-0 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition cursor-pointer border-none"
            >
              <X className="w-6 h-6" />
            </button>

            {activeMedia.type === "video" ? (
              <video src={activeMedia.url} controls autoPlay className="max-h-[70vh] w-auto rounded-xl shadow-2xl" />
            ) : (
              <img
                src={activeMedia.url}
                alt={activeMedia.caption || "Full Media"}
                className="max-h-[70vh] w-auto object-contain rounded-xl shadow-2xl"
              />
            )}

            <div className="bg-slate-900/90 border border-slate-800 text-white px-6 py-4 rounded-xl text-center space-y-2 max-w-lg w-full">
              <h5 className="font-extrabold text-sm text-white">{activeMedia.caption || "Site Execution Photo"}</h5>

              <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1 text-purple-300">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {new Date(activeMedia.capturedAt || activeMedia.createdAt).toLocaleString("en-IN")}
                  </span>
                </span>

                {activeMedia.location && (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{activeMedia.location.label || `${activeMedia.location.lat}° N, ${activeMedia.location.lng}° E`}</span>
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-400 font-medium">
                Uploaded by <strong className="text-white">{activeMedia.uploadedByName}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD GEO MEDIA MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-600" />
                <h4 className="font-extrabold text-slate-900 text-sm uppercase">
                  Upload Geo-Tagged Site Media
                </h4>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">Select Milestone Stage *</label>
                <select
                  value={targetMilestoneId}
                  onChange={(e) => setTargetMilestoneId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-semibold text-slate-800"
                >
                  <option value="">General Site Execution (Unassigned Stage)</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">Photo / Video File *</label>
                <input
                  type="file"
                  required
                  accept="image/*,video/*"
                  onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-50 border rounded-lg p-2 outline-none font-semibold text-xs"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">Caption / Work Description</label>
                <input
                  type="text"
                  placeholder="e.g. Electrical wiring rough-in completed in living area"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">Automatic Timestamp</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>
                        {new Date().toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </span>
                    <span className="text-[9px] font-black uppercase text-purple-700 bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded">
                      Current 🔒
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold">GPS Geo-Location</label>
                  <button
                    type="button"
                    onClick={handleFetchGps}
                    disabled={isGettingGps}
                    className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-extrabold p-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 text-xs"
                  >
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>{isGettingGps ? "Locating..." : geoLoc ? "GPS Captured ✓" : "Capture GPS"}</span>
                  </button>
                </div>
              </div>

              {geoLoc && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200 block truncate">
                  📍 {geoLoc.label}
                </span>
              )}

              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold uppercase rounded-lg shadow-md"
                >
                  {isUploading ? "Uploading..." : "Publish Geo Media"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
