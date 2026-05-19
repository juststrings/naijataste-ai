"use client";

import { useEffect } from "react";

export function AuthThemeSync() {
  useEffect(() => {
    document.body.classList.add("auth-dark");
    return () => {
      document.body.classList.remove("auth-dark");
    };
  }, []);
  return null;
}
