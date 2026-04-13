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

      goNext();
    });
  });
});

// ===============================
// 次の質問へ
// ===============================
function goNext() {
  // 現在の質問を非表示
  questionEls[currentIndex].style.display = "none";
  currentIndex++;

  // 次があれば表示
  if (currentIndex < questionEls.length) {
    questionEls[currentIndex].style.display = "block";
  } else {
    alert("診断完了（ここで結果表示に進めます）");
  }
}
