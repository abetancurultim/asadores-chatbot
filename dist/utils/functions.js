import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import twilio from "twilio";
dotenv.config();
// Twilio configuration
const MessagingResponse = twilio.twiml.MessagingResponse;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);
// Función para brindar canal de contacto de otros servicios diferentes a servicios contables y de revisoría fiscal ofrecidos por Fenix Medellín
export function contactCustomerService() {
    const customerServiceData = {
        whatsapp: "https://wa.me/573104000000",
        description: "Linea de atención especializada para otros servicios.",
    };
    return JSON.stringify(customerServiceData);
}
