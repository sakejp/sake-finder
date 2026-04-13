// ====== 設定 ======
const QUESTIONS = ["fruity","acidity","dryness","aroma","body"]; // 5問

// 属性説明（UI表示用）
const LABELS = {
  fruity: ["フルーティーが好き","控えめが好き"],
  acidity:["酸味が好き","酸味は苦手"],
  dryness:["辛口が好き","甘口が好き"],
  aroma:["華やかな香り","穏やかな香り"],
  body:["コク旨","軽快スッキリ"]
};

// ====== 状態 ======
let answers = {};          // {key: 0/1}
let station = "";          // "東京駅"など
let SAKE_LIST = [];        // sakes.json
let STORES = {};           // stores.json
let INVENTORY = {};        // inventory.json

// ====== 初期化 ======
document.addEventListener("DOMContentLoaded", async () => {
  // 選択ハンドラ
  document.querySelectorAll(".q .choice").forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      const wrap = e.target.closest(".q");
      wrap.querySelectorAll(".choice").forEach(b=>b.classList.remove("selected"));
      e.target.classList.add("selected");
      const key = wrap.dataset.key;
      const val = Number(e.target.getAttribute("data-score"));
      answers[key] = val;
    });
  });

  // 駅
  document.getElementById("stationSelect").addEventListener("change",(e)=>{
    station = e.target.value;
  });

  // ボタン
  document.getElementById("resetBtn").addEventListener("click", resetSelections);
  document.getElementById("matchBtn").addEventListener("click", onMatch);

  // データ読込
  [SAKE_LIST, STORES, INVENTORY] = await Promise.all([
    fetch("data/sakes.json").then(r=>r.json()),
    fetch("data/stores.json").then(r=>r.json()),
    fetch("data/inventory.json").then(r=>r.json()),
  ]);
});

function resetSelections(){
  answers = {};
  document.querySelectorAll(".q .choice").forEach(b=>b.classList.remove("selected"));
  document.getElementById("recommendations").innerHTML = "";
  document.getElementById("storeResults").innerHTML = "";
  document.getElementById("resultSummary").textContent = "";
}

// ====== 診断 ======
function onMatch(){
  // バリデーション
  if(!station){
    alert("乗車駅を選んでください");
    return;
  }
  for(const k of QUESTIONS){
    if(!(k in answers)){
      alert("5問すべて回答してください");
      return;
    }
  }

  // スコアリング
  // SAKE_LIST の各アイテムには属性 {fruity, acidity, dryness, aroma, body} (0〜1) を持たせる
  const ranked = SAKE_LIST.map(s=>{
    let score = 0;
    for(const k of QUESTIONS){
      // 類似度 = 1 - |a - b|
      const a = answers[k];
      const b = Number(s.profile[k] ?? 0.5);
      score += (1 - Math.abs(a - b));
    }
    // 重み付け（例：辛口・香りを少し重視）
    const w = { fruity:1.0, acidity:0.9, dryness:1.2, aroma:1.1, body:0.8 };
    let wscore = 0;
    for(const k of QUESTIONS){
      const a = answers[k];
      const b = Number(s.profile[k] ?? 0.5);
      wscore += (1 - Math.abs(a - b)) * w[k];
    }
    return {...s, score: +(wscore/5).toFixed(4)};
  })
  .sort((a,b)=> b.score - a.score);

  const top = ranked.slice(0,3);

  // 表示：診断要約
  const rs = document.getElementById("resultSummary");
  rs.textContent = `選択した駅：${station} ／ あなたの傾向：` +
    QUESTIONS.map(k => `${k}=${answers[k]}`).join(", ");

  // 表示：銘柄
  const recWrap = document.getElementById("recommendations");
  recWrap.innerHTML = top.map(s => renderSake(s)).join("");

  // 店舗マッチ（駅→候補店舗一覧→各店舗の在庫候補に銘柄があれば可視化）
  const storeWrap = document.getElementById("storeResults");
  const stores = STORES[station] || [];
  let any = false;

  const blocks = [];
  for(const st of stores){
    const list = INVENTORY[st.name] || [];
    // top の中で買える候補
    const hit = top.filter(s => list.includes(s.name));
    if(hit.length>0){
      any = true;
      blocks.push(`
        <div class="store">
          <div><strong>${st.name}</strong> <span class="badge">徒歩${st.walk}分目安</span></div>
          <div class="muted">${st.note || ""}</div>
          <div style="margin-top:6px">
            ${hit.map(h=>`<span class="badge">買える見込み: ${h.name}</span>`).join(" ")}
          </div>
        </div>
      `);
    }
  }

  if(!any){
    // 条件に当てはまるお店がない場合
    storeWrap.innerHTML = `<div class="store"><strong>乗車駅周辺におすすめの日本酒を購入できるお店がありません</strong></div>`;
  }else{
    storeWrap.innerHTML = blocks.join("");
  }
}

function renderSake(s){
  const tags = [
    s.region ? `<span class="badge">${s.region}</span>` : "",
    `<span class="badge">${ s.profile.dryness>=0.5 ? "辛口寄り" : "甘口寄り"}</span>`,
    `<span class="badge">${ s.profile.fruity>=0.5 ? "フルーティー" : "穏やか"}</span>`,
    `<span class="badge">${ s.profile.acidity>=0.5 ? "酸あり" : "酸おだやか"}</span>`,
    `<span class="badge">${ s.profile.body>=0.5 ? "コク" : "ライト"}</span>`
  ].join(" ");
  return `
    <div class="rec">
      <div><strong>${s.name}</strong></div>
      <div class="muted">${s.notes || ""}</div>
      <div style="margin-top:6px">${tags}</div>
      <div style="margin-top:6px">適温の目安：${s.serve || "冷酒〜常温"}</div>
      <div style="margin-top:6px">一致度：${(s.score*100).toFixed(1)}%</div>
    </div>
  `;
}