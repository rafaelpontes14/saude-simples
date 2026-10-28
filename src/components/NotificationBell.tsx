import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Notification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};

export function NotificationBell({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const key = ["notifications", userId];

  const { data = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as Notification[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`notif-${userId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as Notification;
          toast(n.title, { description: n.body });
          qc.invalidateQueries({ queryKey: ["notifications", userId] });
          qc.invalidateQueries({ queryKey: ["appointments"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  const markAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const unread = data.filter((n) => !n.read).length;

  return (
    <Popover onOpenChange={(open) => { if (!open && unread > 0) markAll.mutate(); }}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative" aria-label="Notificações">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-semibold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">Notificações</h3>
          {unread > 0 && (
            <button className="text-xs text-primary hover:underline" onClick={() => markAll.mutate()}>
              Marcar como lidas
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {data.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma notificação.</p>
          )}
          {data.map((n) => (
            <div key={n.id} className={`border-b px-4 py-3 last:border-0 ${n.read ? "" : "bg-secondary"}`}>
              <p className="text-sm font-medium">{n.title}</p>
              {n.body && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{n.body}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
