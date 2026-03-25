import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { imageUrls, campaignId, submissionId, title } = await req.json();

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return new Response(JSON.stringify({ error: "imageUrls is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build vision message with all images
    const imageContent = imageUrls.map((url: string) => ({
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
            content: `You are a YouTube Analytics screenshot data extractor. Extract metrics from the provided screenshots and return structured data using the extract_metrics tool. 
Rules:
- Convert Japanese number formats: 74.1万 → 741000, 1.2万 → 12000
- Convert percentages: 3.4% → 0.034
- For time durations, keep as string (e.g. "4:32")
- If a value cannot be found, use null
- For traffic_sources, audience_age, audience_gender, audience_region, devices: use objects with string keys and numeric values (percentages as decimals)
- Extract as much data as possible from the images`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "以下のYouTubeアナリティクスのスクリーンショットから、すべての指標を抽出してください。" },
              ...imageContent,
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_metrics",
              description: "Extract YouTube analytics metrics from screenshots",
              parameters: {
                type: "object",
                properties: {
                  impressions: { type: "number", description: "Total impressions count" },
                  views: { type: "number", description: "Total view count" },
                  ctr: { type: "number", description: "Click-through rate as decimal (e.g. 0.034 for 3.4%)" },
                  avg_watch_time: { type: "string", description: "Average watch time (e.g. '4:32')" },
                  total_watch_time: { type: "string", description: "Total watch time (e.g. '1,234時間')" },
                  retention_rate: { type: "number", description: "Average retention rate as decimal" },
                  likes: { type: "number", description: "Like count" },
                  like_rate: { type: "number", description: "Like rate as decimal" },
                  traffic_sources: {
                    type: "object",
                    description: "Traffic sources with percentages",
                    additionalProperties: { type: "number" },
                  },
                  audience_age: {
                    type: "object",
                    description: "Age distribution with percentages",
                    additionalProperties: { type: "number" },
                  },
                  audience_gender: {
                    type: "object",
                    description: "Gender distribution with percentages",
                    additionalProperties: { type: "number" },
                  },
                  audience_region: {
                    type: "object",
                    description: "Region distribution with percentages",
                    additionalProperties: { type: "number" },
                  },
                  devices: {
                    type: "object",
                    description: "Device distribution with percentages",
                    additionalProperties: { type: "number" },
                  },
                  raw_text: { type: "string", description: "All raw text found in the images" },
                },
                required: [],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_metrics" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    let extracted: Record<string, unknown> = {};

    try {
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        extracted = JSON.parse(toolCall.function.arguments);
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
    }

    // Save to DB
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: report, error: insertError } = await serviceClient
      .from("analytics_reports")
      .insert({
        campaign_id: campaignId || null,
        submission_id: submissionId || null,
        title: title || "レポート",
        impressions: extracted.impressions ?? null,
        views: extracted.views ?? null,
        ctr: extracted.ctr ?? null,
        avg_watch_time: (extracted.avg_watch_time as string) ?? null,
        total_watch_time: (extracted.total_watch_time as string) ?? null,
        retention_rate: extracted.retention_rate ?? null,
        likes: extracted.likes ?? null,
        like_rate: extracted.like_rate ?? null,
        traffic_sources: extracted.traffic_sources ?? {},
        audience_age: extracted.audience_age ?? {},
        audience_gender: extracted.audience_gender ?? {},
        audience_region: extracted.audience_region ?? {},
        devices: extracted.devices ?? {},
        raw_text: (extracted.raw_text as string) ?? null,
        source_images: imageUrls,
        created_by: userId,
      })
      .select()
      .single();

    if (insertError) {
      console.error("DB insert error:", insertError);
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
