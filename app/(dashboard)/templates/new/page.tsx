"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TemplateEditor } from "@/components/editor/TemplateEditor";

type ApiResponse<T> = {
  data: T;
  error: { code: string; message: string } | null;
};

export default function NewTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState("New Template");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(payload: { html: string; design: unknown }) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          subject,
          preview_text: previewText,
          html_content: payload.html,
          design_json: payload.design,
        }),
      });
      const result: ApiResponse<{ id: string }> = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error?.message ?? "Creation failed");
      }
      router.push(`/templates/${result.data.id}/edit`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/templates"
          className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Templates
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          New Template
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Design your email with the visual editor
        </p>
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-md border border-border bg-muted p-4"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Email Editor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TemplateEditor
            name={name}
            subject={subject}
            previewText={previewText}
            designJson={null}
            onChangeMeta={(key, value) => {
              if (key === "name") setName(value);
              if (key === "subject") setSubject(value);
              if (key === "previewText") setPreviewText(value);
            }}
            onSave={handleSave}
            saving={saving}
          />
        </CardContent>
      </Card>
    </div>
  );
}
