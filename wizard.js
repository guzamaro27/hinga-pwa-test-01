// Mobile character creation draft: source steps from HINGA character-creation-config.mjs.
// Non-validated choices are stored as draft data, never applied to Foundry.
const STEPS=[["peuple","Peuple et apparence"],["element","Élément"],["competence","Compétence culturelle"],["heritage","Don inné"],["vocationalGroup","Groupe vocationnel"],["stats","Statistiques"],["token","Token"],["chance","Chance"],["age","Âge"],["spirits","Esprits"],["traits","Caractères"],["extra","Autres options"],["name","Nom"],["summary","Résumé final"]];
const STAT_KEYS=["force","constit","vita","psych","intell","charisme","demag","arcane","perc","dex","react","discr"];const BUDGET=480;
const e=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let peoples=[];
export async function loadPeople(){try{const manifest=await (await fetch("./data/wiki/manifest.json")).json();const paths=manifest.filter(x=>x.section==="peuplex");const found=await Promise.allSettled(paths.map(async x=>{const r=await fetch("./"+x.path);if(!r.ok)throw Error("Peuple indisponible");return r.json()}));peoples=found.filter(x=>x.status==="fulfilled").map(x=>({id:x.value.id,name:x.value.identity?.name})).filter(x=>x.id&&x.name).sort((a,b)=>a.name.localeCompare(b.name,"fr"))}catch{peoples=[]}return peoples}
export function renderWizard(host,record,onChange,onClose){let step=0;record.creation??={};const data=record.creation;data.baseStats??=Object.fromEntries(STAT_KEYS.map(k=>[k,40]));const save=()=>onChange(record);
function render(){const [key,label]=STEPS[step];const statsTotal=STAT_KEYS.reduce((n,k)=>n+(Number(data.baseStats[k])||0),0);let body="";
if(key==="peuple"){body='<label>Peuple officiel</label><select id="wiz-choice"><option value="">Choisir un peuple</option>'+peoples.map(p=>'<option value="'+e(p.id)+'" '+(data.peupleId===p.id?"selected":"")+'>'+e(p.name)+'</option>').join("")+'</select>'+(peoples.length?"":'<p class="note">Catalogue des peuples indisponible hors ligne : reconnectez-vous une fois pour charger les données.</p>')}
else if(key==="stats"){body='<p>Budget de base : <strong>'+statsTotal+' / '+BUDGET+'</strong>. Le dépassement est signalé, mais Foundry autorise le brouillon. Les bonus de peuple sont séparés.</p>'+STAT_KEYS.map(k=>'<label>'+e(k.toUpperCase())+' <input data-stat="'+k+'" type="number" min="0" max="100" step="1" value="'+e(data.baseStats[k])+'"></label>').join("")+'<p class="note">'+(statsTotal>BUDGET?"Attention : dépassement de "+(statsTotal-BUDGET)+" points.":"Répartition indicative : "+(BUDGET-statsTotal)+" points restants.")+'</p><button id="wiz-balance" class="tab">Répartition équilibrée (40 partout)</button>'}
else if(key==="name")body='<label>Nom du personnage</label><input id="wiz-name" maxlength="150" value="'+e(record.name)+'" placeholder="Nom">';
else if(key==="summary")body='<p>Résumé du brouillon local. Aucune application à Foundry ni calcul final des bonus.</p>'+STEPS.slice(0,-1).map(([k,l])=>'<div class="block"><strong>'+e(l)+'</strong><p>'+e(k==="name"?record.name:k==="stats"?statsTotal+" / "+BUDGET:k==="peuple"?peoples.find(p=>p.id===data.peupleId)?.name||"Non choisi":data[k]||"Non renseigné")+'</p></div>').join("");
else if(key==="traits")body='<p>Traits narratifs, jusqu’à quatre emplacements.</p>'+Array.from({length:4},(_,i)=>'<label>Caractère '+(i+1)+'</label><input data-trait="'+i+'" maxlength="100" value="'+e((data.traits||[])[i]||"")+'">').join("");
else if(key==="age")body='<label>Âge</label><input id="wiz-age" type="number" min="0" max="10000" value="'+e(data.age??"")+'">';
else body='<p class="note">Sélection conservée comme brouillon. Le catalogue et la validation officiels de cette étape restent à intégrer.</p><label>Choix provisoire</label><input id="wiz-generic" maxlength="500" value="'+e(data[key]||"")+'" placeholder="À renseigner">';
host.innerHTML='<button id="wiz-close" class="back">← Retour au personnage</button><p class="eyebrow">Création HINGA · Étape '+(step+1)+' / 14</p><h3>'+e(label)+'</h3>'+body+'<div class="char-actions"><button id="wiz-prev" '+(step===0?"disabled":"")+'>← Précédent</button><button id="wiz-next">'+(step===13?"Terminer le brouillon":"Suivant →")+'</button></div><p class="note">Sauvegarde automatique locale · Brouillon non validé</p>';
host.querySelector("#wiz-close").onclick=()=>onClose();host.querySelector("#wiz-prev").onclick=()=>{step--;render()};host.querySelector("#wiz-next").onclick=()=>{if(step<13){step++;render()}else onClose()};
const bind=(selector,handler)=>host.querySelectorAll(selector).forEach(el=>el.addEventListener("input",()=>{handler(el);save()}));
bind("#wiz-choice",el=>data.peupleId=el.value);
bind("[data-stat]",el=>{const n=Number(el.value);if(Number.isInteger(n)&&n>=0&&n<=100)data.baseStats[el.dataset.stat]=n});
bind("#wiz-name",el=>record.name=el.value);
bind("#wiz-age",el=>data.age=el.value);
bind("[data-trait]",el=>{data.traits??=["","","",""];data.traits[Number(el.dataset.trait)]=el.value});
bind("#wiz-generic",el=>data[key]=el.value);
const balance=host.querySelector("#wiz-balance");if(balance)balance.onclick=()=>{data.baseStats=Object.fromEntries(STAT_KEYS.map(k=>[k,40]));save();render()};
}render()}
