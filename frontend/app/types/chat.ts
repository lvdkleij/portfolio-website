export type JobAttachmentSource = 'paste' | 'file' | 'link'

export type JobAttachment = {
  id: string
  source: JobAttachmentSource
  label: string
  textExcerpt?: string
  fileType?: string
  fileSize?: number
  url?: string
}

export type ChatSubmission = {
  prompt: string
  attachment?: JobAttachment
}

export type ChatRole = 'user' | 'assistant'
export type ChatState = 'idle' | 'connecting' | 'streaming' | 'complete' | 'error' | 'cancelled'
export type ChatTraceState = 'pending' | 'active' | 'complete' | 'error'

export type PastedJobAttachment = {
  type: 'pasted_job'
  label: string
  content: string
}

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  attachment?: PastedJobAttachment
}

export type ChatRequest = {
  clientRequestId: string
  messages: ChatMessage[]
}

export type ChatTraceStage = {
  id: string
  code?: string
  label: string
  state: ChatTraceState
  detail?: string
  result?: string
  durationMs?: number
  kind?: 'stage' | 'tool'
}

export type ChatSource = {
  id: string
  title: string
  kind?: string
  detail?: string
  url?: string
}

export type ChatUsage = {
  inputTokens?: number
  outputTokens?: number
}

export type ChatStreamStatusEvent = {
  type: 'status'
  requestId?: string
  model?: string
  stage: ChatTraceStage
}

export type ChatStreamDeltaEvent = {
  type: 'delta'
  text: string
}

export type ChatStreamSourcesEvent = {
  type: 'sources'
  sources: ChatSource[]
}

export type ChatStreamDoneEvent = {
  type: 'done'
  requestId?: string
  finishReason?: string
  durationMs?: number
  usage?: ChatUsage
  model?: string
}

export type ChatStreamErrorEvent = {
  type: 'error'
  requestId?: string
  code: string
  message: string
  retryable?: boolean
}

export type ChatStreamEvent =
  | ChatStreamStatusEvent
  | ChatStreamDeltaEvent
  | ChatStreamSourcesEvent
  | ChatStreamDoneEvent
  | ChatStreamErrorEvent

export type ChatClientError = {
  code: string
  message: string
  retryable: boolean
  status?: number
  retryAfterSeconds?: number
}

export type ChatRuntimeContext = {
  state: ChatState
  requestId?: string
  model?: string
  durationMs?: number
  trace: ChatTraceStage[]
  sources: ChatSource[]
  usage?: ChatUsage
}
