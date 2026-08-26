"use client";

export function reportWebVitals() {
  if (typeof window === "undefined" || !window.gtag) return;

  const sendToGA = (name: string, value: number, id: string) => {
    window.gtag("event", name, {
      event_category: "Web Vitals",
      event_label: id,
      value: Math.round(name === "CLS" ? value * 1000 : value),
      non_interaction: true,
    });
  };

  if ("PerformanceObserver" in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number; id: string };
        sendToGA("lcp", lastEntry.startTime, lastEntry.id || "lcp");
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {}

    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) clsValue += entry.value;
        });
        sendToGA("cls", clsValue, "cls");
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });
    } catch {}
  }
}
