import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Message = { id: string; sender_id: string; content: string; created_at: string };

export function AppointmentChat(props: {
  appointmentId: string;
  patientId: string;
  currentUserId: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><MessageCircle className="h-4 w-4" /> Chat</Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Conversa</DialogTitle>
          <DialogDescription>{props.title}</DialogDescription>
        </DialogHeader>
        {open && <ChatBody {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function ChatBody({ appointmentId, patientId, currentUserId }: { appointmentId: string; patientId: string; currentUserId: string }) {
  const qc = useQueryClient();
  const key = ["messages", appointmentId];
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("appointment_id", appointmentId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${appointmentId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `appointment_id=eq.${appointmentId}` },
        () => qc.invalidateQueries({ queryKey: ["messages", appointmentId] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [appointmentId, qc]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [data?.length]);

  const send = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("messages").insert({ appointment_id: appointmentId, sender_id: currentUserId, content });
      if (error) throw error;
    },
    onSuccess: () => { setText(""); qc.invalidateQueries({ queryKey: key }); },
    onError: () => toast.error("Não foi possível enviar a mensagem."),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    if (content.length > 1000) { toast.error("Máximo de 1000 caracteres"); return; }
    send.mutate(content);
  }

  const label = (senderId: string) =>
    senderId === currentUserId ? "Você" : senderId === patientId ? "Paciente" : "Médico(a)";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="h-80 space-y-3 overflow-y-auto rounded-xl border bg-muted/40 p-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {error && <p className="text-sm text-destructive">Não foi possível carregar as mensagens.</p>}
        {data && data.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma mensagem ainda. Envie a primeira!</p>
        )}
        {data?.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
              <div className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                mine ? "bg-primary text-primary-foreground" : "border bg-card")}>
                <p className="mb-0.5 text-xs font-semibold opacity-80">{label(m.sender_id)}</p>
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
              </div>
              <span className="mt-1 text-[11px] text-muted-foreground">
                {new Date(m.created_at).toLocaleString("pt-BR")}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={onSubmit} className="flex items-end gap-2">
        <Textarea
          aria-label="Mensagem"
          placeholder="Digite sua mensagem..."
          rows={2}
          maxLength={1000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(e); } }}
        />
        <Button type="submit" disabled={send.isPending || !text.trim()}>
          <Send className="h-4 w-4" /> Enviar
        </Button>
      </form>
    </div>
  );
}
