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

const CATEGORY_PROMPTS: Record<string, { system: string; user: string; fields: string[] }> = {
  overview: {
    system: `You are an expert data extractor specializing in YouTube Studio Analytics screenshots.
Your task: extract REACH/OVERVIEW metrics with high precision.

CRITICAL EXTRACTION RULES:
1. Japanese number conversion:
   - 万 = ×10,000: "74.1万" → 741000, "1.2万" → 12000, "3万" → 30000
   - 億 = ×100,000,000: "1.2億" → 120000000
   - Plain numbers: "1,234" → 1234, "567" → 567
2. Percentage → decimal: "3.4%" → 0.034, "45.3%" → 0.453
3. Time durations stay as strings: "4:32", "1:05:30"
4. Look for these EXACT labels in the screenshot:
   - インプレッション数 / Impressions → impressions
   - 視聴回数 / Views → views  
   - インプレッションのクリック率 / CTR → ctr (as decimal)
   - 平均視聴時間 / Average view duration → avg_watch_time (string)
   - 総再生時間 / Watch time → total_watch_time (string, e.g. "123.4時間" or "5,678分")
5. Numbers next to these labels are the values. Read them carefully.
6. If a value is not visible, return null.`,
    user: `この YouTube アナリティクスのスクリーンショットから以下の指標を正確に読み取って抽出してください：
- インプレッション数（impressions）
- 視聴回数（views）
- インプレッションのクリック率 CTR（ctr）→ 小数で返す
- 平均視聴時間（avg_watch_time）→ 文字列で返す
- 総再生時間（total_watch_time）→ 文字列で返す

数値は正確に読み取り、万・億などの単位を適切に変換してください。`,
    fields: ["impressions", "views", "ctr", "avg_watch_time", "total_watch_time"],
  },
  engagement: {
    system: `You are an expert data extractor specializing in YouTube Studio Analytics screenshots.
Your task: extract ENGAGEMENT metrics with high precision.

CRITICAL EXTRACTION RULES:
1. Japanese number conversion:
   - 万 = ×10,000: "1.2万" → 12000
   - Plain numbers with commas: "1,234" → 1234
2. Percentage → decimal: "45.3%" → 0.453, "3.4%" → 0.034
3. Look for these labels:
   - 高評価率 / Like rate → like_rate (decimal, e.g. 0.034)
   - 視聴者維持率 / Audience retention → retention_rate (decimal, e.g. 0.453)
   - If you see a retention percentage graph, extract the average value shown
   - 完全視聴率 / Complete view rate → complete_view_rate (decimal)
4. Do NOT extract raw like count; only extract the RATE.
5. If a value is not visible, return null.`,
    user: `この YouTube アナリティクスのスクリーンショットから以下の指標を正確に読み取ってください：
- 高評価率（like_rate）→ 小数で返す
- 視聴者維持率（retention_rate）→ 小数で返す（グラフに表示されている平均値）
- 完全視聴率（complete_view_rate）→ 小数で返す

パーセンテージは全て小数に変換してください（例: 45.3% → 0.453）。`,
    fields: ["like_rate", "retention_rate", "complete_view_rate"],
  },
  traffic: {
    system: `You are an expert data extractor specializing in YouTube Studio Analytics screenshots.
Your task: extract TRAFFIC SOURCE breakdown data with EXACT precision.

The screenshot shows "視聴者がこの動画を見つけた方法" (How viewers found this video) section.
It typically has a donut/pie chart on the left and a list of sources with percentages on the right.

CRITICAL EXTRACTION RULES:
1. Read the EXACT percentage shown next to each traffic source label:
   - ブラウジング機能 → key: "ブラウジング機能"
   - 関連動画 → key: "関連動画"  
   - YouTube検索 → key: "YouTube検索"
   - 外部 → key: "外部"
   - 直接入力または不明 → key: "直接入力または不明"
   - チャンネルページ → key: "チャンネルページ"
   - その他のYouTube機能 → key: "その他のYouTube機能"
   - 通知 → key: "通知"
   - その他 → key: "その他"
2. Convert percentage to decimal: "91.2%" → 0.912, "2.4%" → 0.024
3. Include ALL sources listed, even small ones (0.8% etc.)
4. Use the EXACT Japanese label as shown in the screenshot.
5. Values should sum to approximately 1.0.`,
    user: `この YouTube アナリティクスの「トラフィックソース」スクリーンショットを正確に読み取ってください。

重要: 各トラフィックソースの右側に表示されているパーセンテージの数値を正確に読み取り、小数に変換してください。
例: ブラウジング機能 91.2% → 0.912

キー名はスクリーンショットに表示されている日本語ラベルをそのまま使ってください。`,
    fields: ["traffic_sources"],
  },
  search_terms: {
    system: `You are an expert data extractor specializing in YouTube Studio Analytics screenshots.
Your task: extract SEARCH TERMS / KEYWORDS data.

CRITICAL EXTRACTION RULES:
1. Extract each search term/keyword shown in the screenshot.
2. For each term, extract the associated number (impressions, views, or clicks).
3. Japanese number conversion: "1.2万" → 12000, "567" → 567
4. Return as object: {"keyword1": number1, "keyword2": number2, ...}
5. Include ALL visible search terms, not just the top ones.`,
    user: `この YouTube アナリティクスのスクリーンショットから YouTube 検索語句（検索キーワード）とその数値を全て抽出してください。`,
    fields: ["search_terms"],
  },
  audience: {
    system: `You are an expert data extractor specializing in YouTube Studio Analytics screenshots.
Your task: extract AUDIENCE DEMOGRAPHICS (age + gender) with EXACT precision.

The screenshot shows a "年齢と性別" (Age and Gender) section from YouTube Studio.
It has a layout like this:
- Gender section at top with horizontal bars showing "女性 XX.X%" and "男性 XX.X%"
- Age section below with horizontal bars for each age range showing percentages on the right

CRITICAL EXTRACTION RULES:
1. Age distribution - Read the EXACT percentage number shown to the RIGHT of each age range bar:
   - "13〜17歳" or "13～17歳" → key: "13-17"
   - "18〜24歳" or "18～24歳" → key: "18-24"  
   - "25〜34歳" or "25～34歳" → key: "25-34"
   - "35〜44歳" or "35～44歳" → key: "35-44"
   - "45〜54歳" or "45～54歳" → key: "45-54"
   - "55〜64歳" or "55～64歳" → key: "55-64"
   - "65歳以上" → key: "65+"
   - Convert percentage to decimal: "47.7%" → 0.477, "1.3%" → 0.013, "0%" → 0
2. Gender distribution:
   - Read the EXACT percentage shown next to "女性" and "男性"
   - Use keys: "男性", "女性"
   - Convert: "86.6%" → 0.866, "13.4%" → 0.134
   - If "ユーザーによる設定" is shown with a percentage, include as key "その他"
3. Values should sum to approximately 1.0 for each group.
4. Do NOT estimate from bar lengths - read the ACTUAL numbers printed in the screenshot.`,
    user: `この YouTube アナリティクスの「年齢と性別」スクリーンショットを正確に読み取ってください。

重要: バーの長さではなく、右側に表示されている数値（パーセンテージ）を正確に読み取ってください。

返却形式を厳守してください:
- audience_age は {"13-17":0, "18-24":0, "25-34":0.013, ... } のように年齢キーのみ
- audience_gender は {"女性":0.134, "男性":0.866, "その他":0} のように性別キーのみ
- 年齢キーに性別を混ぜないでください
- 画面上で 0% と見える項目は 0 を返してください

- audience_age: 各年齢層の右側に表示されている割合を小数で返す（例: 47.7% → 0.477）
- audience_gender: 男性・女性の横に表示されている割合を小数で返す（例: 86.6% → 0.866）`,
    fields: ["audience_age", "audience_gender"],
  },
  geography: {
    system: `You are an expert data extractor specializing in YouTube Studio Analytics screenshots.
Your task: extract GEOGRAPHIC distribution of viewers.

CRITICAL EXTRACTION RULES:
1. Extract country/region names and their percentage values.
2. Convert percentages to decimals: "85.3%" → 0.853
3. Use the exact region name shown (Japanese or English).
4. Common regions: 日本, アメリカ合衆国, 韓国, 台湾, etc.
5. Values should sum to approximately 1.0 (or close, if only top regions shown).`,
    user: `この YouTube アナリティクスのスクリーンショットから視聴者の地域分布を抽出してください。
国/地域名をキー、割合を小数で返してください。`,
    fields: ["audience_region"],
  },
  devices: {
    system: `You are an expert data extractor specializing in YouTube Studio Analytics screenshots.
Your task: extract DEVICE TYPE distribution with EXACT precision.

The screenshot shows "デバイスの種類" (Device types) section from YouTube Studio.
It has a horizontal stacked bar at the top and a list of devices with percentages below.

CRITICAL EXTRACTION RULES:
1. Read the EXACT percentage shown next to each device type:
   - テレビ → key: "テレビ" (e.g., 35.3%)
   - パソコン → key: "パソコン" (e.g., 26.7%)
   - 携帯電話 → key: "携帯電話" (e.g., 25.8%)
   - タブレット → key: "タブレット" (e.g., 11.8%)
   - ゲーム機 → key: "ゲーム機"
   - 不明 → key: "不明"
2. Convert percentage to decimal: "35.3%" → 0.353, "11.8%" → 0.118
3. Use the EXACT Japanese label shown in the screenshot.
4. Values should sum to approximately 1.0.
5. Do NOT confuse "携帯電話" (mobile phone) with "モバイル". Use the exact label shown.`,
    user: `この YouTube アナリティクスの「デバイスの種類」スクリーンショットを正確に読み取ってください。

重要: 各デバイスの右側に表示されているパーセンテージを正確に読み取り、小数に変換してください。
例: テレビ 35.3% → 0.353

返却形式を厳守してください:
- devices は {"テレビ":0.353, "パソコン":0.267, "携帯電話":0.258, "タブレット":0.118} のように日本語ラベルのみ
- モバイル/スマホ系は「携帯電話」に正規化してください
- 0% の項目が見える場合は 0 を返してください`,
    fields: ["devices"],
  },
};

const TOOL_SCHEMA = {
  type: "function" as const,
  function: {
    name: "extract_metrics",
    description: "Extract YouTube analytics metrics from screenshots",
    parameters: {
      type: "object",
      properties: {
        impressions: { type: "number" },
        views: { type: "number" },
        ctr: { type: "number" },
        avg_watch_time: { type: "string" },
        total_watch_time: { type: "string" },
        retention_rate: { type: "number" },
        complete_view_rate: { type: "number" },
        like_rate: { type: "number" },
        traffic_sources: { type: "object", additionalProperties: { type: "number" } },
        search_terms: { type: "object", additionalProperties: { type: "number" } },
        audience_age: { type: "object", additionalProperties: { type: "number" } },
        audience_gender: { type: "object", additionalProperties: { type: "number" } },
        audience_region: { type: "object", additionalProperties: { type: "number" } },
        devices: { type: "object", additionalProperties: { type: "number" } },
        raw_text: { type: "string" },
      },
      required: [],
      additionalProperties: false,
    },
  },
};

type NumericRecord = Record<string, number>;

const AGE_KEY_MAP: Record<string, string> = {
  "13-17歳": "13-17",
  "13-17": "13-17",
  "13〜17歳": "13-17",
  "13～17歳": "13-17",
  "18-24歳": "18-24",
  "18-24": "18-24",
  "18〜24歳": "18-24",
  "18～24歳": "18-24",
  "25-34歳": "25-34",
  "25-34": "25-34",
  "25〜34歳": "25-34",
  "25～34歳": "25-34",
  "35-44歳": "35-44",
  "35-44": "35-44",
  "35〜44歳": "35-44",
  "35～44歳": "35-44",
  "45-54歳": "45-54",
  "45-54": "45-54",
  "45〜54歳": "45-54",
  "45～54歳": "45-54",
  "55-64歳": "55-64",
  "55-64": "55-64",
  "55〜64歳": "55-64",
  "55～64歳": "55-64",
  "65歳以上": "65+",
  "65才以上": "65+",
  "65以上": "65+",
  "65+": "65+",
};

const GENDER_KEY_MAP: Record<string, string> = {
  "男性": "男性",
  "男": "男性",
  "male": "男性",
  "女性": "女性",
  "女": "女性",
  "female": "女性",
  "ユーザーによる設定": "その他",
  "その他": "その他",
  "other": "その他",
  "不明": "その他",
};

const DEVICE_KEY_MAP: Record<string, string> = {
  "テレビ": "テレビ",
  "tv": "テレビ",
  "パソコン": "パソコン",
  "pc": "パソコン",
  "desktop": "パソコン",
  "computer": "パソコン",
  "携帯電話": "携帯電話",
  "スマートフォン": "携帯電話",
  "モバイル": "携帯電話",
  "mobile": "携帯電話",
  "タブレット": "タブレット",
  "tablet": "タブレット",
  "ゲーム機": "ゲーム機",
  "gameconsole": "ゲーム機",
  "不明": "不明",
};

const TRAFFIC_KEY_MAP: Record<string, string> = {
  "ブラウジング機能": "ブラウジング機能",
  "関連動画": "関連動画",
  "youtube検索": "YouTube検索",
  "you tube検索": "YouTube検索",
  "外部": "外部",
  "直接入力または不明": "直接入力または不明",
  "直接または不明": "直接入力または不明",
  "チャンネルページ": "チャンネルページ",
  "その他のyoutube機能": "その他のYouTube機能",
  "その他のyou tube機能": "その他のYouTube機能",
  "通知": "通知",
  "その他": "その他",
};

function normalizeLabelKey(value: string) {
  return value
    .trim()
    .replace(/\s+/g, "")
    .replace(/[％]/g, "%")
    .replace(/[〜～–—−]/g, "-")
    .replace(/[：:]/g, "")
    .toLowerCase();
}

function toDecimalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

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

function normalizeDistribution(
  input: unknown,
  keyMap: Record<string, string>,
  options: { forceUnitInterval?: boolean } = {},
): NumericRecord {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const normalized: NumericRecord = {};

  for (const [rawKey, rawValue] of Object.entries(input as Record<string, unknown>)) {
    const canonicalKey = keyMap[normalizeLabelKey(rawKey)] ?? rawKey.trim();
    const parsedValue = toDecimalNumber(rawValue);

    if (parsedValue === null || parsedValue < 0) continue;
    normalized[canonicalKey] = (normalized[canonicalKey] ?? 0) + parsedValue;
  }

  let entries = Object.entries(normalized).filter(([, value]) => Number.isFinite(value));
  let sum = entries.reduce((total, [, value]) => total + value, 0);

  if (sum > 1.5 && sum <= 100.5) {
    entries = entries.map(([key, value]) => [key, value / 100]);
    sum = entries.reduce((total, [, value]) => total + value, 0);
  }

  if (options.forceUnitInterval && sum >= 0.95 && sum <= 1.05) {
    entries = entries.map(([key, value]) => [key, value / sum]);
  }

  return Object.fromEntries(entries.map(([key, value]) => [key, Number(value.toFixed(6))]));
}

function normalizeExtractedData(data: Record<string, unknown>, category?: string) {
  const normalized = { ...data };

  if (!category || category === "audience") {
    normalized.audience_age = normalizeDistribution(data.audience_age, AGE_KEY_MAP, { forceUnitInterval: true });
    normalized.audience_gender = normalizeDistribution(data.audience_gender, GENDER_KEY_MAP, { forceUnitInterval: true });
  }

  if (!category || category === "devices") {
    normalized.devices = normalizeDistribution(data.devices, DEVICE_KEY_MAP, { forceUnitInterval: true });
  }

  if (!category || category === "traffic") {
    normalized.traffic_sources = normalizeDistribution(data.traffic_sources, TRAFFIC_KEY_MAP, { forceUnitInterval: true });
  }

  return normalized;
}

async function analyzeCategory(
  apiKey: string,
  imageUrls: string[],
  category: string,
): Promise<Record<string, unknown>> {
  const prompt = CATEGORY_PROMPTS[category];
  if (!prompt || imageUrls.length === 0) return {};

  const imageContent = imageUrls.map((url) => ({
    type: "image_url",
    image_url: { url },
  }));

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: prompt.system },
        {
          role: "user",
          content: [
            { type: "text", text: prompt.user },
            ...imageContent,
          ],
        },
      ],
      tools: [TOOL_SCHEMA],
      tool_choice: { type: "function", function: { name: "extract_metrics" } },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`AI error for category ${category}:`, response.status, text);
    if (response.status === 429 || response.status === 402) {
      throw new Error(response.status === 429 ? "Rate limit exceeded" : "Credits exhausted");
    }
    return {};
  }

  const result = await response.json();
  try {
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      return JSON.parse(toolCall.function.arguments);
    }
  } catch (e) {
    console.error(`Parse error for category ${category}:`, e);
  }
  return {};
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { imageUrls, categoryImages, campaignId, submissionId, title, reportId } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let extracted: Record<string, unknown> = {};
    let allImageUrls: string[] = imageUrls || [];
    let commentImages: string[] = [];

    if (categoryImages && typeof categoryImages === "object") {
      // Separate comment images (not analyzed, just stored)
      commentImages = (categoryImages as CategoryImages).comments || [];

      // Collect all non-comment images for source_images
      const analyzeCategories = { ...categoryImages } as Record<string, string[]>;
      delete analyzeCategories.comments;

      allImageUrls = Object.values(analyzeCategories)
        .flat()
        .filter(Boolean) as string[];

      const categories = Object.entries(analyzeCategories)
        .filter(([_, urls]) => urls && urls.length > 0);

      // Process categories in parallel to avoid CPU timeout
      const results = await Promise.allSettled(
        categories.map(async ([category, urls]) => {
          const categoryResult = await analyzeCategory(LOVABLE_API_KEY, urls as string[], category);
          return { category, result: categoryResult };
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled") {
          extracted = { ...extracted, ...r.value.result };
        } else {
          const errorMsg = r.reason instanceof Error ? r.reason.message : "Unknown error";
          if (errorMsg.includes("Rate limit") || errorMsg.includes("Credits")) {
            return new Response(JSON.stringify({ error: errorMsg }), {
              status: errorMsg.includes("Rate limit") ? 429 : 402,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          console.error(`Category analysis failed:`, r.reason);
        }
      }
    } else if (allImageUrls.length > 0) {
      const imageContent = allImageUrls.map((url: string) => ({
        type: "image_url",
        image_url: { url },
      }));

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are an expert data extractor for YouTube Studio Analytics screenshots.

CRITICAL RULES:
- Japanese numbers: 万 = ×10,000 (74.1万→741000), 億 = ×100,000,000
- Percentages → decimals: 3.4% → 0.034, 45.3% → 0.453
- Time durations as strings: "4:32", "1:05:30"
- Distribution objects: keys are Japanese labels, values are decimals summing to ~1.0
- If a value is not visible, use null
- Read numbers very carefully from the screenshot`,
            },
            {
              role: "user",
              content: [
                { type: "text", text: "以下のYouTubeアナリティクスのスクリーンショットから、すべての指標を正確に読み取って抽出してください。数値の単位（万、億）に注意して正しく変換してください。" },
                ...imageContent,
              ],
            },
          ],
          tools: [TOOL_SCHEMA],
          tool_choice: { type: "function", function: { name: "extract_metrics" } },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Credits exhausted" }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        const aiResult = await response.json();
        try {
          const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            extracted = normalizeExtractedData(JSON.parse(toolCall.function.arguments));
          }
        } catch (e) {
          console.error("Failed to parse AI response:", e);
        }
      }
    } else {
      return new Response(JSON.stringify({ error: "No images provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    extracted = normalizeExtractedData(extracted);

    // Save to DB
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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
      raw_text: (extracted.raw_text as string) ?? null,
      source_images: allImageUrls,
      comment_images: commentImages,
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
      return new Response(JSON.stringify({ error: "Failed to save report" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ report, extracted }), {
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
