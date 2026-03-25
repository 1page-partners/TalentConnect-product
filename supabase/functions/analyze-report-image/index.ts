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
Your task: extract TRAFFIC SOURCE breakdown data.

CRITICAL EXTRACTION RULES:
1. Look for traffic source categories such as:
   - ブラウジング機能 / Browse features
   - 関連動画 / Suggested videos
   - YouTube検索 / YouTube search
   - 外部 / External
   - 直接または不明 / Direct or unknown
   - チャンネルページ / Channel pages
   - 通知 / Notifications
   - その他 / Other
2. Each source has a percentage. Convert to decimal: "45.3%" → 0.453
3. If raw view counts are shown instead of percentages, calculate percentages from them.
4. All values should sum to approximately 1.0.
5. Use the JAPANESE label as the key name.`,
    user: `この YouTube アナリティクスのスクリーンショットからトラフィックソース（流入経路）の内訳を抽出してください。
各ソースの割合を小数で返してください（例: 45.3% → 0.453）。
キー名は日本語のラベルをそのまま使ってください。`,
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
Your task: extract AUDIENCE DEMOGRAPHICS (age + gender).

CRITICAL EXTRACTION RULES:
1. Age distribution - look for bars/data with age ranges:
   - "13-17歳", "18-24歳", "25-34歳", "35-44歳", "45-54歳", "55-64歳", "65歳以上"
   - Use simplified keys: "13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"
   - Values as decimals summing to ~1.0
2. Gender distribution - look for:
   - 男性 / Male, 女性 / Female
   - Use keys: "男性", "女性"
   - Values as decimals summing to ~1.0
3. Read the EXACT percentages from the chart bars or labels.
4. YouTube often shows age+gender combined (stacked bars). Sum male+female per age group for audience_age.`,
    user: `この YouTube アナリティクスのスクリーンショットから視聴者の年齢分布と性別比率を正確に読み取ってください。
- audience_age: 年齢層ごとの割合（小数）
- audience_gender: 性別ごとの割合（小数）`,
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
Your task: extract DEVICE TYPE distribution.

CRITICAL EXTRACTION RULES:
1. Look for device types:
   - モバイル / Mobile
   - パソコン / Computer/Desktop
   - タブレット / Tablet  
   - テレビ / TV
   - ゲーム機 / Game console
2. Convert percentages to decimals: "65.2%" → 0.652
3. Use the JAPANESE label as key name.
4. Values should sum to approximately 1.0.`,
    user: `この YouTube アナリティクスのスクリーンショットからデバイス別の視聴割合を抽出してください。
デバイス名をキー、割合を小数で返してください。`,
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

      for (const [category, urls] of categories) {
        try {
          const categoryResult = await analyzeCategory(LOVABLE_API_KEY, urls as string[], category);
          extracted = { ...extracted, ...categoryResult };
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : "Unknown error";
          if (errorMsg.includes("Rate limit") || errorMsg.includes("Credits")) {
            return new Response(JSON.stringify({ error: errorMsg }), {
              status: errorMsg.includes("Rate limit") ? 429 : 402,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          console.error(`Category ${category} analysis failed:`, e);
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
              content: `You are a YouTube Analytics screenshot data extractor. Extract all metrics from the screenshots.
Convert Japanese numbers (74.1万→741000), percentages to decimals (3.4%→0.034), keep time as strings.
Use null for missing values. Distribution objects should have string keys and decimal values summing to ~1.0.`,
            },
            {
              role: "user",
              content: [
                { type: "text", text: "以下のYouTubeアナリティクスのスクリーンショットから、すべての指標を抽出してください。" },
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
            extracted = JSON.parse(toolCall.function.arguments);
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
