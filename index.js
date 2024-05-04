require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { OpenAI } = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// IMPORTANT: There needs to be a default "_locales/en/messages.json" with your lang keys
const sourceLocalePath = path.join(__dirname, "_locales/en/messages.json");
// These are all the locales your english text will be translated to but this can be expanded to fit your use case:
// https://developer.chrome.com/docs/extensions/reference/api/i18n#locales
const targetLanguages = ["es", "de", "fr", "ja", "ko", "pt_BR", "ru"];

async function translateText(text, targetLang) {
  const messages = [
    {
      role: "system",
      content: `You are a chrome extension language translator that is tasked with translating chrome exetensions in English to other provided locales`,
    },
    {
      role: "user",
      content: `Answer as simple text, Translate the following English text to this locale ${targetLang}: ${text}`,
    },
  ];

  const completion = await openai.chat.completions.create({
    messages,
    model: "gpt-4",
    temperature: 0,
  });

  return completion.choices[0].message.content;
}

async function translateLocale() {
  const messages = require(sourceLocalePath);
  for (let lang of targetLanguages) {
    const translatedMessages = {};
    for (let key in messages) {
      const message = messages[key].message;
      translatedMessages[key] = {
        message: await translateText(message, lang),
      };
    }
    const targetLocalePath = path.join(__dirname, `_locales/${lang}`);
    if (!fs.existsSync(targetLocalePath)) {
      fs.mkdirSync(targetLocalePath, { recursive: true });
    }
    fs.writeFileSync(
      path.join(targetLocalePath, "messages.json"),
      JSON.stringify(translatedMessages, null, 2)
    );
    console.log(`Translated messages saved for locale: ${lang}`);
  }
}

translateLocale().catch(console.error);
