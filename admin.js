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
let activeAdminFilter="all";
function readJson(key,fallback={}){try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}}
function writeJson(key,value){localStorage.setItem(key,JSON.stringify(value))}
function scores(){return readJson(scoreKey,{})}
function state(){return readJson(stateKey,{})}
function settings(){return readJson(settingsKey,{youtubeLink:"https://youtube.com/@youthenhancement?si=sXVp1Qaj-kMiVCAF"})}
function matchPhase(matchId){return (state()[matchId]||{}).phase||"upcoming"}
function isCompleted(matchId){return matchPhase(matchId)==="fulltime"}
function isInProgress(matchId){return ["first_half","halftime","second_half"].includes(matchPhase(matchId))}
function filteredMatches(){return adminMatches.filter(m=>{const phase=matchPhase(m.id);if(activeAdminFilter==="upcoming")return phase==="upcoming";if(activeAdminFilter==="progress")return ["first_half","halftime","second_half"].includes(phase);if(activeAdminFilter==="completed")return phase==="fulltime";return true})}
function currentMatch(){return adminMatches.find(m=>String(m.id)===String(selectedId))||filteredMatches()[0]||adminMatches[0]}
function confirmAction(title,message,confirmText="Confirm"){return confirm(`${title}\n\n${message}\n\nTap OK to ${confirmText}. Tap Cancel to go back.`)}
function saveScoreSide(side,delta){const s=scores();s[selectedId]=s[selectedId]||{home:"",away:""};const old=Number(s[selectedId][side]||0);s[selectedId][side]=String(Math.max(0,old+delta));writeJson(scoreKey,s);render()}
function saveScore(){const s=scores();s[selectedId]=s[selectedId]||{home:"0",away:"0"};writeJson(scoreKey,s);render();alert("Score saved. You can still correct it later, even after Full Time.")}
function setPhase(phase){const st=state();st.currentMatchId=selectedId;st[selectedId]=st[selectedId]||{};st[selectedId].phase=phase;st[selectedId].phaseStartedAt=new Date().toISOString();writeJson(stateKey,st);render()}
function resetPhase(){if(!confirmAction("Reset selected match status?","This will reset only the selected match back to Upcoming. Scores will not be changed.","reset status"))return;const st=state();delete st[selectedId];if(String(st.currentMatchId)===String(selectedId))delete st.currentMatchId;writeJson(stateKey,st);render();alert("Selected match status reset")}
function saveSettings(){const input=document.getElementById("youtubeLink");writeJson(settingsKey,{youtubeLink:input.value.trim()});alert("Live link saved")}
function clearScoresAndStatus(){if(!confirmAction("Clear selected match data?","This will remove only the selected match score and status. Other matches will not be changed.","clear selected match data"))return;const s=scores();const st=state();delete s[selectedId];delete st[selectedId];if(String(st.currentMatchId)===String(selectedId))delete st.currentMatchId;writeJson(scoreKey,s);writeJson(stateKey,st);render();alert("Selected match score and status cleared")}
function clearAllMatchData(){const first=confirmAction("Clear all tournament data?","This will remove all scores, all match statuses, current match state, and saved settings. This action cannot be undone.","continue");if(!first)return;const typed=prompt('Type CLEAR to confirm clearing all tournament data.');if(typed!=="CLEAR"){alert("Clear all cancelled");return}localStorage.removeItem(scoreKey);localStorage.removeItem(stateKey);localStorage.removeItem(settingsKey);selectedId=1;activeAdminFilter="all";render();alert("All match data cleared")}
function phaseText(phase){return {first_half:"1st Half",halftime:"Half Time",second_half:"2nd Half",fulltime:"Full Time",upcoming:"Upcoming"}[phase]||"Upcoming"}
function renderMatchSelect(){const select=document.getElementById("matchSelect");const matches=filteredMatches();if(!matches.some(m=>String(m.id)===String(selectedId)))selectedId=matches[0]?.id||adminMatches[0].id;select.innerHTML=matches.length?matches.map(m=>`<option value="${m.id}">${m.id===22?'Final':`#${m.id}`} — ${m.home} vs ${m.away} · ${phaseText(matchPhase(m.id))}</option>`).join(""):`<option>No matches in this filter</option>`;select.disabled=!matches.length;select.value=String(selectedId);document.querySelectorAll(".admin-tab").forEach(btn=>btn.classList.toggle("active",btn.dataset.adminFilter===activeAdminFilter))}
function render(){renderMatchSelect();const m=currentMatch();const s=scores()[selectedId]||{home:"0",away:"0"};const st=state()[selectedId]||{};document.getElementById("homeTeam").textContent=m.home;document.getElementById("awayTeam").textContent=m.away;document.getElementById("homeScore").textContent=s.home===""?"0":s.home||"0";document.getElementById("awayScore").textContent=s.away===""?"0":s.away||"0";document.getElementById("matchInfo").textContent=`${m.day} • ${m.round} • ${m.time} • ${phaseText(st.phase||"upcoming")}`;document.getElementById("phaseLabel").textContent=phaseText(st.phase||"upcoming");document.querySelectorAll(".phase-buttons button").forEach(btn=>btn.classList.toggle("active",btn.dataset.phase===st.phase));const set=settings();document.getElementById("youtubeLink").value=set.youtubeLink||""}
function init(){const select=document.getElementById("matchSelect");select.addEventListener("change",()=>{selectedId=select.value;render()});document.querySelectorAll(".admin-tab").forEach(btn=>btn.addEventListener("click",()=>{activeAdminFilter=btn.dataset.adminFilter;render()}));document.querySelectorAll("[data-score]").forEach(btn=>btn.addEventListener("click",()=>saveScoreSide(btn.dataset.score,Number(btn.dataset.delta))));document.getElementById("saveScoreBtn").addEventListener("click",saveScore);document.querySelectorAll(".phase-buttons button").forEach(btn=>btn.addEventListener("click",()=>setPhase(btn.dataset.phase)));document.getElementById("resetPhaseBtn").addEventListener("click",resetPhase);document.getElementById("saveSettingsBtn").addEventListener("click",saveSettings);document.getElementById("resetScoresBtn").addEventListener("click",clearScoresAndStatus);document.getElementById("clearAllDataBtn").addEventListener("click",clearAllMatchData);render()}
init();