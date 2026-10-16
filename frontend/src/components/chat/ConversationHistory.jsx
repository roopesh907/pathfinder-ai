import { History, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function ConversationHistory({
  historyOpen,
  setHistoryOpen,
  handleNewChat,
  historyError,
  historyLoading,
  conversations,
  deletingConversationId,
  chatBusy,
  activeConversationId,
  handleLoadConversation,
  handleDeleteConversation,
}) {
  return (
    <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
      <SheetContent
        side="left"
        className="flex w-full flex-col gap-0 border-white/10 bg-zinc-950 p-0 text-zinc-100 sm:max-w-sm"
      >
        <SheetHeader className="border-b border-white/10 p-4 text-left">
          <SheetTitle className="text-zinc-100">Chat history</SheetTitle>

          <SheetDescription className="text-xs text-zinc-500">
            Your saved PathFinder conversations
          </SheetDescription>
        </SheetHeader>

        <div className="border-b border-white/10 p-4">
          <Button
            type="button"
            onClick={handleNewChat}
            className="w-full bg-indigo-500 text-white hover:bg-indigo-400"
          >
            <Plus size={16} />
            New Chat
          </Button>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {historyError && (
            <Alert className="border-rose-900 bg-rose-950/40">
              <AlertDescription className="text-xs text-rose-200">
                {historyError}
              </AlertDescription>
            </Alert>
          )}

          {historyLoading && (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-zinc-500">
              <LoaderCircle size={14} className="animate-spin" />
              Loading conversations...
            </div>
          )}

          {!historyLoading && !historyError && conversations.length === 0 && (
            <div className="px-3 py-12 text-center">
              <History size={24} className="mx-auto mb-3 text-zinc-600" />

              <p className="text-sm text-zinc-300">
                No saved conversations yet
              </p>

              <p className="mt-2 text-xs leading-5 text-zinc-500">
                Your chats will appear here after you send a message.
              </p>
            </div>
          )}

          {conversations.map((conversation) => {
            const isDeleting = deletingConversationId === conversation.id;
            const isActive = activeConversationId === conversation.id;

            return (
              <div
                key={conversation.id}
                className={`flex items-stretch gap-1 rounded-xl border p-2 transition-colors ${
                  isActive
                    ? "border-indigo-400/30 bg-indigo-500/10"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <button
                  type="button"
                  disabled={
                    historyLoading ||
                    Boolean(deletingConversationId) ||
                    chatBusy
                  }
                  onClick={() => handleLoadConversation(conversation)}
                  className="flex min-w-0 flex-1 items-start gap-3 rounded-lg p-1 text-left disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <History
                    size={16}
                    className="mt-0.5 shrink-0 text-indigo-300"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {conversation.title &&
                      conversation.title !== "New conversation"
                        ? conversation.title
                        : "Conversation"}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {conversation.updated_at
                        ? new Date(conversation.updated_at).toLocaleString([], {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "Saved conversation"}
                    </p>
                  </div>
                </button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={
                    historyLoading ||
                    Boolean(deletingConversationId) ||
                    chatBusy
                  }
                  aria-label={`Delete ${conversation.title || "conversation"}`}
                  title="Delete conversation"
                  onClick={() => handleDeleteConversation(conversation)}
                  className="h-9 w-9 shrink-0 self-center text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
                >
                  {isDeleting ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <Trash2 size={15} />
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="border-t border-white/10 px-4 py-3">
          <p className="text-[11px] leading-5 text-zinc-600">
            Deleting a conversation permanently removes its saved messages.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
