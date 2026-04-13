// ===============================
// 定数
// ===============================
const QUESTIONS = ["fruity", "acidity", "dryness", "aroma", "body"];

// ===============================
// 状態
// ===============================
let answers = {};
let currentIndex = 0;
let questions = [];
let SAKE_LIST = [];
let STORES = {};      // { "東京駅": [ { name, location } ] }
let INVENTORY = {};   // { "店舗名": ["酒1","酒2"] }
let station = "";

// ===============================
// 初期化
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  // 質問DOM
  questions = Array.from(document.querySelectorAll(".q"));
  questions.forEach((q, i) => {
    q.style.display = i === 0 ? "block" : "none";
  });

  // 駅選択
  const stationSelect = document.getElementById("stationSelect");
  if (stationSelect) {
    stationSelect.addEventListener("change", e => {
      station = e.target.value;
    });
  }

  // 日本酒データ
  try {
    SAKE_LIST = await fetch("data/sakes.json").then(r => r.json());
  } catch {
    SAKE_LIST = [];
  }

  // 店舗・在庫データ
  try {
    const storesRaw = await fetch("data/stores.json").then(r => r.json());
    const inventoryRaw = await fetch("data/inventory.json").then(r => r.json());

    // 駅 → 店舗
    storesRaw.forEach(s => {
      const key = s.station + "駅";
      if (!STORES[key]) STORES[key] = [];
      STORES[key].push({
        name: s.name,
        location: s.location
      });
    });

    // 店舗 → 在庫
    inventoryRaw.stations.forEach(st => {
      st.stores.forEach(store => {
        INVENTORY[store.name] = store.inventory;
      });
    });
  } catch (e) {
    console.warn("店舗データ読み込み失敗", e);
  }

  // 回答クリック
  document.querySelectorAll(".choice").forEach(btn => {
    btn.addEventListener("click", e => {
      const q = e.target.closest(".q");
      const key = q.dataset.key;
      const val = Number(btn.dataset.score);
      answers[key] = val;

      q.style.display = "none";
      currentIndex++;

      if (currentIndex < questions.length) {
        questions[currentIndex].style.display = "block";
      } else {
        showResult();
      }
    });
  });
});

// ===============================
// 診断結果表示
// ===============================
function showResult() {
  if (!station) {
  alert("乗車駅を選択してください");
  return;
}
  const summary = document.getElementById("resultSummary");
  const recWrap = document.getElementById("recommendations");
  const storeWrap = document.getElementById("storeResults");

  summary.textContent = "あなたにおすすめの日本酒はこちらです。";

  // ---- 日本酒マッチング ----
  if (SAKE_LIST.length === 0) {
    recWrap.innerHTML = "<div class='rec'>日本酒データを読み込めませんでした。</div>";
    return;
  }

  const ranked = SAKE_LIST.map(sake => {
    let score = 0;
    QUESTIONS.forEach(k => {
      const a = answers[k];
      const b = Number(sake.profile?.[k] ?? 0.5);
      score += 1 - Math.abs(a - b);
    });
    return { ...sake, score };
  })
  .sort((a, b) => b.score - a.score);

  const top3 = ranked.slice(0, 3);

  recWrap.innerHTML = top3.map(s => `
    <div class="rec">
      <strong>${s.name}</strong>
      <div class="muted">${s.notes || ""}</div>
      <div style="margin-top:6px">
        <span class="badge">${s.region}</span>
        <span class="badge">${s.profile.dryness >= 0.5 ? "辛口寄り" : "甘口寄り"}</span>
        <span class="badge">${s.profile.fruity >= 0.5 ? "フルーティー" : "穏やか"}</span>
      </div>
      <div style="margin-top:6px">
        一致度：${Math.round((s.score / QUESTIONS.length) * 100)}%
      </div>
    </div>
  `).join("");

  // ---- 店舗マッチング ----
  if (!storeWrap) return;

  if (!station || !STORES[station]) {
    storeWrap.innerHTML =
      "<div class='store'>駅を選択すると購入できる店舗を表示します。</div>";
  } else {
    const blocks = [];

    STORES[station].forEach(store => {
      const list = INVENTORY[store.name] || [];
      const hit = top3.filter(s => list.includes(s.name));

      if (hit.length > 0) {
        blocks.push(`
          <div class="store">
            <strong>${store.name}</strong>
            <div class="muted">${store.location}</div>
            <div style="margin-top:6px">
              ${hit.map(h =>
                `<span class="badge">買える見込み：${h.name}</span>`
              ).join(" ")}
            </div>
          </div>
        `);
      }
    });

    storeWrap.innerHTML =
      blocks.length > 0
        ? blocks.join("")
        : "<div class='store'>近くの店舗で取り扱い情報が見つかりませんでした。</div>";
  }

  // 結果へスクロール
  document.getElementById("result-section")
    ?.scrollIntoView({ behavior: "smooth" });
}
