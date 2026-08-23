"use client";
import { useEffect, useState } from "react";

const checks = ["Website presence", "Offer clarity", "Lead generation", "Local SEO", "Reputation", "Content opportunities", "Conversion opportunities"];
export default function AnalysisScreen({ onComplete }: { onComplete: () => void }) {
  const [complete, setComplete] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setComplete((value) => {
      if (value >= checks.length) {
        window.clearInterval(timer);
        return value;
      }
      return value + 1;
    }), 350);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (complete !== checks.length) return;
    const timer = window.setTimeout(onComplete, 650);
    return () => window.clearTimeout(timer);
  }, [complete, onComplete]);
  return <main className="analysis-page"><div className="analysis-box"><span className="eyebrow">GROWTHPILOT / SIGNAL SCAN</span><h1>Analyzing<br /><em>your business.</em></h1><p className="analysis-intro">We&apos;re mapping the moments where a customer decides to call, click, or keep looking.</p><div className="scan-list">{checks.map((check, index) => <div className={index < complete ? "scan-item checked" : "scan-item"} key={check}><span>{index < complete ? "✓" : "○"}</span>{check}</div>)}</div><div className="scan-progress"><span style={{ width: `${Math.min(100, (complete / checks.length) * 100)}%` }} /></div><p className="scan-status">{complete >= checks.length ? "BUILDING YOUR GROWTH SCORE..." : "READING THE SIGNALS..."}</p></div></main>;
}
