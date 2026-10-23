import { cn } from "@/lib/utils";
import {
  PRIORITY_CLASS,
  PRIORITY_LABEL,
  STATUS_DOT,
  STATUS_LABEL,
  type Profile,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks";

export function PriorityBadge({ p }: { p: TaskPriority }) {
  return (
    <span className={cn("inline-flex rounded px-2 py-0.5 text-xs font-medium", PRIORITY_CLASS[p])}>
      {PRIORITY_LABEL[p]}
    </span>
  );
}

export function StatusLabel({ s }: { s: TaskStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className={cn("size-2 rounded-full", STATUS_DOT[s])} />
      {STATUS_LABEL[s]}
    </span>
  );
}

export function Avatars({ people }: { people: Profile[] }) {
  if (!people.length) return <span className="text-xs text-muted-foreground">Chưa giao</span>;
  return (
    <div className="flex -space-x-1.5">
      {people.slice(0, 4).map((p) => (
        <span
          key={p.id}
          title={p.full_name || p.email}
          className="grid size-6 place-items-center rounded-full border-2 border-card bg-accent text-[10px] font-semibold text-accent-foreground"
        >
          {(p.full_name || p.email).slice(0, 1).toUpperCase()}
        </span>
      ))}
      {people.length > 4 && (
        <span className="grid size-6 place-items-center rounded-full border-2 border-card bg-muted text-[10px]">
          +{people.length - 4}
        </span>
      )}
    </div>
  );
}
