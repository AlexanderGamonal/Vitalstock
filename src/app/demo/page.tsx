"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DemoPage() {
  const router = useRouter();
  useEffect(() => {
    try {
      const cfg = localStorage.getItem("demo_user_config");
      router.replace(cfg ? "/demo/dashboard" : "/demo/setup");
    } catch {
      router.replace("/demo/setup");
    }
  }, [router]);
  return null;
}
