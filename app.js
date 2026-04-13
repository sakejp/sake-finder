// ===============================
// 設定
// ===============================
const QUESTIONS = ["fruity", "acidity", "dryness", "aroma", "body"];

const LABELS = {
  fruity: ["フルーティーが好き", "控えめが好き"],
  acidity: ["酸味が好き", "酸味は苦手"],
  dryness: ["辛口が好き", "甘口が好き"],
  aroma: ["華やかな香り", "穏やかな香り"],
  body: ["コク旨", "軽快スッキリ"],
};

// ===============================
// 状態
// ===============================
let answers = {};        // { fruity:0/1 ... }
let station = "";        // "東京駅" など
let SAKE_LIST = [];      // sakes.json
let STORES = {};         // { "東京駅": [ {name, note, walk} ] }
let INVENTORY = {};      // { "店舗名": ["銘柄", ...] }

// ===============================
// 初期化
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  // 回答選択
  document.querySelectorAll(".q .choice").forEach(btn => {
    btn.addEventListener("click", e => {
      const wrap = e.target.closest(".q");
      wrap.querySelectorAll(".choice").forEach(b => b.classList.remove("selected"));
      e.target.classList.add("selected");

      const key = wrap.dataset.key;
      const val = Number(e.target.dataset.score);
      answers[key] = val;
    });
  });

  // 駅選択
  document.getElementById("stationSelect").addEventListener("change", e => {
    station = e.target.value;
  });

  // ボタン
  document.getElementById("resetBtn").addEventListener("click", resetSelections);
  document.getElementById("matchBtn").addEventListener("click", onMatch);

  // JSON 読み込み
  const [sakes, storesRaw, inventoryRaw] = await Promise.all([
    fetch("data/sakes.json").then(r => r.json()),
    fetch("data/stores.json").then(r => r.json()),
    fetch("data/inventory.json").then(r => r.json()),
  ]);

  SAKE_LIST = sakes;

  // -------------------------------
  // stores.json → STORES 変換
  // -------------------------------
  storesRaw.forEach(s => {
    const key = s.station + "駅";
    if (!STORES[key]) STORES[key] = [];
    STORES[key].push({
      name: s.name,
      note: s.location,
      walk: 5, // 仮で5分
    });
  });

  // -------------------------------
  // inventory.json → INVENTORY 変換
  // -------------------------------
  inventoryRaw.stations.forEach(st => {
    st.stores.forEach(store => {
      INVENTORY[store.name] = store.inventory;
    });
  });
});

// ===============================
// リセット
// ===============================
function resetSelections() {
  answers = {};
  document.querySelectorAll(".q .choice").forEach(b => b.classList.remove("selected"));
  document.getElementById("recommendations").innerHTML = "";
  document.getElementById("storeResults").innerHTML = "";
  document.getElementById("resultSummary").textContent = "";
}

// ===============================
// 診断処理
// ===============================
function onMatch() {
  if (!station) {
    alert("乗車駅を選んでください");
    return;
  }

  for (const k of QUESTIONS) {
    if (!(k in answers)) {
      alert("5問すべて回答してください");
      return;
    }
  }

  // スコアリング
  const ranked = SAKE_LIST.map(s => {
    let score = 0;
    const weight = { fruity:1, acidity:0.9, dryness:1.2, aroma:1.1, body:0.8 };

    for (const k of QUESTIONS) {
      const a = answers[k];
      const b = Number(s.profile[k] ?? 0.5);
      score += (1 - Math.abs(a - b)) * weight[k];
    }

    return { ...s, score: +(score / QUESTIONS.length).toFixed(4) };
  }).sort((a,b) => b.score - a.score);

  const top = ranked.slice(0, 3);

  // 結果要約
  document.getElementById("resultSummary").textContent =
    `選択した駅：${station}`;

  // 銘柄表示
  document.getElementById("recommendations").innerHTML =
    top.map(renderSake).join("");

  // 店舗マッチング
  const storeWrap = document.getElementById("storeResults");
  const stores = STORES[station] || [];
  const blocks = [];

  stores.forEach(st => {
    const list = INVENTORY[st.name] || [];
    const hit = top.filter(s => list.includes(s.name));

    if (hit.length > 0) {
      blocks.push(`
        <div class="store">
          <div>
            <strong>${st.name}</strong>
            <span class="badge">徒歩${st.walk}分</span>
          </div>
