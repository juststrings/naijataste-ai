"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const TABS = [
  { href: "/flavor-finder", label: "Home",      icon: "home" },
  { href: "/simulator",     label: "Simulate",  icon: "edit" },
  { href: "/recommend",     label: "Recommend", icon: "auto_awesome" },
  { href: "/profile",       label: "Profile",   icon: "person" },
];

export default function BottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-outline-variant/20 flex h-16">
      {TABS.map(({ href, label, icon }) => {
        const active = pathname === href || (href === "/flavor-finder" && pathname === "/flavor-finder");
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              active ? "text-primary" : "text-on-surface-variant"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "22px", fontVariationSettings: `'FILL' ${active ? 1 : 0}` }}
            >
              {icon}
            </span>
            <span className="text-[10px] font-semibold leading-none">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
