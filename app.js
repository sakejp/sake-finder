alert("SWIPE VERSION LOADED");

let answers = {};
 currentIndex = 0;
let questions = [];

document.addEventListener("DOMContentLoaded", () => {
  questions = Array.from(document.querySelectorAll(".q"));

  showQuestion(0);

  document.querySelectorAll(".choice").forEach(btn => {
    btn.addEventListener("click", e => {
      const q = e.target.closest(".q");
      answers[q.dataset.key] = Number(btn.dataset.score);

      q.style.display = "none";
      currentIndex++;

      if(currentIndex < questions.length){
        showQuestion(currentIndex);
      } else {
        showResult();
      }
    });
  });
});

function showQuestion(i){
  questions[i].style.display = "block";
}

function showResult(){
  let score = Object.values(answers).reduce((a,b)=>a+b,0);

  let text =
    score >= 4 ? "華やか・フルーティー派" :
    score >= 2 ? "バランス型" :
    "落ち着いた食中酒派";

  document.getElementById("resultSummary").textContent =
    "あなたは「" + text + "」です！";
}
