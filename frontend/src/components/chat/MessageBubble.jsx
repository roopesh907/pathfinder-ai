import { memo } from "react";
import { RichText } from "./RichText";

const MessageBubble = memo(function MessageBubble({ message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end py-3">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-white/[0.07] px-4 py-3 text-sm leading-6 text-zinc-100 sm:max-w-[75%]">
          <RichText text={message.content} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-3">
      <div className="w-full min-w-0 break-words text-sm leading-7 text-zinc-300">
        <RichText text={message.content} />
      </div>
    </div>
  );
});

export default MessageBubble;