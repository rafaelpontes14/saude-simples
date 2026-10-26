import { STATUS_LABEL, type AppointmentStatus } from "@/lib/appointments";
import { cn } from "@/lib/utils";

const styles: Record<AppointmentStatus, string> = {
  pendente: "bg-status-pendente text-status-pendente-foreground",
  confirmada: "bg-status-confirmada text-status-confirmada-foreground",
  concluida: "bg-status-concluida text-status-concluida-foreground",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", styles[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}
