import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import {
  retrieverTool,
  contactTool,
  setAvailableForAudioTool,
  searchProductsTool,
  inventoryTool,
  createQuoteTool,
  fetchUserNameTool,
  conversationExamplesTool,
  sendEmailNotificationTool,
  sendSoftwareSpecialistNotificationTool,
  searchProductUrlTool,
  sendProductImagesTool,
} from "../tools/tools.js";
import { MESSAGES, CONVERSATION_EXAMPLES } from "../config/constants.js";
import { exportedFromNumber } from "../routes/chatRoutes.js";

dotenv.config();

const memory = new MemorySaver();

const llm = new ChatOpenAI({
  model: "gpt-4.1",
  // model: 'ft:gpt-4.1-2025-04-14:ultim-marketing:test-fine-tuning:Bgfh0vs5', // Modelo personalizado de GPT-4.1
  temperature: 0.9, // Ajusta la temperatura para controlar la creatividad de las respuestas
  topP: 1, // Esto ayuda a variar las respuestas y hacerlas más naturales
  apiKey: process.env.OPENAI_API_KEY,
  maxTokens: 200,
  stop: [
    "\nCliente:", // si el modelo intenta generar una nueva intervención del cliente
    "\nIsabella:", // si el modelo intenta generar una nueva intervención de Isabella
  ],
});

const tools = [
  retrieverTool,
  contactTool,
  setAvailableForAudioTool,
  searchProductsTool,
  inventoryTool,
  conversationExamplesTool,
  sendProductImagesTool,
  // createQuoteTool,
  // fetchUserNameTool,
  // sendEmailNotificationTool,
  // sendSoftwareSpecialistNotificationTool,
];

const modifyMessages = async (messages: BaseMessage[]) => {
  const lastUserMessage = messages[messages.length - 1];
  const userText =
    typeof lastUserMessage.content === "string" ? lastUserMessage.content : "";

  // Combinar sistema + ejemplos estáticos
  const enhancedPrompt = `${MESSAGES.SYSTEM_PROMPT_PROVICIONAL}

    ${CONVERSATION_EXAMPLES}

    INSTRUCCIÓN: Imita el estilo de estos ejemplos reales de conversación. Sé breve, directo y natural, como en los ejemplos. No uses frases genéricas como "¿En qué le puedo ayudar hoy?".
    `;

  return [
    new SystemMessage(enhancedPrompt),
    new HumanMessage(`Este es el número de teléfono: ${exportedFromNumber}`),
    ...messages,
  ];
};

export const appWithMemory = createReactAgent({
  llm,
  tools,
  messageModifier: modifyMessages,
  checkpointSaver: memory,
});
