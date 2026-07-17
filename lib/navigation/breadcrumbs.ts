const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  contacts: "Contacts",
  lists: "All contacts",
  templates: "Templates",
  campaigns: "Campaigns",
  analytics: "Analytics",
  settings: "Settings",
  new: "New",
  edit: "Edit",
};

export function getBreadcrumbs(pathname: string): { label: string; path?: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [];

  const crumbs: { label: string; path?: string }[] = [];
  let currentPath = "";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;
    const isListId =
      segments[i - 1] === "contacts" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
    const label = isListId
      ? "All contacts"
      : LABELS[segment] ?? (segment.length > 20 ? "Details" : segment);

    crumbs.push({
      label,
      path: i < segments.length - 1 ? currentPath : undefined,
    });
  }

  return crumbs;
}
