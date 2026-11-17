"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/modules/utils/cn";

const navItems = [
  { label: "Fitur", href: "#fitur" },
  { label: "Cara kerja", href: "#cara-kerja" },
  { label: "Untuk tim toko", href: "#peran" },
];

function HamburgerButton({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      aria-label="Buka/tutup menu"
      aria-expanded={isOpen}
      className="flex h-10 w-10 flex-col items-center justify-center gap-1.5"
    >
      <span
        className={cn(
          "h-0.5 w-6 bg-current transition-all duration-300",
          isOpen && "translate-y-2 rotate-45",
        )}
      />
      <span
        className={cn(
          "h-0.5 w-6 bg-current transition-all duration-300",
          isOpen && "opacity-0",
        )}
      />
      <span
        className={cn(
          "h-0.5 w-6 bg-current transition-all duration-300",
          isOpen && "-translate-y-2 -rotate-45",
        )}
      />
    </button>
  );
}

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>("");

  // Animasi mengecil saat scroll
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight menu sesuai section yang sedang terlihat
  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.href.slice(1)))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      // section dianggap aktif saat melewati area tengah layar
      { rootMargin: "-40% 0px -55% 0px" },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Tutup menu mobile kalau layar dibesarkan ke desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && setIsMenuOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  const linkClass = (href: string) =>
    cn(
      "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300",
      activeId === href.slice(1)
        ? "bg-secondary text-white"
        : "text-neutral-700 hover:bg-neutral-100",
    );

  return (
    <div className="flex w-full justify-center">
      <nav
        aria-label="Navigasi utama"
        className={cn(
          "fixed top-0 left-1/2 z-50 w-full max-w-[100vw] -translate-x-1/2 rounded-b-2xl bg-white px-6 py-4 shadow-lg",
          "transition-all duration-300 ease-in-out",
          // Floating state shrinks to the landing content width (.landing main max-width: 1180px).
          isScrolled &&
            "top-6 max-w-[min(1180px,calc(100vw-2rem))] rounded-2xl",
          isScrolled && isMenuOpen && "rounded-b-none",
        )}
      >
        {/* Content narrows together with the bar (same duration/easing) so it never lags and then jumps. */}
        <div
          className={cn(
            "mx-auto flex w-full items-center justify-between",
            "transition-[max-width] duration-300 ease-in-out",
            isScrolled ? "max-w-[1132px]" : "max-w-[1280px]",
          )}
        >
          {/* Kiri: logo */}
          <Link href="/" aria-label="KOTONG — Beranda" onClick={closeMenu}>
            <Brand />
          </Link>

          {/* Tengah: menu desktop */}
          <div className="hidden flex-1 items-center justify-center gap-2 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={linkClass(item.href)}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Kanan: tombol Masuk (desktop) + hamburger (mobile) */}
          <div className="flex items-center">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "hidden lg:inline-flex",
              )}
            >
              Masuk <ArrowUpRight size={16} />
            </Link>
            <div className="lg:hidden">
              <HamburgerButton isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
            </div>
          </div>

          {/* Dropdown mobile */}
          <div
            className={cn(
              "absolute left-0 flex w-full flex-col items-center gap-2 rounded-b-2xl bg-white px-4 py-6 shadow-lg transition-all duration-300 ease-in-out lg:hidden",
              isMenuOpen
                ? "visible top-full -translate-y-2 opacity-100"
                : "invisible top-[70%] opacity-0",
            )}
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={linkClass(item.href)}
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={closeMenu}
              className={cn(buttonVariants(), "mt-2")}
            >
              Masuk <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
