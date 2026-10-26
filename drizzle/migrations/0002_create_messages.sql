CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_appointment_idx ON public.messages(appointment_id, created_at);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access_appointment(_user_id uuid, _appointment_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'medico') OR EXISTS (
    SELECT 1 FROM public.appointments WHERE id = _appointment_id AND patient_id = _user_id
  )
$$;

CREATE POLICY "Participantes veem mensagens" ON public.messages FOR SELECT TO authenticated
  USING (public.can_access_appointment(auth.uid(), appointment_id));
CREATE POLICY "Participantes enviam mensagens" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.can_access_appointment(auth.uid(), appointment_id));

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;