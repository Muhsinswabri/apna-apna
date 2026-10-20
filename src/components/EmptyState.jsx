export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-brand-soft text-brand">
        <Icon size={36} strokeWidth={1.75} />
      </div>
      <h3 className="mb-1.5 text-lg font-bold">{title}</h3>
      <p className="mb-6 max-w-xs text-[15px] leading-relaxed text-mute">{text}</p>
      {action}
    </div>
  )
}
