const adminMatches=[
{id:1,day:"Day 1 — Wednesday, 27 May 2026",round:"Round 1",time:"20:45 – 21:00",home:"FC Maavadibe",away:"Smashers FC"},
{id:2,day:"Day 1 — Wednesday, 27 May 2026",round:"Round 1",time:"21:05 – 21:20",home:"FC Karaa",away:"Triple T"},
{id:3,day:"Day 1 — Wednesday, 27 May 2026",round:"Round 1",time:"21:25 – 21:40",home:"Muli Blues",away:"Blackout 5"},
{id:4,day:"Day 1 — Wednesday, 27 May 2026",round:"Round 2",time:"21:50 – 22:05",home:"Meem Police",away:"Smashers FC"},
{id:5,day:"Day 1 — Wednesday, 27 May 2026",round:"Round 2",time:"22:10 – 22:25",home:"FC Maavadibe",away:"Blackout 5"},
{id:6,day:"Day 1 — Wednesday, 27 May 2026",round:"Round 2",time:"22:30 – 22:45",home:"FC Karaa",away:"Muli Blues"},
{id:7,day:"Day 1 — Wednesday, 27 May 2026",round:"Round 3",time:"22:55 – 23:10",home:"Meem Police",away:"Triple T"},
{id:8,day:"Day 1 — Wednesday, 27 May 2026",round:"Round 3",time:"23:15 – 23:30",home:"Smashers FC",away:"Blackout 5"},
{id:9,day:"Day 1 — Wednesday, 27 May 2026",round:"Round 3",time:"23:35 – 23:50",home:"FC Maavadibe",away:"FC Karaa"},
{id:10,day:"Day 2 — Thursday, 28 May 2026",round:"Round 4",time:"20:15 – 20:30",home:"Meem Police",away:"Blackout 5"},
{id:11,day:"Day 2 — Thursday, 28 May 2026",round:"Round 4",time:"20:35 – 20:50",home:"Triple T",away:"Muli Blues"},
{id:12,day:"Day 2 — Thursday, 28 May 2026",round:"Round 4",time:"20:55 – 21:10",home:"Smashers FC",away:"FC Karaa"},
{id:13,day:"Day 2 — Thursday, 28 May 2026",round:"Round 5",time:"21:20 – 21:35",home:"Meem Police",away:"Muli Blues"},
{id:14,day:"Day 2 — Thursday, 28 May 2026",round:"Round 5",time:"21:40 – 21:55",home:"Blackout 5",away:"FC Karaa"},
{id:15,day:"Day 2 — Thursday, 28 May 2026",round:"Round 5",time:"22:00 – 22:15",home:"Triple T",away:"FC Maavadibe"},
{id:16,day:"Day 2 — Thursday, 28 May 2026",round:"Round 6",time:"22:25 – 22:40",home:"Meem Police",away:"FC Karaa"},
{id:17,day:"Day 2 — Thursday, 28 May 2026",round:"Round 6",time:"22:45 – 23:00",home:"Muli Blues",away:"FC Maavadibe"},
{id:18,day:"Day 2 — Thursday, 28 May 2026",round:"Round 6",time:"23:05 – 23:20",home:"Triple T",away:"Smashers FC"},
{id:19,day:"Day 2 — Thursday, 28 May 2026",round:"Round 7",time:"23:30 – 23:45",home:"Meem Police",away:"FC Maavadibe"},
{id:20,day:"Day 2 — Thursday, 28 May 2026",round:"Round 7",time:"23:50 – 00:05",home:"Muli Blues",away:"Smashers FC"},
{id:21,day:"Day 2 — Thursday, 28 May 2026",round:"Round 7",time:"00:10 – 00:25",home:"Blackout 5",away:"Triple T"},
{id:22,day:"Grand Final — Friday, 29 May 2026",round:"Grand Final",time:"After league stage",home:"1st Place",away:"2nd Place",isFinal:true}
];
const scoreKey="goal-diggers-cup-2026-scores";
const stateKey="goal-diggers-cup-2026-admin-state";
const settingsKey="goal-diggers-cup-2026-settings";
let selectedId=1;
function readJson(key,fallback={}){try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}}
function writeJson(key,value){localStorage.setItem(key,JSON.stringify(value))}
function currentMatch(){return adminMatches.find(m=>String(m.id)===String(selectedId))||adminMatches[0]}
function scores(){return readJson(scoreKey,{})}
function state(){return readJson(stateKey,{})}
function settings(){return readJson(settingsKey,{youtubeLink:"https://youtube.com/@youthenhancement?si=sXVp1Qaj-kMiVCAF"})}
function saveScoreSide(side,delta){const s=scores();s[selectedId]=s[selectedId]||{home:"",away:""};const old=Number(s[selectedId][side]||0);s[selectedId][side]=String(Math.max(0,old+delta));writeJson(scoreKey,s);render()}
function saveScore(){const s=scores();s[selectedId]=s[selectedId]||{home:"0",away:"0"};writeJson(scoreKey,s);render();alert("Score saved")}
function setPhase(phase){const st=state();st.currentMatchId=selectedId;st[selectedId]=st[selectedId]||{};st[selectedId].phase=phase;st[selectedId].phaseStartedAt=new Date().toISOString();writeJson(stateKey,st);render()}
function resetPhase(){const st=state();delete st[selectedId];if(String(st.currentMatchId)===String(selectedId))delete st.currentMatchId;writeJson(stateKey,st);render()}
function saveSettings(){const input=document.getElementById("youtubeLink");writeJson(settingsKey,{youtubeLink:input.value.trim()});alert("Live link saved")}
function clearScoresAndStatus(){if(confirm("Reset all scores and match statuses? This keeps saved settings like the live link.")){localStorage.removeItem(scoreKey);localStorage.removeItem(stateKey);render();alert("Scores and match statuses cleared")}}
function clearAllMatchData(){if(confirm("Clear ALL match data, scores, phases, current match and saved settings? Use this before launch after testing.")){localStorage.removeItem(scoreKey);localStorage.removeItem(stateKey);localStorage.removeItem(settingsKey);selectedId=1;document.getElementById("matchSelect").value="1";render();alert("All match data cleared")}}
function phaseText(phase){return {first_half:"1st Half",halftime:"Half Time",second_half:"2nd Half",fulltime:"Full Time"}[phase]||"Upcoming"}
function render(){const m=currentMatch();const s=scores()[selectedId]||{home:"0",away:"0"};const st=state()[selectedId]||{};document.getElementById("homeTeam").textContent=m.home;document.getElementById("awayTeam").textContent=m.away;document.getElementById("homeScore").textContent=s.home===""?"0":s.home||"0";document.getElementById("awayScore").textContent=s.away===""?"0":s.away||"0";document.getElementById("matchInfo").textContent=`${m.day} • ${m.round} • ${m.time}`;document.getElementById("phaseLabel").textContent=phaseText(st.phase);document.querySelectorAll(".phase-buttons button").forEach(btn=>btn.classList.toggle("active",btn.dataset.phase===st.phase));const set=settings();document.getElementById("youtubeLink").value=set.youtubeLink||""}
function init(){const select=document.getElementById("matchSelect");select.innerHTML=adminMatches.map(m=>`<option value="${m.id}">${m.id===22?'Final':`#${m.id}`} — ${m.home} vs ${m.away}</option>`).join("");select.addEventListener("change",()=>{selectedId=select.value;render()});document.querySelectorAll("[data-score]").forEach(btn=>btn.addEventListener("click",()=>saveScoreSide(btn.dataset.score,Number(btn.dataset.delta))));document.getElementById("saveScoreBtn").addEventListener("click",saveScore);document.querySelectorAll(".phase-buttons button").forEach(btn=>btn.addEventListener("click",()=>setPhase(btn.dataset.phase)));document.getElementById("resetPhaseBtn").addEventListener("click",resetPhase);document.getElementById("saveSettingsBtn").addEventListener("click",saveSettings);document.getElementById("resetScoresBtn").addEventListener("click",clearScoresAndStatus);document.getElementById("clearAllDataBtn").addEventListener("click",clearAllMatchData);render()}
init();