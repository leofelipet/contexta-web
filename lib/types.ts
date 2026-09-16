export type Paginated<T> = { data: T[]; next_cursor?: string | null };

export type Contact = {
  id: string;
  name?: string | null;
  push_name?: string | null;
  phone?: string | null;
  profile_picture_url?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type Conversation = {
  id: string;
  contact_id?: string;
  type: string;
  title?: string | null;
  last_message?: Message | null;
  last_message_at?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type Message = {
  id: string;
  conversation_id?: string;
  direction?: "inbound" | "outbound" | string;
  body?: string | null;
  text?: string | null;
  type?: string;
  status?: string | null;
  timestamp: string;
  [key: string]: unknown;
};

export type Dashboard = {
  contacts: number;
  conversations: number;
  messages: number;
  last_message_at?: string | null;
  last_webhook_at?: string | null;
  uazapi_status: string;
};

export type UazapiIntegration = {
  instance: { id: string; name: string; status: string; profile_name: string };
  connection: { connected: boolean; logged_in: boolean };
  webhook: { configured: boolean; enabled: boolean; events: string[] };
  checked_at: string;
};

export type McpStatus = {
  enabled: boolean;
  endpoint: string;
  authentication: string;
  tools: string[];
  last_access_at?: string | null;
};

export type Activity = {
  id: string;
  category: string;
  level: string;
  operation: string;
  outcome: string;
  entity_type?: string;
  entity_id?: string;
  metadata: Record<string, unknown>;
  occurred_at: string;
};
