declare module 'ai/react' {
  import { UseChatOptions, UseChatHelpers } from 'ai';
  export function useChat(options?: UseChatOptions): UseChatHelpers;
}
