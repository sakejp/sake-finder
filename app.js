// ===============================
// 設定
// ===============================
const QUESTIONS = ["fruity", "acidity", "dryness", "aroma", "body"];

// ===============================
// 状態
// ===============================
let answers = {};
let station = "";
let SAKE_LIST = [];
let STORES = {};
let INVENTORY = {};
let currentIndex = 0;
let questionEls = [];

// ===============================
// 初期化
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  // 質問要素
  questionEls = Array.from(document.querySelectorAll(".q"));
  showQuestion(0);

  // クリック回答（YES/NO）
  document.querySelectorAll(".q .choice").forEach(btn => {
    btn.addEventListener("click", e => {
      const wrap = e.target.closest(".q");
      const key = wrap.dataset.key;
      const val = Number(e.target.dataset.score);
      answers[key] = val;
      goNext(val === 1 ? "right" : "left");
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

  // stores.json → 駅別マップ
  storesRaw.forEach(s => {
    const key = s.station + "駅";
    if (!STORES[key]) STORES[key] = [];
    STORES[key].push({
      name: s.name,
      note: s.location,
      walk: 5,
    });
  });

  // inventory.json → 店舗名マップ
  inventoryRaw.stations.forEach(st => {
    st.stores.forEach(store => {
      INVENTORY[store.name] = store.inventory;
    });
  });
});

// ===============================
// スワイプUI制御
// ===============================
function showQuestion(index) {
  questionEls.forEach((q, i) => {
    q.classList.remove("active", "out-left", "out-right");
    if (i === index) q.classList.add("active");
  });
}

function goNext(direction) {
  const current = questionEls[currentIndex];
  current.classList.add(direction === "right" ? "out-right" : "out-left");

  currentIndex++;
  if (currentIndex < questionEls.length) {
    setTimeout(() => showQuestion(currentIndex), 200);
  } else {
    document.getElementById("matchBtn").click();
  }
}

// ===============================
// タッチ（スワイプ）対応
// ===============================
let startX = 0;

document.addEventListener("touchstart", e => {
  if (!questionEls[currentIndex]) return;
  startX = e.touches[0].clientX;
});

document.addEventListener("touchend", e => {
  if (!questionEls[currentIndex]) return;
  const endX = e.changedTouches[0].clientX;
  const diff = endX - startX;

  if (Math.abs(diff) > 50) {
    const key = questionEls[currentIndex].dataset.key;
    const val = diff > 0 ? 1 : 0;
    answers[key] = val;
    goNext(diff > 0 ? "right" : "left");
  }
});

// ===============================
// リセット
// ===============================
function resetSelections() {
  answers = {};
  currentIndex = 0;
  showQuestion(0);
  document.getElementById("recommendations").innerHTML = "";
  document.getElementById("storeResults").innerHTML = "";
  document.getElementById("resultSummary").textContent = "";
}

// ===============================
// 診断ロジック
// ===============================
function onMatch() {
  if (!station) {
    alert("乗車駅を選んでください");
    return;
  }

  const ranked = SAKE_LIST.map(s => {
    let score = 0;
    const weight = { fruity:1, acidity:0.9, dryness:1.2, aroma:1.1, body:0.8 };

    QUESTIONS.forEach(k => {
      const a = answers[k];
      const b = Number(s.profile[k] ?? 0.5);
      score += (1 - Math.abs(a - b)) * weight[k];
    });

    return { ...s, score: +(score / QUESTIONS.length).toFixed(4) };
  }).sort((a, b) => b.score - a.score);

  const top = ranked.slice(0, 3);
  document.getElementById("resultSummary").textContent = `選択した駅：${station}`;
  document.getElementById("recommendations").innerHTML = top.map(renderSake).join("");

  const storeWrap = document.getElementById("storeResults");
  const stores = STORES[station] || [];
  const blocks = [];

  stores.forEach(st => {
    const list = INVENTORY[st.name] || [];
    const hit = top.filter(s => list.includes(s.name));
    if (hit.length > 0) {
      blocks.push(`
        <div class="store">
          <strong>${st.name}</strong>
          <span class="badge">徒歩${st.walk}分</span>
          <div class="muted">${st.note}</div>
          <div>
            ${hit.map(h => `<span class="badge">買える見込み：${h.name}</span>`).join(" ")}
          </div>
        </div>
      `);
    }
  });

  storeWrap.innerHTML =
    blocks.length ? blocks.join("") :
    `<div class="store"><strong>該当するお店がありません</strong></div>`;
}

// ===============================
// 表示
// ===============================
function renderSake(s) {
  return `
    <div class="rec">
      <strong>${s.name}</strong>
      <div class="muted">${s.notes || ""}</div>
      <div>
        <span class="badge">${s.region}</span>
        <span class="badge">${s.profile.dryness >= 0.5 ? "辛口寄り" : "甘口寄り"}</span>
        <span class="badge">${s.profile.fruity >= 0.5 ? "フルーティー" : "穏やか"}</span>
      </div>
      <div>適温：${s.serve}</div>
      <div>一致度：${(s.score * 100).toFixed(1)}%</div>
    </div>
  `;
}
