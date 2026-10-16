
import { memo, useState } from "react";
import { LoaderCircle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GLASS } from "../../constants/styles";

const MAX_MESSAGE_LENGTH = 2000;

const ChatInput = memo(function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");

  const trimmedValue = value.trim();
  const canSend = trimmedValue.length > 0 && !disabled;

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
      className={[
        "group rounded-2xl border p-2.5",
        "transition-[border-color,box-shadow] duration-200",
        "focus-within:border-indigo-400/40",
        "focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.08)]",
        GLASS,
      ].join(" ")}
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
        maxLength={MAX_MESSAGE_LENGTH}
        aria-label="Message PathFinder"
        placeholder="Ask about careers, timelines, or what to learn next..."
        className={[
          "max-h-40 min-h-[58px] resize-y",
          "border-0 bg-transparent px-3 py-2",
          "text-sm leading-6 text-zinc-100",
          "shadow-none placeholder:text-zinc-500",
          "focus-visible:ring-0 focus-visible:ring-offset-0",
          "disabled:cursor-not-allowed disabled:opacity-60",
        ].join(" ")}
      />

      <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-2">
        <div className="min-w-0">
          <p className="text-[11px] leading-4 text-zinc-500">
            Enter to send
            <span className="mx-1.5 text-zinc-700">·</span>
            Shift + Enter for a new line
          </p>

          {value.length >= MAX_MESSAGE_LENGTH * 0.9 && (
            <p
              aria-live="polite"
              className="mt-1 text-[10px] tabular-nums text-violet-300"
            >
              {value.length}/{MAX_MESSAGE_LENGTH} characters
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="icon"
          disabled={!canSend}
          aria-label={disabled ? "Sending message" : "Send message"}
          className={[
            "h-9 w-9 shrink-0 rounded-xl",
            "bg-gradient-to-br from-indigo-500 to-violet-500",
            "text-white shadow-sm shadow-indigo-950/30",
            "transition-[background,box-shadow,transform] duration-150",
            "hover:from-indigo-400 hover:to-violet-400",
            "hover:shadow-md hover:shadow-indigo-950/40",
            "active:scale-95",
            "focus-visible:ring-2 focus-visible:ring-violet-400",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
            "disabled:cursor-not-allowed disabled:opacity-40",
          ].join(" ")}
        >
          {disabled ? (
            <LoaderCircle
              className="animate-spin"
              size={16}
              aria-hidden="true"
            />
          ) : (
            <Send size={16} aria-hidden="true" />
          )}
        </Button>
      </div>
    </form>
  );
});

export default ChatInput;
