-- WhatsApp inbox (admin v1): conversations + messages

CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  wa_from TEXT NOT NULL,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_conversations_wa_from_key
  ON public.whatsapp_conversations (wa_from);

CREATE INDEX IF NOT EXISTS whatsapp_conversations_last_message_at_idx
  ON public.whatsapp_conversations (last_message_at DESC);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access whatsapp_conversations"
  ON public.whatsapp_conversations
  FOR ALL
  USING (true)
  WITH CHECK (true);


CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_phone TEXT,
  body TEXT,
  wa_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS whatsapp_messages_conversation_id_created_at_idx
  ON public.whatsapp_messages (conversation_id, created_at ASC);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access whatsapp_messages"
  ON public.whatsapp_messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

