"use client";

import { useState, useEffect } from "react";
import {
  IconLayoutDashboard,
  IconMessage,
  IconRadar2,
  IconShoppingBag,
  IconX,
} from "@tabler/icons-react";

const ONBOARDING_KEY = "campus-connect-onboarded";

const steps = [
  {
    icon: <IconLayoutDashboard className="w-8 h-8 text-emerald-400" />,
    title: "Your Feed",
    description: "See posts from people you follow, share updates, and create polls. Stories appear at the top!",
  },
  {
    icon: <IconMessage className="w-8 h-8 text-violet-400" />,
    title: "Real-time Chat",
    description: "Message anyone with typing indicators, read receipts, voice messages, and video calls.",
  },
  {
    icon: <IconRadar2 className="w-8 h-8 text-amber-400" />,
    title: "Discover Nearby",
    description: "Find students around your campus using GPS. Connect with people physically close to you.",
  },
  {
    icon: <IconShoppingBag className="w-8 h-8 text-rose-400" />,
    title: "Campus Marketplace",
    description: "Buy, sell, and trade textbooks, electronics, and more with fellow students.",
  },
];

export default function Onboarding() {
  const [show, setShow] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const onboarded = localStorage.getItem(ONBOARDING_KEY);
    if (!onboarded) setShow(true);
  }, []);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShow(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleComplete();
    }
  };

  if (!show) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1e1e2e] border border-[#2e2e3e] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i <= currentStep ? "w-8 bg-emerald-500" : "w-4 bg-[#2e2e3e]"
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleComplete}
            className="p-1 hover:bg-[#2e2e3e] rounded-lg transition-colors"
            aria-label="Skip onboarding"
          >
            <IconX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-10 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#12121a] border border-[#2e2e3e] flex items-center justify-center">
            {step.icon}
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{step.title}</h2>
          <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep((s) => s - 1)}
              className="flex-1 py-2.5 bg-[#12121a] border border-[#2e2e3e] text-white rounded-lg font-medium hover:bg-[#2e2e3e] transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors"
          >
            {currentStep === steps.length - 1 ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
