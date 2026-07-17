"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/spinner";
import { TemplateEditor } from "@/components/editor/TemplateEditor";

type Template = {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  design_json: unknown;
  preview_text: string | null;
};

type ApiResponse<T> = {
  data: T;
  error: { code: string; message: string } | null;
};

export default function EditTemplatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      void fetch(`/api/v1/templates/${id}`, { cache: "no-store" })
        .then((response) => response.json().then((payload) => ({ response, payload })))
        .then(({ response, payload }: { response: Response; payload: ApiResponse<Template> }) => {
          if (!response.ok || payload.error) {
            throw new Error(payload.error?.message ?? "Template not found");
          }
          setTemplate(payload.data);
          setName(payload.data.name);
          setSubject(payload.data.subject);
          setPreviewText(payload.data.preview_text ?? "");
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Error"))
        .finally(() => setLoading(false));
    }, 0);

    return () => clearTimeout(timer);
  }, [id]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  async function handleSave(payload: { html: string; design: unknown }) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/v1/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          subject,
          preview_text: previewText,
          html_content: payload.html,
          design_json: payload.design,
        }),
      });
      const result: ApiResponse<Template> = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error?.message ?? "Save failed");
      }
      setTemplate(result.data);
      setSuccess("Template saved successfully!");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("Are you sure you want to delete this template? This action cannot be undone.");
    if (!confirmed) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/templates/${id}`, { method: "DELETE" });
      const payload: ApiResponse<{ deleted: boolean }> = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error?.message ?? "Delete failed");
      }
      router.push("/templates");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setDeleting(false);
    }
  }

  if (loading) {
    return <PageLoader label="Loading template..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/templates"
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Templates
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Template
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Update your email content and design
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={handleDelete}
          loading={deleting}
          loadingText="Deleting..."
        >
          <Trash2 className="h-4 w-4" />
          Delete Template
        </Button>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-md border border-destructive/20 bg-destructive/5 p-4"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
            </div>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-md border border-border bg-muted p-4"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle>{template?.name ?? "Template"}</CardTitle>
        </CardHeader>
        <CardContent>
          {template ? (
            <TemplateEditor
              name={name}
              subject={subject}
              previewText={previewText}
              designJson={template.design_json}
              onChangeMeta={(key, value) => {
                if (key === "name") setName(value);
                if (key === "subject") setSubject(value);
                if (key === "previewText") setPreviewText(value);
              }}
              onSave={handleSave}
              saving={saving}
            />
          ) : (
            <p className="text-sm text-slate-500">Template not found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
