import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { HeartPulse, LogOut, Stethoscope, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { AppointmentChat } from "@/components/AppointmentChat";
import { NotificationBell } from "@/components/NotificationBell";
import { SPECIALTIES, STATUS_LABEL, STATUS_OPTIONS, formatDate, type AppointmentStatus } from "@/lib/appointments";

export const Route = createFileRoute("/painel")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel | Simplificando o Atendimento de Saúde" },
      { name: "description", content: "Solicite consultas e acompanhe o status do atendimento." },
      { property: "og:title", content: "Painel | Saúde Simples" },
      { property: "og:description", content: "Área do paciente e área do médico." },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/" });
    const [{ data: roles }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", data.user.id),
      supabase.from("profiles").select("full_name").eq("id", data.user.id).maybeSingle(),
    ]);
    const isDoctor = (roles ?? []).some((r) => r.role === "medico");
    return { user: data.user, isDoctor, fullName: profile?.full_name || data.user.email || "" };
  },
  component: Painel,
});

type Appointment = {
  id: string;
  patient_id: string;
  specialty: string;
  preferred_date: string;
  reason: string;
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string } | null;
};

function Painel() {
  const { isDoctor, fullName, user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 font-display font-semibold text-primary">
            <HeartPulse className="h-6 w-6" /> Saúde Simples
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground sm:flex">
              {isDoctor ? <Stethoscope className="h-4 w-4" /> : <User className="h-4 w-4" />}
              {isDoctor ? "Médico(a)" : "Paciente"}: {fullName}
            </span>
            <NotificationBell userId={user.id} />
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        {isDoctor ? <AreaMedico /> : <AreaPaciente />}
      </main>
    </div>
  );
}

const requestSchema = z.object({
  specialty: z.string().min(2, "Escolha a especialidade"),
  preferred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data"),
  reason: z.string().trim().min(3, "Descreva o motivo").max(500, "Máximo de 500 caracteres"),
});

function AreaPaciente() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [specialty, setSpecialty] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", "mine", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Appointment[];
    },
  });

  const create = useMutation({
    mutationFn: async (values: z.infer<typeof requestSchema>) => {
      const { error } = await supabase.from("appointments").insert({ ...values, patient_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação enviada!");
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: () => toast.error("Não foi possível enviar a solicitação."),
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const parsed = requestSchema.safeParse({
      specialty,
      preferred_date: fd.get("preferred_date"),
      reason: fd.get("reason"),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos"); return; }
    create.mutate(parsed.data, {
      onSuccess: () => {
        form.reset();
        setSpecialty("");
      },
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Área do paciente</h1>
        <p className="text-muted-foreground">Solicite uma consulta e acompanhe o status.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form onSubmit={onSubmit} className="h-fit space-y-4 rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold">Nova solicitação</h2>
          <div className="space-y-2">
            <Label>Especialidade</Label>
            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger aria-label="Especialidade"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {SPECIALTIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferred_date">Data desejada</Label>
            <Input id="preferred_date" name="preferred_date" type="date" min={today} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da consulta</Label>
            <Textarea id="reason" name="reason" rows={4} maxLength={500} required />
          </div>
          <Button type="submit" className="w-full" disabled={create.isPending}>
            {create.isPending ? "Enviando..." : "Solicitar consulta"}
          </Button>
        </form>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Minhas solicitações</h2>
          {isLoading && <p className="text-muted-foreground">Carregando...</p>}
          {data && data.length === 0 && (
            <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
              Você ainda não fez nenhuma solicitação.
            </p>
          )}
          {data?.map((a) => (
            <article key={a.id} className="rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{a.specialty}</h3>
                <StatusBadge status={a.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Data desejada: {formatDate(a.preferred_date)}</p>
              <p className="mt-3 text-sm">{a.reason}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Atualizado em {new Date(a.updated_at).toLocaleString("pt-BR")}
                </p>
                <AppointmentChat appointmentId={a.id} patientId={a.patient_id} currentUserId={user.id}
                  title={`${a.specialty} · ${formatDate(a.preferred_date)}`} />
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

function AreaMedico() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"todas" | AppointmentStatus>("todas");

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Appointment[];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      const { error, data } = await supabase.from("appointments").update({ status }).eq("id", id).select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("sem permissão");
    },
    onSuccess: (_d, v) => {
      toast.success(`Status alterado para ${STATUS_LABEL[v.status]}.`);
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: () => toast.error("Não foi possível alterar o status."),
  });

  const list = (data ?? []).filter((a) => filter === "todas" || a.status === filter);
  const count = (s: AppointmentStatus) => (data ?? []).filter((a) => a.status === s).length;

  const history = (data ?? [])
    .filter((a) => a.status === "concluida")
    .filter((a) => (a.profiles?.full_name ?? "").toLowerCase().includes(search.trim().toLowerCase()))
    .sort((x, y) => y.updated_at.localeCompare(x.updated_at));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Área do médico</h1>
        <p className="text-muted-foreground">Visualize as solicitações e atualize o status.</p>
      </div>
      <div className="flex gap-2 border-b">
        {([["solicitacoes", "Solicitações"], ["historico", "Histórico de atendimentos"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === "historico" ? (
        <div className="space-y-4">
          <Input placeholder="Buscar por paciente" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          {isLoading && <p className="text-muted-foreground">Carregando...</p>}
          {data && history.length === 0 && (
            <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">Nenhum atendimento concluído.</p>
          )}
          <div className="space-y-3">
            {history.map((a) => (
              <article key={a.id} className="rounded-2xl border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{a.profiles?.full_name || "Paciente"}</h3>
                  <StatusBadge status={a.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {a.specialty} · Data desejada: {formatDate(a.preferred_date)}
                </p>
                <p className="mt-2 text-sm">{a.reason}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Concluído em {new Date(a.updated_at).toLocaleString("pt-BR")}
                  </p>
                  <AppointmentChat appointmentId={a.id} patientId={a.patient_id} currentUserId={user.id}
                    title={`${a.profiles?.full_name || "Paciente"} · ${a.specialty}`} />
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (<>
      <div className="grid gap-3 sm:grid-cols-3">
        {STATUS_OPTIONS.map((s) => (
          <div key={s} className="rounded-2xl border bg-card p-4">
            <StatusBadge status={s} />
            <p className="mt-2 font-display text-3xl font-bold">{count(s)}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {(["todas", ...STATUS_OPTIONS] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f === "todas" ? "Todas" : STATUS_LABEL[f]}
          </Button>
        ))}
      </div>
      {isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {data && list.length === 0 && (
        <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">Nenhuma solicitação.</p>
      )}
      <div className="space-y-3">
        {list.map((a) => (
          <article key={a.id} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-[1fr_200px] md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{a.profiles?.full_name || "Paciente"}</h3>
                <StatusBadge status={a.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {a.specialty} · Data desejada: {formatDate(a.preferred_date)}
              </p>
              <p className="mt-2 text-sm">{a.reason}</p>
              <div className="mt-3">
                <AppointmentChat appointmentId={a.id} patientId={a.patient_id} currentUserId={user.id}
                  title={`${a.profiles?.full_name || "Paciente"} · ${a.specialty}`} />
              </div>
            </div>
            <Select
              value={a.status}
              onValueChange={(v) => update.mutate({ id: a.id, status: v as AppointmentStatus })}
            >
              <SelectTrigger aria-label={`Status de ${a.profiles?.full_name ?? "paciente"}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </article>
        ))}
      </div>
    </div>
  );
}
