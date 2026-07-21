"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Mail,
  Send,
  CheckCircle2,
  Eye,
  MousePointerClick,
  AlertTriangle,
  Calendar,
  Filter,
  RefreshCw,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { EventsMonitorTable, type MonitorEventRow } from "@/components/analytics/EventsMonitorTable";
import { SendsMonitorTable, type MonitorSendRow } from "@/components/analytics/SendsMonitorTable";
import { Select } from "@/components/ui/select";
import { PageLoader } from "@/components/ui/spinner";

type Campaign = {
  id: string;
  name: string;
  status: string;
  created_at: string;
};

type EmailEvent = MonitorEventRow;

type EmailSend = MonitorSendRow & {
  sent_at: string | null;
};

type AnalyticsData = {
  campaigns: Campaign[];
  events: EmailEvent[];
  sends: EmailSend[];
  totals: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    complained: number;
    failed: number;
  };
};

const dateRanges = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

const sendStatusOptions = [
  { value: "all", label: "All send statuses" },
  { value: "pending", label: "Pending" },
  { value: "sent", label: "Sent" },
  { value: "delivered", label: "Delivered" },
  { value: "opened", label: "Opened" },
  { value: "clicked", label: "Clicked" },
  { value: "bounced", label: "Bounced" },
  { value: "complained", label: "Complained" },
  { value: "failed", label: "Failed" },
];

const SENDS_PAGE_SIZE = 50;

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState("30d");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [selectedSendStatus, setSelectedSendStatus] = useState<string>("all");
  const [sendsPage, setSendsPage] = useState(1);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const [campaignsRes, sendsRes, eventsRes] = await Promise.all([
        fetch("/api/v1/campaigns"),
        fetch(
          `/api/v1/analytics/sends?range=${dateRange}&campaign_id=${selectedCampaign}&status=${selectedSendStatus}`
        ),
        fetch(`/api/v1/analytics/events?range=${dateRange}&campaign_id=${selectedCampaign}`),
      ]);

      const campaignsJson = await campaignsRes.json();
      const campaigns = campaignsJson.data || [];

      let sends: EmailSend[] = [];
      let events: EmailEvent[] = [];

      if (sendsRes.ok) {
        const sendsJson = await sendsRes.json();
        sends = sendsJson.data || [];
      }

      if (eventsRes.ok) {
        const eventsJson = await eventsRes.json();
        events = eventsJson.data || [];
      }

      const filteredSends = sends;

      const sendIds = new Set(filteredSends.map((s) => s.id));
      const filteredEvents = events.filter((e) => sendIds.has(e.email_send_id));

      const totals = {
        sent: filteredSends.filter((s) => s.status !== "pending").length,
        delivered: filteredSends.filter((s) => s.status === "delivered").length,
        opened: filteredSends.filter((s) => s.status === "opened").length,
        clicked: filteredSends.filter((s) => s.status === "clicked").length,
        bounced: filteredSends.filter((s) => s.status === "bounced").length,
        complained: filteredSends.filter((s) => s.status === "complained").length,
        failed: filteredSends.filter((s) => s.status === "failed").length,
      };

      setData({ campaigns, events: filteredEvents, sends: filteredSends, totals });
    } catch {
      setData({
        campaigns: [],
        events: [],
        sends: [],
        totals: { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0, failed: 0 },
      });
    }
  }, [dateRange, selectedCampaign, selectedSendStatus]);

  useEffect(() => {
    setSendsPage(1);
  }, [dateRange, selectedCampaign, selectedSendStatus]);

  useEffect(() => {
    setLoading(true);
    fetchAnalytics().finally(() => setLoading(false));
  }, [fetchAnalytics]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  }

  if (loading) {
    return <PageLoader label="Loading analytics..." />;
  }

  if (!data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-slate-500">Failed to load analytics data.</p>
      </div>
    );
  }

  const { totals, campaigns, events, sends } = data;
  const openRate = totals.sent > 0 ? ((totals.opened / totals.sent) * 100).toFixed(1) : "0.0";
  const clickRate = totals.sent > 0 ? ((totals.clicked / totals.sent) * 100).toFixed(1) : "0.0";
  const deliveryRate = totals.sent > 0 ? ((totals.delivered / totals.sent) * 100).toFixed(1) : "0.0";
  const bounceRate = totals.sent > 0 ? ((totals.bounced / totals.sent) * 100).toFixed(1) : "0.0";

  const recentEvents = events.slice(0, 50);
  const sendsTotal = sends.length;
  const sendsTotalPages = Math.max(1, Math.ceil(sendsTotal / SENDS_PAGE_SIZE));
  const sendsPageStart = (sendsPage - 1) * SENDS_PAGE_SIZE;
  const paginatedSends = sends.slice(sendsPageStart, sendsPageStart + SENDS_PAGE_SIZE);
  const sendsRangeStart = sendsTotal === 0 ? 0 : (sendsPage - 1) * SENDS_PAGE_SIZE + 1;
  const sendsRangeEnd = Math.min(sendsPage * SENDS_PAGE_SIZE, sendsTotal);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics
          </h1>
          <p className="mt-1 text-gray-600">
            Track your email performance and engagement metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
            loadingText="Refreshing..."
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-blue-100 bg-blue-50/30">
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-40"
            >
              {dateRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-600" />
            <Select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="w-48"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-blue-600" />
            <Select
              value={selectedSendStatus}
              onChange={(e) => setSelectedSendStatus(e.target.value)}
              className="w-52"
            >
              {sendStatusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Sent" value={totals.sent.toLocaleString()} icon="send" tone="blue" />
        <StatCard
          title="Delivered"
          value={totals.delivered.toLocaleString()}
          suffix={`(${deliveryRate}%)`}
          icon="check-circle-2"
          tone="green"
        />
        <StatCard
          title="Opened"
          value={totals.opened.toLocaleString()}
          suffix={`(${openRate}%)`}
          icon="eye"
          tone="cyan"
        />
        <StatCard
          title="Clicked"
          value={totals.clicked.toLocaleString()}
          suffix={`(${clickRate}%)`}
          icon="mouse-pointer-click"
          tone="indigo"
        />
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Engagement Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Engagement Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressMetric
              label="Delivery Rate"
              value={parseFloat(deliveryRate)}
              icon={CheckCircle2}
              barClass="bg-emerald-500"
              iconClass="text-emerald-600"
            />
            <ProgressMetric
              label="Open Rate"
              value={parseFloat(openRate)}
              icon={Eye}
              barClass="bg-cyan-500"
              iconClass="text-cyan-600"
            />
            <ProgressMetric
              label="Click Rate"
              value={parseFloat(clickRate)}
              icon={MousePointerClick}
              barClass="bg-indigo-500"
              iconClass="text-indigo-600"
            />
            <ProgressMetric
              label="Bounce Rate"
              value={parseFloat(bounceRate)}
              icon={AlertTriangle}
              barClass="bg-orange-500"
              iconClass="text-orange-600"
            />
          </CardContent>
        </Card>

        {/* Problem Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Delivery Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: "Bounces",
                  value: totals.bounced,
                  hint: `${bounceRate}% of sent`,
                  className: "border-orange-100 bg-orange-50/70",
                  valueClass: "text-orange-700",
                },
                {
                  label: "Complaints",
                  value: totals.complained,
                  hint: "Spam reports",
                  className: "border-red-100 bg-red-50/70",
                  valueClass: "text-red-700",
                },
                {
                  label: "Failed",
                  value: totals.failed,
                  hint: "Send failures",
                  className: "border-red-100 bg-red-50/70",
                  valueClass: "text-red-700",
                },
                {
                  label: "Health Score",
                  value:
                    totals.sent > 0
                      ? `${Math.max(0, 100 - parseFloat(bounceRate) * 2 - totals.complained * 5).toFixed(0)}%`
                      : "—",
                  hint: "Sender reputation",
                  className: "border-emerald-100 bg-emerald-50/70",
                  valueClass: "text-emerald-700",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-lg border p-4 ${item.className}`}
                >
                  <p className="text-sm text-gray-600">{item.label}</p>
                  <p className={`mt-2 text-2xl font-semibold ${item.valueClass}`}>
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{item.hint}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-blue-600" />
            Email Sends Monitor ({sendsTotal.toLocaleString()})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 overflow-x-auto">
          <SendsMonitorTable sends={paginatedSends} />
          {sendsTotal > SENDS_PAGE_SIZE && (
            <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                Showing {sendsRangeStart.toLocaleString()}–{sendsRangeEnd.toLocaleString()} of{" "}
                {sendsTotal.toLocaleString()}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={sendsPage <= 1}
                  onClick={() => setSendsPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {sendsPage.toLocaleString()} of {sendsTotalPages.toLocaleString()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={sendsPage >= sendsTotalPages}
                  onClick={() => setSendsPage((current) => Math.min(sendsTotalPages, current + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-indigo-600" />
            Event Activity Monitor
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {recentEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Mail className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No events recorded yet.</p>
            </div>
          ) : (
            <EventsMonitorTable events={recentEvents} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProgressMetric({
  label,
  value,
  icon: Icon,
  barClass = "bg-primary",
  iconClass = "text-primary",
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  barClass?: string;
  iconClass?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconClass}`} />
          <span className="text-sm font-medium text-gray-800">{label}</span>
        </div>
        <span className={`text-sm font-semibold ${iconClass}`}>{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClass}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}
