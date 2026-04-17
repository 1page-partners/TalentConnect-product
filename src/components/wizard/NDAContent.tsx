import { useMemo } from "react";

interface NDAContentProps {
  text: string;
}

type Block =
  | { kind: "title"; text: string }
  | { kind: "chapter"; text: string }
  | { kind: "article"; number: string; title: string }
  | { kind: "paragraph"; text: string }
  | { kind: "numbered"; marker: string; text: string }
  | { kind: "bullet"; text: string };

// 連続行を1つの段落にまとめつつ、構造（章・条・項番号）を抽出する
const parseNda = (raw: string): Block[] => {
  // 改行ごとにトリム→空行で段落区切り
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/\u3000/g, " ").trimEnd());

  // 段落単位（空行区切り）にまとめる
  const paragraphs: string[] = [];
  let buf: string[] = [];
  for (const line of lines) {
    if (line.trim() === "") {
      if (buf.length) {
        paragraphs.push(buf.join("\n"));
        buf = [];
      }
    } else {
      buf.push(line);
    }
  }
  if (buf.length) paragraphs.push(buf.join("\n"));

  const blocks: Block[] = [];
  let titleAssigned = false;

  for (const para of paragraphs) {
    const joined = para
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!joined) continue;

    // タイトル（最初の短い1行）
    if (!titleAssigned && joined.length <= 30 && !/^第/.test(joined) && !/^\d/.test(joined)) {
      blocks.push({ kind: "title", text: joined });
      titleAssigned = true;
      continue;
    }

    // 章: 「第1章 総則」など
    const chapterMatch = joined.match(/^第\s*[0-9０-９一二三四五六七八九十]+\s*章\s*(.*)$/);
    if (chapterMatch) {
      blocks.push({ kind: "chapter", text: joined });
      continue;
    }

    // 条: 「第1条（適用）」「第１０条（損害賠償）」など。条タイトル行のみ
    const articleMatch = joined.match(/^(第\s*[0-9０-９一二三四五六七八九十]+\s*条)\s*(?:（([^）]*)）|\(([^)]*)\))?\s*$/);
    if (articleMatch) {
      blocks.push({
        kind: "article",
        number: articleMatch[1].replace(/\s/g, ""),
        title: articleMatch[2] || articleMatch[3] || "",
      });
      continue;
    }

    // 条タイトル + 本文が同じ段落に入っているケース
    const articleInline = joined.match(
      /^(第\s*[0-9０-９一二三四五六七八九十]+\s*条)\s*(?:（([^）]*)）|\(([^)]*)\))\s*(.+)$/
    );
    if (articleInline) {
      blocks.push({
        kind: "article",
        number: articleInline[1].replace(/\s/g, ""),
        title: articleInline[2] || articleInline[3] || "",
      });
      // 残り本文を項番号付きとして処理
      const rest = articleInline[4].trim();
      if (rest) blocks.push({ kind: "paragraph", text: rest });
      continue;
    }

    // 番号付き項目: 「1.」「(1)」「（１）」「●」など
    const numbered = joined.match(/^(\d+\.|\(\d+\)|（[0-9０-９]+）|[①-⑳])\s*(.+)$/);
    if (numbered) {
      blocks.push({ kind: "numbered", marker: numbered[1], text: numbered[2] });
      continue;
    }

    // 箇条書き: 「●」「・」「-」始まり
    const bullet = joined.match(/^[●・\-]\s*(.+)$/);
    if (bullet) {
      blocks.push({ kind: "bullet", text: bullet[1] });
      continue;
    }

    blocks.push({ kind: "paragraph", text: joined });
  }

  return blocks;
};

const NDAContent = ({ text }: NDAContentProps) => {
  const blocks = useMemo(() => parseNda(text), [text]);

  return (
    <div className="space-y-4 text-sm text-foreground leading-relaxed">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "title":
            return (
              <h2
                key={i}
                className="text-base font-bold text-center text-foreground border-b border-border pb-2 mb-2"
              >
                {block.text}
              </h2>
            );
          case "chapter":
            return (
              <h3
                key={i}
                className="text-sm font-semibold text-primary mt-4 pt-2 border-t border-border/50"
              >
                {block.text}
              </h3>
            );
          case "article":
            return (
              <div key={i} className="mt-3">
                <div className="font-semibold text-foreground">
                  {block.number}
                  {block.title && (
                    <span className="text-muted-foreground font-normal ml-1">
                      （{block.title}）
                    </span>
                  )}
                </div>
              </div>
            );
          case "numbered":
            return (
              <div key={i} className="flex gap-2 pl-2">
                <span className="text-muted-foreground shrink-0 min-w-[1.5rem]">
                  {block.marker}
                </span>
                <span className="flex-1">{block.text}</span>
              </div>
            );
          case "bullet":
            return (
              <div key={i} className="flex gap-2 pl-2">
                <span className="text-muted-foreground shrink-0">・</span>
                <span className="flex-1">{block.text}</span>
              </div>
            );
          case "paragraph":
          default:
            return (
              <p key={i} className="text-foreground">
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
};

export default NDAContent;
