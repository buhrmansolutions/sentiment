const cheerio = require("cheerio");
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");
const { NEGATIVES } = require("./negativeWords");
const { POSITIVES } = require("./positiveWords");
const { TEAMS } = require("./teams");

const supabaseUrl = "https://zhsxmmrlucdpsgtfqspz.supabase.co";
console.log("process", process.env);
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getLatestEntry(team, table) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("team", team)
    .order("date", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error fetching latest entry:", error);
    return null;
  }

  return data[0];
}

async function generateData(team, table, getFormattedDate) {
  const latestEntry = await getLatestEntry(team.name, table);

  const sentiment = ({ textContent, date }) => {
    let result = {
      score: 0,
      date,
      text: "",
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
    result.text = textContent?.substring(0, 10) ?? "";

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

  async function fetchAllTexts() {
    let results = [];
    let page = 1;
    let hasReachedLatestEntry = false;
    do {
      const texts = await getTextsFromUrl(`${team.url}/${page}`);

      const latestEntryIndex = latestEntry
        ? texts.findIndex(
            (text) =>
              text.textContent?.substring(0, 10) === latestEntry.latestFetch
          )
        : 1;

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
    return results;
  }

  const results = await fetchAllTexts();

  const timeline = results.reduce((prev, curr) => {
    const formattedDate = getFormattedDate(curr.date);
    return {
      ...prev,
      [formattedDate]: [...(prev[formattedDate] ?? []), curr.score],
    };
  }, {});

  const fixedTimeline = Object.entries(timeline).map(([time, values]) => {
    let timeHasExistingDbValues = false;
    if (latestEntry?.date === time) {
      timeHasExistingDbValues = true;
    }

    const totalNumberOfEntries =
      values.length +
      (timeHasExistingDbValues ? latestEntry?.numberOfEntries : 0);

    const newValues = values.reduce((tot, val) => {
      if (val > 0) return tot + 1;
      if (val < 0) return tot - 1;
      return tot;
    }, 0);

    const totalValueForEntry =
      (timeHasExistingDbValues
        ? latestEntry?.value * latestEntry?.numberOfEntries
        : 0) + newValues;

    return {
      date: time,
      value: totalValueForEntry / totalNumberOfEntries,
      numberOfEntries: totalNumberOfEntries,
      source: team.source,
      team: team.name,
      latestFetch: results[0].text,
    };
  });
  console.log({ team, table }, fixedTimeline);
  fixedTimeline.forEach(async (timelineEntry) => {
    try {
      if (latestEntry?.id && latestEntry.date === timelineEntry.date) {
        const { data, error } = await supabase
          .from(table)
          .update(timelineEntry)
          .eq("id", latestEntry.id);
        if (error) console.error("Supabase error:", error);
        else console.log("Data inserted:", data);
      } else {
        const { data, error } = await supabase
          .from(table)
          .insert(timelineEntry);
        if (error) console.error("Supabase error:", error);
        else console.log("Data inserted:", data);
      }
    } catch (err) {
      console.error(err);
    }
  });
}

async function main() {
  TEAMS.forEach((team) => {
    generateData(team, "hourly", (date) => `${date.split(":")[0]}:00`);
    generateData(team, "daily", (date) => date.split(",")[0]);
    generateData(team, "weekly", (date) => {
      const d = new Date(date);
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNum = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
      return weekNum;
    });
  });
}

main();
