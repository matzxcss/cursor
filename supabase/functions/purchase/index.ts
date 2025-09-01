import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PURCHASE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Purchase function started");
    
    const { quantity } = await req.json();
    
    if (!quantity || quantity < 1 || quantity > 10000) {
      return new Response(JSON.stringify({ 
        error: "Quantidade deve ser entre 1 e 10000 rifas" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create Supabase client for auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        error: "Usuário não autenticado" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      logStep("Authentication error", { error: userError?.message });
      return new Response(JSON.stringify({ 
        error: "Usuário não autenticado" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Calculate price: R$ 0.10 for < 1000, R$ 0.05 for >= 1000
    const totalPrice = quantity >= 1000 ? quantity * 0.05 : quantity * 0.10;

    // Get user info from metadata
    const userName = user.user_metadata?.full_name || 'Usuário';
    const userPhone = user.user_metadata?.phone || '';

    // Create Supabase service client for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Generate raffle numbers
    const { data: raffleNumbers, error: numbersError } = await supabaseService
      .rpc('generate_raffle_numbers', { quantity });

    if (numbersError) {
      logStep("Error generating raffle numbers", { error: numbersError.message });
      return new Response(JSON.stringify({ 
        error: "Erro ao gerar números da rifa" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    logStep("Generated raffle numbers", { numbers: raffleNumbers, quantity });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `${quantity} Rifas - Porsche Taycan 2025`,
              description: `${quantity} números da rifa do Porsche Taycan 2025`,
            },
            unit_amount: Math.round(totalPrice * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/cancel`,
      metadata: {
        user_id: user.id,
        quantity: quantity.toString(),
        user_name: userName,
        user_phone: userPhone,
      },
    });

    logStep("Stripe session created", { sessionId: session.id });

    // Store purchase record in database
    const { error: insertError } = await supabaseService
      .from('raffle_purchases')
      .insert({
        user_id: user.id,
        user_name: userName,
        user_phone: userPhone,
        stripe_session_id: session.id,
        raffle_numbers: raffleNumbers,
        quantity,
        amount: Math.round(totalPrice * 100), // Store in cents
        status: 'pending',
      });

    if (insertError) {
      logStep("Error storing purchase", { error: insertError.message });
      return new Response(JSON.stringify({ 
        error: "Erro ao registrar compra" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    logStep("Purchase stored successfully");

    return new Response(JSON.stringify({
      success: true,
      url: session.url,
      raffle_numbers: raffleNumbers,
      quantity,
      total_amount: totalPrice,
      message: `Compra criada! ${quantity} rifas com números: ${raffleNumbers.join(', ')}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("Unexpected error", { error: error.message });
    return new Response(JSON.stringify({ 
      error: "Erro interno do servidor" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});