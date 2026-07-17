import { Settings, Shield, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const dnsRecords = [
    { type: "SPF", record: "v=spf1 include:amazonses.com ~all", status: "required" },
    { type: "DKIM", record: "Provided by Resend/SES", status: "required" },
    {
      type: "DMARC",
      record: "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com",
      status: "recommended",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-600">Manage your account and sending configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-pale text-sm font-semibold text-primary">
              {user?.email?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div>
              <p className="font-medium text-gray-900">{user?.email ?? "Unknown"}</p>
              <p className="text-sm text-gray-500">Account owner</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            DNS Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-gray-600">
            Configure these DNS records for your sending domain to ensure optimal deliverability.
          </p>
          <div className="space-y-3">
            {dnsRecords.map(({ type, record, status }) => (
              <div key={type} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-pale text-primary">
                      <Shield className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-gray-900">{type}</span>
                  </div>
                  <Badge variant={status === "required" ? "danger" : "warning"} size="sm">
                    {status}
                  </Badge>
                </div>
                <div className="mt-3 rounded-lg bg-gray-50 p-3 font-mono text-xs text-gray-700">
                  {record}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
