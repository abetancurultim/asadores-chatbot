// @ts-nocheck
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  contactCustomerService,
  getProductInventory,
  fetchUserName,
  sendEmailNotification,
  sendSoftwareSpecialistNotification,
  saveNickname,
  searchProductUrl,
  sendProductImagesToWhatsApp,
} from "../utils/functions.js";
import {
  searchProducts,
  searchVectors,
  searchConversations,
} from "../utils/retrievers.js";
import { setAvailableForAudio } from "../utils/setAvailableForAudio.js";
import { createQuotePDF } from "../utils/createQuote.js";

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

export const searchProductsTool = tool(
  async ({ query, topK = 4 }: { query: string; topK?: number }) => {
    const results = await searchProducts(query, topK);
    return results;
  },
  {
    name: "search_products",
    description:
      "Herramienta para buscar productos específicos en el catálogo de Fénix. Utilízala cuando el cliente busque información sobre productos disponibles, características o referencias específicas. Esta herramienta devuelve los productos más relevantes según la consulta, incluyendo SKU, descripción completa, precio y disponibilidad en inventario.",
    schema: z.object({
      query: z.string().describe("La consulta de búsqueda del producto"),
      topK: z
        .number()
        .optional()
        .default(4)
        .describe("Número máximo de resultados a devolver"),
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

export const setAvailableForAudioTool = tool(
  async ({ isAvailableForAudio }: { isAvailableForAudio: boolean }) => {
    const preferences = setAvailableForAudio(isAvailableForAudio);
    return preferences;
  },
  {
    name: "can_the_client_answer_audios",
    description:
      "si el cliente manifiesta una preferencia por recibir la informacion por audio o por texto o que no puede escuchar audios, si el usuario no peude escuchar audios setea en la base de datos FALSE, si puede escuchar audios setea en la base de datos TRUE. Además, debes enviar nuevamente al cliente el último mensaje que recibió en texto para que lo pueda leer en caso de no poder recibir audios.",
    schema: z.object({
      isAvailableForAudio: z.boolean(),
    }),
  }
);

export const inventoryTool = tool(
  async ({ sku }: { sku: string }) => {
    const result = await getProductInventory(sku);
    return result;
  },
  {
    name: "consultar_inventario",
    description:
      "Consulta la disponibilidad en inventario y el precio de un producto específico usando su código SKU. Utiliza esta herramienta cuando el cliente muestra interés en un producto específico y desea saber si está disponible, cuál es su precio exacto y el link de compra del producto en Mercado Libre.",
    schema: z.object({
      sku: z
        .string()
        .describe(
          "El código SKU del producto a consultar, ejemplo: CS-CP1-R105-1J4WF(AM-STD)"
        ),
    }),
  }
);

// Tool para buscar la url del producto en la página oficial de Mercado Libre
export const searchProductUrlTool = tool(
  async ({ sku }: { sku: string }) => {
    const result = await searchProductUrl(sku);
    return result;
  },
  {
    name: "search_product_url",
    description:
      "Busca la url del producto en la página oficial de Mercado Libre de Fenix. Utiliza esta herramienta cuando el cliente te pida el link de compra del producto.",
    schema: z.object({
      sku: z
        .string()
        .describe(
          "El código SKU del producto a consultar, ejemplo: CS-CP1-R105-1J4WF(AM-STD)"
        ),
    }),
  }
);

// Tool para crear cotizaciones en PDF
export const createQuoteTool = tool(
  async ({
    items,
    phoneNumber,
    client,
    address,
    city,
  }: {
    items: { sku: string; description: string; qty: number; price: number }[];
    phoneNumber: string;
    client: string;
    address: string;
    city: string;
  }) => {
    const url = await createQuotePDF(items, phoneNumber, client, address, city);
    return url;
  },
  {
    name: "create_quote",
    description:
      "Genera una cotización en PDF para uno o varios productos y la envía al cliente por WhatsApp. Utiliza esta herramienta cuando el cliente solicita una cotización formal.",
    schema: z.object({
      items: z
        .array(
          z.object({
            sku: z.string().describe("El código SKU del producto a cotizar"),
            description: z.string().describe("Descripción del producto"),
            qty: z.number().describe("Cantidad de ese producto"),
            price: z.number().describe("Precio unitario del producto"),
          })
        )
        .describe("Listado de ítems a cotizar"),
      phoneNumber: z
        .string()
        .describe("Número de teléfono del cliente para enviar la cotización"),
      client: z
        .string()
        .describe("Nombre del cliente que solicita la cotización"),
      address: z.string().describe("Dirección del cliente"),
      city: z.string().describe("Ciudad del cliente"),
    }),
  }
);

//Tool para consultar el nombre del cliente por su número de celular.
export const fetchUserNameTool = tool(
  async ({ phoneNumber }: { phoneNumber: string }) => {
    const userName = await fetchUserName(phoneNumber);
    return userName;
  },
  {
    name: "fetch_user_name",
    description:
      "Obtiene el nombre del cliente. Esto se hace para personalizar la conversación y hacerla más amigable. Ejecuta esta tool para obtener su nombre y dirigirte a él de manera más personalizada. Siempre ejecuta esta tool en el saludo inicial para validar si tenemos el nombre del cliente. Si no tenemos información, continua con la conversación de manera normal.",
    schema: z.object({
      phoneNumber: z.string(),
    }),
  }
);

// Tool para buscar ejemplos de conversaciones
export const conversationExamplesTool = tool(
  async ({ query }: { query: string }) => {
    const results = await searchConversations(query);
    return results;
  },
  {
    name: "conversation_examples",
    description:
      "Busca ejemplos de conversaciones reales entre asesores y clientes para usar como referencia. Utiliza esta herramienta cuando necesites ejemplos de cómo los asesores humanos responden a situaciones similares, o cuando quieras imitar el estilo conversacional natural de un asesor colombiano.",
    schema: z.object({
      query: z
        .string()
        .describe(
          "La situación o consulta para la que necesitas ejemplos de conversación"
        ),
    }),
  }
);

// Tool para enviar notificaciones por email cuando no hay stock suficiente
export const sendEmailNotificationTool = tool(
  async ({
    name,
    phone,
    email,
    message,
  }: {
    name: string;
    phone: string;
    email?: string;
    message: string;
  }) => {
    const result = await sendEmailNotification(name, phone, message);
    return result;
  },
  {
    name: "send_email_notification",
    description:
      "Envía una notificación por email al encargado cuando no hay suficiente stock de productos que el cliente solicita. Utiliza esta herramienta ÚNICAMENTE cuando el cliente requiera una cantidad de productos que no esté disponible en inventario y necesite que el encargado contacte al cliente para darle más información sobre alternativas, tiempos de reposición o continuar con el proceso de compra.",
    schema: z.object({
      name: z.string().describe("Nombre completo del cliente"),
      phone: z.string().describe("Número de teléfono del cliente"),
      message: z
        .string()
        .describe(
          "Detalles específicos sobre los productos sin stock que el cliente necesita, cantidades solicitadas y cualquier información relevante para que el encargado pueda contactar al cliente"
        ),
    }),
  }
);

// Tool para enviar notificaciones al especialista en software
export const sendSoftwareSpecialistNotificationTool = tool(
  async ({
    name,
    phone,
    message,
  }: {
    name: string;
    phone: string;
    message: string;
  }) => {
    const result = await sendSoftwareSpecialistNotification(
      name,
      phone,
      message
    );
    return result;
  },
  {
    name: "send_software_specialist_notification",
    description:
      "Envía una notificación por email al especialista en software cuando un cliente pregunta sobre productos de software. Utiliza esta herramienta ÚNICAMENTE cuando el cliente consulte específicamente sobre productos de software, aplicaciones, licencias de software o servicios relacionados con tecnología y software que requieran asesoría especializada.",
    schema: z.object({
      name: z.string().describe("Nombre completo del cliente"),
      phone: z.string().describe("Número de teléfono del cliente"),
      message: z
        .string()
        .describe(
          "Consulta específica del cliente sobre productos de software, incluyendo detalles sobre qué tipo de software necesita o qué información solicita"
        ),
    }),
  }
);

// Tool para guardar el nickname del cliente en la base de datos
export const saveNicknameTool = tool(
  async ({
    nickname,
    phoneNumber,
  }: {
    nickname: string;
    phoneNumber: string;
  }) => {
    const result = await saveNickname(nickname, phoneNumber);
    return result;
  },
  {
    name: "save_nickname",
    description:
      "Guarda el nickname del cliente en la base de datos. Utiliza esta herramienta cuando el cliente te diga su apodo o nickname para que lo puedas usar en la conversación.",
    schema: z.object({
      nickname: z.string().describe("El nickname del cliente"),
      phoneNumber: z.string().describe("Número de teléfono del cliente"),
    }),
  }
);

// Tool para enviar imágenes de productos por WhatsApp
export const sendProductImagesTool = tool(
  async ({ sku, phoneNumber }: { sku: string; phoneNumber: string }) => {
    const result = await sendProductImagesToWhatsApp(sku, phoneNumber);
    return result;
  },
  {
    name: "send_product_images",
    description:
      "Envía las imágenes de un producto específico al cliente por WhatsApp. Utiliza esta herramienta cuando el cliente solicite ver las imágenes de un producto, quiera conocer el aspecto visual del producto, o necesite ver más detalles visuales antes de tomar una decisión de compra. Esta herramienta envía todas las imágenes disponibles del producto de manera automática.",
    schema: z.object({
      sku: z
        .string()
        .describe(
          "El código SKU del producto cuyas imágenes se van a enviar, ejemplo: CS-CP1-R105-1J4WF(AM-STD)"
        ),
      phoneNumber: z
        .string()
        .describe("Número de teléfono del cliente para enviar las imágenes"),
    }),
  }
);
