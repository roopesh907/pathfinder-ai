import { memo } from "react";

function renderInline(value, keyPrefix = "inline") {
  const text = String(value ?? "");
  const tokenPattern =
    /(\[[^\]]+\]\(https?:\/\/[^)\s]+\)|\*\*[\s\S]+?\*\*|`[^`]+`|\*[^*\n]+\*|https?:\/\/[^\s<]+)/g;

  const parts = text.split(tokenPattern);

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;

    if (!part) return null;

    // Markdown links: [label](https://example.com)
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);

    if (link) {
      return (
        <a
          key={key}
          href={link[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="break-words text-indigo-300 underline underline-offset-4 hover:text-violet-300"
        >
          {link[1]}
        </a>
      );
    }

    // Automatically link plain URLs.
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={key}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-indigo-300 underline underline-offset-4 hover:text-violet-300"
        >
          {part}
        </a>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} className="font-semibold text-zinc-100">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={key}
          className="rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.9em] text-indigo-200"
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

function isTableSeparator(line) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function parseBlocks(content) {
  const lines = content.split("\n");
  const blocks = [];

  let paragraph = [];
  let listItems = [];
  let listType = null;
  let codeLines = [];
  let codeLanguage = "";
  let inCode = false;

  function flushParagraph() {
    if (paragraph.length === 0) return;

    blocks.push({
      type: "paragraph",
      content: paragraph.join(" "),
    });

    paragraph = [];
  }

  function flushList() {
    if (listItems.length === 0) return;

    blocks.push({
      type: "list",
      listType,
      items: listItems,
    });

    listItems = [];
    listType = null;
  }

  function flushText() {
    flushParagraph();
    flushList();
  }

  function addListItem(type, content) {
    flushParagraph();

    if (listType !== type) {
      flushList();
      listType = type;
    }

    listItems.push(content);
  }

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Preserve everything inside fenced code blocks.
    if (line.startsWith("```") || line.startsWith("~~~")) {
      const fence = line.slice(0, 3);

      if (!inCode) {
        flushText();
        inCode = true;
        codeLanguage = line.slice(3).trim();
        codeLines = [];
      } else {
        inCode = false;
        blocks.push({
          type: "code",
          language: codeLanguage,
          content: codeLines.join("\n"),
        });
        codeLines = [];
        codeLanguage = "";
      }

      continue;
    }

    if (inCode) {
      codeLines.push(rawLine);
      continue;
    }

    if (!line) {
      flushText();
      continue;
    }

    // Headings.
    const heading = line.match(/^(#{1,3})\s+(.+)$/);

    if (heading) {
      flushText();
      blocks.push({
        type: "heading",
        level: heading[1].length,
        content: heading[2],
      });
      continue;
    }

    // Horizontal rules.
    if (/^([-*_])(?:\s*\1){2,}$/.test(line)) {
      flushText();
      blocks.push({ type: "hr" });
      continue;
    }

    // Markdown tables: header, separator, then rows.
    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1])
    ) {
      flushText();

      const headers = parseTableRow(line);
      i += 2;

      const rows = [];

      while (i < lines.length) {
        const rowLine = lines[i].trim();

        if (!rowLine || !rowLine.includes("|")) {
          i -= 1;
          break;
        }

        rows.push(parseTableRow(rowLine));
        i += 1;
      }

      blocks.push({
        type: "table",
        headers,
        rows,
      });

      continue;
    }

    // Blockquotes.
    if (line.startsWith(">")) {
      flushText();

      const quoteLines = [];

      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i += 1;
      }

      i -= 1;

      blocks.push({
        type: "quote",
        content: quoteLines.join(" "),
      });

      continue;
    }

    // Bulleted and numbered lists.
    const bullet = line.match(/^(?:[-*+] |•\s+)(.+)$/);
    const numbered = line.match(/^\d+[.)]\s+(.+)$/);

    if (bullet || numbered) {
      addListItem(
        bullet ? "bullet" : "numbered",
        bullet ? bullet[1] : numbered[1],
      );
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  if (inCode) {
    blocks.push({
      type: "code",
      language: codeLanguage,
      content: codeLines.join("\n"),
    });
  }

  flushText();

  return blocks;
}

function RichTextComponent({ text }) {
  const content = String(text ?? "")
    .replace(/\r\n?/g, "\n")
    .trim();

  if (!content) return null;

  const blocks = parseBlocks(content);

  return (
    <div className="w-full min-w-0 space-y-3 break-words">
      {blocks.map((block, index) => {
        const key = `block-${index}`;

        if (block.type === "heading") {
          const HeadingTag = `h${block.level}`;

          const headingClasses = {
            1: "mb-3 mt-5 text-lg font-semibold tracking-tight text-zinc-100",
            2: "mb-2 mt-5 text-base font-semibold text-zinc-100",
            3: "mb-2 mt-4 text-sm font-semibold text-indigo-200",
          };

          return (
            <HeadingTag key={key} className={headingClasses[block.level]}>
              {renderInline(block.content, key)}
            </HeadingTag>
          );
        }

        if (block.type === "paragraph") {
          return (
            <p key={key} className="leading-7 text-zinc-300">
              {renderInline(block.content, key)}
            </p>
          );
        }

        if (block.type === "list") {
          const ListTag = block.listType === "bullet" ? "ul" : "ol";

          return (
            <ListTag
              key={key}
              className={[
                "space-y-1.5 pl-5",
                block.listType === "bullet" ? "list-disc" : "list-decimal",
              ].join(" ")}
            >
              {block.items.map((item, itemIndex) => (
                <li
                  key={`${key}-${itemIndex}`}
                  className="pl-1 leading-7 text-zinc-300 marker:text-indigo-300"
                >
                  {renderInline(item, `${key}-${itemIndex}`)}
                </li>
              ))}
            </ListTag>
          );
        }

        if (block.type === "code") {
          return (
            <div
              key={key}
              className="my-4 min-w-0 max-w-full overflow-hidden rounded-xl border border-white/10 bg-[#080a10]"
            >
              {block.language && (
                <div className="border-b border-white/10 px-4 py-2 text-xs text-zinc-500">
                  {block.language}
                </div>
              )}

              <pre className="custom-scrollbar max-w-full overflow-x-auto p-4 text-[13px] leading-6 text-zinc-200">
                <code className="font-mono whitespace-pre">
                  {block.content}
                </code>
              </pre>
            </div>
          );
        }

        if (block.type === "table") {
          return (
            <div
              key={key}
              className="custom-scrollbar my-4 w-full max-w-full overflow-x-auto rounded-xl border border-white/10"
            >
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-white/[0.04]">
                  <tr>
                    {block.headers.map((header, headerIndex) => (
                      <th
                        key={`${key}-header-${headerIndex}`}
                        className="whitespace-nowrap border-b border-white/10 px-3 py-2.5 font-semibold text-zinc-100"
                      >
                        {renderInline(header, `${key}-header-${headerIndex}`)}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr
                      key={`${key}-row-${rowIndex}`}
                      className="border-t border-white/[0.06] align-top"
                    >
                      {block.headers.map((_, cellIndex) => (
                        <td
                          key={`${key}-cell-${rowIndex}-${cellIndex}`}
                          className="min-w-0 px-3 py-2.5 text-zinc-300"
                        >
                          {renderInline(
                            row[cellIndex] ?? "",
                            `${key}-cell-${rowIndex}-${cellIndex}`,
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote
              key={key}
              className="border-l-2 border-indigo-400/40 pl-4 text-zinc-400"
            >
              {renderInline(block.content, key)}
            </blockquote>
          );
        }

        if (block.type === "hr") {
          return <hr key={key} className="border-white/10" />;
        }

        return null;
      })}
    </div>
  );
}

export const RichText = memo(RichTextComponent);
