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
      <div className="w-full bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 animate-fade-up">
        <div className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h5 className="font-extrabold text-sm text-red-900">Booking {status}</h5>
          <p className="text-xs text-red-750 font-semibold">
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
    <div className="w-full py-4 selection:bg-primary-500/30">
      {/* Desktop Horizontal Tracker */}
      <div className="hidden md:flex items-center justify-between relative w-full px-8">
        {/* Connector Line Background */}
        <div className="absolute top-[28px] left-[10%] right-[10%] h-[3px] bg-slate-100 z-0 rounded-full" />
        
        {/* Active Progress Filler Line */}
        <div
          className="absolute top-[28px] left-[10%] h-[3px] bg-gradient-to-r from-blue-500 to-indigo-500 z-0 transition-all duration-700 ease-out rounded-full"
          style={{ width: `${currentStep === 0 ? 0 : (currentStep / (steps.length - 1)) * 80}%` }}
        />

        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          const isPending = idx > currentStep;

          return (
            <div key={idx} className="flex flex-col items-center relative z-10 text-center flex-1">
              {/* Step Circle/Box */}
              <div
                className={`w-[54px] h-[54px] rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${
                  isCompleted
                    ? "bg-gradient-to-br from-blue-500 to-indigo-650 text-white shadow-md shadow-blue-500/20"
                    : isActive
                    ? "bg-white text-blue-600 border-2 border-blue-500 ring-4 ring-blue-500/10 scale-105"
                    : "bg-slate-50 border border-slate-200 text-slate-400"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5.5 h-5.5 stroke-[3]" />
                ) : (
                  <Icon className={`w-5 h-5 ${isActive ? "animate-pulse" : ""}`} />
                )}
              </div>
              
              {/* Step Label */}
              <span
                className={`text-[12.5px] font-black mt-3.5 tracking-tight transition-colors duration-300 ${
                  isActive
                    ? "text-blue-600"
                    : isCompleted
                    ? "text-slate-800 font-bold"
                    : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
              
              {/* Step Description */}
              <span className={`text-[10px] font-medium mt-1 max-w-[125px] leading-tight transition-colors duration-300 ${
                isActive ? "text-slate-500" : "text-slate-405"
              }`}>
                {step.description}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile Vertical Tracker */}
      <div className="flex md:hidden flex-col gap-5 pl-3.5 relative">
        {/* Connector Line Background */}
        <div className="absolute left-[23px] top-4 bottom-4 w-[3px] bg-slate-100 z-0 rounded-full" />
        
        {/* Active Progress Filler Line */}
        <div
          className="absolute left-[23px] top-4 w-[3px] bg-gradient-to-b from-blue-500 to-indigo-500 z-0 transition-all duration-700 ease-out rounded-full"
          style={{ height: `${currentStep === 0 ? 0 : (currentStep / (steps.length - 1)) * 88}%` }}
        />

        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <div key={idx} className="flex items-center gap-4 relative z-10">
              {/* Step Circle */}
              <div
                className={`w-[44px] h-[44px] rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 shadow-sm ${
                  isCompleted
                    ? "bg-gradient-to-br from-blue-500 to-indigo-650 text-white"
                    : isActive
                    ? "bg-white text-blue-600 border-2 border-blue-500 ring-4 ring-blue-500/10"
                    : "bg-slate-50 border border-slate-200 text-slate-400"
                }`}
              >
                {isCompleted ? <Check className="w-4.5 h-4.5 stroke-[3]" /> : <Icon className="w-4 h-4" />}
              </div>
              
              <div className="flex flex-col">
                <span
                  className={`text-xs font-black tracking-tight ${
                    isActive ? "text-blue-600" : isCompleted ? "text-slate-800" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
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
