export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      {description && <p className="mt-1 text-gray-600">{description}</p>}
    </div>
  );
}
