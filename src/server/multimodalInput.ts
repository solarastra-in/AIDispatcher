export interface FileInput {
  mimeType: string;
  base64Data: string;
}

export function buildAnthropicMessageContent(prompt: string, files: FileInput[]) {
  const content: any[] = [];
  for (const f of files) {
    if (!f.mimeType.startsWith("image/")) continue;
    content.push({ type: "image", source: { type: "base64", media_type: f.mimeType, data: f.base64Data } });
  }
  content.push({ type: "text", text: prompt });
  return content;
}

export function buildOpenAIMessageContent(prompt: string, files: FileInput[]) {
  const content: any[] = [{ type: "text", text: prompt }];
  for (const f of files) {
    if (!f.mimeType.startsWith("image/")) continue;
    content.push({ type: "image_url", image_url: { url: `data:${f.mimeType};base64,${f.base64Data}` } });
  }
  return content;
}

export function buildGeminiContent(prompt: string, files: FileInput[]) {
  const parts: any[] = [];
  for (const f of files) {
    if (!f.mimeType.startsWith("image/") && f.mimeType !== "application/pdf") continue;
    parts.push({ inlineData: { mimeType: f.mimeType, data: f.base64Data } });
  }
  parts.push({ text: prompt });
  return parts;
}

export function buildMultimodalContent(provider: string, prompt: string, files: FileInput[]): any {
  if (files.length === 0) return null;
  switch (provider) {
    case "anthropic": return buildAnthropicMessageContent(prompt, files);
    case "openai": return buildOpenAIMessageContent(prompt, files);
    case "google": return buildGeminiContent(prompt, files);
    default: return null;
  }
}
