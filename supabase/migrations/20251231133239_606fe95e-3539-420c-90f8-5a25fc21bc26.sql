-- Habilitar RLS na tabela achievements e criar política de leitura pública
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read achievements"
ON public.achievements
FOR SELECT
USING (true);