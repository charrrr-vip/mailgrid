import { cn } from "@/lib/utils";

export function DataTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-lg border border-gray-300", className)}>
      <table className="mf-table">{children}</table>
    </div>
  );
}

export function DataTableHead({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>;
}

export function DataTableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function DataTableRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <tr className={className}>{children}</tr>;
}

export function DataTableHeaderCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <th className={className}>{children}</th>;
}

export function DataTableCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={className}>{children}</td>;
}

export function DataTableEmpty({
  children,
  colSpan,
}: {
  children: React.ReactNode;
  colSpan: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="mf-table-empty">
        {children}
      </td>
    </tr>
  );
}
