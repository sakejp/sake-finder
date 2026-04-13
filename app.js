console.log("APP LOADED");

const QUESTIONS = ["fruity","acidity","dryness","aroma","body"];

let answers = {};
let index = 0;
let qs = [];
let SAKE_LIST = [];

document.addEventListener("DOMContentLoaded", async () => {
  qs = Array.from(document.querySelectorAll(".q"));
  qs[0].style.display = "block";

  try {
    SAKE_LIST = await fetch("data/sakes.json").then(r=>r.json());
  } catch {
    SAKE_LIST = [];
  }

  document.querySelectorAll(".choice").forEach(btn=>{
    btn.addEventListener("click", e=>{
      const q = e.target.closest(".q");
      answers[q.dataset.key] = Number(btn.dataset.score);

      q.style.display="none";
      index++;

      if(index < qs.length){
        qs[index].style.display="block";
      } else {
        showResult();
      }
    });
  });
});

function showResult(){
  const sum = Object.values(answers).reduce((a,b)=>a+b,0);

  const summary = document.getElementById("resultSummary");
  const wrap = document.getElementById("recommendations");

  summary.textContent = "診断完了！";

  if(SAKE_LIST.length === 0){
    wrap.innerHTML = `<div class="rec">（データ未読込）スコア：${sum}</div>`;
    return;
  }

  const ranked = SAKE_LIST.map(s=>{
    let score = 0;
    QUESTIONS.forEach(k=>{
      score += 1 - Math.abs(answers[k] - (s.profile?.[k] ?? 0.5));
    });
    return {...s, score};
  }).sort((a,b)=>b.score-a.score).slice(0,3);

  wrap.innerHTML = ranked.map(s=>`
    <div class="rec">
      <strong>${s.name}</strong>
      <div>${s.region}</div>
      <div>一致度 ${Math.round(s.score/QUESTIONS.length*100)}%</div>
    </div>
  `).join("");
}
