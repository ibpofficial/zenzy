"use client";

import React, { useState } from "react";
import { ProjectMedia } from "@/lib/schema";
import { Camera, Image as ImageIcon, Layers, Plus, Upload } from "lucide-react";

interface BeforeAfterGalleryTabProps {
  mediaList: ProjectMedia[];
  isClient: boolean;
  onUploadPhoto: (spaceName: string, stageTag: 'before' | 'during' | 'after', file: File) => Promise<void>;
}

export default function BeforeAfterGalleryTab({
  mediaList,
  isClient,
  onUploadPhoto,
}: BeforeAfterGalleryTabProps) {
  const [selectedSpace, setSelectedSpace] = useState<string>("Bedroom");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSpace, setUploadSpace] = useState("Bedroom");
  const [uploadTag, setUploadTag] = useState<'before' | 'during' | 'after'>("before");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const spaces = ["Bedroom", "Kitchen", "Living Room", "Bathroom", "Exterior"];

  // Group media by space & stage tag
  const filteredMedia = mediaList.filter(
    (m) => (m.spaceName || "Bedroom").toLowerCase() === selectedSpace.toLowerCase()
  );

  const beforePhotos = filteredMedia.filter((m) => m.stageTag === "before");
  const duringPhotos = filteredMedia.filter((m) => m.stageTag === "during");
  const afterPhotos = filteredMedia.filter((m) => m.stageTag === "after");

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setSubmitting(true);
    try {
      await onUploadPhoto(uploadSpace, uploadTag, uploadFile);
      setShowUploadModal(false);
      setUploadFile(null);
    } catch (err) {
      console.error("Error uploading photo:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-sky-500/20 text-sky-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border border-sky-400/30">
              🖼️ BEFORE VS AFTER GALLERY
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Space-Grouped Photo Journal
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
            Before vs After Space Gallery
          </h2>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Compare initial conditions, active execution work, and completed site finishes grouped room by room.
          </p>
        </div>

        {!isClient && (
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl transition shadow-md cursor-pointer flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Space Photo</span>
          </button>
        )}
      </div>

      {/* SPACE TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {spaces.map((sp) => {
          const isActive = selectedSpace.toLowerCase() === sp.toLowerCase();
          return (
            <button
              key={sp}
              type="button"
              onClick={() => setSelectedSpace(sp)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 border ${
                isActive
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                  : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
              }`}
            >
              {sp}
            </button>
          );
        })}
      </div>

      {/* THREE-COLUMN STAGE COMPARISON (BEFORE | DURING | AFTER) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* BEFORE COLUMN */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="text-xs font-black uppercase text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
              Before ({beforePhotos.length})
            </span>
          </div>

          {beforePhotos.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400 font-medium">
              No Before photos uploaded for {selectedSpace} yet.
            </div>
          ) : (
            <div className="space-y-3">
              {beforePhotos.map((p) => (
                <div key={p.id} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group">
                  <img
                    src={p.url}
                    alt={p.caption || "Before"}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                  />
                  {p.caption && (
                    <p className="p-2 text-[11px] text-slate-300 bg-slate-900/90 font-medium line-clamp-1">
                      {p.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DURING COLUMN */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="text-xs font-black uppercase text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
              During ({duringPhotos.length})
            </span>
          </div>

          {duringPhotos.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400 font-medium">
              No During photos uploaded for {selectedSpace} yet.
            </div>
          ) : (
            <div className="space-y-3">
              {duringPhotos.map((p) => (
                <div key={p.id} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group">
                  <img
                    src={p.url}
                    alt={p.caption || "During"}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                  />
                  {p.caption && (
                    <p className="p-2 text-[11px] text-slate-300 bg-slate-900/90 font-medium line-clamp-1">
                      {p.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AFTER COLUMN */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
              After ({afterPhotos.length})
            </span>
          </div>

          {afterPhotos.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400 font-medium">
              No After photos uploaded for {selectedSpace} yet.
            </div>
          ) : (
            <div className="space-y-3">
              {afterPhotos.map((p) => (
                <div key={p.id} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group">
                  <img
                    src={p.url}
                    alt={p.caption || "After"}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                  />
                  {p.caption && (
                    <p className="p-2 text-[11px] text-slate-300 bg-slate-900/90 font-medium line-clamp-1">
                      {p.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase border-b border-slate-100 pb-3">
              Upload Space Media Photo
            </h3>

            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">Space / Room</label>
                <select
                  value={uploadSpace}
                  onChange={(e) => setUploadSpace(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-bold"
                >
                  {spaces.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">Stage Tag</label>
                <select
                  value={uploadTag}
                  onChange={(e) => setUploadTag(e.target.value as any)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-bold"
                >
                  <option value="before">Before Work Started</option>
                  <option value="during">During Active Execution</option>
                  <option value="after">After Completion</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">Select Image File</label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-50 border rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 text-white font-extrabold uppercase rounded-lg shadow-md"
                >
                  {submitting ? "Uploading..." : "Upload Photo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
