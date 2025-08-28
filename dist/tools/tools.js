// @ts-nocheck
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { searchConversations, searchVectors } from "../utils/retrievers.js";
export const retrieverTool = tool(async ({ query }) => {
    const results = await searchVectors(query);
    return results;
}, {
    name: "retriever",
    description: "Eres una herramienta de consulta de información sobre Asadores El Barril. Tu tarea es buscar y extraer solo la información relevante de la base de datos, respondiendo a las consultas de los clientes. Siempre entrega el resultado bien formateado para que sea facil de leer. Usa esta herramienta para responder preguntas específicas sobre preguntas frecuentes, politicas de devolucion e informacion general de la empresa, productos a la venta.",
    schema: z.object({
        query: z.string(),
    }),
});
// Tool para buscar ejemplos de conversaciones
export const conversationExamplesTool = tool(async ({ query }) => {
    const results = await searchConversations(query);
    return results;
}, {
    name: "conversation_examples",
    description: "Busca ejemplos de conversaciones reales entre asesores y clientes para usar como referencia. Utiliza esta herramienta cuando necesites ejemplos de cómo los asesores humanos responden a situaciones similares, o cuando quieras imitar el estilo conversacional natural de un asesor de Asadores El Barril.",
    schema: z.object({
        query: z
            .string()
            .describe("La situación o consulta para la que necesitas ejemplos de conversación"),
    }),
});
