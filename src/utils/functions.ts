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

export async function getProductInventory(sku: string) {
  console.log("Consultando inventario para SKU:", sku);
  try {
    const { data, error } = await supabase
      .from("inventory")
      .select("sku, stock_medellin, stock_la_ceja, price, url")
      .eq("sku", sku)
      .single();

    if (error) {
      console.error("Error al consultar inventario:", error);
      return JSON.stringify({
        success: false,
        message: "No se pudo consultar la información del producto",
        error: error.message,
      });
    }

    if (!data) {
      return JSON.stringify({
        success: false,
        message: `No se encontró el producto con SKU: ${sku}`,
        data: null,
      });
    }

    return JSON.stringify({
      success: true,
      product: {
        sku: data.sku,
        availability: {
          medellin: data.stock_medellin,
          laCeja: data.stock_la_ceja,
          total: data.stock_medellin + data.stock_la_ceja,
          url: data.url,
        },
        price: data.price,
        formattedPrice: `$${data.price.toLocaleString("es-CO")}`,
      },
    });
  } catch (error) {
    console.error("Error inesperado:", error);
    return JSON.stringify({
      success: false,
      message: "Ocurrió un error al procesar la solicitud",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}

// Función para buscar la url del producto en la página oficial de Mercado Libre
export async function searchProductUrl(sku: string) {
  const { data, error } = await supabase
    .from("inventory")
    .select("url")
    .eq("sku", sku)
    .single();

  if (error) {
    console.error("Error al buscar la url del producto:", error);
    return JSON.stringify({
      success: false,
      message: "No se pudo buscar la url del producto",
      error: error.message,
    });
  }

  return JSON.stringify({
    success: true,
    url: data.url,
  });
}

// Función que envía la url de la cotización al cliente por WhatsApp
export async function sendQuoteToWhatsApp(
  quoteUrl: string,
  phoneNumber: string
) {
  const message = await client.messages.create({
    // body: 'Mensaje con archivo',
    to: `whatsapp:${phoneNumber}`,
    from: "whatsapp:+5742044644",
    // from: `whatsapp:+14155238886`,
    mediaUrl: [quoteUrl],
  });
  console.log("Quote file message sent successfully");
}

export async function fetchUserName(firstNumber: string) {
  console.log("fetchUserName:", firstNumber);

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("phone", firstNumber)
    .single();

  if (error) {
    console.error("Error fetching user:", error);
    return "No se encontró el nombre del cliente.";
  }

  // Actualizar el nombre del cliente en el historial del chat
  if (data.name) {
    await setChatHistoryName(data.name);
    await setChatHistoryService(data.area);
  }

  console.log("User:", data);

  // Retornar el nombre y el  nickname del cliente en formato JSON
  return JSON.stringify({
    name: data.name,
    nickname: data.nickname,
  });
}

export async function sendEmailNotification(
  name: string,
  phone: string,
  message: string
) {
  const transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    auth: {
      user: "apikey",
      pass: process.env.SENDGRID_API_KEY,
    },
  });

  const mailOptions = {
    from: '"¡Producto sin stock!" <grow@ultimmarketing.com>',
    to: "daniel.a@ultimmarketing.com",
    cc: [],
    subject: "Fénix - Cliente requiere productos sin stock suficiente",
    text: `¡Cliente requiere productos que no están disponibles en stock! \n\nNombre: ${name} \nCelular: ${phone} \n\nDetalles del requerimiento:\n${message}\n\nPor favor, contacta al cliente lo antes posible para informarle sobre alternativas, tiempos de reposición o continuar con el proceso de compra.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return "Email enviado correctamente.";
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

export async function sendSoftwareSpecialistNotification(
  name: string,
  phone: string,
  message: string
) {
  const transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    auth: {
      user: "apikey",
      pass: process.env.SENDGRID_API_KEY,
    },
  });

  const mailOptions = {
    from: '"Consulta Software" <grow@ultimmarketing.com>',
    to: "daniel.a@ultimmarketing.com", // Puedes cambiar este email por el del especialista en software
    cc: [],
    subject: "Fénix - Cliente consulta sobre productos de software",
    text: `¡Cliente interesado en productos de software! \n\nNombre: ${name} \nCelular: ${phone} \n\nConsulta específica:\n${message}\n\nPor favor, contacta al cliente para brindarle asesoría especializada en software.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Software specialist email sent:", info.response);
    return "Email enviado al especialista en software correctamente.";
  } catch (error) {
    console.error("Error sending software specialist email:", error);
    throw error;
  }
}

// Función para guardar el Nickname del cliente en la base de datos
export async function saveNickname(nickname: string, phoneNumber: string) {
  const { data, error } = await supabase
    .from("users")
    .update({ nickname: nickname })
    .eq("phone", phoneNumber);

  if (error) {
    console.error("Error saving nickname:", error);
    throw error;
  }

  console.log("Nickname saved:", data);
  return "Nickname guardado correctamente.";
}

// Función para consultar las imagenes asociadas a un producto y enviarlas a través de WhatsApp. Se debe consultar la tabla inventory y el campo images que tiene un jsonb con las urls de las imagenes. Se debe buscar por SKU.
export async function sendProductImagesToWhatsApp(
  sku: string,
  phoneNumber: string
) {
  console.log(
    "Enviando imágenes del producto con SKU:",
    sku,
    "al número:",
    phoneNumber
  );

  try {
    // Consultar las imágenes del producto por SKU
    const { data, error } = await supabase
      .from("inventory")
      .select("images")
      .eq("sku", sku)
      .single();

    console.log("📊 Resultado de consulta DB:");
    console.log("📊 Error:", error);
    console.log("📊 Data:", data);
    console.log("📊 Data.images:", data?.images);
    console.log("📊 Tipo de data.images:", typeof data?.images);

    if (error) {
      console.error("❌ Error al consultar imágenes del producto:", error);
      return JSON.stringify({
        success: false,
        message: "No se pudieron consultar las imágenes del producto",
        error: error.message,
        sentImages: [],
        failedImages: [],
        totalSent: 0,
      });
    }

    if (!data || !data.images) {
      console.log("❌ No se encontraron datos o imágenes");
      return JSON.stringify({
        success: false,
        message: `No se encontraron imágenes para el producto con SKU: ${sku}`,
        sentImages: [],
        failedImages: [],
        totalSent: 0,
      });
    }

    const images = data.images;
    const sentImages: string[] = [];
    const failedImages: { key: string; url: string; error: string }[] = [];

    console.log("📊 Contenido de images:", images);
    console.log("📊 Es array:", Array.isArray(images));

    // Manejar tanto arrays como objetos
    let imageEntries = [];

    if (Array.isArray(images)) {
      // Si es un array, extraer todas las propiedades de cada objeto
      console.log("📊 Procesando como array de objetos");
      for (const imageObj of images) {
        for (const [key, url] of Object.entries(imageObj)) {
          imageEntries.push([key, url]);
        }
      }
    } else {
      // Si es un objeto directo
      console.log("📊 Procesando como objeto directo");
      imageEntries = Object.entries(images);
    }

    console.log("📊 Image entries finales:", imageEntries);

    // Iterar sobre todas las imágenes encontradas
    for (const [key, imageUrl] of imageEntries) {
      console.log(`🔄 Procesando ${key}:`, imageUrl, "Tipo:", typeof imageUrl);
      if (typeof imageUrl === "string" && imageUrl.trim() !== "") {
        try {
          // Convertir .webp a .jpg para compatibilidad con Twilio WhatsApp
          const compatibleImageUrl = imageUrl.replace(/\.webp$/i, ".jpg");
          console.log(`Enviando imagen ${key}:`, imageUrl);
          if (imageUrl !== compatibleImageUrl) {
            console.log(
              `🔄 Convirtiendo formato: ${imageUrl} → ${compatibleImageUrl}`
            );
          }

          // Guardar primero el mensaje en la BD con la URL que se enviará
          const messageId = await saveChatHistory(
            phoneNumber,
            "Archivo enviado",
            false,
            compatibleImageUrl
          );

          const message = await client.messages.create({
            to: `whatsapp:${phoneNumber}`,
            from: "whatsapp:+5742044644",
            // from: "whatsapp:+14155238886",
            mediaUrl: [compatibleImageUrl],
          });

          sentImages.push(imageUrl);
          console.log(`Imagen ${key} enviada exitosamente, SID:`, message.sid);

          // Vincular el SID de Twilio al registro del mensaje
          if (messageId && message.sid) {
            await updateMessageTwilioSid(messageId, message.sid);
          }

          // Pequeña pausa entre envíos para evitar rate limiting
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (sendError) {
          console.error(`Error enviando imagen ${key}:`, sendError);
          failedImages.push({
            key: String(key),
            url: imageUrl,
            error:
              sendError instanceof Error
                ? sendError.message
                : "Error desconocido",
          });
        }
      }
    }

    const totalSent = sentImages.length;
    const hasFailures = failedImages.length > 0;

    // Delay final proporcional para asegurar que todas las imágenes lleguen antes de la respuesta del agente
    if (totalSent > 0) {
      const finalDelay = Math.min(1500 + totalSent * 400, 3500); // 1.5s base + 400ms por imagen, máximo 3.5s
      console.log(
        `📱 Esperando a que lleguen todas las ${totalSent} imagen(es) al usuario... (${finalDelay}ms)`
      );
      await new Promise((resolve) => setTimeout(resolve, finalDelay));
      console.log(`✅ Proceso de envío de imágenes completado`);
    }

    return JSON.stringify({
      success: totalSent > 0,
      message:
        totalSent > 0
          ? `Se enviaron ${totalSent} imagen(es) del producto ${sku}${
              hasFailures ? ` (${failedImages.length} fallaron)` : ""
            }`
          : `No se pudieron enviar las imágenes del producto ${sku}`,
      sentImages,
      failedImages,
      totalSent,
    });
  } catch (error) {
    console.error("Error inesperado enviando imágenes:", error);
    return JSON.stringify({
      success: false,
      message: "Ocurrió un error inesperado al enviar las imágenes",
      error: error instanceof Error ? error.message : "Error desconocido",
      sentImages: [],
      failedImages: [],
      totalSent: 0,
    });
  }
}
