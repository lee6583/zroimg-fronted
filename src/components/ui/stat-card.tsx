type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
};

export function StatCard(props: StatCardProps) {
  const label = props.label;
  const value = props.value;
  const hint = props.hint;

  return (
    <div className="surface rounded-xl p-4">
      <p className="label">{label}</p>
      <p className="mt-2 font-serif text-3xl font-medium">{value}</p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}
