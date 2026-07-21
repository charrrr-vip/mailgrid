"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Upload,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  FolderOpen,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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

const statusConfig: Record<
  Contact["status"],
  { variant: "success" | "warning" | "danger" | "default" }
> = {
  active: { variant: "success" },
  unsubscribed: { variant: "warning" },
  bounced: { variant: "danger" },
  complained: { variant: "danger" },
};

const PREVIEW_LIMIT = 3;

export default function ContactsPage() {
  const router = useRouter();
  const [lists, setLists] = useState<ContactList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactFirstName, setContactFirstName] = useState("");
  const [contactLastName, setContactLastName] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const selectedList = useMemo(
    () => lists.find((list) => list.id === selectedListId),
    [lists, selectedListId]
  );

  const previewContacts = useMemo(
    () => contacts.slice(0, PREVIEW_LIMIT),
    [contacts]
  );

  const hasMoreContacts = contacts.length > PREVIEW_LIMIT;

  const fetchLists = useCallback(async () => {
    const response = await fetch("/api/v1/contact-lists", { cache: "no-store" });
    const payload: ApiResponse<ContactList[]> = await response.json();
    if (!response.ok || payload.error) {
      throw new Error(payload.error?.message ?? "Failed to load lists");
    }
    setLists(payload.data);
    if (!selectedListId && payload.data.length > 0) {
      setSelectedListId(payload.data[0].id);
    }
  }, [selectedListId]);

  const fetchContacts = useCallback(async (listId: string) => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search.trim()) params.set("search", search.trim());

    const response = await fetch(`/api/v1/contact-lists/${listId}/contacts?${params.toString()}`, {
      cache: "no-store",
    });
    const payload: ApiResponse<Contact[]> = await response.json();
    if (!response.ok || payload.error) {
      throw new Error(payload.error?.message ?? "Failed to load contacts");
    }
    setContacts(payload.data);
  }, [search, statusFilter]);

  const refreshData = useCallback(async () => {
    setError(null);
    try {
      await fetchLists();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }, [fetchLists]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      void refreshData().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshData]);

  useEffect(() => {
    if (!selectedListId) return;
    const timer = setTimeout(() => {
      setActionLoading(true);
      void fetchContacts(selectedListId)
        .catch((e) => setError(e instanceof Error ? e.message : "Error"))
        .finally(() => setActionLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedListId, fetchContacts]);

  async function handleCreateList(e: FormEvent) {
    e.preventDefault();
    if (!listName.trim()) return;
    setActionLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/contact-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: listName.trim(),
          description: listDescription.trim(),
        }),
      });
      const payload: ApiResponse<ContactList> = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error?.message ?? "Creation failed");
      }
      setLists((prev) => [payload.data, ...prev]);
      setSelectedListId(payload.data.id);
      setListName("");
      setListDescription("");
      setSuccess("List created successfully!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRenameList(list: ContactList) {
    const nextName = window.prompt("New list name", list.name);
    if (!nextName || !nextName.trim() || nextName.trim() === list.name) return;
    setActionLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/contact-lists/${list.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName.trim() }),
      });
      const payload: ApiResponse<ContactList> = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error?.message ?? "Update failed");
      }
      setLists((prev) =>
        prev.map((item) => (item.id === list.id ? { ...item, name: payload.data.name } : item))
      );
      setSuccess("List renamed successfully!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteList(list: ContactList) {
    const confirmed = window.confirm(
      `Delete list "${list.name}"? All associated contacts will be deleted.`
    );
    if (!confirmed) return;
    setActionLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/contact-lists/${list.id}`, {
        method: "DELETE",
      });
      const payload: ApiResponse<{ deleted: boolean }> = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error?.message ?? "Delete failed");
      }

      const nextLists = lists.filter((item) => item.id !== list.id);
      setLists(nextLists);
      if (selectedListId === list.id) {
        setSelectedListId(nextLists[0]?.id ?? "");
        setContacts([]);
      }
      setSuccess("List deleted successfully!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCreateContact(e: FormEvent) {
    e.preventDefault();
    if (!selectedListId || !contactEmail.trim()) return;
    setActionLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/contact-lists/${selectedListId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: contactEmail.trim(),
          first_name: contactFirstName.trim(),
          last_name: contactLastName.trim(),
        }),
      });
      const payload: ApiResponse<Contact> = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error?.message ?? "Contact creation failed");
      }
      setContactEmail("");
      setContactFirstName("");
      setContactLastName("");
      await fetchLists();
      await fetchContacts(selectedListId);
      setSuccess("Contact added successfully!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleImportCsv(e: FormEvent) {
    e.preventDefault();
    if (!selectedListId || !csvFile) return;
    setImporting(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append("file", csvFile);

      const response = await fetch(`/api/v1/contact-lists/${selectedListId}/contacts/import`, {
        method: "POST",
        body: formData,
      });
      const payload: ApiResponse<{ imported: number; skipped: number }> = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error?.message ?? "Import failed");
      }

      setSuccess(`Import complete: ${payload.data.imported} added, ${payload.data.skipped} skipped.`);
      setCsvFile(null);
      await fetchLists();
      await fetchContacts(selectedListId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setImporting(false);
    }
  }

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
        throw new Error(payload.error?.message ?? "Status update failed");
      }
      setContacts((prev) =>
        prev.map((item) => (item.id === contactId ? { ...item, status: payload.data.status } : item))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteContact(contactId: string) {
    const confirmed = window.confirm("Delete this contact?");
    if (!confirmed) return;
    setActionLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/contacts/${contactId}`, {
        method: "DELETE",
      });
      const payload: ApiResponse<{ deleted: boolean }> = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error?.message ?? "Delete failed");
      }
      setContacts((prev) => prev.filter((item) => item.id !== contactId));
      await fetchLists();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setActionLoading(false);
    }
  }

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (loading) {
    return <PageLoader label="Loading contacts..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Contacts
        </h1>
        <p className="mt-1 text-gray-600">
          Manage your contact lists and subscribers
        </p>
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

      {/* Add Contact & Import — placed above the list preview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-muted-foreground" />
              Add Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-3" onSubmit={handleCreateContact}>
              <div>
                <Label required>Email</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label optional>First Name</Label>
                <Input
                  placeholder="John"
                  value={contactFirstName}
                  onChange={(e) => setContactFirstName(e.target.value)}
                />
              </div>
              <div>
                <Label optional>Last Name</Label>
                <Input
                  placeholder="Doe"
                  value={contactLastName}
                  onChange={(e) => setContactLastName(e.target.value)}
                />
              </div>
              <div className="sm:col-span-3">
                <Button type="submit" disabled={!selectedListId} loading={actionLoading}>
                  <Plus className="h-4 w-4" />
                  Add Contact
                </Button>
                {!selectedListId && (
                  <p className="mt-2 text-xs text-gray-500">Select a list first.</p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-muted-foreground" />
              Import contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleImportCsv}>
              <p className="text-sm text-gray-600">
                Upload a CSV with{" "}
                <code className="rounded bg-gray-100 px-1 text-xs">email</code>,{" "}
                <code className="rounded bg-gray-100 px-1 text-xs">first_name</code>,{" "}
                <code className="rounded bg-gray-100 px-1 text-xs">last_name</code>
                , or a TXT file with one email per line. A header row is optional for CSV.
              </p>
              <Input
                type="file"
                accept=".csv,text/csv,.txt,text/plain"
                onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
              />
              <Button
                type="submit"
                disabled={!selectedListId || !csvFile}
                loading={importing}
                loadingText="Importing..."
              >
                <Upload className="h-4 w-4" />
                Import Contacts
              </Button>
              {!selectedListId && (
                <p className="text-xs text-gray-500">Select a list before importing.</p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lists Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
              Contact Lists
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                  <Users className="h-6 w-6 text-slate-400" />
                </div>
                <p className="mt-3 text-sm text-slate-500">No lists yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lists.map((list) => {
                  const isSelected = selectedListId === list.id;
                  return (
                    <div
                      key={list.id}
                      className={`rounded-lg border p-3 transition-all ${
                        isSelected
                          ? "border-primary bg-primary-pale"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedListId(list.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate font-medium text-gray-900">{list.name}</p>
                            <Badge variant="default" size="sm">
                              {list.contact_count}
                            </Badge>
                          </div>
                          {list.description && (
                            <p className="mt-1 text-xs text-gray-500">{list.description}</p>
                          )}
                        </button>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => void handleRenameList(list)}
                            aria-label="Rename list"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => void handleDeleteList(list)}
                            aria-label="Delete list"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Create List Form */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <p className="mb-3 text-sm font-medium text-gray-700">Create New List</p>
              <form className="space-y-3" onSubmit={handleCreateList}>
                <Input
                  placeholder="List name"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  required
                />
                <Input
                  placeholder="Description (optional)"
                  value={listDescription}
                  onChange={(e) => setListDescription(e.target.value)}
                />
                <Button type="submit" className="w-full" loading={actionLoading}>
                  <Plus className="h-4 w-4" />
                  Create List
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Contacts Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              {selectedList ? selectedList.name : "Contacts"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by email..."
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="unsubscribed">Unsubscribed</option>
                <option value="bounced">Bounced</option>
                <option value="complained">Complained</option>
              </Select>
            </div>

            {/* Contacts Table */}
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
                  previewContacts.map((contact) => (
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

            {hasMoreContacts && selectedListId && (
              <div className="flex justify-center border-t border-gray-200 pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/contacts/${selectedListId}`)}
                >
                  See more ({contacts.length - PREVIEW_LIMIT} more)
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
