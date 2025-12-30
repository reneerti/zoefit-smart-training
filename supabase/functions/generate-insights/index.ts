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
    const { workoutData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating insights for workout data:", JSON.stringify(workoutData).substring(0, 200));

    const systemPrompt = `Você é um treinador pessoal expert e analista de dados fitness chamado ZoeAI. 
Analise os dados de treino fornecidos e gere insights personalizados em português brasileiro.

Gere exatamente 4 insights nos seguintes tipos:
1. achievement (conquista): Algo positivo que o usuário alcançou
2. progress (progresso): Análise de evolução nos treinos
3. recommendation (recomendação): Sugestão para melhorar os resultados
4. warning (alerta): Algo que precisa de atenção

Responda APENAS com um JSON válido no seguinte formato:
{
  "insights": [
    {
      "type": "achievement" | "progress" | "recommendation" | "warning",
      "title": "título curto com emoji",
      "content": "descrição detalhada de 2-3 frases",
      "metrics": [
        { "label": "nome da métrica", "value": "valor", "trend": "up" | "down" | "stable" }
      ]
    }
  ]
}`;

    const userPrompt = `Dados do usuário:
- Total de treinos: ${workoutData.totalWorkouts}
- Treinos esta semana: ${workoutData.thisWeekWorkouts}
- Tempo total: ${workoutData.totalMinutes} minutos
- Tempo médio por sessão: ${workoutData.averageSessionTime} minutos
- Sequência atual: ${workoutData.streak} dias
- Exercícios completados: ${workoutData.exercisesCompleted}
- Progresso semanal: ${JSON.stringify(workoutData.weeklyProgress)}
- Sessões recentes: ${JSON.stringify(workoutData.recentSessions?.slice(0, 5) || [])}

Gere insights personalizados e motivadores baseados nesses dados.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
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
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response:", content?.substring(0, 500));

    // Parse the JSON response
    let insights;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return fallback insights
      insights = {
        insights: [
          {
            type: "achievement",
            title: "🏆 Continue Assim!",
            content: "Você está no caminho certo! Seus treinos mostram dedicação e consistência.",
            metrics: [{ label: "Treinos totais", value: String(workoutData.totalWorkouts), trend: "up" }]
          },
          {
            type: "progress",
            title: "📈 Progresso Sólido",
            content: `Você acumulou ${workoutData.totalMinutes} minutos de treino. Continue mantendo sua rotina!`,
            metrics: [{ label: "Tempo total", value: `${Math.round(workoutData.totalMinutes / 60)}h`, trend: "up" }]
          },
          {
            type: "recommendation",
            title: "💡 Dica de Otimização",
            content: "Tente manter uma média de 45-60 minutos por sessão para resultados ideais.",
            metrics: [{ label: "Média atual", value: `${workoutData.averageSessionTime}min`, trend: "stable" }]
          },
          {
            type: "warning",
            title: "⚠️ Mantenha o Ritmo",
            content: "Consistência é a chave! Tente completar pelo menos 4 treinos por semana.",
            metrics: [{ label: "Esta semana", value: String(workoutData.thisWeekWorkouts), trend: "stable" }]
          }
        ]
      };
    }

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-insights function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
