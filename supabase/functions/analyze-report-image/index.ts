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
    system: `You extract YouTube Analytics REACH/OVERVIEW metrics from screenshots.
Focus ONLY on: impressions, views, CTR, average watch time, total watch time.
Rules:
- Convert Japanese numbers: 74.1万 → 741000, 1.2万 → 12000
- Convert percentages to decimals: 3.4% → 0.034
- Time durations as strings: "4:32"
- If not found, use null`,
    user: "この画像からインプレッション数・再生回数・CTR・平均視聴時間・総再生時間を抽出してください。",
    fields: ["impressions", "views", "ctr", "avg_watch_time", "total_watch_time"],
  },
  engagement: {
    system: `You extract YouTube Analytics ENGAGEMENT metrics from screenshots.
Focus ONLY on: like rate, retention rate, complete view rate.
Rules:
- Convert Japanese numbers: 1.2万 → 12000
- Percentages to decimals: 45.3% → 0.453
- complete_view_rate is the percentage of viewers who watched the entire video
- If not found, use null`,
    user: "この画像から高評価率・視聴維持率・完全視聴率を抽出してください。",
    fields: ["like_rate", "retention_rate", "complete_view_rate"],
  },
  traffic: {
    system: `You extract YouTube Analytics TRAFFIC SOURCE data from screenshots.
Focus ONLY on traffic sources breakdown (e.g. ブラウジング機能, 関連動画, YouTube検索, 外部, 直接, その他).
Return as object with source name keys and decimal percentage values (e.g. 0.45 for 45%).
All values should sum to approximately 1.0.`,
    user: "この画像からトラフィックソース（流入経路）の内訳を抽出してください。",
    fields: ["traffic_sources"],
  },
  search_terms: {
    system: `You extract YouTube Analytics SEARCH TERMS data from screenshots.
Extract the search keywords/terms that viewers used to find this video.
Return search_terms as an object with search term string keys and numeric values representing impressions or clicks.
Example: {"キーワードA": 1500, "キーワードB": 800}
If percentages are shown, convert to decimals.`,
    user: "この画像からYouTube検索語句（検索キーワード）とその数値を抽出してください。",
    fields: ["search_terms"],
  },
  audience: {
    system: `You extract YouTube Analytics AUDIENCE DEMOGRAPHICS from screenshots.
Focus on age distribution and gender distribution.
- audience_age: object with age range keys (e.g. "13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+") and decimal values
- audience_gender: object with keys like "男性"/"女性" (or "male"/"female") and decimal values
All values in each category should sum to approximately 1.0.`,
    user: "この画像から視聴者の年齢分布と性別比率を抽出してください。",
    fields: ["audience_age", "audience_gender"],
  },
  geography: {
    system: `You extract YouTube Analytics GEOGRAPHY/REGION data from screenshots.
Return audience_region as object with country/region name keys and decimal percentage values.
Values should sum to approximately 1.0.`,
    user: "この画像から視聴者の地域分布を抽出してください。",
    fields: ["audience_region"],
  },
  devices: {
    system: `You extract YouTube Analytics DEVICE data from screenshots.
Return devices as object with device type keys (e.g. "モバイル", "パソコン", "タブレット", "テレビ") and decimal percentage values.
Values should sum to approximately 1.0.`,
    user: "この画像からデバイス別の視聴割合を抽出してください。",
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
