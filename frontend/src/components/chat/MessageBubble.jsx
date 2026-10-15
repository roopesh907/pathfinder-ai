
import { memo } from "react";
import { RichText } from "./RichText";

const GLASS =
  "border border-white/10 bg-white/[0.03] backdrop-blur-xl";

const MessageBubble = memo(function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-xl px-4 py-3 text-sm leading-6 sm:max-w-[75%] ${
          isUser
            ? "border border-indigo-300/20 bg-indigo-500/15 text-zinc-100"
            : `${GLASS} text-zinc-300`
        }`}
      >
        <RichText text={message.content} />
      </div>
    </div>
  );
});

export default MessageBubble;
