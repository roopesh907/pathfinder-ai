
import { memo } from "react";
import { RichText } from "./RichText";

const MessageBubble = memo(function MessageBubble({ message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end py-2.5 sm:py-3">
        <div
          className={[
            "max-w-[90%] break-words sm:max-w-[78%]",
            "rounded-2xl rounded-br-md",
            "border border-indigo-300/[0.12]",
            "bg-gradient-to-br from-indigo-500/[0.13] to-violet-500/[0.08]",
            "px-4 py-3",
            "text-sm leading-6 text-zinc-100",
            "[&_pre]:max-w-full [&_pre]:overflow-x-auto",
            "[&_a]:text-indigo-300 [&_a]:underline",
            "[&_a]:underline-offset-4",
          ].join(" ")}
        >
          <RichText text={message.content} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-3 sm:py-3.5">
      <div
        className={[
          "w-full min-w-0 break-words",
          "text-sm leading-7 text-zinc-300",
          "[&_h1]:mb-3 [&_h1]:mt-5 [&_h1]:text-lg",
          "[&_h1]:font-semibold [&_h1]:tracking-tight",
          "[&_h1]:text-zinc-100",
          "[&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-base",
          "[&_h2]:font-semibold [&_h2]:text-zinc-100",
          "[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:font-semibold",
          "[&_h3]:text-zinc-100",
          "[&_p]:my-2 [&_p:first-child]:mt-0",
          "[&_p:last-child]:mb-0",
          "[&_ul]:my-3 [&_ol]:my-3",
          "[&_ul]:list-disc [&_ol]:list-decimal",
          "[&_ul]:space-y-1 [&_ol]:space-y-1",
          "[&_ul]:pl-5 [&_ol]:pl-5",
          "[&_li]:pl-1",
          "[&_strong]:font-semibold [&_strong]:text-zinc-100",
          "[&_a]:text-indigo-300 [&_a]:underline",
          "[&_a]:underline-offset-4 [&_a:hover]:text-violet-300",
          "[&_pre]:my-3 [&_pre]:max-w-full [&_pre]:overflow-x-auto",
          "[&_code]:break-words",
          "[&_blockquote]:my-3 [&_blockquote]:border-l-2",
          "[&_blockquote]:border-indigo-400/40",
          "[&_blockquote]:pl-4 [&_blockquote]:text-zinc-400",
          "[&_hr]:my-4 [&_hr]:border-white/10",
          "[&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto",
          "[&_th]:border [&_th]:border-white/10",
          "[&_th]:bg-white/[0.04] [&_th]:px-3 [&_th]:py-2",
          "[&_td]:border [&_td]:border-white/10",
          "[&_td]:px-3 [&_td]:py-2",
        ].join(" ")}
      >
        <RichText text={message.content} />
      </div>
    </div>
  );
});

export default MessageBubble;
