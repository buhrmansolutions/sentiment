const cheerio = require("cheerio");

const { createClient } = require("@supabase/supabase-js");
const { NEGATIVES } = require("./negativeWords");
const { POSITIVES } = require("./positiveWords");

const supabaseUrl = "https://zhsxmmrlucdpsgtfqspz.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpoc3htbXJsdWNkcHNndGZxc3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDc2NDEsImV4cCI6MjA3Mzg4MzY0MX0.YyzfyCqomzAGS2PtJ9aHG-Uzr5rQKhjGxPatKo_M9qA";
const supabase = createClient(supabaseUrl, supabaseKey);

async function getLatestEntry() {
  const { data, error } = await supabase
    .from("sentiment")
    .select("*")
    .order("date", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error fetching latest entry:", error);
    return null;
  }

  return data[0];
}

async function main() {
  const { date: latestFetch } = await getLatestEntry();

  const sentiment = ({ textContent, date }) => {
    let result = {
      score: 0,
      date,
    };

    function escapeRegex(word) {
      return word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    const negativeWords = NEGATIVES.filter((word) => {
      const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
      return regex.test(textContent?.toLowerCase());
    });
    const positiveWords = POSITIVES.filter((word) => {
      const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
      return regex.test(textContent?.toLowerCase());
    });

    result.score = positiveWords.length - negativeWords.length;

    return result;
  };

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

  let results = [];
  let page = 0;
  let hasReachedLatestEntry = false;

  async function fetchAllTexts() {
    do {
      const texts = await getTextsFromUrl(
        `https://www.svenskafans.com/fotboll/lag/mff/forum/${page}`
      );

      const latestEntryIndex = texts.findIndex(
        (text) => text.date === latestFetch
      );

      const shortenedTextsArray = texts.slice(
        0,
        latestEntryIndex !== -1 ? latestEntryIndex : texts.length
      );

      results = results.concat(
        shortenedTextsArray.map((text) => {
          const result = sentiment(text);
          return result;
        })
      );

      hasReachedLatestEntry = latestEntryIndex !== -1;
      page++;
    } while (!hasReachedLatestEntry);
  }

  fetchAllTexts().then(async () => {
    const timeline = results.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.date]: [...(prev[curr.date] ?? []), curr.score],
      }),
      {}
    );
    const fixedTimeline = Object.entries(timeline).map(([time, values]) => ({
      date: time,
      value:
        values.reduce((tot, val) => {
          if (val > 0) return tot + 1;
          if (val < 0) return tot - 1;
          return tot;
        }, 0) / values.length,
      source: "svenskafans1234",
      team: "Malmö FF",
    }));

    console.log({ fixedTimeline });
    try {
      const { data, error } = await supabase
        .from("sentiment")
        .insert(fixedTimeline);
      if (error) console.error("Supabase error:", error);
      else console.log("Data inserted:", data);
    } catch (err) {
      console.error(err);
    }
  });
}

main();
