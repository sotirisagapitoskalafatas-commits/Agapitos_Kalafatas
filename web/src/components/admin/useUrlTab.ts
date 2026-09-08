"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// URL-driven tab state: `?tab=` survives refresh/deep-links and keeps the
// sidebar active item and the content in sync (one application, not pages).
export function useUrlTab<T extends string>(
  valid: readonly T[],
  fallback: T,
  key = "tab"
): [T, (next: T) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const raw = searchParams.get(key) as T | null;
  const tab: T = raw && valid.includes(raw) ? raw : fallback;

  const setTab = useCallback(
    (next: T) => {
      const sp = new URLSearchParams(searchParams.toString());
      sp.set(key, next);
      router.replace(`${pathname}?${sp.toString()}`);
    },
    [router, searchParams, pathname, key]
  );

  return [tab, setTab];
}