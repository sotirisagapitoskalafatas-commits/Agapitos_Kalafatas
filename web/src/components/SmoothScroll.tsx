"use client";

import { useEffect } from "react";

export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Use native smooth scroll via CSS
    document.documentElement.classList.add("smooth-scroll");
    return () => {
      document.documentElement.classList.remove("smooth-scroll");
    };
  }, []);

  return <>{children}</>;
}
