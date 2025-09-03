// index.js
const express = require("express");
const app = express();
const port = 3000;
const { forumTexter } = require("./examples");

// Enkelt svenskt lexikon (positiva och negativa ord)

const POSITIVES = [
  "formstarka",
  "bra",
  "fantastisk",
  "älskar",
  "självförtroende",
  "acklimatisera",
  "speltid",
  "accepterar",
  "lovar",
  "spets",
  "hoppas",
  "förädlades",
  "väloljat",
  "välförtjänt",
  "talangfull",
  "inte dålig",
  "intressant",
  "gillar",
];

const NEGATIVES = [
  "hemskt",
  "katastrof",
  "förstöra",
  "kapitalförstörning",
  "oacceptabelt",
  "ärkesopan",
  "sopan",
  "skämt",
  "katastrof",
  "vansinne",
  "bedrövligt",
  "uselt",
  "slarvigt",
  "skandal",
  "pinsamt",
  "ruttet",
  "svagt",
  "ducka",
  "ryggdunkare",
  "jösses",
  "inte bra",
  "som vanligt",
  "kaos",
  "sabbar",
  "inte direkt",
  "sopa",
  "inkompetens",
  "orkar inte",
  "grav",
  "inte",
  "?",
  "typiskt",
];

const customLexicon = {
  ...POSITIVES.reduce((prev, curr) => ({ ...prev, [curr]: 1 }), {}),
  ...NEGATIVES.reduce((prev, curr) => ({ ...prev, curr: 1 }), {}),
};

const sentiment = (text) => {
  const words = text
    .toLowerCase()
    .replace(/[^\wåäöÅÄÖ\- ]/g, "") // Tar bort skiljetecken (förutom bindestreck och mellanslag)
    .split(/\s+/); // Dela på ett eller flera mellanslag

  let result = { score: 0, ironyDetected: false, text: text };

  result.score -= NEGATIVES.some((word) => text.toLowerCase().includes(word));
  result.score += POSITIVES.some((word) => text.toLowerCase().includes(word));

  const ironicPhrases =
    /men\s+(han|hon|det|detta|detta var|vi|hr)?\s*(gjorde|valde|beslutade)?.*\b(bra|fantastiskt|formstarka|glad)\b/;

  if (ironicPhrases.test(text.toLowerCase())) {
    result.score = result.score * -1;
    result.ironyDetected = true;
  }
  if (result.score > 0) {
    result.score = 1;
  }
  if (result.score < 0) {
    result.score = -1;
  }
  return result;
};

// Förbättrad analysfunktion
function analyzeWithRules(text) {
  // Grundläggande analys
  const result = sentiment(text);

  // Specialregel: om text innehåller "men" och efterföljande positivt ord, misstänk ironi

  return result;
}

// Initiera sentiment-analys

// Hårdkodad lista av strängar
const texts = forumTexter;

// Route för att analysera strängarna
app.get("/sentiment", (req, res) => {
  let total = 0;
  const results = texts.map((text) => {
    const result = analyzeWithRules(text);
    total += result.score;
    return result;
  });
  const negativeResults = results.filter((result) => result.score === -1);
  const positiveResults = results.filter((result) => result.score === 1);
  const neutralResults = results.filter((result) => result.score === 0);
  const ironicresults = results.filter((result) => result.ironyDetected);
  console.log({
    positive: positiveResults.length,
    negative: negativeResults.length,
  });
  const avg =
    (positiveResults.length - negativeResults.length) /
    (positiveResults.length + negativeResults.length);
  console.log({ total, avg });
  res.json({ negativeResults, positiveResults, neutralResults, ironicresults });
});

// Starta servern
app.listen(port, () => {
  console.log(`Servern körs på http://localhost:${port}`);
});
