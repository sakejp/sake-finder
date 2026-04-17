const QUESTIONS=["fruity","acidity","dryness","aroma","body"];
let answers={},index=0,qs=[];
let SAKE_LIST=[],STORES={},INVENTORY={},station="";

document.addEventListener("DOMContentLoaded",async()=>{
  qs=[...document.querySelectorAll(".q")];
  qs[0].style.display="block";

  document.getElementById("stationSelect")
    .addEventListener("change",e=>station=e.target.value);

  SAKE_LIST=await fetch("data/sakes.json").then(r=>r.json());
  const s=await fetch("data/stores.json").then(r=>r.json());
  const i=await fetch("data/inventory.json").then(r=>r.json());

  s.forEach(x=>{
    const k=x.station+"駅";
    (STORES[k]??=[]).push({name:x.name,location:x.location});
  });
  i.stations.forEach(st=>st.stores.forEach(o=>INVENTORY[o.name]=o.inventory));

  document.querySelectorAll(".choice").forEach(b=>{
    b.onclick=e=>{
      const q=e.target.closest(".q");
      answers[q.dataset.key]=Number(b.dataset.score);
      q.style.display="none";
      index++;
      updateProgress(index);
      index<qs.length?qs[index].style.display="block":showResult();
    };
  });
});

function updateProgress(i){
  document.querySelectorAll(".dot")
    .forEach((d,idx)=>d.classList.toggle("active",idx<=i));
}

function showResult(){
  const ranked=SAKE_LIST.map(s=>{
    let sc=0;
    QUESTIONS.forEach(k=>sc+=1-Math.abs(answers[k]-(s.profile[k]??.5)));
    return {...s,score:sc};
  }).sort((a,b)=>b.score-a.score).slice(0,3);

  resultSummary.textContent="あなたに合う日本酒はこちらです";

  recommendations.innerHTML=ranked.map(s=>`
    <div class="rec">
      <strong>${s.name}</strong>
      <div class="muted">${s.region}</div>
      <div>${Math.round(s.score/5*100)}%</div>
    </div>`).join("");

  storeResults.innerHTML=(STORES[station]||[]).map(st=>{
    const hit=(INVENTORY[st.name]||[])
      .filter(n=>ranked.some(r=>r.name===n));
    return hit.length?`
      <div class="store">
        <strong>${st.name}</strong>
        <div class="muted">${st.location}</div>
        ${hit.map(h=>`<span class="badge">${h}</span>`).join("")}
      </div>`:"";
  }).join("");

  document.getElementById("result-section")
    .scrollIntoView({behavior:"smooth"});
}
