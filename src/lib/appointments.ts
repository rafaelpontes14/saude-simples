export type AppointmentStatus = "pendente" | "confirmada" | "concluida";

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pendente: "Pendente",
  confirmada: "Confirmada",
  concluida: "Concluída",
};

export const STATUS_OPTIONS: AppointmentStatus[] = ["pendente", "confirmada", "concluida"];

export const SPECIALTIES = [
  "Clínica geral",
  "Cardiologia",
  "Dermatologia",
  "Pediatria",
  "Ortopedia",
  "Ginecologia",
];

export function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}
