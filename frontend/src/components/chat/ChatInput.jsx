import { memo, useState } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GLASS } from "../../constants/styles";



const ChatInput = memo(function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const canSend = value.trim().length > 0 && !disabled;

  function submit() {
    if (!canSend) return;
    const text = value;
    setValue("");
    onSend(text);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className={`rounded-xl p-2 transition-colors focus-within:border-indigo-300/40 ${GLASS}`}
    >
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            submit();
          }
        }}
        rows={2}
        maxLength={2000}
        aria-label="Message PathFinder"
        placeholder="Ask about careers, timelines, or what to learn next"
        className="max-h-40 min-h-[58px] resize-y border-0 bg-transparent px-3 py-2 text-sm leading-6 text-zinc-100 shadow-none placeholder:text-zinc-600 focus-visible:ring-0"
      />

      <div className="flex items-center justify-between gap-3 px-2 pb-1">
        <p className="text-[11px] text-zinc-600">
          Enter to send, Shift + Enter for a new line
        </p>

        <Button
          type="submit"
          size="icon"
          disabled={!canSend}
          aria-label="Send message"
          className="h-8 w-8 shrink-0 bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-40"
        >
          {disabled ? (
            <LoaderCircle className="animate-spin" size={15} />
          ) : (
            <Send size={15} />
          )}
        </Button>
      </div>
    </form>
  );
});
export default ChatInput;