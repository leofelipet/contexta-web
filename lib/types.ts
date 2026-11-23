export type Paginated<T> = { data: T[]; next_cursor?: string | null };

export type Contact = {
  id: string;
  name?: string | null;
  push_name?: string | null;
  phone?: string | null;
  profile_picture_url?: string | null;
  company_id?: string | null;
  company_name?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type Conversation = {
  id: string;
  contact_id?: string;
  type: string;
  title?: string | null;
  company_id?: string | null;
  company_name?: string | null;
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

export type PushoverIntegration = {
  configured: boolean;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PushoverSound = {
  id: string;
  name: string;
};

export type ReminderStatus = "pending" | "sent" | "failed";

export type Reminder = {
  id: string;
  title?: string | null;
  message: string;
  priority: number;
  sound?: string | null;
  send_at: string;
  status: ReminderStatus;
  attempts: number;
  last_error?: string | null;
  sent_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type McpTool = { name: string; description: string; read_only: boolean };

export type McpAccess = "read" | "write" | "custom";

export type McpKey = {
  id: string;
  name: string;
  prefix: string;
  access: McpAccess;
  tools: string[];
  created_at: string;
  expires_at?: string | null;
  last_used_at?: string | null;
};

export type McpStatus = {
  enabled: boolean;
  endpoint: string;
  authentication: string;
  tools: McpTool[] | null;
  last_access_at?: string | null;
};

export type EmailAccount = {
  id: string;
  name: string;
  address: string;
  username: string;
  imap_host: string;
  imap_port: number;
  imap_use_tls: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_use_tls: boolean;
  save_sent_copy: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type EmailTestResult = {
  imap_ok: boolean;
  smtp_ok: boolean;
  imap_error?: string;
  smtp_error?: string;
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

export type TaskStatus = "pending" | "in_progress" | "blocked" | "done" | "cancelled";

export type TaskMemoryRef = {
  id: string;
  title?: string;
  source?: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  company_id?: string | null;
  company_name?: string | null;
  status: TaskStatus | string;
  due_at?: string | null;
  conversation_id?: string | null;
  contact_id?: string | null;
  conversation_title?: string | null;
  contact_name?: string | null;
  schedule_id?: string | null;
  memories?: TaskMemoryRef[];
  created_at: string;
  updated_at: string;
};

export type TaskSchedule = {
  id: string;
  cron: string;
  timezone: string;
  enabled: boolean;
  skip_if_open: boolean;
  title: string;
  description?: string | null;
  company_id?: string | null;
  company_name?: string | null;
  due_in_minutes?: number | null;
  conversation_id?: string | null;
  contact_id?: string | null;
  notify: boolean;
  notify_priority: number;
  notify_sound?: string | null;
  next_run_at?: string | null;
  last_run_at?: string | null;
  last_task_id?: string | null;
  run_count: number;
  created_at: string;
  updated_at: string;
};

export type CompanyLink = {
  label: string;
  url: string;
};

export type Company = {
  id: string;
  name: string;
  notes?: string | null;
  rules?: string | null;
  links?: CompanyLink[] | null;
  open_task_count: number;
  task_count: number;
  contact_count: number;
  conversation_count?: number;
  memory_count?: number;
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
  company_id?: string;
  conversation_title?: string;
  contact_name?: string;
  company_name?: string;
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
