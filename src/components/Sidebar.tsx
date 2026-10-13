"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  BrainCircuit,
  ChartNoAxesCombined,
  Gamepad2,
  House,
  Library,
  Settings,
  Sparkles,
  Target,
} from "lucide-react";

interface SidebarProps {
  activeItem?: string;
}

const navigation = [
  { name: "Dashboard", icon: House, href: "/" },
  { name: "My Courses", icon: BookOpen, href: "/courses" },
  { name: "AI Tutor", icon: BrainCircuit, href: "/ai-tutor" },
  { name: "Practice", icon: Target, href: "/practice" },
  {
    name: "Learning Map",
    icon: ChartNoAxesCombined,
    href: "/learning-map",
  },
  { name: "Library", icon: Library, href: "/library" },
  { name: "Games", icon: Gamepad2, href: "/games" },
];

export function Sidebar({ activeItem }: SidebarProps) {
  const pathname = usePathname();

  const isCurrent = (name: string, href: string) => {
    if (activeItem) return activeItem.toLowerCase() === name.toLowerCase();
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="border-b border-white/[0.08] bg-[#0A1322] p-5 md:sticky md:top-0 md:flex md:h-screen md:w-[250px] md:shrink-0 md:flex-col md:border-b-0 md:border-r">
      {/* Brand Logo */}
      <Link href="/" className="mb-9 flex items-center gap-3">
        <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3 text-cyan-300 shadow-[0_0_25px_rgba(59,130,246,0.12)]">
          <BookOpen size={27} />
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">StudyMate</h1>
          <p className="mt-0.5 text-[11px] text-slate-500">
            AI Learning Companion
          </p>
        </div>
      </Link>

      {/* Workspace Section Header */}
      <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        Workspace
      </p>

      {/* Navigation list */}
      <nav className="flex flex-wrap gap-1.5 md:flex-col">
        {navigation.map(({ name, icon: Icon, href }) => {
          const active = isCurrent(name, href);

          return (
            <Link
              key={name}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-all duration-200 ${
                active
                  ? "border-blue-400/20 bg-gradient-to-r from-blue-500/25 to-blue-500/10 text-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.06)] font-medium"
                  : "border-transparent text-slate-400 hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{name}</span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-7 hidden rounded-2xl border border-blue-400/15 bg-gradient-to-br from-blue-500/10 via-[#101D33] to-cyan-400/[0.03] p-4 md:block">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-400/10 text-cyan-300">
          <Sparkles size={19} />
        </div>
        <p className="text-sm font-semibold text-white">Learn smarter</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Your personal AI companion is ready to help you understand more.
        </p>
      </div>

      <Link
        href="/settings"
        className="mt-5 hidden items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white md:flex"
      >
        <Settings size={18} />
        Settings
      </Link>

      <div className="mt-auto hidden border-t border-white/[0.08] pt-5 md:block">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/15 text-sm font-semibold text-blue-200">
            B
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">Bharath</p>
            <p className="text-xs text-slate-500">Learning workspace</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
