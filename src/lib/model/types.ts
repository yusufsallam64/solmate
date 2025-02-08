export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface MessageImage {
    role: 'system' | 'user' | 'assistant';
    content: {
        type: string;
        image_url: {
            url: string;
            detail: string;
        }
    }
}

export interface AIRequest {
    messages: (Message | MessageImage)[];
}
  
export interface AIResponse {
    result: {
        response: string;
    };
    success: boolean;
    errors: any[];
    messages: any[];
}