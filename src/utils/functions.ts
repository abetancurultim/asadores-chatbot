import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import twilio from "twilio";
import nodemailer from "nodemailer";
import { setChatHistoryName } from "./setChatHistoryName.js";
import { setChatHistoryService } from "./setChatHistoryService.js";
import { saveChatHistory, updateMessageTwilioSid } from "./saveHistoryDb.js";

dotenv.config();

// Twilio configuration
const MessagingResponse = twilio.twiml.MessagingResponse;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
export const supabase = createClient(supabaseUrl, supabaseKey);

// Función para brindar canal de contacto de otros servicios diferentes a servicios contables y de revisoría fiscal ofrecidos por Fenix Medellín
export function contactCustomerService() {
  const customerServiceData = {
    whatsapp: "https://wa.me/573104000000",
    description: "Linea de atención especializada para otros servicios.",
  };

  return JSON.stringify(customerServiceData);
}


