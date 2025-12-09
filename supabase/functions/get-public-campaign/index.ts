import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const slug = url.searchParams.get('slug')

    if (!slug) {
      console.error('Missing slug parameter')
      return new Response(
        JSON.stringify({ error: 'slug parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Fetching campaign with slug: ${slug}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 本番DBスキーマに対応したカラム名
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        id,
        title,
        slug,
        summary,
        platforms,
        deliverables,
        deadline,
        posting_date,
        restrictions,
        status,
        created_at,
        video_production_only,
        secondary_usage,
        ad_appearance,
        image_materials,
        attachments,
        nda_template,
        requires_consent,
        client_name,
        shooting_only,
        editing_only,
        shooting_and_editing,
        tieup_post_production,
        is_th,
        planned_post_date,
        requirements
      `)
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    if (!data) {
      console.log(`Campaign not found: ${slug}`)
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Successfully fetched campaign: ${data.title}`)

    // 機密フィールドを除外して返す
    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in get-public-campaign:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})