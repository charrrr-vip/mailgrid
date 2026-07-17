"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="flex items-center justify-center bg-white p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link
            href="/login"
            className="group mb-8 flex items-center gap-2 no-underline hover:no-underline"
          >
            <span className="text-2xl font-bold text-gray-900 no-underline">Mailforge</span>
          </Link>

          <h1 className="mb-2 text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mb-8 text-gray-600">{subtitle}</p>
          {children}
        </motion.div>
      </div>

      <div className="relative hidden overflow-hidden md:block">
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#0F172A]"
        />
        <div className="absolute inset-0 bg-black/5" />

        {[
          { className: "absolute left-[15%] top-[10%] h-20 w-20", duration: 4, delay: 0 },
          { className: "absolute right-[20%] top-[20%] h-12 w-12", duration: 3.5, delay: 0.5 },
          { className: "absolute bottom-[15%] left-[10%] h-16 w-16", duration: 5, delay: 1 },
          { className: "absolute bottom-[25%] right-[15%] h-8 w-8", duration: 3, delay: 1.5 },
          { className: "absolute left-[8%] top-1/2 h-14 w-14", duration: 4.5, delay: 2 },
        ].map((bubble, index) => (
          <motion.div
            key={index}
            className={`${bubble.className} rounded-full bg-white/15 backdrop-blur-sm`}
            animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
            transition={{
              duration: bubble.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: bubble.delay,
            }}
          />
        ))}
      </div>
    </div>
  );
}
