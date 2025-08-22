// Guardar hustorial de conversación en Supabase
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const CHAT_HISTORY_TABLE = "chat_history";
export const supabase = createClient(supabaseUrl, supabaseKey);
// Función para consultar si el chat está activado para atención por IA
export async function getAvailableChatOn(clientNumber) {
    try {
        // Verificar si el cliente ya tiene una conversación
        // 🔧 FIX: Usar order + limit + maybeSingle para manejar duplicados
        const { data: existingConversation, error: fetchError } = await supabase
            .from(CHAT_HISTORY_TABLE)
            .select("chat_on, origin")
            .eq("client_number", clientNumber)
            .order("created_at", { ascending: false }) // Más reciente primero
            .limit(1) // Solo el más reciente
            .maybeSingle(); // Ahora es seguro usar maybeSingle
        if (fetchError) {
            console.error(`Error fetching data in getAvailableChatOn: ${fetchError.message}`);
            console.error(`Client number: ${clientNumber}`);
            return null;
        }
        if (existingConversation) {
            console.log(`🔍 Found conversation for ${clientNumber}: chat_on=${existingConversation.chat_on}, origin=${existingConversation.origin}`);
            // Respetar SIEMPRE el valor de chat_on de la conversación más reciente
            return existingConversation.chat_on;
        }
        console.log(`📭 No conversation found for ${clientNumber}`);
        return null;
    }
    catch (error) {
        console.error("Error in getAvailableChatOn:", error);
        console.error(`Client number: ${clientNumber}`);
        return null;
    }
}
