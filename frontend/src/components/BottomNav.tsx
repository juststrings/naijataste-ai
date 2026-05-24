"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const AUTH_TABS = [
  { href: "/flavor-finder", label: "Home",      icon: "home" },
  { href: "/simulator",     label: "Simulate",  icon: "edit" },
  { href: "/recommend",     label: "Recommend", icon: "auto_awesome" },
  { href: "/profile",       label: "Profile",   icon: "person" },
];

const GUEST_TABS = [
  { href: "/",                                  label: "Home",     icon: "home" },
  { href: "/simulator",                         label: "Simulate", icon: "edit" },
  { href: "/recommend",                         label: "Recommend",icon: "auto_awesome" },
  { href: "/about",                             label: "About",    icon: "info" },
  { href: "https://trailblazer.mintlify.app/introduction",   label: "Docs",     icon: "description", external: true },
];

type Tab = { href: string; label: string; icon: string; external?: boolean };

function TabLinks({ tabs, pathname }: { tabs: Tab[]; pathname: string }) {
  return (
    <>
      {tabs.map(({ href, label, icon, external }) => {
        const active = !external && pathname === href;
        const cls = `flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
          active ? "text-primary" : "text-on-surface-variant"
        }`;
        const inner = (
          <>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "22px", fontVariationSettings: `'FILL' ${active ? 1 : 0}` }}
            >
              {icon}
            </span>
            <span className="text-[10px] font-semibold leading-none">{label}</span>
          </>
        );
        return external ? (
          <a key={href} href={href} target="_blank" rel="noreferrer" className={cls}>
            {inner}
          </a>
        ) : (
          <Link key={href} href={href} className={cls}>
            {inner}
          </Link>
        );
      })}
    </>
  );
}

export default function BottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (user) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setVisible(true);
      } else if (currentScrollY < lastScrollY.current) {
        setVisible(true);
      } else if (currentScrollY > lastScrollY.current + 5) {
        setVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [user]);

  if (user) {
    return (
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-outline-variant/20 flex h-16">
        <TabLinks tabs={AUTH_TABS} pathname={pathname} />
      </nav>
    );
  }

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-outline-variant/20 flex h-16 transition-transform duration-300 ease-in-out md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <TabLinks tabs={GUEST_TABS} pathname={pathname} />
    </nav>
  );
}
