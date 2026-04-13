alert("SWIPE VERSION LOADED");

// ===============================
// 状態
// ===============================
let answers = {};
let station = "";
let currentIndex = 0;
let questionEls = [];

// ===============================
// 初期化
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  questionEls = Array.from(document.querySelectorAll(".q"));

  // 初期表示：1問目だけ
  questionEls.forEach((q, i) => {
    q.style.display = i === 0 ? "block" : "none";
  });

  // 選択肢クリック
document.querySelectorAll(".choice").forEach(btn => {
  btn.addEventListener("click", e => {
    const q = e.target.closest(".q");
    const key = q.dataset.key;
    const val = Number(e.target.dataset.score);
    answers[key] = val;

    // 退場アニメーション
    q.style.transform = val === 1
      ? "translateX(120%)"
      : "translateX(-120%)";
    q.style.opacity = "0";

    setTimeout(() => {
      q.style.transform = "";
      q.style.opacity = "";
      goNext();
    }, 260);
  });
});

// ===============================
// 次の質問へ
// ===============================
function goNext() {
  questionEls[currentIndex].style.display = "none";
  currentIndex++;

  if (currentIndex < questionEls.length) {
    questionEls[currentIndex].style.display = "block";
  } else {
    // ✅ 全問回答後に診断結果を表示
    onMatch();
  }
}
