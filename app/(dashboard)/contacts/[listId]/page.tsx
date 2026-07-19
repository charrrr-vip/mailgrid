"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Search, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageLoader } from "@/components/ui/spinner";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/ui/data-table";

type ContactList = {
  id: string;
  name: string;
  description: string | null;
  contact_count: number;
};

type Contact = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: "active" | "unsubscribed" | "bounced" | "complained";
  created_at: string;
};

type ApiResponse<T> = {
  data: T;
  error: { code: string; message: string } | null;
  meta?: { total?: number; page?: number; limit?: number } | null;
};

const PAGE_SIZE = 50;

export default function ContactListDetailPage() {
  const params = useParams<{ listId: string }>();
  const listId = params.listId;

  const [list, setList] = useState<ContactList | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);

  const fetchList = useCallback(async () => {
    const response = await fetch(`/api/v1/contact-lists/${listId}`, { cache: "no-store" });
    const payload: ApiResponse<ContactList> = await response.json();
    if (!response.ok || payload.error) {
      throw new Error(payload.error?.message ?? "Failed to load list");
    }
    setList(payload.data);
  }, [listId]);

  const fetchContacts = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search.trim()) params.set("search", search.trim());

    const response = await fetch(
      `/api/v1/contact-lists/${listId}/contacts?${params.toString()}`,
      { cache: "no-store" }
    );
    const payload: ApiResponse<Contact[]> = await response.json();
    if (!response.ok || payload.error) {
      throw new Error(payload.error?.message ?? "Failed to load contacts");
    }
    setContacts(payload.data);
    setTotalContacts(payload.meta?.total ?? payload.data.length);
  }, [listId, page, search, statusFilter]);

  useEffect(() => {
    setLoading(true);
    void Promise.all([fetchList(), fetchContacts()])
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [fetchList, fetchContacts]);

  async function handleUpdateContactStatus(contactId: string, status: Contact["status"]) {
    setActionLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload: ApiResponse<Contact> = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error?.message ?? "Update failed");
      }
      setContacts((prev) =>
        prev.map((item) => (item.id === contactId ? { ...item, status } : item))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteContact(contactId: string) {
    if (!window.confirm("Delete this contact?")) return;
    setActionLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/contacts/${contactId}`, { method: "DELETE" });
      const payload: ApiResponse<{ id: string }> = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error?.message ?? "Delete failed");
      }
      setContacts((prev) => prev.filter((item) => item.id !== contactId));
      await fetchList();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setActionLoading(false);
    }
  }

  const listTitle = useMemo(() => list?.name ?? "Contact list", [list?.name]);
  const totalCount = list?.contact_count ?? totalContacts;
  const totalPages = Math.max(1, Math.ceil(totalContacts / PAGE_SIZE));
  const rangeStart = totalContacts === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalContacts);

  if (loading) {
    return <PageLoader label="Loading contacts..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/contacts"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to contacts
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{listTitle}</h1>
        <p className="mt-1 text-gray-600">
          {totalCount.toLocaleString()} contact{totalCount !== 1 ? "s" : ""} in this list
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All contacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by email..."
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-40"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="unsubscribed">Unsubscribed</option>
              <option value="bounced">Bounced</option>
              <option value="complained">Complained</option>
            </Select>
          </div>

          <DataTable>
            <DataTableHead>
              <DataTableRow>
                <DataTableHeaderCell>Email</DataTableHeaderCell>
                <DataTableHeaderCell>Name</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
                <DataTableHeaderCell>Actions</DataTableHeaderCell>
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {contacts.length === 0 ? (
                <DataTableEmpty colSpan={4}>No contacts in this list yet.</DataTableEmpty>
              ) : (
                contacts.map((contact) => (
                  <DataTableRow key={contact.id}>
                    <DataTableCell className="font-medium text-gray-900">
                      {contact.email}
                    </DataTableCell>
                    <DataTableCell className="text-gray-600">
                      {contact.first_name || contact.last_name
                        ? `${contact.first_name || ""} ${contact.last_name || ""}`.trim()
                        : "—"}
                    </DataTableCell>
                    <DataTableCell>
                      <Select
                        value={contact.status}
                        onChange={(e) =>
                          void handleUpdateContactStatus(
                            contact.id,
                            e.target.value as Contact["status"]
                          )
                        }
                        className="h-9 w-36 text-sm"
                        disabled={actionLoading}
                      >
                        <option value="active">Active</option>
                        <option value="unsubscribed">Unsubscribed</option>
                        <option value="bounced">Bounced</option>
                        <option value="complained">Complained</option>
                      </Select>
                    </DataTableCell>
                    <DataTableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => void handleDeleteContact(contact.id)}
                        disabled={actionLoading}
                        aria-label="Delete contact"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DataTableCell>
                  </DataTableRow>
                ))
              )}
            </DataTableBody>
          </DataTable>

          {totalContacts > PAGE_SIZE && (
            <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                Showing {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of{" "}
                {totalContacts.toLocaleString()}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || actionLoading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages.toLocaleString()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || actionLoading}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
