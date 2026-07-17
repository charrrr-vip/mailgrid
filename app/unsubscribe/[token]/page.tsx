"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UnsubscribePage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleUnsubscribe() {
    setStatus("loading");
    try {
      const response = await fetch(`/api/v1/unsubscribe/${token}`, {
        method: "POST",
      });

      if (response.ok) {
        setStatus("success");
        setMessage("You have been successfully unsubscribed from our mailing list.");
      } else {
        throw new Error("Failed to process unsubscribe request");
      }
    } catch {
      setStatus("error");
      setMessage("Unable to process your request. Please try again later.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-border bg-card">
            <Mail className="h-5 w-5 text-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Mailforge</h1>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Unsubscribe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "idle" && (
              <>
                <p className="text-center text-sm text-muted-foreground">
                  Confirm below to stop receiving marketing emails from us.
                </p>
                <Button onClick={handleUnsubscribe} className="w-full" variant="destructive">
                  Confirm Unsubscribe
                </Button>
              </>
            )}

            {status === "loading" && (
              <div className="flex flex-col items-center py-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">Processing...</p>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center py-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">{message}</p>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center py-4 text-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="mt-4 text-sm text-muted-foreground">{message}</p>
                <Button onClick={handleUnsubscribe} variant="outline" className="mt-4">
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">Powered by Mailforge</p>
      </div>
    </div>
  );
}
