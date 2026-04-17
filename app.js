const QUESTIONS = ["fruity","acidity","dryness","aroma","body"];

let answers = {};
let index = 0;
let qs = [];
let SAKE_LIST = [];
let STORES = {};
let INVENTORY = {};
let station = "";

document.addEventListener("DOMContentLoaded", async () => {
  // 質問
  qs = Array.from(document.querySelectorAll(".q"));
  qs.forEach((q,i)=>q.style.display = i===0 ? "block" : "none");

  // 駅選択
  document.getElementById("stationSelect")
    .addEventListener("change", e => station = e.target.value);

  // 日本酒
  SAKE_LIST = await fetch("data/sakes.json").then(r=>r.json());

  // 店舗・在庫
  const storesRaw = await fetch("data/stores.json").then(r=>r.json());
  const inventoryRaw = await fetch("data/inventory.json").then(r=>r.json());

  storesRaw.forEach(s=>{
    const k = s.station + "駅";
    if(!STORES[k]) STORES[k] = [];
    STORES[k].push({
      name: s.name,
      location: s.location
    });
  });

  inventoryRaw.stations.forEach(st=>{
    st.stores.forEach(store=>{
      INVENTORY[store.name] = store.inventory; // ← 配列（文字列）
    });
  });

  // 回答
  document.querySelectorAll(".choice").forEach(btn=>{
    btn.addEventListener("click", e=>{
      const q = e.target.closest(".q");
      answers[q.dataset.key] = Number(btn.dataset.score);

      q.style.display = "none";
      index++;
      updateProgress(index);

      index < qs.length ? qs[index].style.display="block" : showResult();
    });
  });

  document.getElementById("restartBtn")
    .addEventListener("click", resetAll);
});

function updateProgress(i){
  document.querySelectorAll(".dot")
    .forEach((d,idx)=>d.classList.toggle("active", idx<=i));
}

function showResult(){
  // 日本酒スコアリング
  const ranked = SAKE_LIST.map(s=>{
    let score = 0;
    QUESTIONS.forEach(k=>{
      score += 1 - Math.abs(answers[k] - (s.profile[k] ?? 0.5));
    });
    return {...s, score};
  }).sort((a,b)=>b.score-a.score).slice(0,3);

  resultSummary.textContent = "あなたに合う日本酒はこちらです。";

  recommendations.innerHTML = ranked.map(s=>`
    <div class="rec">
      <strong>${s.name}</strong>
      <div class="muted">${s.region}</div>
      <div>一致度：${Math.round(s.score/QUESTIONS.length*100)}%</div>
    </div>
  `).join("");

  // 店舗表示
  const stores = STORES[station] || [];
  const blocks = [];

  stores.forEach(st=>{
    const inventory = INVENTORY[st.name] || [];

    // ✅ 常に ranked（オブジェクト）から name を取る
    const hit = ranked.filter(r => inventory.includes(r.name));

    if(hit.length){
      blocks.push(`
        <div class="store">
          <div class="store-header">
            <strong>${st.name}</strong>
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(st.name)}"
               target="_blank" class="map-link">Google Maps</a>
          </div>

          <div class="muted">${st.location}</div>

          <div style="margin-top:6px">
            ${hit.map(r => `<span class="badge">買える見込み：${r.name}</span>`).join("")}
          </div>
        </div>
      `);
    }
  });

  storeResults.innerHTML =
    blocks.length
      ? blocks.join("")
      : "<div class='store'>近くで購入できる店舗が見つかりませんでした</div>";

  document.getElementById("result-section")
    .scrollIntoView({behavior:"smooth"});
}

function resetAll(){
  answers = {};
  index = 0;
  qs.forEach(q=>q.style.display="none");
  qs[0].style.display="block";
  updateProgress(0);
  resultSummary.textContent="";
  recommendations.innerHTML="";
  storeResults.innerHTML="";
  window.scrollTo({top:0,behavior:"smooth"});
}
