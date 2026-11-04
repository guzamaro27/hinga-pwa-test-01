// HINGA Mobile: assistant de création en 14 étapes, brouillon sans application Foundry.
const STEPS=[["peuple","Peuple et apparence"],["element","Élément"],["competence","Compétence culturelle"],["heritage","Don inné"],["vocationalGroup","Groupe vocationnel"],["stats","Statistiques"],["token","Token"],["chance","Chance"],["age","Âge"],["spirits","Esprits"],["traits","Caractères"],["extra","Autres options"],["name","Nom"],["summary","Résumé final"]];
const STATS=["force","constit","vita","psych","intell","charisme","demag","arcane","perc","dex","react","discr"];
const ELEMENTS=["PLANTE","EAU","FEU","TERRE","METAL","ELECTRICITE","AIR","SON","CORPS","LUMIERE","TENEBRES","TEMPS","ESPACE"];
const GROUPS=[["combattant-emerite","Combattant Émérite"],["corps-militaire","Corps Militaire"],["garde-protecteur","Garde Protecteur"],["gardien-de-la-nature","Gardien de la Nature"],["mage-sage","Mage Sage"],["negociateur-diplomatique","Négociateur Diplomatique"],["ombre-rebelle","Ombre Rebelle"],["peregrin-mystique","Pérégrin Mystique"],["scientifique-savant","Scientifique Savant"]];
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const title=id=>String(id??"").replace(/-/g," ").replace(/\b\p{L}/gu,x=>x.toUpperCase());
let peoples=[],presets=[],skills=[],spirits=[];
export async function loadPeople(){try{const r=await fetch("./data/creation/peuples.json");if(!r.ok)throw Error("Catalogue indisponible");const data=await r.json();if(data.schemaVersion!==1||!Array.isArray(data.peoples))throw Error("Catalogue invalide");peoples=data.peoples.sort((a,b)=>a.label.localeCompare(b.label,"fr"));}catch{peoples=[]}try{const [a,b,m]=await Promise.all([fetch("./data/creation/presets.json"),fetch("./data/creation/skills-index.json"),fetch("./data/wiki/manifest.json")]);if(a.ok)presets=(await a.json()).presets||[];if(b.ok)skills=(await b.json()).skills||[];if(m.ok){const paths=(await m.json()).filter(x=>x.section==="pantheon"&&!x.path.includes("guide-"));const data=await Promise.allSettled(paths.map(async x=>{const r=await fetch("./"+x.path);return r.ok?r.json():null}));spirits=data.filter(x=>x.status==="fulfilled"&&x.value?.type==="pantheon-spirit").map(x=>({id:x.value.id,label:x.value.identity?.name,domains:x.value.pantheon?.domains||[],blessings:Object.values(x.value.pantheon?.blessings||{}).map(b=>({name:b.name,effect:b.shortEffect,tier:b.tier}))})).filter(x=>x.id&&x.label).sort((a,b)=>a.label.localeCompare(b.label,"fr"))}}catch(e){console.warn("Catalogues indisponibles",e)}return peoples}
export function renderWizard(host,record,onChange,onClose){
record.creation??={};const d=record.creation;let step=Number.isInteger(d.wizardStep)?Math.max(0,Math.min(13,d.wizardStep)):0;d.baseStats??=Object.fromEntries(STATS.map(k=>[k,40]));d.elementSlots??=[];d.elementSlots=d.elementSlots.map(x=>x?{elementId:x.elementId||x.id||"",level:Number(x.level)||0}:x);d.traits??=["","","",""];
const save=()=>onChange(record);const people=()=>peoples.find(p=>p.id===d.peupleId);
const select=(id,opts,value,placeholder="Choisir")=>'<select id="'+id+'"><option value="">'+esc(placeholder)+'</option>'+opts.map(([v,l])=>'<option value="'+esc(v)+'" '+(String(value??"")===String(v)?"selected":"")+'>'+esc(l)+'</option>').join("")+'</select>';
const field=(id,label,value="",type="text")=>'<label for="'+id+'">'+esc(label)+'</label><input id="'+id+'" type="'+type+'" value="'+esc(value)+'">';
const bind=(selector,fn)=>host.querySelectorAll(selector).forEach(el=>el.addEventListener("change",()=>{fn(el);save();render()}));
function render(){
const [key,label]=STEPS[step],p=people(),sum=STATS.reduce((n,k)=>n+(Number(d.baseStats[k])||0),0);let html="";
if(key==="peuple"){
html='<p>Choisissez votre peuple. Ses affinités, compétences et dons dépendent de ce choix.</p><label>Peuple</label>'+select("p",peoples.map(x=>[x.id,x.label]),d.peupleId,"Choisir un peuple")+
'<label>Apparence</label>'+select("gender",[["M","Homme"],["F","Femme"],["autre","Autre / libre"]],d.gender,"Choisir")+
(p?'<p class="note">Affinité : '+esc(p.affinity)+' · Bonus : '+esc(p.stats.primary.id)+' '+p.stats.primary.value+', '+esc(p.stats.secondary.id)+' +'+p.stats.secondary.value+' · Malus : '+esc(p.stats.penalty.id)+' '+p.stats.penalty.value+'</p>':'<p class="note">Sélectionnez un peuple pour débloquer ses choix culturels.</p>');
}else if(key==="element"){
html='<p>Jusqu’à trois éléments distincts. Maîtrise N0 (Néophyte) à N4 (Sage). L’affinité du peuple est indiquée à titre informatif.</p>'+(p?'<p>Affinité du peuple : <strong>'+esc(p.affinity)+'</strong></p>':'<p class="note">Peuple non sélectionné.</p>')+
Array.from({length:3},(_,i)=>'<div class="wizard-pair"><label>Élément '+(i+1)+select("element-"+i,ELEMENTS.map(x=>[x,title(x)]),d.elementSlots[i]?.elementId,"Aucun")+'</label><label>Maîtrise'+select("level-"+i,[0,1,2,3,4].map(n=>[n,"N"+n]),d.elementSlots[i]?.level??0,"Niveau")+'</label></div>').join("");
}else if(key==="competence"){
html=p?'<p>Choisissez une compétence culturelle autorisée pour '+esc(p.label)+'.</p>'+select("competence",p.competenceIds.map(x=>[x,title(x)]),d.competenceId):'<p class="note">Choisissez d’abord un peuple.</p>';
}else if(key==="heritage"){
html=p?'<p>Don inné parmi les options propres à votre peuple. Les effets restent descriptifs dans la PWA.</p>'+select("heritage",p.bonuses.map(x=>[x.id+(x.detail?"|"+x.detail:""),title(x.id)+(x.detail?" — "+title(x.detail):"")]),d.heritageId)+(d.heritageId?.startsWith("sens-aiguise")?'<label>Sens spécialisé</label>'+select("heritage-detail",[["vis","Vue"],["aud","Ouïe"],["olf","Odorat"],["tac","Toucher"],["gus","Goût"],["eso","Ésotérique"]],d.heritageDetail,"Choisir le sens"):"")+'<p class="note">Bonus officiels : double héritage = deux compétences culturelles ; Chance accrue = +5 maximum ; Réserve naturelle = +5 % maximum ; Récupération améliorée = +10 % ; Résistance élémentaire = +10 %.</p>':'<p class="note">Choisissez d’abord un peuple.</p>';
}else if(key==="vocationalGroup"){
html='<p>Premier groupe vocationnel spécialisé : gratuit. Les compétences ne sont pas attribuées automatiquement.</p>'+select("group",GROUPS,d.primaryVocationalGroupId)+'<label>Compétences disponibles : '+skills.length+'</label><input id="skill-search" placeholder="Rechercher une compétence"><div id="skill-results"></div><div id="skill-selected"></div>';
}else if(key==="stats"){
html='<label>Archétype de statistiques</label>'+select("preset",presets.map(x=>[x.id,x.label]),d.presetId,"Répartition personnalisée")+'<p>Statistiques de base : <strong>'+sum+' / 480</strong> points. Les bonus du peuple restent séparés.</p>'+(sum>480?'<p class="note">Dépassement de '+(sum-480)+' points.</p>':'<p class="note">Solde indicatif : '+(480-sum)+' points.</p>')+
STATS.map(k=>'<div class="wizard-stat"><label for="stat-'+k+'">'+esc(k.toUpperCase())+'</label><input id="stat-'+k+'" data-stat="'+k+'" type="number" min="0" max="100" step="1" value="'+esc(d.baseStats[k])+'"></div>').join("")+'<button id="balance" type="button">Répartition équilibrée (40 partout)</button>';
}else if(key==="token"){
html='<p>La bibliothèque de tokens Foundry n’est pas intégrée à la PWA. Conservez ici une préférence visuelle, sans inventer de fichier.</p>'+field("token","Description du token souhaité",d.tokenDescription);
}else if(key==="chance"){
html='<p>Valeur de Chance du brouillon (aucun jet Foundry).</p>'+field("chance","Chance",d.chance??"","number");
}else if(key==="age"){
html=field("age","Âge (narratif)",d.age??"","number");
}else if(key==="spirits"){
html='<p>Choix narratif provisoire : les incompatibilités du panthéon ne sont pas encore validées ici.</p>'+select("spirit",spirits.map(x=>[x.id,x.label]),d.spiritId,"Aucun esprit")+(spirits.find(x=>x.id===d.spiritId)?'<p class="note">Domaines : '+esc(spirits.find(x=>x.id===d.spiritId).domains.join(", "))+'</p>'+spirits.find(x=>x.id===d.spiritId).blessings.map(b=>'<p>'+esc(b.name)+' ('+esc(b.tier)+') — '+esc(b.effect)+'</p>').join(""):"")+field("spirits","Notes spirituelles",d.spirits);
}else if(key==="traits"){
html='<p>Trois qualités et un défaut, sans effet automatique.</p>'+["Qualité 1","Qualité 2","Qualité 3","Défaut"].map((x,i)=>field("trait-"+i,x,d.traits[i]||"")).join("");
}else if(key==="extra"){
html='<label>Autres options et notes narratives</label><textarea id="extra" rows="5">'+esc(d.extra||"")+'</textarea>';
}else if(key==="name"){
html=field("name","Nom du personnage",record.name);
}else if(key==="summary"){
const values=[p?.label||"Non choisi",d.elementSlots.filter(x=>x?.elementId).map(x=>x.elementId+" N"+x.level).join(", ")||"Aucun",title(d.competenceId)||"—",title(d.heritageId)||"—",GROUPS.find(x=>x[0]===d.primaryVocationalGroupId)?.[1]||"—",sum+" / 480",d.tokenDescription||"—",d.chance??"—",d.age??"—",d.spirits||"—",d.traits.filter(Boolean).join(", ")||"—",d.extra||"—",record.name||"Sans nom"];
html='<p>Récapitulatif de votre personnage. Ce document reste un brouillon indépendant de Foundry.</p>'+STEPS.slice(0,-1).map(([id,l],i)=>'<div class="wizard-summary"><strong>'+esc(l)+'</strong><p>'+esc(values[i])+'</p></div>').join("");
}
host.innerHTML='<button id="wiz-close" class="back">← Retour au personnage</button><p class="eyebrow">Création HINGA · '+(step+1)+' / 14</p><h3>'+esc(label)+'</h3><div class="wizard-progress"><span style="width:'+((step+1)/14*100)+'%"></span></div>'+html+'<div class="char-actions"><button id="prev" '+(step===0?"disabled":"")+'>← Précédent</button><button id="next">'+(step===13?"Terminer le brouillon":"Suivant →")+'</button></div><p class="note">Enregistrement local automatique · Pas de synchronisation Foundry</p>';
host.querySelector("#wiz-close").onclick=()=>onClose();
host.querySelector("#prev").onclick=()=>{step--;d.wizardStep=step;save();render()};
host.querySelector("#next").onclick=()=>{if(step<13){step++;d.wizardStep=step;save();render()}else{d.wizardStep=13;save();onClose()}};
bind("#p",el=>{if(d.peupleId!==el.value){d.peupleId=el.value;d.competenceId="";d.heritageId="";d.elementSlots=[]}});
bind("#gender",el=>d.gender=el.value);
bind('[id^="element-"]',el=>{const i=Number(el.id.split("-")[1]);const id=el.value;if(id&&d.elementSlots.some((x,j)=>j!==i&&x?.elementId===id)){d.elementSlots[i]={elementId:"",level:0};return}d.elementSlots[i]={elementId:id,level:d.elementSlots[i]?.level??0}});
bind('[id^="level-"]',el=>{const i=Number(el.id.split("-")[1]);d.elementSlots[i]??={elementId:"",level:0};d.elementSlots[i].level=Number(el.value)});
bind("#competence",el=>d.competenceId=el.value);
bind("#heritage",el=>d.heritageId=el.value);
bind("#heritage-detail",el=>d.heritageDetail=el.value);
bind("#group",el=>d.primaryVocationalGroupId=el.value);
bind("#preset",el=>{d.presetId=el.value;const preset=presets.find(x=>x.id===el.value);if(preset)d.baseStats={...preset.stats}});
bind("#spirit",el=>d.spiritId=el.value);
bind("[data-stat]",el=>{const n=Number(el.value);if(Number.isInteger(n)&&n>=0&&n<=100)d.baseStats[el.dataset.stat]=n});
bind("#token",el=>d.tokenDescription=el.value);
bind("#chance",el=>d.chance=el.value===""?"":Number(el.value));
bind("#age",el=>d.age=el.value===""?"":Number(el.value));
bind("#spirits",el=>d.spirits=el.value);
const search=host.querySelector("#skill-search");if(search){d.selectedSkillIds??=[];const results=host.querySelector("#skill-results"),selected=host.querySelector("#skill-selected");function draw(){const q=search.value.trim().toLocaleLowerCase("fr");selected.textContent=d.selectedSkillIds.map(id=>skills.find(x=>x.id===id)?.name||id).join(" · ")||"Aucune compétence sélectionnée";results.replaceChildren();if(q.length<2){results.textContent="Saisissez deux caractères.";return}for(const sk of skills.filter(x=>x.name.toLocaleLowerCase("fr").includes(q)).slice(0,20)){const b=document.createElement("button");b.type="button";b.className="tab";b.style.margin="3px";b.textContent=(d.selectedSkillIds.includes(sk.id)?"✓ ":"＋ ")+sk.name+(sk.tier?" · "+sk.tier:"");b.onclick=()=>{if(d.selectedSkillIds.includes(sk.id))d.selectedSkillIds=d.selectedSkillIds.filter(id=>id!==sk.id);else d.selectedSkillIds.push(sk.id);save();draw()};results.append(b)}}search.oninput=draw;draw()}
bind('[id^="trait-"]',el=>d.traits[Number(el.id.split("-")[1])]=el.value);
bind("#extra",el=>d.extra=el.value);
bind("#name",el=>record.name=el.value);
const balance=host.querySelector("#balance");if(balance)balance.onclick=()=>{d.baseStats=Object.fromEntries(STATS.map(k=>[k,40]));save();render()};

}
render();
}
