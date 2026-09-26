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
  sender?: string | null;
  sender_contact_id?: string | null;
  direction?: "inbound" | "outbound" | string;
  body?: string | null;
  text?: string | null;
  type?: string;
  status?: string | null;
  transcription?: {
    status: string;
    text?: string;
    language?: string;
    model?: string;
    transcribed_at?: string;
  } | null;
  timestamp: string;
  [key: string]: unknown;
};

export type Dashboard = {
  contacts: number;
  conversations: number;
  messages: number;
  messages_inbound: number;
  messages_outbound: number;
  messages_last_7d: number;
  messages_last_30d: number;
  groups: number;
  directs: number;
  active_conversations_7d: number;
  last_message_at?: string | null;
  last_webhook_at?: string | null;
  uazapi_status: string;
  version: string;
  traffic: DashboardTrafficDay[];
  message_types: DashboardNamedCount[];
  top_conversations: DashboardTopConversation[];
};

export type DashboardTrafficDay = {
  date: string;
  inbound: number;
  outbound: number;
};

export type DashboardNamedCount = {
  name: string;
  count: number;
};

export type DashboardTopConversation = {
  id: string;
  title: string;
  type: string;
  message_count: number;
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

export type DenylistEntry = {
  id: string;
  target_type: "conversation" | "contact" | string;
  target_id: string;
  target_label?: string | null;
  reason?: string | null;
  created_at: string;
};

export type SystemOverview = {
  generated_at: string;
  version: string;
  started_at: string;
  database: {
    size_bytes: number;
    messages_last_24h: number;
    last_message_at?: string | null;
    last_webhook_at?: string | null;
    migration_version?: number | null;
    denylist_entries: number;
  };
  pool: {
    max_connections: number;
    total_connections: number;
    idle_connections: number;
    acquired_connections: number;
  };
  queues: {
    transcription_pending: number;
    transcription_processing: number;
    transcription_retry: number;
    transcription_failed: number;
  };
};

export type StaleConversation = {
  id: string;
  type: string;
  title?: string | null;
  last_message_at?: string | null;
  created_at: string;
  message_count: number;
  inactive_days: number;
  blocked?: boolean;
};

export type StaleConversationsResponse = {
  data: StaleConversation[];
  next_cursor?: string | null;
  days: number;
};

export type TaskStatus = "pending" | "in_progress" | "done" | "cancelled";

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  company?: string | null;
  status: TaskStatus | string;
  due_at?: string | null;
  conversation_id?: string | null;
  contact_id?: string | null;
  conversation_title?: string | null;
  contact_name?: string | null;
  created_at: string;
  updated_at: string;
};

export type MemorySource = "note" | "message";
export type EmbeddingStatus = "pending" | "ready" | "failed";

export type Memory = {
  id: string;
  title?: string;
  content: string;
  source: MemorySource | string;
  message_id?: string;
  conversation_id?: string;
  contact_id?: string;
  conversation_title?: string;
  contact_name?: string;
  embedding_status: EmbeddingStatus | string;
  embedding_model?: string;
  embedding_error?: string;
  created_at: string;
  updated_at: string;
};

export type MemorySearchHit = {
  memory: Memory;
  score: number;
};

export type MemorySearchResult = {
  hits: MemorySearchHit[];
};
