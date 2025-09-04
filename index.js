// index.js
const express = require("express");
const app = express();
const port = 3000;
const cheerio = require("cheerio");

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
  ":)",
  "glädjande",
  "rekommenderar",
  "drägligt",
  "kämpa på",
  "spännande",
  "stark",
  "lovande",
  "bra insats",
  "stabil",
  "grym",
  "mycket bra",
  "lysande",
  "superbt",
  "härligt",
  "rolig",
  "underbart",
  "riktigt bra",
  "kvalitet",
  "positivt",
  "imponerande",
  "toppklass",
  "klasspelare",
  "väl genomfört",
  "förtjänar beröm",
  "viktig",
  "bidrar",
  "förbättring",
  "progress",
  "utveckling",
  "bättre",
  "lyfter laget",
  "framtid",
  "hopp",
  "styrka",
  "på gång",
  "överlägsen",
  "roligt",
  "klockren",
  "snabb",
  "teknisk",
  "perfekt",
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
  "typiskt",
  "groteskt",
  "kassa",
  "ointressant",
  "dum",
  "bitter",
  "synd",
  "fan",
  "konstigt",
  "ingen",
  "usel",
  "oerhört konstigt",
  "löjligt",
  "nonsens",
  "flopp",
  "pajas",
  "patetiskt",
  "värdelös",
  "hopplöst",
  "katastrofalt",
  "sämst",
  "dåligt",
  "försämrat",
  "felaktigt",
  "trams",
  "skit",
  "skitdåligt",
  "meningslöst",
  "skräp",
  "pinsamt dåligt",
  "fånigt",
  "overkligt",
  "illusion",
  "idiotiskt",
  "överdrivet",
  "felbedömning",
  "miss",
  "misstag",
  "brist",
  "brister",
  "undermålig",
  "naivt",
  "överskattad",
  "så fel",
  "överdrift",
  "dålig kvalité",
  "tappar",
  "felbeslut",
  "konstigt",
  "absurt",
  "orimligt",
  "besviken",
  "besvikelse",
  "orutinerad",
  "låg nivå",
  "..",
];

const IRONY = [];

const sentiment = ({ textContent, date }) => {
  let result = {
    score: 0,
    ironyDetected: false,
    text: textContent,
    date,
    negatives: 0,
    positives: 0,
  };

  function escapeRegex(word) {
    return word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  const negativeWords = NEGATIVES.filter((word) => {
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
    return regex.test(textContent.toLowerCase());
  });
  const positiveWords = POSITIVES.filter((word) => {
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
    return regex.test(textContent.toLowerCase());
  });
  const ironyDetected = IRONY.some((word) =>
    textContent.toLowerCase().includes(word)
  );

  result.score = positiveWords.length - negativeWords.length;
  result.negatives = negativeWords.length;
  result.positives = positiveWords.length;
  result.negativeWords = negativeWords;
  result.positiveWords = positiveWords;

  if (ironyDetected) {
    result.score = result.score * -1;
    result.ironyDetected = true;
  }
  //   if (result.score > 0) {
  //     result.score = 1;
  //   }
  //   if (result.score < 0) {
  //     result.score = -1;
  //   }
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

// Route för att analysera strängarna
app.get("/sentiment", async (req, res) => {
  async function getTextsFromUrl(url) {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    const texts = [];
    $(".mb-4.flex.flex-col.gap-4").each((i, container) => {
      let textContent;
      let date;
      $(container)
        .find(".text-gray-charcoal")
        .each((j, el) => {
          textContent = $(el).text().trim();
        });
      $(container)
        .find(".text-green-sage")
        .each((j, el) => {
          date = $(el).text().trim();
        });
      texts.push({ textContent, date });
    });

    return texts;
  }

  const pagesToCheck = 10;
  let total = 0;
  let results = [];

  for (let page = 1; page <= pagesToCheck; page++) {
    const texts = await getTextsFromUrl(
      `https://www.svenskafans.com/fotboll/lag/mff/forum/${page}`
    );
    console.log({ page });
    results = results.concat(
      texts.map((text) => {
        const result = analyzeWithRules(text);
        total += result.score;
        return result;
      })
    );
  }

  const negativeResults = results.filter((result) => result.score < 0);
  const positiveResults = results.filter((result) => result.score > 0);
  const neutralResults = results.filter((result) => result.score === 0);
  const ironicresults = results.filter((result) => result.ironyDetected);
  const avg =
    (positiveResults.length - negativeResults.length) /
    (positiveResults.length + negativeResults.length);

  const timeline = results.reduce(
    (prev, curr) => ({
      ...prev,
      [curr.date]: [...(prev[curr.date] ?? []), curr.score],
    }),
    {}
  );
  const fixedTimeline = Object.entries(timeline).map(([time, values]) => ({
    time,
    value:
      values.reduce((tot, val) => {
        if (val > 0) return tot + 1;
        if (val < 0) return tot - 1;
        return tot;
      }, 0) / values.length,
  }));
  console.log({ total, avg });
  res.json({
    timeline: fixedTimeline,
  });
});

// Starta servern
app.listen(port, () => {
  console.log(`Servern körs på http://localhost:${port}`);
});
