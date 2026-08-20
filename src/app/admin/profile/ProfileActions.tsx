"use client";

import Link from "next/link";
import { LayoutDashboard, LayoutGrid, LogOut } from "lucide-react";
import { useAdminSession } from "@/components/AdminSessionProvider";

const labels = {
  zh: {
    dashboard: "返回管理后台",
    navigation: "编辑个人导航",
    logout: "退出登录",
  },

  en: {
    dashboard: "Back to dashboard",
    navigation: "Edit personal navigation",
    logout: "Sign out",
  },
};

export function ProfileActions({ lang }: { lang: keyof typeof labels }) {
  const { logout } = useAdminSession();
  const t = labels[lang];

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link
        href="/admin"
        className="ui-button-ghost justify-center border border-[var(--border-subtle)]"
      >
        <LayoutDashboard className="h-4 w-4" />
        {t.dashboard}
      </Link>
      <Link
        href={`/${lang}/nav?admin=1`}
        className="ui-button-ghost justify-center border border-[var(--border-subtle)]"
      >
        <LayoutGrid className="h-4 w-4" />
        {t.navigation}
      </Link>
      <button
        type="button"
        onClick={() => void logout()}
        className="ui-button-ghost justify-center border border-red-500/20 text-red-500 hover:bg-red-500/5"
      >
        <LogOut className="h-4 w-4" />
        {t.logout}
      </button>
    </div>
  );
}
