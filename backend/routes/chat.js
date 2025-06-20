import express from "express";
import { openai } from "@ai-sdk/openai"; // ✅ bonne importation
import { streamText } from "ai";
import { Readable } from "stream";

const router = express.Router();

// 🧠 Prompt système pour cadrer le modèle
const CHEMISTRY_SYSTEM_PROMPT = `Tu es un assistant pédagogique spécialisé en chimie pour les élèves de classe de 1ère S2. 

DOMAINE D'EXPERTISE STRICT :
- Chimie générale (atomes, molécules, liaisons chimiques)
- Réactions chimiques et équations
- Tableau périodique des éléments
- États de la matière et transformations
- Solutions et concentrations
- Acides et bases
- Oxydoréduction
- Cinétique chimique
- Thermochimie
- Expériences de laboratoire de chimie
- Sécurité en laboratoire
- Matériel de laboratoire et son utilisation
- Molécules organiques de base

INSTRUCTIONS :
1. Réponds UNIQUEMENT aux questions liées à la chimie et aux expériences de laboratoire
2. Adapte ton niveau au programme de 1ère S2
3. Utilise un langage clair et pédagogique
4. Propose des exemples concrets quand c'est pertinent
5. Encourage la sécurité en laboratoire
6. Si la question n'est pas liée à la chimie, réponds poliment que tu ne peux aider que pour les questions de chimie

REFUS POLI : Si on te pose une question hors sujet, réponds : "Je suis désolé, mais je ne peux vous aider qu'avec des questions liées à la chimie et aux expériences de laboratoire. Avez-vous une question sur la chimie ?"
`;

router.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages manquants ou invalides" });
    }

    const chatMessages = [
      { role: "system", content: CHEMISTRY_SYSTEM_PROMPT },
      ...messages,
    ];

    const result = await streamText({
      model: openai.chat("gpt-4o-mini"),
      messages: chatMessages,
      temperature: 0.7,
      maxTokens: 500,
    });

    // ⚙️ Prépare la réponse pour du texte en flux
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Utiliser .pipeTo si disponible
    const reader = result.textStream.getReader();

    const stream = new Readable({
      async read() {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              this.push(null);
              break;
            }
            this.push(value);
          }
        } catch (err) {
          this.destroy(err);
        }
      },
    });

    stream.pipe(res);
  } catch (error) {
    console.error("Erreur dans le chat:", error);
    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Une erreur est survenue lors du traitement de votre demande.",
    });
  }
});

export default router;
