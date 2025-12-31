import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { workoutPlan, model = 'google/gemini-2.5-flash' } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing workout plan with model:', model);
    console.log('Workout plan:', JSON.stringify(workoutPlan, null, 2));

    const systemPrompt = `Você é um personal trainer experiente que analisa planos de treino.
Analise o treino fornecido e dê recomendações construtivas em português brasileiro.

IMPORTANTE: 
- Seja breve e direto (máximo 3-4 frases)
- Foque em irregularidades como misturar grupos musculares incompatíveis no mesmo dia
- Verifique se há excesso de volume ou falta de descanso
- Veja se está bem distribuído ao longo da semana
- NÃO PROÍBA nada, apenas RECOMENDE melhorias se necessário
- Se o treino estiver bem estruturado, elogie e dê uma dica rápida

Responda em JSON com a estrutura:
{
  "hasIssues": boolean,
  "recommendation": "sua recomendação aqui",
  "summary": "resumo de 1 linha sobre o treino"
}`;

    const userPrompt = `Analise este plano de treino:

${JSON.stringify(workoutPlan, null, 2)}

Verifique se há alguma irregularidade como:
- Treinar o mesmo grupo muscular em dias consecutivos
- Misturar tipos de treino de forma não ideal
- Falta de equilíbrio entre grupos musculares
- Excesso de exercícios para um grupo e poucos para outro`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error('Erro ao analisar treino');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI Analysis Response:', content);

    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      analysis = {
        hasIssues: false,
        recommendation: "Treino bem estruturado! Continue assim e lembre-se de manter a consistência.",
        summary: "Plano de treino adequado"
      };
    }

    return new Response(JSON.stringify({ 
      success: true,
      analysis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-workout:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
