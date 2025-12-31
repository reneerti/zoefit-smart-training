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
    const { formData, model = 'google/gemini-2.5-flash' } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating workout profile with model:', model);
    console.log('Form data:', formData);

    const systemPrompt = `Você é um personal trainer experiente que cria planos de treino personalizados.
Baseado nas informações do usuário, crie um plano de treino estruturado.

SEMPRE responda em JSON válido com a seguinte estrutura:
{
  "profileName": "Nome sugestivo para o perfil (ex: 'Foco em Hipertrofia', 'Definição Verão')",
  "description": "Breve descrição do perfil e objetivos",
  "workouts": [
    {
      "name": "Nome do treino (ex: 'Treino A - Peito e Tríceps')",
      "dayOfWeek": 1, // 0=Domingo, 1=Segunda, etc. ou null se não tiver dia fixo
      "youtubeSearch": "termo de busca no youtube para encontrar referência",
      "exercises": [
        {
          "name": "Nome do exercício",
          "sets": "4",
          "reps": "12",
          "notes": "Observações técnicas",
          "youtubeSearch": "termo de busca no youtube para o exercício"
        }
      ]
    }
  ]
}`;

    const userPrompt = `Crie um plano de treino para:
- Objetivo: ${formData.goal}
- Nível de experiência: ${formData.experienceLevel}
- Dias disponíveis por semana: ${formData.availableDays}
- Duração por treino: ${formData.workoutDuration} minutos
- Áreas de foco: ${formData.focusAreas?.join(', ') || 'Geral'}
- Limitações/Lesões: ${formData.limitations || 'Nenhuma'}
- Equipamentos disponíveis: ${formData.equipment?.join(', ') || 'Academia completa'}

Crie ${formData.availableDays} treinos diferentes, um para cada dia disponível.`;

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
        temperature: 0.7,
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
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Créditos insuficientes. Entre em contato com o suporte.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error('Erro ao gerar plano de treino');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI Response:', content);

    let workoutPlan;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        workoutPlan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      workoutPlan = {
        profileName: "Treino Personalizado",
        description: "Plano de treino gerado por IA",
        workouts: [
          {
            name: "Treino A - Corpo Inteiro",
            dayOfWeek: 1,
            youtubeSearch: "treino corpo inteiro iniciante",
            exercises: [
              { name: "Agachamento", sets: "3", reps: "12", notes: "Foco na técnica", youtubeSearch: "como fazer agachamento corretamente" },
              { name: "Supino", sets: "3", reps: "10", notes: "Controle o movimento", youtubeSearch: "supino reto técnica correta" },
              { name: "Remada", sets: "3", reps: "12", notes: "Mantenha as costas retas", youtubeSearch: "remada curvada execução" }
            ]
          }
        ]
      };
    }

    return new Response(JSON.stringify({ 
      success: true,
      workoutPlan,
      model
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fit-ai-generator:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
