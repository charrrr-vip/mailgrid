"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import {
  BellOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { CustomAvatar } from "@/components/common/CustomAvatar";
import { createClient } from "@/lib/supabase/client";
import { getBreadcrumbs } from "@/lib/navigation/breadcrumbs";

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const breadcrumbs = useMemo(() => getBreadcrumbs(pathname), [pathname]);
  const displayName = userEmail?.split("@")[0] ?? "User";

  useEffect(() => {
    void createClient()
      .auth.getUser()
      .then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const menuItems: MenuProps["items"] = [
    {
      key: "header",
      label: (
        <div className="px-1 py-1">
          <p className="font-semibold text-gray-900">{displayName}</p>
          <p className="text-sm text-gray-500">{userEmail}</p>
        </div>
      ),
      disabled: true,
    },
    { type: "divider" },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
      onClick: () => router.push("/settings"),
    },
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
      onClick: () => router.push("/settings"),
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: loggingOut ? "Signing out..." : "Sign out",
      onClick: handleLogout,
      disabled: loggingOut,
    },
  ];

  return (
    <header className="h-16" style={{ backgroundColor: "#F8F8F9" }}>
      <div className="flex h-full items-center justify-between px-8">
        <div>
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={`${crumb.label}-${index}`} className="flex items-center gap-2">
                  {index > 0 && <span className="text-gray-400">/</span>}
                  {crumb.path ? (
                    <Link
                      href={crumb.path}
                      className="text-gray-600 transition-colors hover:text-gray-900"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-900">{crumb.label}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative rounded-lg p-2 transition-colors hover:bg-gray-100"
            aria-label="Notifications"
          >
            <BellOutlined className="text-lg text-gray-600" />
          </button>

          {userEmail && (
            <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
              <button
                type="button"
                className="transition-opacity hover:opacity-80"
                title={displayName}
              >
                <CustomAvatar name={displayName} size="sm" />
              </button>
            </Dropdown>
          )}
        </div>
      </div>
    </header>
  );
}
