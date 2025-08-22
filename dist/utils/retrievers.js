import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { getProductInventory } from "./functions.js";
import dotenv from "dotenv";
dotenv.config();
const openAIApiKey = process.env.OPENAI_API_KEY;
const embeddings = new OpenAIEmbeddings({ openAIApiKey });
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseApiKey = process.env.SUPABASE_KEY;
export const searchVectors = async (query) => {
    const client = createClient(supabaseUrl, supabaseApiKey);
    const vectorStore = new SupabaseVectorStore(embeddings, {
        client,
        tableName: "documents",
        queryName: "match_documents",
    });
    console.log("Petición de vectores");
    const results = await vectorStore.similaritySearch(query, 4);
    const combineDocuments = (results) => {
        return results
            .map((doc) => doc.pageContent)
            .join("\n\n");
    };
    // console.log(combineDocuments(results));
    return combineDocuments(results);
};
/**
 * Busca los productos más similares a 'query' en la tabla products_vector.
 * Devuelve un string con SKU + descripción, separados por saltos de línea.
 */
export const searchProducts = async (query, topK = 4) => {
    const client = createClient(supabaseUrl, supabaseApiKey);
    const vectorStore = new SupabaseVectorStore(embeddings, {
        client,
        tableName: "products_vector",
        queryName: "match_products_vector",
    });
    console.log("Buscando productos…");
    const results = await vectorStore.similaritySearch(query, topK);
    // SIEMPRE obtener información de inventario y precios
    const enrichedResults = await Promise.all(results.map(async (doc) => {
        try {
            const inventory = await getProductInventory(doc.metadata.sku);
            return `• **${doc.metadata.sku}**: ${doc.pageContent}\n  💰 ${inventory}`;
        }
        catch (error) {
            console.error(`Error obteniendo inventario para ${doc.metadata.sku}:`, error);
            return `• **${doc.metadata.sku}**: ${doc.pageContent}\n  💰 Precio no disponible temporalmente`;
        }
    }));
    const productsResults = enrichedResults.join("\n\n");
    console.log(productsResults);
    return productsResults;
};
/**
 * Busca conversaciones similares a 'query' en la tabla vectorial de conversaciones.
 * Muestra ejemplos reales de conversaciones entre asesores y clientes.
 * @param query Consulta para buscar conversaciones relevantes
 * @param topK Número máximo de conversaciones a devolver
 * @returns Ejemplos formateados de conversaciones relevantes
 */
export const searchConversations = async (query, topK = 3) => {
    const client = createClient(supabaseUrl, supabaseApiKey);
    const vectorStore = new SupabaseVectorStore(embeddings, {
        client,
        tableName: "conversations", // Tabla de conversaciones vectorizadas
        queryName: "match_conversations", // Asegúrate de crear esta función en Supabase
    });
    console.log("Buscando conversaciones relevantes...");
    const results = await vectorStore.similaritySearch(query, topK);
    // Formatear los resultados para mostrar la conversación de manera legible
    const conversationsResults = results
        .map((doc) => {
        const metadata = doc.metadata;
        // Formato con pregunta-respuesta y contexto
        return `
### ${metadata.intent || "Conversación"}

**Cliente**: ${metadata.question || doc.pageContent}

**Asesor**: ${metadata.answer || ""}

${metadata.outcome ? `*Resultado: ${metadata.outcome}*` : ""}
`;
    })
        .join("\n---\n");
    console.log(`Se encontraron ${results.length} conversaciones relevantes`);
    return conversationsResults;
};
