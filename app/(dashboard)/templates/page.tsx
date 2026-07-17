import Link from "next/link";
import { FileText, Plus, Edit3, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type Template = {
  id: string;
  name: string;
  subject: string;
  preview_text: string | null;
  updated_at: string;
};

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: templatesData } = await supabase
    .from("templates")
    .select("id,name,subject,preview_text,updated_at")
    .order("updated_at", { ascending: false });
  const templates = (templatesData ?? []) as Template[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build emails with the visual editor
          </p>
        </div>
        <Link href="/templates/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </Link>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-base font-semibold">No templates yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first email template to get started.
            </p>
            <Link href="/templates/new" className="mt-4">
              <Button>
                <Plus className="h-4 w-4" />
                Create Template
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Link href={`/templates/${template.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <div className="mt-4">
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                    {template.subject || "No subject"}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Updated {new Date(template.updated_at).toLocaleDateString()}
                </div>
                <Link href={`/templates/${template.id}/edit`} className="mt-4 block">
                  <Button variant="outline" className="w-full">
                    <Edit3 className="h-4 w-4" />
                    Edit Template
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
