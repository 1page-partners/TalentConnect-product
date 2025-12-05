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

    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        id,
        title,
        slug,
        summary,
        requirements,
        platforms,
        platform_deliverables,
        deadline,
        planned_post_date,
        restrictions,
        status,
        created_at,
        is_video_production_only,
        secondary_usage,
        has_advertisement_appearance,
        is_th,
        image_materials,
        attachments,
        nda_template,
        requires_consent,
        client_name
      `)
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`Campaign not found: ${slug}`)
        return new Response(
          JSON.stringify({ error: 'Campaign not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      console.error('Database error:', error)
      throw error
    }

    console.log(`Successfully fetched campaign: ${data.title}`)

    // 機密フィールドを除外して返す
    // contact_email, nda_url, management_sheet_url, report_url, client_name は含まない
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