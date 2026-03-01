"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  BarChart3,
  LogOut,
  Search,
  Settings,
  User,
  ChevronDown,
  LayoutDashboard,
  SlidersHorizontal,
  Star,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/screener", label: "Screener", icon: SlidersHorizontal },
  { href: "/watchlist", label: "Watchlist", icon: Star },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;

    function handleClick() {
      setDropdownOpen(false);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [dropdownOpen]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Logout failed");

      const supabase = createClient();
      await supabase.auth.signOut();

      toast({ title: "Signed out", variant: "success" });
      router.push("/login");
      router.refresh();
    } catch {
      toast({
        title: "Logout failed",
        description: "Please try again.",
        variant: "error",
      });
    } finally {
      setLoggingOut(false);
    }
  }

  // Don't show navbar on landing, login, signup
  const hideOn = ["/", "/login", "/signup"];
  if (hideOn.includes(pathname)) return null;

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-foreground transition-colors hover:text-primary"
        >
          <BarChart3 className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold tracking-tight">
            StockScreener AI
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Global search trigger */}
          <Link
            href="/screener"
            className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search stocks...</span>
          </Link>

          {/* User dropdown */}
          {user ? (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen((prev) => !prev);
                }}
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                  {user.email?.charAt(0).toUpperCase() ?? "U"}
                </div>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    dropdownOpen && "rotate-180"
                  )}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-border bg-card shadow-xl">
                  {/* User info */}
                  <div className="border-b border-border px-3 py-2.5">
                    <p className="truncate text-sm font-medium text-card-foreground">
                      {user.email}
                    </p>
                  </div>

                  {/* Menu items */}
                  <div className="p-1">
                    {/* Mobile nav links */}
                    <div className="border-b border-border pb-1 md:hidden">
                      {NAV_LINKS.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <link.icon className="h-4 w-4" />
                          {link.label}
                        </Link>
                      ))}
                    </div>

                    <Link
                      href="/settings"
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>

                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-negative transition-colors hover:bg-negative/10 disabled:opacity-50"
                    >
                      <LogOut className="h-4 w-4" />
                      {loggingOut ? "Signing out..." : "Sign out"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <User className="h-3.5 w-3.5" />
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
