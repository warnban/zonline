import Link from "next/link";
import { ServiceIconBadge, type ServiceId } from "@/components/icons/service-icons";

type Props = {
  href: string;
  id: ServiceId;
  title: string;
  desc: string;
};

export function ServiceTile({ href, id, title, desc }: Props) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5 transition-all hover:border-accent/40 hover:bg-surface-elevated"
    >
      <ServiceIconBadge id={id} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium group-hover:text-accent">{title}</p>
        <p className="truncate text-xs text-muted">{desc}</p>
      </div>
    </Link>
  );
}
