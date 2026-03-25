import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CategoryImages {
  overview?: string[];
  engagement?: string[];
  traffic?: string[];
  search_terms?: string[];
  audience?: string[];
  geography?: string[];
  devices?: string[];
  comments?: string[];
}

// ─── Key normalization maps ───

const AGE_KEY_MAP: Record<string, string> = {
  "13-17歳": "13-17", "13-17": "13-17", "13〜17歳": "13-17", "13～17歳": "13-17",
  "18-24歳": "18-24", "18-24": "18-24", "18〜24歳": "18-24", "18～24歳": "18-24",
  "25-34歳": "25-34", "25-34": "25-34", "25〜34歳": "25-34", "25～34歳": "25-34",
  "35-44歳": "35-44", "35-44": "35-44", "35〜44歳": "35-44", "35～44歳": "35-44",
  "45-54歳": "45-54", "45-54": "45-54", "45〜54歳": "45-54", "45～54歳": "45-54",
  "55-64歳": "55-64", "55-64": "55-64", "55〜64歳": "55-64", "55～64歳": "55-64",
  "65歳以上": "65+", "65才以上": "65+", "65以上": "65+", "65+": "65+",
};

const GENDER_KEY_MAP: Record<string, string> = {
  "男性": "男性", "男": "男性", "male": "男性",
  "女性": "女性", "女": "女性", "female": "女性",
  "ユーザーによる設定": "その他", "その他": "その他", "other": "その他", "不明": "その他",
};

const DEVICE_KEY_MAP: Record<string, string> = {
  "テレビ": "テレビ", "tv": "テレビ",
  "パソコン": "パソコン", "pc": "パソコン", "desktop": "パソコン", "computer": "パソコン",
  "携帯電話": "携帯電話", "スマートフォン": "携帯電話", "モバイル": "携帯電話", "mobile": "携帯電話",
  "タブレット": "タブレット", "tablet": "タブレット",
  "ゲーム機": "ゲーム機", "gameconsole": "ゲーム機",
  "不明": "不明",
};

const TRAFFIC_KEY_MAP: Record<string, string> = {
  "ブラウジング機能": "ブラウジング機能",
  "関連動画": "関連動画",
  "youtube検索": "YouTube検索", "you tube検索": "YouTube検索",
  "外部": "外部",
  "直接入力または不明": "直接入力または不明", "直接または不明": "直接入力または不明",
  "チャンネルページ": "チャンネルページ",
  "その他のyoutube機能": "その他のYouTube機能", "その他のyou tube機能": "その他のYouTube機能",
  "通知": "通知",
  "その他": "その他",
};

function normalizeLabelKey(value: string) {
  return value.trim().replace(/\s+/g, "").replace(/[％]/g, "%").replace(/[〜～–—−]/g, "-").replace(/[：:]/g, "").toLowerCase();
}

function toDecimalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").replace(/[％]/g, "%").trim();
    const match = normalized.match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    let parsed = Number(match[0]);
    if (!Number.isFinite(parsed)) return null;
    if (normalized.includes("%")) parsed = parsed / 100;
    return parsed;
  }
  return null;
}

function normalizeDistribution(input: unknown, keyMap: Record<string, string>): Record<string, number> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const normalized: Record<string, number> = {};
  for (const [rawKey, rawValue] of Object.entries(input as Record<string, unknown>)) {
    const canonicalKey = keyMap[normalizeLabelKey(rawKey)] ?? rawKey.trim();
    const parsedValue = toDecimalNumber(rawValue);
    if (parsedValue === null || parsedValue < 0) continue;
    normalized[canonicalKey] = (normalized[canonicalKey] ?? 0) + parsedValue;
  }
  let entries = Object.entries(normalized).filter(([, v]) => Number.isFinite(v));
  const sum = entries.reduce((t, [, v]) => t + v, 0);
  if (sum > 1.5 && sum <= 100.5) {
    entries = entries.map(([k, v]) => [k, v / 100]);
  }
  return Object.fromEntries(entries.map(([k, v]) => [k, Number(v.toFixed(6))]));
}

// ─── Phase 1: OCR text extraction ───

const OCR_SYSTEM_PROMPT = `あなたはOCR専門のテキスト抽出エンジンです。
画像に表示されているテキスト・数値・ラベル・パーセンテージをすべてそのまま書き起こしてください。

ルール：
- 意味の解釈は一切しない
- 数値、%、ラベルをそのまま保持する
- レイアウトの位置関係が分かるように行ごとに出力する
- 不明な文字は [不明] とする
- グラフのタイトル、凡例、軸ラベルもすべて書き起こす
- 日本語と英語が混在していてもそのまま出力する`;

async function extractOcrText(apiKey: string, imageUrls: string[], categoryHint: string): Promise<string> {
  const imageContent = imageUrls.map((url) => ({ type: "image_url", image_url: { url } }));

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: OCR_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: `以下のYouTube Studio「${categoryHint}」セクションのスクリーンショットから、表示されているテキストと数値をすべてそのまま書き起こしてください。` },
            ...imageContent,
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`OCR error for ${categoryHint}:`, response.status, text);
    if (response.status === 429) throw new Error("RATE_LIMIT");
    if (response.status === 402) throw new Error("CREDITS_EXHAUSTED");
    return "";
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content ?? "";
}

// ─── Phase 2: Structure from OCR text ───

async function callStructure(apiKey: string, systemPrompt: string, userPrompt: string): Promise<Record<string, unknown>> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Structure error:", response.status, text);
    if (response.status === 429) throw new Error("RATE_LIMIT");
    if (response.status === 402) throw new Error("CREDITS_EXHAUSTED");
    return {};
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content);
  } catch {
    console.error("JSON parse failed:", content.substring(0, 200));
    return {};
  }
}

function structureOverviewFromOcr(apiKey: string, ocrText: string) {
  return callStructure(apiKey,
    `OCRテキストからYouTubeの概要指標を抽出してJSONで返してください。
出力形式（厳守）：
{
  "impressions": number|null,
  "views": number|null,
  "ctr": number|null,
  "avg_watch_time": string|null,
  "total_watch_time": string|null
}
ルール：
- 万=×10000（74.1万→741000）、億=×100000000
- CTRは小数（3.4%→0.034）
- 時間はそのまま文字列（"4:32"）
- 見つからない項目はnull`,
    `以下のOCRテキストから指標を抽出してください:\n\n${ocrText}`
  );
}

function structureEngagementFromOcr(_apiKey: string, ocrText: string): Promise<Record<string, unknown>> {
  // Pure regex extraction — no AI structuring, no graph estimation
  const result: Record<string, unknown> = {
    like_rate: null,
    retention_rate: null,
    complete_view_rate: null,
  };

  // Normalize full-width characters for matching
  const normalized = ocrText
    .replace(/％/g, "%")
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFF10 + 0x30))
    .replace(/．/g, ".");

  // 高評価率: extract percentage value
  const likeRateMatch = normalized.match(/高評価率[^\d]*?(\d+(?:\.\d+)?)%/);
  if (likeRateMatch) {
    result.like_rate = parseFloat(likeRateMatch[1]) / 100;
    console.log(`[engagement] Regex extracted like_rate: ${likeRateMatch[1]}% → ${result.like_rate}`);
  }

  // 平均視聴率 (retention_rate): extract percentage value
  const retentionMatch = normalized.match(/平均視聴率[^\d]*?(\d+(?:\.\d+)?)%/);
  if (retentionMatch) {
    result.retention_rate = parseFloat(retentionMatch[1]) / 100;
    console.log(`[engagement] Regex extracted retention_rate: ${retentionMatch[1]}% → ${result.retention_rate}`);
  }

  // Also try 視聴維持率 as alternative label
  if (result.retention_rate === null) {
    const retentionAlt = normalized.match(/視聴維持率[^\d]*?(\d+(?:\.\d+)?)%/);
    if (retentionAlt) {
      result.retention_rate = parseFloat(retentionAlt[1]) / 100;
      console.log(`[engagement] Regex extracted retention_rate (alt): ${retentionAlt[1]}% → ${result.retention_rate}`);
    }
  }

  console.log(`[engagement] Final regex result:`, JSON.stringify(result));
  return Promise.resolve(result);
}

function structureAudienceFromOcr(apiKey: string, ocrText: string) {
  return callStructure(apiKey,
    `OCRテキストからYouTubeの視聴者属性（年齢・性別）を抽出してJSONで返してください。
出力形式（厳守）：
{
  "audience_gender": {
    "女性": number,
    "男性": number,
    "その他": number
  },
  "audience_age": {
    "13-17": number,
    "18-24": number,
    "25-34": number,
    "35-44": number,
    "45-54": number,
    "55-64": number,
    "65+": number
  }
}
ルール：
- パーセンテージの数値のみ（%記号は除去）→ 例: 47.7% → 47.7
- ラベルと数値をセットで抽出する
- バーの長さは無視し、テキストの%数値を読む
- 合計が約100になるはず
- 見つからない項目は0`,
    `以下のOCRテキストから視聴者の年齢・性別データを抽出してください:\n\n${ocrText}`
  );
}

function structureTrafficFromOcr(apiKey: string, ocrText: string) {
  return callStructure(apiKey,
    `OCRテキストからYouTubeのトラフィックソースを抽出してJSONで返してください。
出力形式（厳守）：
{
  "traffic_sources": {
    "ソース名": number,
    ...
  }
}
ルール：
- ラベル名は原文そのまま保持（日本語）
- 円グラフの色は無視し、テキスト一覧の%数値を読む
- パーセンテージの数値のみ（%記号は除去）→ 例: 91.2% → 91.2
- 合計が約100になるはず
- すべてのソースを含める（小さい値も）`,
    `以下のOCRテキストからトラフィックソースを抽出してください:\n\n${ocrText}`
  );
}

function structureDevicesFromOcr(apiKey: string, ocrText: string) {
  return callStructure(apiKey,
    `OCRテキストからYouTubeのデバイス種類を抽出してJSONで返してください。
出力形式（厳守）：
{
  "devices": {
    "デバイス名": number,
    ...
  }
}
ルール：
- ラベル名は原文そのまま（テレビ、パソコン、携帯電話、タブレット等）
- パーセンテージの数値のみ（%記号は除去）→ 例: 35.3% → 35.3
- 合計が約100になるはず
- 順序は原文どおり`,
    `以下のOCRテキストからデバイス分布を抽出してください:\n\n${ocrText}`
  );
}

function structureSearchTermsFromOcr(apiKey: string, ocrText: string) {
  return callStructure(apiKey,
    `OCRテキストからYouTubeの検索語句とその数値を抽出してJSONで返してください。
出力形式（厳守）：
{
  "search_terms": {
    "キーワード": number,
    ...
  }
}
ルール：
- 各キーワードと対応するインプレッション数/クリック数を抽出
- 万=×10000、億=×100000000で変換
- すべての検索語句を含める`,
    `以下のOCRテキストから検索語句を抽出してください:\n\n${ocrText}`
  );
}

function structureGeographyFromOcr(apiKey: string, ocrText: string) {
  return callStructure(apiKey,
    `OCRテキストからYouTubeの視聴者地域分布を抽出してJSONで返してください。
出力形式（厳守）：
{
  "audience_region": {
    "国名": number,
    ...
  }
}
ルール：
- パーセンテージの数値のみ（%記号は除去）→ 例: 85.3% → 85.3
- 国/地域名はそのまま保持`,
    `以下のOCRテキストから地域分布を抽出してください:\n\n${ocrText}`
  );
}

async function structureCommentsFromImages(apiKey: string, imageUrls: string[]): Promise<Array<{ body: string }>> {
  const imageContent = imageUrls.map((url) => ({ type: "image_url", image_url: { url } }));

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `あなたはYouTubeコメント欄のスクリーンショットからコメント本文のみを抽出するエキスパートです。

ルール（厳守）：
- コメント本文のテキストのみ抽出する
- 以下は絶対に除外する：
  - ユーザー名（@付きのIDも含む）
  - アイコン/プロフィール画像
  - 投稿日時（○日前、○か月前等）
  - いいね数（👍数値）
  - 返信ボタン等のUI要素
- 各コメントは個別のオブジェクトにする
- 返信コメントも本文のみ抽出する
- 絵文字はそのまま保持する

出力形式（厳守）：
{
  "comments": [
    { "body": "コメント本文1" },
    { "body": "コメント本文2" }
  ]
}`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "以下のYouTubeコメント欄のスクリーンショットから、コメント本文のみを抽出してください。ユーザー名・アイコン・日時・いいね数は除外してください。" },
            ...imageContent,
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Comment extraction error:", response.status, text);
    if (response.status === 429) throw new Error("RATE_LIMIT");
    if (response.status === 402) throw new Error("CREDITS_EXHAUSTED");
    return [];
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed.comments) ? parsed.comments : [];
  } catch {
    console.error("Comment JSON parse failed");
    return [];
  }
}

// ─── Category processor ───

interface CategoryResult {
  status: "success" | "error";
  data?: Record<string, unknown>;
  ocrText?: string;
  error?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  overview: "概要（リーチ）",
  engagement: "エンゲージメント",
  traffic: "トラフィックソース",
  search_terms: "YouTube検索語句",
  audience: "視聴者属性（年齢・性別）",
  geography: "地域",
  devices: "デバイスの種類",
};

const STRUCTURE_FN_MAP: Record<string, (apiKey: string, ocrText: string) => Promise<Record<string, unknown>>> = {
  overview: structureOverviewFromOcr,
  engagement: structureEngagementFromOcr,
  audience: structureAudienceFromOcr,
  traffic: structureTrafficFromOcr,
  devices: structureDevicesFromOcr,
  search_terms: structureSearchTermsFromOcr,
  geography: structureGeographyFromOcr,
};

async function processCategory(
  apiKey: string,
  category: string,
  imageUrls: string[],
): Promise<CategoryResult> {
  if (!imageUrls || imageUrls.length === 0) {
    return { status: "error", error: "No images" };
  }

  try {
    // Phase 1: OCR
    console.log(`[${category}] Phase 1: OCR extraction...`);
    const ocrText = await extractOcrText(apiKey, imageUrls, CATEGORY_LABELS[category] ?? category);
    if (!ocrText) {
      return { status: "error", error: "OCR returned empty", ocrText: "" };
    }
    console.log(`[${category}] OCR extracted ${ocrText.length} chars`);

    // Phase 2: Structure
    console.log(`[${category}] Phase 2: Structuring...`);
    const structureFn = STRUCTURE_FN_MAP[category];
    if (!structureFn) {
      return { status: "error", error: `No structure function for ${category}`, ocrText };
    }

    const structured = await structureFn(apiKey, ocrText);
    console.log(`[${category}] Structured:`, JSON.stringify(structured).substring(0, 200));

    return { status: "success", data: structured, ocrText };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "RATE_LIMIT" || msg === "CREDITS_EXHAUSTED") throw e;
    console.error(`[${category}] Error:`, msg);
    return { status: "error", error: msg };
  }
}

// ─── Normalize final data ───

function normalizeAllExtracted(extracted: Record<string, unknown>): Record<string, unknown> {
  const result = { ...extracted };

  if (result.audience_age) {
    result.audience_age = normalizeDistribution(result.audience_age, AGE_KEY_MAP);
  }
  if (result.audience_gender) {
    result.audience_gender = normalizeDistribution(result.audience_gender, GENDER_KEY_MAP);
  }
  if (result.devices) {
    result.devices = normalizeDistribution(result.devices, DEVICE_KEY_MAP);
  }
  if (result.traffic_sources) {
    result.traffic_sources = normalizeDistribution(result.traffic_sources, TRAFFIC_KEY_MAP);
  }
  if (result.audience_region) {
    result.audience_region = normalizeDistribution(result.audience_region, {});
  }

  return result;
}

// ─── Anomaly detection ───

function isDistributionValid(dist: unknown): boolean {
  if (!dist || typeof dist !== "object" || Array.isArray(dist)) return false;
  const entries = Object.entries(dist as Record<string, number>);
  return entries.length > 0;
}

function isPercentDistributionValid(dist: unknown): boolean {
  if (!isDistributionValid(dist)) return false;
  const entries = Object.entries(dist as Record<string, number>);
  const sum = entries.reduce((t, [, v]) => t + (typeof v === "number" ? v : 0), 0);
  // Values could be 0-1 decimals or 0-100. Normalize check.
  const normalizedSum = sum <= 1.5 ? sum * 100 : sum;
  return normalizedSum >= 80 && normalizedSum <= 120;
}

function isAudienceAgeValid(dist: unknown): boolean {
  if (!isDistributionValid(dist)) return false;
  const entries = Object.entries(dist as Record<string, number>);
  const allZero = entries.every(([, v]) => v === 0);
  if (allZero) return false;
  return isPercentDistributionValid(dist);
}

function isTrafficSourcesValid(dist: unknown): boolean {
  if (!isDistributionValid(dist)) return false;
  return true;
}

function isDevicesValid(dist: unknown): boolean {
  if (!isDistributionValid(dist)) return false;
  const entries = Object.entries(dist as Record<string, number>);
  return entries.length >= 2;
}

function isScalarValid(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

// ─── Merge with previous data ───

interface MergeStatus {
  category: string;
  status: "success" | "used_previous" | "skipped" | "no_data";
  usedPrevious: boolean;
  improved: boolean;
}

function mergeWithPreviousData(
  previous: Record<string, unknown>,
  next: Record<string, unknown>,
  processedCategories: Set<string>,
): { merged: Record<string, unknown>; mergeStatuses: MergeStatus[] } {
  const merged: Record<string, unknown> = {};
  const mergeStatuses: MergeStatus[] = [];

  // Category-to-scalar mapping
  const overviewFields = ["impressions", "views", "ctr", "avg_watch_time", "total_watch_time"];
  const engagementFields = ["retention_rate", "complete_view_rate", "like_rate"];

  // Scalar KPI fields — only merge if their category was processed
  for (const field of overviewFields) {
    if (!processedCategories.has("overview")) {
      merged[field] = previous[field] ?? null;
    } else if (isScalarValid(next[field])) {
      merged[field] = next[field];
    } else {
      merged[field] = previous[field] ?? null;
    }
  }
  for (const field of engagementFields) {
    if (!processedCategories.has("engagement")) {
      merged[field] = previous[field] ?? null;
    } else if (isScalarValid(next[field])) {
      merged[field] = next[field];
    } else {
      merged[field] = previous[field] ?? null;
    }
  }

  // Distribution fields with specific validators
  const distFields: Array<{
    key: string;
    category: string;
    validator: (d: unknown) => boolean;
  }> = [
    { key: "audience_age", category: "audience", validator: isAudienceAgeValid },
    { key: "audience_gender", category: "audience", validator: isPercentDistributionValid },
    { key: "audience_region", category: "geography", validator: isDistributionValid },
    { key: "traffic_sources", category: "traffic", validator: isTrafficSourcesValid },
    { key: "devices", category: "devices", validator: isDevicesValid },
    { key: "search_terms", category: "search_terms", validator: isDistributionValid },
  ];

  const categoryFieldMap: Record<string, string[]> = {};
  for (const df of distFields) {
    if (!categoryFieldMap[df.category]) categoryFieldMap[df.category] = [];
    categoryFieldMap[df.category].push(df.key);
  }

  for (const df of distFields) {
    // If this category was NOT processed, unconditionally keep previous data
    if (!processedCategories.has(df.category)) {
      merged[df.key] = previous[df.key] ?? {};
      continue;
    }

    const newVal = next[df.key];
    const prevVal = previous[df.key];
    const newValid = df.validator(newVal);
    const prevValid = df.validator(prevVal);

    if (newValid) {
      merged[df.key] = newVal;
    } else if (prevValid) {
      merged[df.key] = prevVal;
    } else {
      merged[df.key] = newVal ?? prevVal ?? {};
    }
  }

  // Build category-level statuses
  const allCategories = new Set([
    ...Object.keys(categoryFieldMap),
    "overview", "engagement",
  ]);

  for (const category of allCategories) {
    if (!processedCategories.has(category)) {
      mergeStatuses.push({
        category,
        status: "skipped",
        usedPrevious: true,
        improved: false,
      });
      continue;
    }

    if (category === "overview") {
      const anyNew = overviewFields.some(f => isScalarValid(next[f]));
      const anyPrev = overviewFields.some(f => !isScalarValid(next[f]) && isScalarValid(previous[f]));
      mergeStatuses.push({
        category,
        status: anyNew ? "success" : (anyPrev ? "used_previous" : "no_data"),
        usedPrevious: anyPrev,
        improved: anyNew,
      });
      continue;
    }

    if (category === "engagement") {
      const anyNew = engagementFields.some(f => isScalarValid(next[f]));
      const anyPrev = engagementFields.some(f => !isScalarValid(next[f]) && isScalarValid(previous[f]));
      mergeStatuses.push({
        category,
        status: anyNew ? "success" : (anyPrev ? "used_previous" : "no_data"),
        usedPrevious: anyPrev,
        improved: anyNew,
      });
      continue;
    }

    const fields = categoryFieldMap[category] || [];
    const anyNewValid = fields.some(f => {
      const df = distFields.find(d => d.key === f)!;
      return df.validator(next[f]);
    });
    const anyUsedPrev = fields.some(f => {
      const df = distFields.find(d => d.key === f)!;
      return !df.validator(next[f]) && df.validator(previous[f]);
    });

    mergeStatuses.push({
      category,
      status: anyNewValid ? "success" : (anyUsedPrev ? "used_previous" : "no_data"),
      usedPrevious: anyUsedPrev,
      improved: anyNewValid,
    });
  }

  return { merged, mergeStatuses };
}

// ─── Main handler ───

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { imageUrls, categoryImages, campaignId, submissionId, title, reportId } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Fetch previous data for merge (re-analysis only) ───
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let previousData: Record<string, unknown> | null = null;
    let previousCommentTexts: Array<{ body: string }> = [];
    if (reportId) {
      const { data: prevReport } = await serviceClient
        .from("analytics_reports")
        .select("*")
        .eq("id", reportId)
        .single();
      if (prevReport) {
        previousData = {
          impressions: prevReport.impressions,
          views: prevReport.views,
          ctr: prevReport.ctr,
          avg_watch_time: prevReport.avg_watch_time,
          total_watch_time: prevReport.total_watch_time,
          retention_rate: prevReport.retention_rate,
          complete_view_rate: prevReport.complete_view_rate,
          like_rate: prevReport.like_rate,
          traffic_sources: prevReport.traffic_sources,
          search_terms: prevReport.search_terms,
          audience_age: prevReport.audience_age,
          audience_gender: prevReport.audience_gender,
          audience_region: prevReport.audience_region,
          devices: prevReport.devices,
        };
        previousCommentTexts = Array.isArray(prevReport.comment_texts)
          ? prevReport.comment_texts as Array<{ body: string }>
          : [];
        console.log("Loaded previous data for merge protection");
      }
    }

    let extracted: Record<string, unknown> = {};
    let allImageUrls: string[] = imageUrls || [];
    let commentImages: string[] = [];
    let commentTexts: Array<{ body: string }> = [];
    const categoryResults: Record<string, CategoryResult> = {};
    const ocrTexts: string[] = [];
    const processedCategories = new Set<string>();

    if (categoryImages && typeof categoryImages === "object") {
      commentImages = (categoryImages as CategoryImages).comments || [];

      const analyzeCategories = { ...categoryImages } as Record<string, string[]>;
      delete analyzeCategories.comments;

      allImageUrls = Object.values(analyzeCategories).flat().filter(Boolean) as string[];

      const categoryEntries = Object.entries(analyzeCategories)
        .filter(([_, urls]) => urls && urls.length > 0);

      for (const [category, urls] of categoryEntries) {
        try {
          console.log(`Processing category: ${category} (${(urls as string[]).length} images)`);
          processedCategories.add(category);
          const result = await processCategory(LOVABLE_API_KEY, category, urls as string[]);
          categoryResults[category] = result;

          if (result.ocrText) ocrTexts.push(`--- ${category} ---\n${result.ocrText}`);

          if (result.status === "success" && result.data) {
            extracted = { ...extracted, ...result.data };
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Unknown";
          if (msg === "RATE_LIMIT") {
            return new Response(JSON.stringify({ error: "Rate limit exceeded", categoryResults }), {
              status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (msg === "CREDITS_EXHAUSTED") {
            return new Response(JSON.stringify({ error: "Credits exhausted", categoryResults }), {
              status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          categoryResults[category] = { status: "error", error: msg };
          continue;
        }
      }

      // Process comments separately
      if (commentImages.length > 0) {
        processedCategories.add("comments");
        try {
          console.log(`Processing comments (${commentImages.length} images)`);
          commentTexts = await structureCommentsFromImages(LOVABLE_API_KEY, commentImages);
          categoryResults.comments = { status: "success", data: { count: commentTexts.length } };
          console.log(`Extracted ${commentTexts.length} comments`);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Unknown";
          categoryResults.comments = { status: "error", error: msg };
        }
      }
    } else if (allImageUrls.length > 0) {
      processedCategories.add("overview");
      try {
        const ocrText = await extractOcrText(LOVABLE_API_KEY, allImageUrls, "全体");
        if (ocrText) {
          ocrTexts.push(ocrText);
          const overviewData = await structureOverviewFromOcr(LOVABLE_API_KEY, ocrText);
          extracted = { ...extracted, ...overviewData };
        }
      } catch (e) {
        console.error("Legacy analysis error:", e);
      }
    } else {
      return new Response(JSON.stringify({ error: "No images provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize
    extracted = normalizeAllExtracted(extracted);

    console.log("Processed categories:", [...processedCategories].join(", "));

    // ─── Merge with previous data (safe re-analysis) ───
    let mergeStatuses: MergeStatus[] = [];
    if (previousData) {
      const mergeResult = mergeWithPreviousData(previousData, extracted, processedCategories);
      extracted = mergeResult.merged;
      mergeStatuses = mergeResult.mergeStatuses;
      console.log("Merge statuses:", JSON.stringify(mergeStatuses));
    }

    // ─── Comments: protect previous if not processed or new is empty ───
    if (!processedCategories.has("comments") && previousCommentTexts.length > 0) {
      commentTexts = previousCommentTexts;
      mergeStatuses.push({
        category: "comments",
        status: "skipped",
        usedPrevious: true,
        improved: false,
      });
      console.log("Comments: skipped (not processed), keeping previous data");
    } else if (previousCommentTexts.length > 0 && commentTexts.length === 0) {
      commentTexts = previousCommentTexts;
      mergeStatuses.push({
        category: "comments",
        status: "used_previous",
        usedPrevious: true,
        improved: false,
      });
      console.log("Comments: kept previous data (new extraction was empty)");
    } else if (commentTexts.length > 0) {
      mergeStatuses.push({
        category: "comments",
        status: "success",
        usedPrevious: false,
        improved: true,
      });
    }

    // Save to DB
    const reportData = {
      campaign_id: campaignId || null,
      submission_id: submissionId || null,
      title: title || "レポート",
      impressions: extracted.impressions ?? null,
      views: extracted.views ?? null,
      ctr: extracted.ctr ?? null,
      avg_watch_time: (extracted.avg_watch_time as string) ?? null,
      total_watch_time: (extracted.total_watch_time as string) ?? null,
      retention_rate: extracted.retention_rate ?? null,
      complete_view_rate: extracted.complete_view_rate ?? null,
      like_rate: extracted.like_rate ?? null,
      traffic_sources: extracted.traffic_sources ?? {},
      search_terms: extracted.search_terms ?? {},
      audience_age: extracted.audience_age ?? {},
      audience_gender: extracted.audience_gender ?? {},
      audience_region: extracted.audience_region ?? {},
      devices: extracted.devices ?? {},
      raw_text: ocrTexts.join("\n\n") || null,
      source_images: allImageUrls,
      comment_images: commentImages,
      comment_texts: commentTexts,
      category_images: categoryImages || {},
      updated_at: new Date().toISOString(),
    };

    let report;
    let dbError;

    if (reportId) {
      const { data, error } = await serviceClient
        .from("analytics_reports")
        .update(reportData)
        .eq("id", reportId)
        .select()
        .single();
      report = data;
      dbError = error;
    } else {
      const { data, error } = await serviceClient
        .from("analytics_reports")
        .insert({ ...reportData, created_by: userId })
        .select()
        .single();
      report = data;
      dbError = error;
    }

    if (dbError) {
      console.error("DB error:", dbError);
      return new Response(JSON.stringify({ error: "Failed to save report", categoryResults }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      report,
      extracted,
      reportId: report.id,
      categoryResults,
      mergeStatuses,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-report-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});