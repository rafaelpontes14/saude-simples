import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { HeartPulse, CalendarCheck, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrar | Simplificando o Atendimento de Saúde" },
      { name: "description", content: "Acesse ou crie sua conta para solicitar e acompanhar consultas." },
      { property: "og:title", content: "Simplificando o Atendimento de Saúde" },
      { property: "og:description", content: "Solicite e acompanhe consultas médicas de forma simples." },
    ],
  }),
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres").max(72),
});
const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(3, "Informe seu nome completo").max(100),
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/painel", replace: true });
    });
  }, [navigate]);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) { toast.error("E-mail ou senha incorretos."); return; }
    navigate({ to: "/painel" });
  }

  async function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signupSchema.safeParse({
      fullName: fd.get("fullName"),
      email: fd.get("email"),
      password: fd.get("password"),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos"); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { emailRedirectTo: window.location.origin, data: { full_name: parsed.data.fullName } },
    });
    setLoading(false);
    if (error) { toast.error(error.message.includes("registered") ? "Este e-mail já está cadastrado." : error.message); return; }
    if (!data.session) { toast.success("Conta criada! Verifique seu e-mail para confirmar."); return; }
    toast.success("Conta criada com sucesso!");
    navigate({ to: "/painel" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-hero p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2 font-display text-lg font-semibold">
          <HeartPulse className="h-6 w-6" /> Saúde Simples
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">Simplificando o Atendimento de Saúde</h1>
          <p className="max-w-md text-primary-foreground/85">
            Solicite consultas em poucos cliques e acompanhe cada etapa até o atendimento.
          </p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3"><CalendarCheck className="h-5 w-5" /> Solicitação rápida de consultas</li>
            <li className="flex items-center gap-3"><ShieldCheck className="h-5 w-5" /> Seus dados visíveis apenas para você e a equipe médica</li>
          </ul>
        </div>
        <p className="text-xs text-primary-foreground/70">Projeto acadêmico — dados fictícios</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2 font-display font-semibold text-primary">
              <HeartPulse className="h-6 w-6" /> Saúde Simples
            </div>
            <h1 className="mt-3 text-2xl font-bold">Simplificando o Atendimento de Saúde</h1>
          </div>
          <div className="rounded-2xl border bg-card p-8 shadow-soft">
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="mt-6 space-y-4">
                  <Field id="login-email" name="email" label="E-mail" type="email" />
                  <Field id="login-password" name="password" label="Senha" type="password" />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="mt-6 space-y-4">
                  <Field id="signup-name" name="fullName" label="Nome completo" />
                  <Field id="signup-email" name="email" label="E-mail" type="email" />
                  <Field id="signup-password" name="password" label="Senha (mín. 6 caracteres)" type="password" />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Criando conta..." : "Criar conta de paciente"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Novas contas são de paciente. O perfil de médico é atribuído pela administração.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ id, name, label, type = "text" }: { id: string; name: string; label: string; type?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type={type} required />
    </div>
  );
}
