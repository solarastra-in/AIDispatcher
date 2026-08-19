import { useState } from "react";
import ChatHistorySidebar from "../components/ChatHistorySidebar";
import ExpandableComposer from "../components/ExpandableComposer";
import ModelAvailabilityPanel from "../components/ModelAvailabilityPanel";
import ContextPreviewPanel from "../components/ContextPreviewPanel";
import OutputArtifactPanel, { type OutputArtifact } from "../components/OutputArtifactPanel";
import CorroboratePanel from "../components/CorroboratePanel";
import RelayPanel from "../components/RelayPanel";
import FileUploadZone, { type UploadedFile, readAsBase64 } from "../components/FileUploadZone";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { authedFetch } from "../lib/firebaseClient";

type DispatchMode = "chat" | "corroborate" | "relay";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  artifact?: OutputArtifact;
}

export default function Workspace() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mode, setMode] = useState<DispatchMode>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [sending, setSending] = useState(false);

  const uploadedMimeTypes = uploadedFiles.map((f) => f.mimeType);

  async function handleSend(effectivePrompt: string, rawUserPrompt: string) {
    if (!sessionId) return;
    setSending(true);
    setMessages((m) => [...m, { role: "user", content: rawUserPrompt }]);

    try {
      for (const f of uploadedFiles) {
        if (!f.base64) f.base64 = await readAsBase64(f.file);
      }

      const res = await authedFetch("/api/dispatch/output", {
        method: "POST",
        body: JSON.stringify({
          prompt: effectivePrompt,
          provider: selectedModelId ? selectedModelId.split(":")[0] : "google",
          modelId: selectedModelId ? selectedModelId.split(":")[1] : "gemini-2.5-flash",
          outputFormat: "auto",
          sessionId,
          files: uploadedFiles.map((f) => ({ mimeType: f.mimeType, base64Data: f.base64 })),
        }),
      });
      const data = await res.json();
      if (data.format === "text") {
        setMessages((m) => [...m, { role: "assistant", content: data.text }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.text || "(file generated)", artifact: data }]);
      }
      setUploadedFiles([]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="h-screen bg-[#0F1216] text-[#E7E9EC] flex overflow-hidden">
      <ChatHistorySidebar
        activeSessionId={sessionId}
        onSelectSession={setSessionId}
        onNewChat={() => setMessages([])}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP BAR */}
        <div className="h-14 border-b border-[#2A2F38] flex items-center justify-between px-5 shrink-0 bg-[#12151B]">
          <div className="flex items-center gap-1">
            {(["chat", "corroborate", "relay"] as DispatchMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`text-xs px-3.5 py-1.5 rounded font-mono capitalize cursor-pointer ${
                  mode === m ? "bg-[#FF8A3D] text-[#171208]" : "text-[#93999F] hover:text-[#E7E9EC]"
                }`}
              >
                {m === "chat" ? "Dispatch" : m}
              </button>
            ))}
          </div>
          <GoogleSignInButton />
        </div>

        {!sessionId ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-[#93999F]">Select a chat or click "+ New chat" from the sidebar to begin.</p>
          </div>
        ) : mode === "corroborate" ? (
          <div className="flex-1 overflow-y-auto p-6">
            <CorroboratePanel
              prompt={messages[messages.length - 1]?.content || ""}
              modelA={{ provider: "openai", modelId: "gpt-4o", label: "GPT-4o" }}
              modelB={{ provider: "anthropic", modelId: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" }}
            />
          </div>
        ) : mode === "relay" ? (
          <div className="flex-1 overflow-y-auto p-6">
            <RelayPanel />
          </div>
        ) : (
          <>
            {/* MESSAGE THREAD */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-sm">
                  Conversation started. Enter your prompt below to dispatch to optimal AI model.
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div className={`max-w-[75%] rounded-xl p-3.5 ${msg.role === "user" ? "bg-[#FF8A3D] text-[#171208]" : "bg-[#171B21] border border-[#2A2F38]"}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.artifact && (
                      <div className="mt-3">
                        <OutputArtifactPanel artifact={msg.artifact} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sending && <p className="text-xs text-[#5B6169] font-mono">Dispatching…</p>}
            </div>

            {/* CONTEXT PREVIEW */}
            <div className="px-6">
              <ContextPreviewPanel sessionId={sessionId} />
            </div>

            {/* MODEL AVAILABILITY / SELECTION */}
            <div className="px-6 pt-3">
              <ModelAvailabilityPanel
                uploadedFileMimeTypes={uploadedMimeTypes}
                selectedModelId={selectedModelId}
                onSelect={setSelectedModelId}
              />
            </div>

            {/* FILE UPLOAD (collapsible) */}
            <div className="px-6 pt-2">
              <button onClick={() => setShowFileUpload((s) => !s)} className="text-[11px] text-[#5B6169] hover:text-[#93999F] font-mono cursor-pointer">
                {showFileUpload ? "▾" : "▸"} Attach files {uploadedFiles.length > 0 ? `(${uploadedFiles.length})` : ""}
              </button>
              {showFileUpload && (
                <div className="mt-2">
                  <FileUploadZone files={uploadedFiles} onFilesChange={setUploadedFiles} />
                </div>
              )}
            </div>

            {/* COMPOSER */}
            <div className="p-6 pt-2">
              <ExpandableComposer sessionId={sessionId} onSend={handleSend} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
