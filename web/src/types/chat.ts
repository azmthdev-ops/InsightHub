export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    analysis?: string;
    code?: string;
    isCode?: boolean; // true if code response, false if conversational
}

export interface ChatResponse {
    original_query: string;
    analysis?: string;
    generated_code?: string;
    response?: string; // conversational response
    is_code: boolean;
    fallback_used?: boolean;
}

export type RelayStatus = 'idle' | 'groq' | 'deepseek' | 'fastapi' | 'complete' | 'error';
