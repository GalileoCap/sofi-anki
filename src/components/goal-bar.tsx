/** How far toward a goal, as a green bar filled to `share` (0 to 1, more is drawn full). */
export function GoalBar({ share }: { share: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-green-500 transition-all duration-300" style={{ width: `${Math.min(100, share * 100)}%` }} />
    </div>
  );
}
