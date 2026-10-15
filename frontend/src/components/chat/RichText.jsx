
import { memo } from "react";

function renderInline(text, keyPrefix = "inline") {
  const parts = String(text).split(
    /(\*\*[\s\S]+?\*\*|`[^`]+`|\*[^*\n]+\*)/g,
  );

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={key}
          className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-indigo-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={key} className="italic text-zinc-200">
          {part.slice(1, -1)}
        </em>
      );
    }

    return part;
  });
}

function RichTextComponent({ text }) {
  const content = String(text ?? "").replace(/\r\n?/g, "\n").trim();

  if (!content) return null;

  const lines = content.split("\n");
  const blocks = [];
  let paragraph = [];
  let listItems = [];
  let listType = null;

  function flushParagraph() {
    if (!paragraph.length) return;

    blocks.push({
      type: "paragraph",
      content: paragraph.join(" "),
    });

    paragraph = [];
  }

  function flushList() {
    if (!listItems.length) return;

    blocks.push({
      type: listType,
      items: listItems,
    });

    listItems = [];
    listType = null;
  }

  function flushAll() {
    flushParagraph();
    flushList();
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushAll();
      continue;
    }

    // Headings: # Heading, ## Heading, ### Heading
    const heading = line.match(/^(#{1,3})\s+(.+)$/);

    if (heading) {
      flushAll();
      blocks.push({
        type: "heading",
        level: heading[1].length,
        content: heading[2],
      });
      continue;
    }

    // Bullet points: - item, * item, • item
    const bullet = line.match(/^(?:[-*•])\s+(.+)$/);

    // Numbered lists: 1. item, 2) item
    const numbered = line.match(/^\d+[.)]\s+(.+)$/);

    if (bullet || numbered) {
      flushParagraph();

      const nextType = bullet ? "bullet" : "numbered";

      if (listType !== nextType) {
        flushList();
        listType = nextType;
      }

      listItems.push(bullet ? bullet[1] : numbered[1]);
      continue;
    }

    // Markdown table rows are not rendered as a broken table.
    // Preserve their cell contents as readable text.
    if (line.startsWith("|") && line.endsWith("|")) {
      flushAll();

      if (/^\|?[\s|:-]+\|?$/.test(line)) {
        continue;
      }

      const cells = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());

      blocks.push({
        type: "tableRow",
        cells,
      });

      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushAll();

  return (
    <div className="space-y-3 break-words">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const className =
            block.level === 1
              ? "text-lg font-semibold text-white"
              : block.level === 2
                ? "text-base font-semibold text-white"
                : "text-sm font-semibold text-indigo-200";

          return (
            <div key={index} className={className}>
              {renderInline(block.content, `heading-${index}`)}
            </div>
          );
        }

        if (block.type === "bullet" || block.type === "numbered") {
          const ListTag = block.type === "bullet" ? "ul" : "ol";

          return (
            <ListTag
              key={index}
              className={`space-y-1.5 pl-5 ${
                block.type === "bullet" ? "list-disc" : "list-decimal"
              }`}
            >
              {block.items.map((item, itemIndex) => (
                <li
                  key={itemIndex}
                  className="pl-1 text-zinc-300 marker:text-indigo-300"
                >
                  {renderInline(item, `list-${index}-${itemIndex}`)}
                </li>
              ))}
            </ListTag>
          );
        }

        if (block.type === "tableRow") {
          return (
            <div
              key={index}
              className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3"
              style={{
                gridTemplateColumns: `repeat(${Math.max(
                  block.cells.length,
                  1,
                )}, minmax(0, 1fr))`,
              }}
            >
              {block.cells.map((cell, cellIndex) => (
                <div
                  key={cellIndex}
                  className="min-w-0 text-sm text-zinc-300"
                >
                  {renderInline(cell, `table-${index}-${cellIndex}`)}
                </div>
              ))}
            </div>
          );
        }

        return (
          <p key={index} className="leading-7 text-zinc-300">
            {renderInline(block.content, `paragraph-${index}`)}
          </p>
        );
      })}
    </div>
  );
}

export const RichText = memo(RichTextComponent);
