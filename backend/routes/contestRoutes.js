const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

router.get("/codeforces", async (req, res) => {
  try {
    const url = "https://codeforces.com/api/contest.list?gym=false";
    const response = await axios.get(url);
    const upcoming = response.data.result
      .filter(c => c.phase === "BEFORE")
      .slice(0, 5)
      .map(c => ({
        name: c.name,
        start: new Date(c.startTimeSeconds * 1000).toLocaleString(),
        duration: `${Math.floor(c.durationSeconds / 3600)} hrs`,
        site: "Codeforces",
        link: `https://codeforces.com/contests/${c.id}`
      }));
    res.json(upcoming);
  } catch (err) {
    res.status(500).json({ message: "Error fetching Codeforces events" });
  }
});

// LeetCode changed their contest page markup; use GraphQL API instead of scraping HTML
router.get("/leetcode", async (req, res) => {
  try {
    const response = await axios.post(
      "https://leetcode.com/graphql",
      {
        query: `
          query contestSchedule {
            allContests {
              title
              titleSlug
              startTime
              duration
            }
          }
        `,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
          Referer: "https://leetcode.com/contest/",
          Origin: "https://leetcode.com",
        },
        timeout: 10000,
      }
    );

    const contests = response.data?.data?.allContests || [];
    const nowMs = Date.now();

    // Keep only upcoming contests, take next 5
    const upcoming = contests
      .filter((c) => (c.startTime || 0) * 1000 > nowMs)
      .sort((a, b) => a.startTime - b.startTime)
      .slice(0, 5)
      .map((c) => ({
        name: c.title,
        start: new Date(c.startTime * 1000).toISOString(),
        duration: `${Math.round((c.duration || 0) / 3600)} hrs`,
        site: "LeetCode",
        link: `https://leetcode.com/contest/${c.titleSlug}`,
      }));

    res.json(upcoming);
  } catch (err) {
    console.error("LeetCode fetch failed:", err.response?.status, err.response?.data || err.message);
    res.status(503).json({ message: "Error fetching LeetCode events" });
  }
});

router.get("/codechef", async (req, res) => {
  try {
    const url = "https://www.codechef.com/contests";
    const html = (await axios.get(url)).data;
    const $ = cheerio.load(html);
    const data = [];

    $("table.dataTable tbody tr").each((i, el) => {
      const tds = $(el).find("td");
      const name = $(tds[0]).text().trim();
      const start = $(tds[1]).text().trim();
      const link = `https://www.codechef.com/${$(tds[0]).find("a").attr("href")}`;

      if (name && i < 5) {
        data.push({
          name,
          start,
          site: "CodeChef",
          link
        });
      }
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching CodeChef events" });
  }
});

module.exports = router;
