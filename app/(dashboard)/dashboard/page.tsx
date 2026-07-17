import { createClient } from "@/lib/supabase/server";
import { Users, FileText, Send, TrendingUp, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [contactsRes, templatesRes, campaignsRes, sendsRes, eventsRes] =
    await Promise.all([
      supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase.from("templates").select("id", { count: "exact", head: true }),
      supabase.from("campaigns").select("id,status,name,created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("email_sends").select("id,status", { count: "exact" }),
      supabase
        .from("email_events")
        .select("event_type")
        .in("event_type", ["delivered", "opened", "clicked"]),
    ]);

  const activeContacts = contactsRes.count ?? 0;
  const totalTemplates = templatesRes.count ?? 0;
  const campaigns = campaignsRes.data ?? [];
  const totalCampaigns = campaigns.length;
  const sends = sendsRes.data ?? [];
  const sentCount = sends.filter((s) => s.status !== "pending").length;

  const events = eventsRes.data ?? [];
  const deliveredCount = events.filter((e) => e.event_type === "delivered").length;
  const openedCount = events.filter((e) => e.event_type === "opened").length;
  const clickedCount = events.filter((e) => e.event_type === "clicked").length;

  const openRate = sentCount > 0 ? ((openedCount / sentCount) * 100).toFixed(1) : "0.0";
  const clickRate = sentCount > 0 ? ((clickedCount / sentCount) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back${user?.email ? `, ${user.email.split("@")[0]}` : ""}. Here's your email performance overview.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Contacts" value={activeContacts.toLocaleString()} icon="users" tone="indigo" />
        <StatCard title="Templates" value={totalTemplates.toLocaleString()} icon="file-text" tone="cyan" />
        <StatCard title="Emails Sent" value={sentCount.toLocaleString()} icon="send" tone="blue" />
        <StatCard title="Delivered" value={deliveredCount.toLocaleString()} icon="mail-check" tone="green" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Engagement Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-cyan-100 bg-cyan-50/70 p-4">
                <p className="text-sm text-gray-600">Open Rate</p>
                <p className="mt-1 text-2xl font-semibold text-cyan-700">{openRate}%</p>
                <p className="mt-1 text-xs text-gray-500">
                  {openedCount} of {sentCount} emails opened
                </p>
              </div>
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-4">
                <p className="text-sm text-gray-600">Click Rate</p>
                <p className="mt-1 text-2xl font-semibold text-indigo-700">{clickRate}%</p>
                <p className="mt-1 text-xs text-gray-500">
                  {clickedCount} of {sentCount} emails clicked
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-600" />
              Recent Campaigns
            </CardTitle>
            <Link href="/campaigns" className="text-sm font-medium text-primary hover:text-primary-dark">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-8">
                <AlertCircle className="h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No campaigns yet</p>
                <Link href="/campaigns" className="mt-2 text-sm font-medium text-primary hover:text-primary-dark">
                  Create your first campaign
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    href={`/campaigns/${campaign.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-[#F8F8F9] p-3 transition-colors hover:bg-gray-100"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {campaign.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge kind="campaign" status={campaign.status} size="sm" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/contacts", title: "Import Contacts", desc: "Upload CSV file", icon: Users, iconClass: "border-indigo-100 bg-indigo-100 text-indigo-700", hoverClass: "hover:border-indigo-200 hover:bg-indigo-50/40" },
              { href: "/templates/new", title: "Create Template", desc: "Visual editor", icon: FileText, iconClass: "border-cyan-100 bg-cyan-100 text-cyan-700", hoverClass: "hover:border-cyan-200 hover:bg-cyan-50/40" },
              { href: "/campaigns", title: "New Campaign", desc: "Send emails", icon: Send, iconClass: "border-blue-100 bg-blue-100 text-blue-700", hoverClass: "hover:border-blue-200 hover:bg-blue-50/40" },
              { href: "/analytics", title: "View Analytics", desc: "Performance data", icon: TrendingUp, iconClass: "border-emerald-100 bg-emerald-100 text-emerald-700", hoverClass: "hover:border-emerald-200 hover:bg-emerald-50/40" },
            ].map(({ href, title, desc, icon: Icon, iconClass, hoverClass }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors ${hoverClass}`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-md border ${iconClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
