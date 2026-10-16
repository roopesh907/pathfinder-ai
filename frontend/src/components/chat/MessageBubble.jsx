
import { memo } from "react";
import { RichText } from "./RichText";

const USER_MESSAGE_CLASSES = [
  "max-w-[90%] min-w-0 break-words sm:max-w-[78%]",
  "rounded-2xl rounded-br-md",
  "border border-indigo-300/[0.12]",
  "bg-gradient-to-br from-indigo-500/[0.13] to-violet-500/[0.08]",
  "px-4 py-3",
  "text-sm leading-6 text-zinc-100",
  "[&_pre]:my-3 [&_pre]:max-w-full [&_pre]:overflow-x-auto",
  "[&_pre]:rounded-xl [&_pre]:border [&_pre]:border-white/10",
  "[&_pre]:bg-black/30 [&_pre]:p-3",
  "[&_pre_code]:whitespace-pre",
  "[&_pre_code]:break-normal",
  "[&_a]:break-words [&_a]:text-indigo-300",
  "[&_a]:underline [&_a]:underline-offset-4",
].join(" ");

const ASSISTANT_MESSAGE_CLASSES = [
  "w-full min-w-0 break-words",
  "text-sm font-normal leading-7 text-zinc-400",

  // Softer opening paragraph
  "[&>p:first-child]:text-zinc-400",
  "[&>p:first-child]:font-normal",
  "[&>p:first-child]:leading-6",

  // Headings stay prominent
  "[&_h1]:mb-3 [&_h1]:mt-5 [&_h1]:text-lg",
  "[&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-zinc-100",
  "[&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-base",
  "[&_h2]:font-semibold [&_h2]:text-zinc-100",
  "[&_h3]:mb-2 [&_h3]:mt-4",
  "[&_h3]:font-semibold [&_h3]:text-zinc-100",

  // Paragraphs
  "[&_p]:my-2 [&_p:first-child]:mt-0",
  "[&_p:last-child]:mb-0",

  // Lists
  "[&_ul]:my-3 [&_ol]:my-3",
  "[&_ul]:list-disc [&_ol]:list-decimal",
  "[&_ul]:space-y-1 [&_ol]:space-y-1",
  "[&_ul]:pl-5 [&_ol]:pl-5",
  "[&_li]:pl-1",

  // Softer bold emphasis
  "[&_strong]:font-medium",
  "[&_strong]:text-zinc-200",
  "[&_em]:text-zinc-200",

  // Links
  "[&_a]:break-words [&_a]:text-indigo-300",
  "[&_a]:underline [&_a]:underline-offset-4",
  "[&_a:hover]:text-violet-300",

  // Inline code
  "[&_code]:break-words",
  "[&_:not(pre)>code]:rounded-md",
  "[&_:not(pre)>code]:border [&_:not(pre)>code]:border-white/10",
  "[&_:not(pre)>code]:bg-white/[0.06]",
  "[&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5",
  "[&_:not(pre)>code]:text-indigo-200",

  // Code blocks
  "[&_pre]:my-4 [&_pre]:max-w-full",
  "[&_pre]:overflow-x-auto [&_pre]:rounded-xl",
  "[&_pre]:border [&_pre]:border-white/10",
  "[&_pre]:bg-[#080a10] [&_pre]:p-4",
  "[&_pre]:text-[13px] [&_pre]:leading-6",
  "[&_pre_code]:whitespace-pre",
  "[&_pre_code]:break-normal",

  // Quotes and separators
  "[&_blockquote]:my-4 [&_blockquote]:border-l-2",
  "[&_blockquote]:border-indigo-400/40",
  "[&_blockquote]:pl-4 [&_blockquote]:text-zinc-400",
  "[&_hr]:my-5 [&_hr]:border-white/10",

  // Tables
  "[&_table]:my-4 [&_table]:w-full",
  "[&_table]:border-collapse [&_table]:text-left",
  "[&_th]:border [&_th]:border-white/10",
  "[&_th]:bg-white/[0.04] [&_th]:px-3 [&_th]:py-2",
  "[&_th]:font-medium [&_th]:text-zinc-200",
  "[&_td]:border [&_td]:border-white/10",
  "[&_td]:px-3 [&_td]:py-2",
  "[&_td]:align-top",
].join(" ");

const MessageBubble = memo(function MessageBubble({ message }) {
  const isUser = message?.role === "user";
  const content =
    typeof message?.content === "string" ? message.content : "";

  if (isUser) {
    return (
      <div className="flex min-w-0 justify-end py-2.5 sm:py-3">
        <div className={USER_MESSAGE_CLASSES}>
          <RichText text={content} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 py-3 sm:py-3.5">
      <div className={ASSISTANT_MESSAGE_CLASSES}>
        <RichText text={content} />
      </div>
    </div>
  );
});

export default MessageBubble;
