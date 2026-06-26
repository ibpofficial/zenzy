"use client";

import React from "react";
import { Check, Clock, User, Truck, Play, Award } from "lucide-react";

interface BookingTrackerProps {
  status: string;
}

export default function BookingTracker({ status }: BookingTrackerProps) {
  // Map statuses to step index (0 to 4)
  const getStepIndex = (statusStr: string): number => {
    switch (statusStr) {
      case "Pending":
        return 0; // Booked
      case "Accepted":
        return 1; // Professional Assigned
      case "OnTheWay":
        return 2; // On The Way
      case "Started":
        return 3; // Service Started
      case "Job Done":
      case "Completed":
        return 4; // Completed
      default:
        if (["Cancelled", "Expired", "Rejected"].includes(statusStr)) {
          return -1; // Special/Terminal error state
        }
        return 0;
    }
  };

  const currentStep = getStepIndex(status);

  // If booking is cancelled or expired, display a cancelled banner
  if (currentStep === -1) {
    return (
      <div className="w-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-4 rounded-2xl flex items-center gap-3 animate-fade-up">
        <div className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h5 className="font-extrabold text-sm text-red-900 dark:text-red-400">Booking {status}</h5>
          <p className="text-xs text-red-750 dark:text-red-500 font-semibold">
            This booking was terminated ({status}). If payment was made, refunds are processed by admin.
          </p>
        </div>
      </div>
    );
  }

  const steps = [
    { label: "Booked", description: "Request sent to provider", icon: Clock },
    { label: "Assigned", description: "Professional confirmed", icon: User },
    { label: "On The Way", description: "Worker in transit", icon: Truck },
    { label: "Started", description: "Service is in progress", icon: Play },
    {
      label: status === "Job Done" ? "Pending Approval" : "Completed",
      description: status === "Job Done" ? "Awaiting your review" : "Job fully completed",
      icon: Award,
    },
  ];

  return (
    <div className="w-full py-6">
      {/* Desktop Horizontal Tracker */}
      <div className="hidden md:flex items-center justify-between relative w-full px-4">
        {/* Connector Line Background */}
        <div className="absolute top-7 left-10 right-10 h-1 bg-slate-200 dark:bg-slate-800 z-0 rounded-full" />
        
        {/* Active Progress Filler Line */}
        <div
          className="absolute top-7 left-10 h-1 bg-gradient-to-r from-primary-500 to-primary-600 z-0 transition-all duration-750 rounded-full"
          style={{ width: `${(currentStep / (steps.length - 1)) * 82}%` }}
        />

        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          const isPending = idx > currentStep;

          return (
            <div key={idx} className="flex flex-col items-center relative z-10 text-center flex-1">
              {/* Step Circle */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-md ${
                  isCompleted
                    ? "bg-primary-600 text-white"
                    : isActive
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 ring-4 ring-primary-500/30 dark:ring-primary-500/50 scale-105 animate-pulse"
                    : "bg-white dark:bg-slate-850 border-2 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600"
                }`}
              >
                {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
              </div>
              
              {/* Step Label */}
              <span
                className={`text-[13px] font-extrabold mt-3 tracking-tight ${
                  isActive
                    ? "text-primary-600 dark:text-primary-400"
                    : isCompleted
                    ? "text-slate-800 dark:text-slate-200"
                    : "text-slate-400 dark:text-slate-650"
                }`}
              >
                {step.label}
              </span>
              
              {/* Step Description */}
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 max-w-[120px] leading-tight">
                {step.description}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile Vertical Tracker */}
      <div className="flex md:hidden flex-col gap-6 pl-4 relative">
        {/* Connector Line Background */}
        <div className="absolute left-7 top-4 bottom-4 w-1 bg-slate-200 dark:bg-slate-800 z-0 rounded-full" />
        
        {/* Active Progress Filler Line */}
        <div
          className="absolute left-7 top-4 w-1 bg-gradient-to-b from-primary-500 to-primary-600 z-0 transition-all duration-750 rounded-full"
          style={{ height: `${(currentStep / (steps.length - 1)) * 88}%` }}
        />

        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <div key={idx} className="flex items-center gap-4 relative z-10">
              {/* Step Circle */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 shadow-sm ${
                  isCompleted
                    ? "bg-primary-600 text-white"
                    : isActive
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 ring-4 ring-primary-500/20 dark:ring-primary-500/40 animate-pulse"
                    : "bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600"
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              
              <div className="flex flex-col">
                <span
                  className={`text-xs font-black tracking-tight ${
                    isActive ? "text-primary-600 dark:text-primary-400" : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                  {step.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
