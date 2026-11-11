import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { HeartPulse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { translateAuthError } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha | Saúde Simples" },
      { name: "description", content: "Crie uma nova senha para sua conta do Saúde Simples." },
      { property: "og:title", content: "Nova senha | Saúde Simples" },
      { property: "og:description", content: "Redefina a senha da sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm") ?? "");
    if (password.length < 6) { toast.error("A senha deve ter ao menos 6 caracteres"); return; }
    if (password !== confirm) { toast.error("As senhas não coincidem"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(translateAuthError(error.message, "Não foi possível alterar a senha.")); return; }
    toast.success("Senha alterada com sucesso!");
    navigate({ to: "/painel" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-soft">
        <div className="mb-6 flex items-center gap-2 font-display font-semibold text-primary">
          <HeartPulse className="h-6 w-6" /> Saúde Simples
        </div>
        <h1 className="mb-4 text-2xl font-bold">Criar nova senha</h1>
        {ready ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar nova senha</Label>
              <Input id="confirm" name="confirm" type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            Abra esta página pelo link enviado ao seu e-mail. Se o link expirou, peça um novo na tela de login.
          </p>
        )}
      </div>
    </main>
  );
}
