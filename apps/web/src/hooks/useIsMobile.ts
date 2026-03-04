"use client";

import { useEffect, useState } from "react";

const QUERY = "(max-width: 768px)";

export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    setMobile(mql.matches);
    const listener = () => setMobile(mql.matches);
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, []);

  return mobile;
}
