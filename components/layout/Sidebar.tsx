"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeOutlined,
  TeamOutlined,
  FileTextOutlined,
  SendOutlined,
  BarChartOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";

const menuItems = [
  { key: "/dashboard", icon: HomeOutlined, label: "Dashboard" },
  { key: "/contacts", icon: TeamOutlined, label: "Contacts" },
  { key: "/templates", icon: FileTextOutlined, label: "Templates" },
  { key: "/campaigns", icon: SendOutlined, label: "Campaigns" },
  { key: "/analytics", icon: BarChartOutlined, label: "Analytics" },
  { key: "/settings", icon: SettingOutlined, label: "Settings" },
];

export function Sidebar() {
  const [collapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  function isActive(key: string) {
    return pathname === key || pathname.startsWith(`${key}/`);
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative flex h-screen flex-col"
      style={{ backgroundColor: "#F8F8F9" }}
    >
      <div className={`${collapsed ? "p-4" : "px-6 py-5"} transition-all`}>
        <Link href="/dashboard" className="group flex items-center no-underline">
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="text-lg font-semibold text-gray-900"
              >
                Mailforge
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      <div className={`my-3 ${collapsed ? "px-4" : "px-6"}`}>
        <div className="border-t border-gray-200" />
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        <nav className={`space-y-0.5 ${collapsed ? "px-2" : "px-3"}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.key);

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => router.push(item.key)}
                className={`group relative flex w-full items-center gap-3 rounded-md transition-all ${
                  collapsed ? "justify-center p-2.5" : "px-3 py-2"
                } ${
                  active
                    ? "bg-white text-gray-900"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`flex-shrink-0 text-[18px] ${
                    active ? "text-primary" : "text-gray-500 group-hover:text-gray-700"
                  }`}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className={`flex-1 text-left text-sm font-medium ${
                        active ? "text-gray-900" : "text-gray-700"
                      }`}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </nav>
      </div>
    </motion.div>
  );
}
