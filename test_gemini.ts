import { processQRCodeWithGemini } from "./lib/gemini";
import { config } from "dotenv";

config();

async function test() {
  try {
    const result = await processQRCodeWithGemini("Facture de test 100 EUR");
    console.log("SUCCESS:", result);
  } catch (e: any) {
    console.error("FAILED:", e.message);
  }
}

test();
