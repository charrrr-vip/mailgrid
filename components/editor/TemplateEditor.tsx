"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef } from "react";
import type { EditorRef, EmailEditorProps } from "react-email-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EmailEditor = dynamic(() => import("react-email-editor"), { ssr: false });

type TemplateEditorProps = {
  name: string;
  subject: string;
  previewText: string;
  designJson: unknown;
  onChangeMeta: (key: "name" | "subject" | "previewText", value: string) => void;
  onSave: (payload: { html: string; design: unknown }) => Promise<void> | void;
  saving?: boolean;
};

export function TemplateEditor({
  name,
  subject,
  previewText,
  designJson,
  onChangeMeta,
  onSave,
  saving = false,
}: TemplateEditorProps) {
  const editorRef = useRef<EditorRef | null>(null);

  const options: EmailEditorProps["options"] = useMemo(
    () => ({
      appearance: { theme: "modern_light" },
    }),
    []
  );

  function handleReady() {
    if (!designJson) return;
    editorRef.current?.editor?.loadDesign(designJson as never);
  }

  function handleSaveClick() {
    editorRef.current?.editor?.exportHtml(async ({ html, design }) => {
      await onSave({ html, design });
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <Label htmlFor="template-name">Template Name</Label>
          <Input
            id="template-name"
            value={name}
            onChange={(e) => onChangeMeta("name", e.target.value)}
            placeholder="July Newsletter"
          />
        </div>
        <div>
          <Label htmlFor="template-subject">Subject</Label>
          <Input
            id="template-subject"
            value={subject}
            onChange={(e) => onChangeMeta("subject", e.target.value)}
            placeholder="Hi {first_name}, ..."
          />
        </div>
        <div>
          <Label htmlFor="template-preview">Preview text</Label>
          <Input
            id="template-preview"
            value={previewText}
            onChange={(e) => onChangeMeta("previewText", e.target.value)}
            placeholder="Email preheader"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <EmailEditor
          ref={editorRef}
          minHeight={650}
          options={options}
          onReady={handleReady}
        />
      </div>

      <Button onClick={handleSaveClick} disabled={saving}>
        {saving ? "Saving..." : "Save Template"}
      </Button>
    </div>
  );
}
