import { apiRequest } from "./api";
import type { AiChatRequest, AiChatResponse } from "../types/api";

export function sendAiChat(request: AiChatRequest) {
  return apiRequest<AiChatResponse>("/ai/chat/", {
    method: "POST",
    body: request,
  });
}
