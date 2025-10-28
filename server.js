const express = require("express");
const fs = require("fs");
const app = express();
app.use(express.json());

const DB_FILE = "players.json";

// Hilfsfunktion zum Laden und Speichern
function loadData() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}
function saveData(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Punkte nach Tier bestimmen
function tierToPoints(tier) {
  const map = { F: 0, E: 100, D: 200, C: 300, B: 400, A: 500, S: 600, SS: 700 };
  return map[tier] ?? 0;
}

// ✅ POST /api/submit
app.post("/api/submit", (req, res) => {
  const { tier, points, minecraftName, discordName, kit } = req.body;

  if (!tier || !minecraftName || !discordName || !kit) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const data = loadData();
  let player = data.find(
    (p) => p.minecraftName === minecraftName || p.discordName === discordName
  );

  if (!player) {
    player = {
      minecraftName,
      discordName,
      kits: {},
      totalPoints: 0,
    };
    data.push(player);
  }

  const basePoints = tierToPoints(tier);
  const totalKitPoints = basePoints + (points || 0);
  player.kits[kit] = { tier, points: totalKitPoints };
  player.totalPoints = Object.values(player.kits).reduce(
    (sum, k) => sum + k.points,
    0
  );

  saveData(data);
  res.json({ success: true, player });
});

// ✅ GET /api/player/:identifier
app.get("/api/player/:identifier", (req, res) => {
  const id = req.params.identifier;
  const data = loadData();
  const player = data.find(
    (p) => p.minecraftName === id || p.discordName === id
  );
  if (!player) return res.status(404).json({ error: "Player not found" });
  res.json(player);
});

// ✅ GET /api/leaderboard/kit/:kitName
app.get("/api/leaderboard/kit/:kitName", (req, res) => {
  const kit = req.params.kitName;
  const data = loadData();

  const leaderboard = data
    .filter((p) => p.kits[kit])
    .sort((a, b) => b.kits[kit].points - a.kits[kit].points)
    .map((p, index) => ({
      rank: index + 1,
      minecraftName: p.minecraftName,
      discordName: p.discordName,
      tier: p.kits[kit].tier,
      points: p.kits[kit].points,
    }));

  res.json(leaderboard);
});

// ✅ GET /api/leaderboard/all
app.get("/api/leaderboard/all", (req, res) => {
  const data = loadData();

  const leaderboard = data
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((p, index) => ({
      rank: index + 1,
      minecraftName: p.minecraftName,
      discordName: p.discordName,
      totalPoints: p.totalPoints,
      kits: p.kits,
    }));

  res.json(leaderboard);
});

app.listen(3000, () => console.log("✅ API läuft auf http://localhost:3000"));
