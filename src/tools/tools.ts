// @ts-nocheck
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { contactCustomerService } from "../utils/functions.js";
import { searchVectors } from "../utils/retrievers.js";

export const retrieverTool = tool(
  async ({ query }: { query: string }) => {
    const results = await searchVectors(query);
    return results;
  },
  {
    name: "retriever",
    description:
      "Eres una herramienta de consulta de información sobre Fénix. Tu tarea es buscar y extraer solo la información relevante de la base de datos, respondiendo a las consultas de los clientes. Siempre entrega el resultado bien formateado para que sea facil de leer. Usa esta herramienta para responder preguntas específicas sobre preguntas frecuentes, politicas de devolucion e informacion general de la empresa, productos a la venta.",
    schema: z.object({
      query: z.string(),
    }),
  }
);

export const contactTool = tool(
  async () => {
    const contact = contactCustomerService();
    return contact;
  },
  {
    name: "contacto_servicio_cliente",
    description:
      "Brinda el canal de contacto para otros servicios diferentes a los servicios contables y de revisoría fiscal ofrecidos por Fenix Medellín. Esta tool se debe ejecutar cuando el cliente solicita información sobre otros servicios diferentes a los mencionados anteriormente.",
    schema: z.object({}),
  }
);
