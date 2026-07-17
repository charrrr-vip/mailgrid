"use client";

import { App, ConfigProvider } from "antd";

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1E3A8A",
          colorLink: "#1E3A8A",
          colorLinkHover: "#152E6E",
          borderRadius: 8,
          fontFamily: "var(--font-outfit), system-ui, sans-serif",
          colorBorder: "#D1D5DB",
          colorText: "#111827",
          colorTextSecondary: "#6B7280",
        },
        components: {
          Button: {
            primaryShadow: "none",
            defaultShadow: "none",
            fontWeight: 500,
          },
          Table: {
            headerBg: "#F9FAFB",
            headerColor: "#6B7280",
            borderColor: "#E5E7EB",
            rowHoverBg: "#F9FAFB",
          },
          Select: {
            optionSelectedBg: "#EFF6FF",
          },
          Input: {
            activeBorderColor: "#1E3A8A",
            hoverBorderColor: "#93C5FD",
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
