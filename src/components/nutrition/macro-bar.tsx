interface MacroBarProps {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  color: string;
}

export function MacroBar({
  label,
  consumed,
  target,
  unit,
  color,
}: MacroBarProps) {
  const percent = Math.min(Math.round((consumed / target) * 100), 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {consumed}{unit} / {target}{unit}
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted">
        <div
          className={`h-2.5 rounded-full transition-all ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
