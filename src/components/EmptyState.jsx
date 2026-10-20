/** Pass `illustration` (an SVG node) for the friendly look, or `icon` for a compact fallback. */
export function EmptyState({ icon: Icon, illustration, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      {illustration ? (
        <div className="mb-3 w-full max-w-[220px]">{illustration}</div>
      ) : (
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-brand-soft text-accent">
          <Icon size={36} strokeWidth={1.75} />
        </div>
      )}
      <h3 className="mb-1.5 text-xl font-bold tracking-tight">{title}</h3>
      <p className="mb-6 max-w-xs text-[15px] font-medium leading-relaxed text-mute">{text}</p>
      {action}
    </div>
  )
}
