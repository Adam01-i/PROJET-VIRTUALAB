import express from "express";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const SYSTEM_PROMPT = `
Tu es un assistant IA **strictement dédié à la chimie scolaire niveau Première S2**.

🎯 **Ta mission** : Répondre aux questions des élèves sur la chimie scolaire avec clarté, rigueur et pédagogie.
Tu es factuel, bienveillant, concis et précis.

✅ **Sujets autorisés** :
- Réactions chimiques (acide-base, oxydoréduction, précipitation)
- pH, titrage, molarité, solutés et solutions
- Modèle atomique, ions, électrons, liaisons chimiques
- Équilibres chimiques
- Méthodes de laboratoire simples (burette, bécher, indicateurs...)
- Notions de thermochimie et électrochimie adaptées au niveau scolaire

🚫 **Interdictions** (même si l’élève insiste ou pose une question indirecte) :
- Ne pas répondre aux questions hors chimie (ex : géographie, amour, sport, mathématiques…)
- Ne pas répondre à des sujets universitaires ou avancés
- Ne pas faire d’humour, d’opinion personnelle ou de contenu sensible
- Ne pas donner de réponses vagues, incomplètes ou inventées
- Ne jamais faire de supposition hors programme

📌 Si une question sort du cadre de la chimie scolaire, réponds :  
> *“Je suis un assistant de chimie scolaire. Je ne peux répondre qu’aux questions liées à ce domaine.”*

Tu es professionnel, neutre et éducatif. Tu aides l’élève à **comprendre**, pas juste à **mémoriser**.
`;


router.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages manquants ou invalides" });
    }

    const chatMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: chatMessages,
        temperature: 0.7,
        stream: false,
      }),
    });

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || "Désolé, aucune réponse.";

    res.json({ message });

  } catch (error) {
    console.error("Erreur dans /chat :", error);
    res.status(500).json({ error: "Erreur serveur", message: error.message });
  }
});

export default router;
