CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications select" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own notifications delete" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.notify_doctors(_appointment uuid, _title text, _body text, _except uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.notifications(user_id, appointment_id, title, body)
  SELECT ur.user_id, _appointment, _title, _body FROM public.user_roles ur
  WHERE ur.role = 'medico' AND ur.user_id IS DISTINCT FROM _except;
$$;
REVOKE EXECUTE ON FUNCTION public.notify_doctors(uuid, text, text, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.trg_appointment_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pname text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT full_name INTO pname FROM public.profiles WHERE id = NEW.patient_id;
    PERFORM public.notify_doctors(NEW.id, 'Nova solicitação de consulta',
      coalesce(pname, 'Paciente') || ' · ' || NEW.specialty, NULL);
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications(user_id, appointment_id, title, body)
    VALUES (NEW.patient_id, NEW.id, 'Status da consulta atualizado',
      NEW.specialty || ': ' || CASE NEW.status WHEN 'pendente' THEN 'Pendente' WHEN 'confirmada' THEN 'Confirmada' ELSE 'Concluída' END);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER appointments_notify AFTER INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.trg_appointment_notify();

CREATE OR REPLACE FUNCTION public.trg_message_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a record; sname text;
BEGIN
  SELECT id, patient_id, specialty INTO a FROM public.appointments WHERE id = NEW.appointment_id;
  SELECT full_name INTO sname FROM public.profiles WHERE id = NEW.sender_id;
  IF NEW.sender_id = a.patient_id THEN
    PERFORM public.notify_doctors(a.id, 'Nova mensagem de ' || coalesce(sname, 'paciente'), left(NEW.content, 120), NEW.sender_id);
  ELSE
    INSERT INTO public.notifications(user_id, appointment_id, title, body)
    VALUES (a.patient_id, a.id, 'Nova mensagem do(a) médico(a)', left(NEW.content, 120));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER messages_notify AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.trg_message_notify();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;