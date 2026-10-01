import { LucideIcon } from "lucide-react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-14">
      <div className="flex items-center justify-center w-[5.5rem] h-[5.5rem] rounded-full bg-gradient-to-br from-brand-50 to-brand-100 border-[1.5px] border-brand-200 text-brand-700 mb-5">
        <Icon size={30} strokeWidth={1.25} />
      </div>
      <h3 className="font-display text-[19px] font-bold text-ink-900">{title}</h3>
      {description && (
        <p className="text-[0.8125rem] text-ink-500 mt-1.5 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
