"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Plus,
  Play,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageLoader } from "@/components/ui/spinner";
import { DeleteCampaignButton } from "@/components/campaigns/DeleteCampaignButton";

type Template = { id: string; name: string };
type ContactList = { id: string; name: string };
type Campaign = {
  id: string;
  name: string;
  status: string;
  template_id: string | null;
  list_id: string | null;
  created_at: string;
};

type ApiResponse<T> = {
  data: T;
  error: { code: string; message: string } | null;
};

const statusConfig: Record<string, { icon: React.ElementType }> = {
  draft: { icon: Clock },
  scheduled: { icon: Clock },
  sending: { icon: Loader2 },
  completed: { icon: CheckCircle2 },
  failed: { icon: AlertCircle },
};

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [listId, setListId] = useState("");
  const [fromName, setFromName] = useState("Mailforge");
  const [fromEmail, setFromEmail] = useState("");
  const [replyTo, setReplyTo] = useState("");

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedCampaignId),
    [campaigns, selectedCampaignId]
  );

  const loadInitialData = useCallback(async () => {
    setError(null);
    try {
      const [campaignsRes, templatesRes, listsRes] = await Promise.all([
        fetch("/api/v1/campaigns", { cache: "no-store" }),
        fetch("/api/v1/templates", { cache: "no-store" }),
        fetch("/api/v1/contact-lists", { cache: "no-store" }),
      ]);

      const campaignsPayload: ApiResponse<Campaign[]> = await campaignsRes.json();
      const templatesPayload: ApiResponse<Template[]> = await templatesRes.json();
      const listsPayload: ApiResponse<ContactList[]> = await listsRes.json();

      if (!campaignsRes.ok || campaignsPayload.error) {
        throw new Error(campaignsPayload.error?.message ?? "Failed to load campaigns");
      }
      if (!templatesRes.ok || templatesPayload.error) {
        throw new Error(templatesPayload.error?.message ?? "Failed to load templates");
      }
      if (!listsRes.ok || listsPayload.error) {
        throw new Error(listsPayload.error?.message ?? "Failed to load lists");
      }

      setCampaigns(campaignsPayload.data);
      setTemplates(templatesPayload.data);
      setLists(listsPayload.data);
      if (campaignsPayload.data.length > 0) {
        setSelectedCampaignId(campaignsPayload.data[0].id);
      }
      if (templatesPayload.data.length > 0 && !templateId) {
        setTemplateId(templatesPayload.data[0].id);
      }
      if (listsPayload.data.length > 0 && !listId) {
        setListId(listsPayload.data[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }, [listId, templateId]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      void loadInitialData().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [loadInitialData]);

  async function handleCreateCampaign(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/v1/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          template_id: templateId,
          list_id: listId,
          from_name: fromName,
          from_email: fromEmail,
          reply_to: replyTo,
        }),
      });
      const payload: ApiResponse<Campaign> = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error?.message ?? "Campaign creation failed");
      }
      setCampaigns((prev) => [payload.data, ...prev]);
      setSelectedCampaignId(payload.data.id);
      setSuccess("Campaign created successfully!");
      setName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setCreating(false);
    }
  }

  async function handleSendNow() {
    if (!selectedCampaign) return;
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/v1/campaigns/${selectedCampaign.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload: ApiResponse<{ status: string; total_recipients: number; enqueued: number }> =
        await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error?.message ?? "Failed to start campaign");
      }
      setSuccess(`Campaign started! ${payload.data.enqueued} emails queued for delivery.`);
      await loadInitialData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <PageLoader label="Loading campaigns..." />;
  }

  const config = selectedCampaign
    ? statusConfig[selectedCampaign.status] || statusConfig.draft
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Campaigns
          </h1>
          <p className="mt-1 text-gray-600">
            Create and send email campaigns to your contacts
          </p>
        </div>
      </div>

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
              <p className="text-sm font-medium text-destructive">{error}</p>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Campaign List — scrollable sidebar */}
        <Card className="flex flex-col lg:col-span-1 lg:max-h-[calc(100vh-12rem)]">
          <CardHeader className="shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-muted-foreground" />
              Your Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto">
            {campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                  <Send className="h-6 w-6 text-gray-400" />
                </div>
                <p className="mt-3 text-sm text-gray-500">No campaigns yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {campaigns.map((campaign) => {
                  const isSelected = selectedCampaignId === campaign.id;
                  return (
                    <button
                      key={campaign.id}
                      type="button"
                      className={`w-full rounded-lg border p-3 text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary-pale"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedCampaignId(campaign.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 truncate font-medium text-gray-900">
                          {campaign.name || "Untitled campaign"}
                        </p>
                        <StatusBadge kind="campaign" status={campaign.status} size="sm" className="shrink-0" />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column — actions first, then create form */}
        <div className="space-y-6 lg:col-span-2">
          {selectedCampaign && config && (
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-3">
                  <config.icon className="h-5 w-5 text-primary" />
                  <span className="text-gray-900">{selectedCampaign.name}</span>
                  <StatusBadge kind="campaign" status={selectedCampaign.status} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={handleSendNow}
                    loading={sending}
                    loadingText="Starting..."
                    disabled={!["draft", "scheduled"].includes(selectedCampaign.status)}
                  >
                    <Play className="h-4 w-4" />
                    Send Now
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/campaigns/${selectedCampaign.id}`)}
                  >
                    <BarChart3 className="h-4 w-4" />
                    View Analytics
                  </Button>
                  <DeleteCampaignButton
                    campaignId={selectedCampaign.id}
                    campaignName={selectedCampaign.name}
                    status={selectedCampaign.status}
                    onDeleted={() => {
                      setCampaigns((prev) => {
                        const next = prev.filter((item) => item.id !== selectedCampaign.id);
                        setSelectedCampaignId(next[0]?.id ?? "");
                        return next;
                      });
                      setSuccess("Campaign deleted.");
                    }}
                  />
                </div>
                {!["draft", "scheduled"].includes(selectedCampaign.status) && (
                  <p className="mt-3 text-sm text-gray-500">
                    This campaign has already been sent or is currently sending.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Create Campaign Form */}
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-muted-foreground" />
              Create New Campaign
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleCreateCampaign}>
              <div className="sm:col-span-2">
                <Label htmlFor="campaign-name" required>
                  Campaign Name
                </Label>
                <Input
                  id="campaign-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Summer Newsletter 2026"
                  required
                />
              </div>
              <div>
                <Label htmlFor="campaign-template" required>
                  Template
                </Label>
                <Select
                  id="campaign-template"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  required
                >
                  <option value="">Select template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="campaign-list" required>
                  Contact List
                </Label>
                <Select
                  id="campaign-list"
                  value={listId}
                  onChange={(e) => setListId(e.target.value)}
                  required
                >
                  <option value="">Select list</option>
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="from-name" required>
                  From Name
                </Label>
                <Input
                  id="from-name"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="Mailforge"
                  required
                />
              </div>
              <div>
                <Label htmlFor="from-email" required>
                  From Email
                </Label>
                <Input
                  id="from-email"
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="newsletter@yourdomain.com"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="reply-to" optional>
                  Reply-To
                </Label>
                <Input
                  id="reply-to"
                  type="email"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  placeholder="support@yourdomain.com"
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" loading={creating} loadingText="Creating...">
                  <Plus className="h-4 w-4" />
                  Create Campaign
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
