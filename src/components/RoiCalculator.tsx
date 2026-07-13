"use client";

import { useState } from "react";

// Interactive "what are missed WhatsApp messages costing you" widget for the
// landing page. Deliberately conservative labels — estimates, not promises.
export function RoiCalculator() {
  const [missedPerWeek, setMissedPerWeek] = useState(5);
  const [patientValue, setPatientValue] = useState(3000);

  const monthlyMissed = missedPerWeek * 4;
  const monthlyLoss = monthlyMissed * patientValue;

  return (
    <div className="card mx-auto max-w-xl text-left">
      <h3 className="font-semibold">What are missed messages costing you?</h3>
      <div className="mt-4 space-y-4 text-sm">
        <div>
          <label className="label">
            WhatsApp inquiries you miss or forget to follow up each week: <b>{missedPerWeek}</b>
          </label>
          <input
            type="range"
            min={1}
            max={25}
            value={missedPerWeek}
            onChange={(e) => setMissedPerWeek(Number(e.target.value))}
            className="w-full accent-brand-600"
          />
        </div>
        <div>
          <label className="label">
            Average value of one new patient: <b>₹{patientValue.toLocaleString("en-IN")}</b>
          </label>
          <input
            type="range"
            min={500}
            max={20000}
            step={500}
            value={patientValue}
            onChange={(e) => setPatientValue(Number(e.target.value))}
            className="w-full accent-brand-600"
          />
        </div>
      </div>
      <div className="mt-5 rounded-lg bg-brand-50 p-4 text-center">
        <div className="text-sm text-brand-900">Potential revenue slipping away every month*</div>
        <div className="mt-1 text-3xl font-extrabold text-brand-700">
          ₹{monthlyLoss.toLocaleString("en-IN")}
        </div>
        <div className="mt-2 text-xs text-brand-900/70">
          DentalFlow AI pays for itself if it recovers just <b>one</b> of these patients.
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        *Estimate: missed inquiries × 4 weeks × average patient value. Your numbers will vary.
      </p>
    </div>
  );
}
