alert("MATCHING LOGIC LOADED");

// ===============================
// 設定
// ===============================
const QUESTIONS = ["fruity", "acidity", "dryness", "aroma", "body"];

// ===============================
// 状態
// ===============================
let answers = {};
let currentIndex = 0;
let questions = [];
let SAKE_LIST = [];

// ===============================
// 初期化
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  questions = Array.from(document.querySelectorAll(".q"));

  // 1問目だけ表示
  questions.forEach((q, i) => {
    q.style.display = i === 0 ? "block" : "none";
  });

  // 日本酒データ読み込み
  SAKE_LIST = await fetch("data/sakes.json").then(r => r.json());

  // 選択肢クリック
  document.querySelectorAll(".choice").forEach(btn => {
    btn.addEventListener("click", e => {
      const q = e.target.closest(".q");
      const key = q.dataset.key;
      const val = Number(btn.dataset.score);
      answers[key] = val;

      // 次の質問へ
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
// 診断結果表示（日本酒マッチング）
// ===============================
function showResult() {
  // スコアリング
  const ranked = SAKE_LIST.map(sake => {
    let score = 0;
    QUESTIONS.forEach(key => {
      const a = answers[key];
      const b = Number(sake.profile?.[key] ?? 0.5);
      score += (1 - Math.abs(a - b));
    });
    return {
      ...sake,
      score
    };
  }).sort((a, b) => b.score - a.score);

  const top3 = ranked.slice(0, 3);

  // 表示
  const summary = document.getElementById("resultSummary");
  const recWrap = document.getElementById("recommendations");

  summary.textContent = "あなたにおすすめの日本酒はこちらです。";

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

  // 結果エリアへスクロール
  document.getElementById("result-section")
    .scrollIntoView({ behavior: "smooth" });
}
