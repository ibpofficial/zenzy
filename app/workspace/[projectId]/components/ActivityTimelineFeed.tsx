"use client";

import React from "react";
import { ProjectEvent, DailyLog, ProjectMedia } from "@/lib/schema";
import {
  CheckCircle2,
  Camera,
  FileText,
  IndianRupee,
  Layers,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  Clock,
  User
} from "lucide-react";

interface ActivityTimelineFeedProps {
  events: ProjectEvent[];
  dailyLogs: DailyLog[];
  mediaList: ProjectMedia[];
  onSelectMedia?: (media: ProjectMedia) => void;
}

export default function ActivityTimelineFeed({
  events,
  dailyLogs,
  mediaList,
  onSelectMedia,
}: ActivityTimelineFeedProps) {
  // Combine & sort all timeline events and logs chronologically
  const combinedTimeline = React.useMemo(() => {
    const list: Array<{
      id: string;
      date: Date;
      dateFormatted: string;
      title: string;
      description?: string;
      actorName: string;
      actorRole: string;
      type: string;
      iconType: "check" | "camera" | "bill" | "payment" | "log" | "message" | "alert";
      metadata?: any;
    }> = [];

    // Map ProjectEvents
    events.forEach((ev) => {
      const dateObj = new Date(ev.createdAt);
      let iconType: any = "log";
      if (ev.type.includes("milestone_approved") || ev.type.includes("agreement")) iconType = "check";
      else if (ev.type.includes("payment")) iconType = "payment";
      else if (ev.type.includes("document") || ev.type.includes("bill")) iconType = "bill";
      else if (ev.type.includes("media") || ev.type.includes("photo")) iconType = "camera";
      else if (ev.type.includes("rejected") || ev.type.includes("alert")) iconType = "alert";
      else if (ev.type.includes("message")) iconType = "message";

      list.push({
        id: ev.id,
        date: dateObj,
        dateFormatted: dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        title: ev.title,
        description: ev.description,
        actorName: ev.actorName,
        actorRole: ev.actorRole,
        type: ev.type,
        iconType,
        metadata: ev.metadata,
      });
    });

    // Map Daily Logs
    dailyLogs.forEach((dl) => {
      const dateObj = new Date(dl.createdAt || dl.date);
      const summaryText = dl.workSummary?.join(", ") || "Daily work log recorded.";
      list.push({
        id: dl.id,
        date: dateObj,
        dateFormatted: dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        title: `Daily Work Report Submitted (${dl.workersPresent} Workers, ${dl.hoursWorked} hrs)`,
        description: summaryText,
        actorName: dl.submittedBy || "Contractor",
        actorRole: "professional",
        type: "daily_log_submitted",
        iconType: "log",
        metadata: dl,
      });
    });

    // Sort descending by date
    list.sort((a, b) => b.date.getTime() - a.date.getTime());
    return list;
  }, [events, dailyLogs]);

  // Group timeline entries by date (e.g. "29 July 2026")
  const groupedTimeline = React.useMemo(() => {
    const map: Record<string, typeof combinedTimeline> = {};
    combinedTimeline.forEach((item) => {
      if (!map[item.dateFormatted]) {
        map[item.dateFormatted] = [];
      }
      map[item.dateFormatted].push(item);
    });
    return map;
  }, [combinedTimeline]);

  if (combinedTimeline.length === 0) {
    return (
      <div className="bg-white rounded-[16px] border border-slate-200 p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h4 className="font-extrabold text-slate-900 text-base uppercase tracking-wider">
            Activity Timeline Initialized
          </h4>
          <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto">
            All project updates, photo uploads, milestone sign-offs, and daily reports will log automatically here in GitHub-style sequence.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Automatic Activity Feed
          </h3>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
            Chronological audit log of all project updates, photos, approvals, and releases.
          </p>
        </div>
        <span className="bg-slate-100 text-slate-700 font-mono font-bold text-xs px-3 py-1 rounded-full border border-slate-200">
          {combinedTimeline.length} Entries Logged
        </span>
      </div>

      {/* GitHub-style Timeline Feed */}
      <div className="space-y-8 relative before:absolute before:inset-0 before:left-4.5 before:w-0.5 before:bg-slate-200">
        {Object.entries(groupedTimeline).map(([dateLabel, items]) => (
          <div key={dateLabel} className="space-y-4 relative">
            {/* Date Header Badge */}
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center z-10 shadow-md border-2 border-white">
                <Clock className="w-4 h-4" />
              </span>
              <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider bg-slate-100 border border-slate-200 px-3 py-1 rounded-md">
                {dateLabel}
              </span>
            </div>

            {/* List of events on this date */}
            <div className="ml-11 space-y-3">
              {items.map((item) => {
                let badgeStyle = "bg-blue-50 text-blue-700 border-blue-200";
                let IconComponent = CheckCircle2;

                if (item.iconType === "check") {
                  badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  IconComponent = CheckCircle2;
                } else if (item.iconType === "camera") {
                  badgeStyle = "bg-purple-50 text-purple-700 border-purple-200";
                  IconComponent = Camera;
                } else if (item.iconType === "payment") {
                  badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
                  IconComponent = IndianRupee;
                } else if (item.iconType === "bill") {
                  badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-200";
                  IconComponent = FileText;
                } else if (item.iconType === "alert") {
                  badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
                  IconComponent = AlertTriangle;
                }

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-subtle hover:border-slate-300 transition space-y-2"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`p-1.5 rounded-lg border text-xs ${badgeStyle}`}>
                          <IconComponent className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs md:text-sm">
                            {item.title}
                          </h4>
                          <span className="text-[10px] font-semibold text-slate-500 block">
                            Logged by <strong className="text-slate-700">{item.actorName}</strong> ({item.actorRole}) at{" "}
                            {item.date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-extrabold uppercase text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded-xs border border-slate-200">
                        {item.type.replace(/_/g, " ")}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                        {item.description}
                      </p>
                    )}

                    {/* Render embedded photos preview if this is a daily log or media event */}
                    {item.metadata?.beforePhotoIds && item.metadata.beforePhotoIds.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pt-1">
                        {item.metadata.beforePhotoIds.map((url: string, idx: number) => (
                          <img
                            key={idx}
                            src={url}
                            alt="Log Photo"
                            className="w-16 h-16 rounded-md object-cover border border-slate-200 shrink-0 cursor-pointer hover:opacity-90 transition"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
