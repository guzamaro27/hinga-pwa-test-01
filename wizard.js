// HINGA Mobile: assistant de création en 14 étapes, brouillon sans application Foundry.
const STEPS=[["peuple","Peuple et apparence"],["element","Élément"],["competence","Compétence culturelle"],["heritage","Don inné"],["vocationalGroup","Groupe vocationnel"],["stats","Statistiques"],["token","Token"],["chance","Chance"],["age","Âge"],["spirits","Esprits"],["traits","Caractères"],["extra","Autres options"],["name","Nom"],["summary","Résumé final"]];
const STATS=["force","constit","vita","psych","intell","charisme","demag","arcane","perc","dex","react","discr"];
const ELEMENTS=["PLANTE","EAU","FEU","TERRE","METAL","ELECTRICITE","AIR","SON","CORPS","LUMIERE","TENEBRES","TEMPS","ESPACE"];
const title=id=>String(id??"").replace(/-/g," ").replace(/\b\p{L}/gu,x=>x.toUpperCase());
const BONUS_INFO={
"double-heritage":["Double héritage","Les deux compétences culturelles du peuple sont gratuites."],
"point-competence":["Point de compétence","+1 point supplémentaire au budget de compétences."],
"chance-accrue":["Chance accrue","+5 au maximum de Chance."],
"mentalite":["Mentalité","Immunité aux états de tier 1 de la famille choisie ; AV1 contre les tiers 2 à 4."],
"recuperation-amelioree":["Récupération améliorée","+10 % de récupération de la ressource choisie."],
"reserve-naturelle":["Réserve naturelle","+5 % au maximum de la ressource choisie, arrondi au supérieur."],
"transformation-condition":["Transformation & Condition","Héritage narratif, sans automatisation."],
"adaptation-environnementale":["Adaptation environnementale","Compétence N1 gratuite de l’environnement choisi."],
"sens-aiguise":["Sens aiguisé","+5 dans le sens choisi."],
"resistance-elementaire":["Résistance élémentaire","+10 % contre l’élément choisi."],
"resistance-poisons":["Résistance aux poisons","+10 % contre les poisons indiqués."],
"pilier-ancrage":["Pilier d’Ancrage","Pilier d’Ancrage N1 gratuit et choix de statistique d’ancrage."]
};
const BONUS_DETAILS={
"sens-aiguise":[["vis","Vue"],["aud","Ouïe"],["olf","Odorat"],["tac","Toucher"],["gus","Goût"],["eso","Ésotérique"]],
"mentalite":["folie","serimoth","peur","desespoir","panique","influence","brouillage_sensoriel","confusion"].map(x=>[x,title(x)]),
"recuperation-amelioree":[["pv","Points de vie"],["sm","Santé mentale"],["pf","Points de fatigue"]],
"reserve-naturelle":[["pv","Points de vie"],["sm","Santé mentale"],["pf","Points de fatigue"]],
"adaptation-environnementale":[["altitude","Altitude"],["aquatique","Aquatique"],["forets-denses","Forêts denses"],["souterrains","Souterrains"],["terrains-hostiles","Terrains hostiles"],["zones-urbanisees","Zones urbanisées"]],
"resistance-elementaire":ELEMENTS.map(x=>[x,title(x)]),
"resistance-poisons":[["poison_phy","Poison naturel"],["poison_mag","Poison magique"],["poison_phy|poison_mag","Poisons naturel et magique"]]
};
const ENV_SKILLS={"altitude":"environnement-altitude","aquatique":"environnement-aquatique","forets-denses":"environnement-forets-densite-vegetale","souterrains":"environnement-souterrains","terrains-hostiles":"environnement-terrains-hostiles","zones-urbanisees":"environnement-zones-urbanisees"};
const GROUPS=[["combattant-emerite","Combattant Émérite"],["corps-militaire","Corps Militaire"],["garde-protecteur","Garde Protecteur"],["gardien-de-la-nature","Gardien de la Nature"],["mage-sage","Mage Sage"],["negociateur-diplomatique","Négociateur Diplomatique"],["ombre-rebelle","Ombre Rebelle"],["peregrin-mystique","Pérégrin Mystique"],["scientifique-savant","Scientifique Savant"]];
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

let peoples=[],presets=[],skills=[],spirits=[];
export async function loadPeople(){try{const r=await fetch("./data/creation/peuples.json");if(!r.ok)throw Error("Catalogue indisponible");const data=await r.json();if(![1,2].includes(data.schemaVersion)||!Array.isArray(data.peoples))throw Error("Catalogue invalide");peoples=data.peoples.sort((a,b)=>a.label.localeCompare(b.label,"fr"));}catch{peoples=[]}try{const [a,b,m]=await Promise.all([fetch("./data/creation/presets.json"),fetch("./data/creation/skills-index.json"),fetch("./data/wiki/manifest.json")]);if(a.ok)presets=(await a.json()).presets||[];if(b.ok)skills=(await b.json()).skills||[];if(m.ok){const paths=(await m.json()).filter(x=>x.section==="pantheon"&&!x.path.includes("guide-"));const data=await Promise.allSettled(paths.map(async x=>{const r=await fetch("./"+x.path);return r.ok?r.json():null}));spirits=data.filter(x=>x.status==="fulfilled"&&x.value?.type==="pantheon-spirit").map(x=>({id:x.value.id,label:x.value.identity?.name,domains:x.value.pantheon?.domains||[],blessings:Object.values(x.value.pantheon?.blessings||{}).map(b=>({name:b.name,effect:b.shortEffect,tier:b.tier}))})).filter(x=>x.id&&x.label).sort((a,b)=>a.label.localeCompare(b.label,"fr"))}}catch(e){console.warn("Catalogues indisponibles",e)}return peoples}
export function renderWizard(host,record,onChange,onClose){
record.creation??={};const d=record.creation;let step=Number.isInteger(d.wizardStep)?Math.max(0,Math.min(13,d.wizardStep)):0;d.baseStats??=Object.fromEntries(STATS.map(k=>[k,40]));d.elementSlots??=[];d.elementSlots=d.elementSlots.map(x=>x?{elementId:x.elementId||x.id||"",level:Number(x.level)||0}:x);d.traits??=["","","",""];
const save=()=>onChange(record);const people=()=>peoples.find(p=>p.id===d.peupleId);
const racialStats=()=>{const p=people(),out={};for(const entry of [p?.stats?.primary,p?.stats?.secondary,p?.stats?.penalty])if(entry?.id&&STATS.includes(entry.id))out[entry.id]=(out[entry.id]||0)+Number(entry.value||0);return out};
const racialResources=()=>{const out={};for(const entry of [people()?.stats?.primary,people()?.stats?.secondary,people()?.stats?.penalty])if(["pv","sm","pf"].includes(entry?.id))out[entry.id]=(out[entry.id]||0)+Number(entry.value||0);return out};
const finalStats=()=>{const bonus=racialStats();return Object.fromEntries(STATS.map(k=>[k,Number(d.baseStats[k]||0)+(bonus[k]||0)]))};
const statsErrors=()=>{const errors=[],total=STATS.reduce((n,k)=>n+Number(d.baseStats[k]||0),0);if(total!==480)errors.push("La répartition doit totaliser exactement 480 points.");for(const k of STATS){const v=Number(d.baseStats[k]);if(!Number.isInteger(v)||v<0||v>100)errors.push(k.toUpperCase()+" : valeur de base invalide (0–100).")}return errors};
const creationErrors=()=>{const errors=statsErrors(),p=people();if(!p)errors.push("Peuple non sélectionné.");if(p&&!p.competenceIds.includes(d.competenceId))errors.push("Compétence culturelle non sélectionnée.");const boon=p?.bonuses.find(x=>x.id===d.heritageId);if(!boon)errors.push("Don inné non sélectionné.");else if(BONUS_DETAILS[boon.id]?.length&&!boon.detail&&!d.heritageDetail)errors.push("Précision du don inné manquante.");if(!d.primaryVocationalGroupId||!GROUPS.some(x=>x[0]===d.primaryVocationalGroupId))errors.push("Groupe vocationnel principal manquant.");if(!String(record.name||"").trim())errors.push("Nom du personnage manquant.");if(d.chance!==""&&d.chance!=null){const chance=Number(d.chance),maximum=100+(d.heritageId==="chance-accrue"?5:0);if(!Number.isInteger(chance)||chance<0||chance>maximum)errors.push("Chance hors limites (0–"+maximum+").");}const free=new Set(d.heritageId==="double-heritage"?(p?.competenceIds||[]):[d.competenceId]);if(d.heritageId==="adaptation-environnementale")free.add(ENV_SKILLS[boon?.detail||d.heritageDetail]);const points=(d.selectedSkillIds||[]).reduce((n,id)=>n+(free.has(id)?0:({D:1,C:2,B:3,A:4,S:5}[skills.find(x=>x.id===id)?.tier]||0)),0)+(d.additionalVocationalGroupIds||[]).reduce((n,_,i)=>n+(i===0?2:(i+2)*2),0);if(points>12+(d.heritageId==="point-competence"?1:0))errors.push("Budget de compétences dépassé.");if(new Set([d.primaryVocationalGroupId,...(d.additionalVocationalGroupIds||[])].filter(Boolean)).size!==[d.primaryVocationalGroupId,...(d.additionalVocationalGroupIds||[])].filter(Boolean).length)errors.push("GV en double.");const owned=[d.primaryVocationalGroupId,...(d.additionalVocationalGroupIds||[])].filter(Boolean);if(new Set(owned).size!==owned.length)errors.push("Groupe vocationnel sélectionné plusieurs fois.");const selected=d.selectedSkillIds||[];if(new Set(selected).size!==selected.length)errors.push("Compétence sélectionnée plusieurs fois.");for(const id of selected){if(free.has(id))continue;const sk=skills.find(x=>x.id===id);if(!sk||!({D:1,C:2,B:3,A:4,S:5}[sk.tier])||sk.status==="deferred")errors.push("Compétence indisponible : "+id);else if(!sk.gv?.some(g=>g==="Générales"||g==="Generales"||owned.some(oid=>GROUPS.some(([key,label])=>key===oid&&(g===key||g===label)))))errors.push("GV non débloqué : "+sk.name);}return errors};

const select=(id,opts,value,placeholder="Choisir")=>'<select id="'+id+'"><option value="">'+esc(placeholder)+'</option>'+opts.map(([v,l])=>'<option value="'+esc(v)+'" '+(String(value??"")===String(v)?"selected":"")+'>'+esc(l)+'</option>').join("")+'</select>';
const field=(id,label,value="",type="text")=>'<label for="'+id+'">'+esc(label)+'</label><input id="'+id+'" type="'+type+'" value="'+esc(value)+'">';
const bind=(selector,fn)=>host.querySelectorAll(selector).forEach(el=>el.addEventListener("change",()=>{fn(el);save();render()}));
function render(){
const [key,label]=STEPS[step],p=people(),sum=STATS.reduce((n,k)=>n+(Number(d.baseStats[k])||0),0);let html="";
if(key==="peuple"){
html='<p>Choisissez votre peuple. Ses affinités, compétences et dons dépendent de ce choix.</p><label>Peuple</label>'+select("p",peoples.map(x=>[x.id,x.label]),d.peupleId,"Choisir un peuple")+
'<label>Apparence</label>'+select("gender",[["M","Homme"],["F","Femme"],["autre","Autre / libre"]],d.gender,"Choisir")+
(p?'<p class="note">Affinité : '+esc(p.affinity)+' · Bonus : '+esc(p.stats.primary.id)+' '+p.stats.primary.value+', '+esc(p.stats.secondary.id)+' +'+p.stats.secondary.value+' · Malus : '+esc(p.stats.penalty.id)+' '+p.stats.penalty.value+' · Sens : '+esc([p.senses?.bonus,p.senses?.penalty].filter(Boolean).map(x=>x.id+' '+(x.value>0?'+':'')+x.value).join(', ')||'aucun')+'</p>':'<p class="note">Sélectionnez un peuple pour débloquer ses choix culturels.</p>');
}else if(key==="element"){
html='<p>Jusqu’à trois éléments distincts. Maîtrise N0 (Néophyte) à N4 (Sage). L’affinité du peuple est indiquée à titre informatif.</p>'+(p?'<p>Affinité du peuple : <strong>'+esc(p.affinity)+'</strong></p>':'<p class="note">Peuple non sélectionné.</p>')+
Array.from({length:3},(_,i)=>'<div class="wizard-pair"><label>Élément '+(i+1)+select("element-"+i,ELEMENTS.map(x=>[x,title(x)]),d.elementSlots[i]?.elementId,"Aucun")+'</label><label>Maîtrise'+select("level-"+i,[0,1,2,3,4].map(n=>[n,"N"+n]),d.elementSlots[i]?.level??0,"Niveau")+'</label></div>').join("");
}else if(key==="competence"){
html=p?'<p>Choisissez une compétence culturelle gratuite parmi les deux proposées par votre peuple.</p>'+select("competence",p.competenceIds.map(x=>[x,skills.find(y=>y.id===x)?.name||title(x)]),d.competenceId)+(d.heritageId==="double-heritage"?'<p class="note">Double héritage : les deux compétences culturelles sont gratuites.</p>':''):'<p class="note">Choisissez d’abord un peuple.</p>';
}else if(key==="heritage"){
const bonus=p?.bonuses.find(x=>x.id===d.heritageId);
const info=BONUS_INFO[bonus?.id]||[title(bonus?.id),"Bonus racial descriptif"];
const options=bonus?(BONUS_DETAILS[bonus.id]||[]):[];
html=p?'<p>Choisissez un don inné de votre peuple. Les bonus sont récapitulés sans déclencher d’effet Foundry.</p>'+select("heritage",p.bonuses.map(x=>[x.id,(BONUS_INFO[x.id]?.[0]||title(x.id))+(x.detail?" — "+title(x.detail):"")]),d.heritageId)+(bonus?'<p class="note"><strong>'+esc(info[0])+'</strong> — '+esc(info[1])+'</p>':'')+(bonus&&options.length?'<label>Précision du don</label>'+select("heritage-detail",options,bonus.detail||d.heritageDetail,"Choisir"):''):'<p class="note">Choisissez d’abord un peuple.</p>';
}else if(key==="vocationalGroup"){
const owned=[d.primaryVocationalGroupId,...(d.additionalVocationalGroupIds||[])].filter(Boolean);
const nextCost=owned.length===0?0:(owned.length===1?2:(owned.length+1)*2);
html='<p>Choisissez vos groupes vocationnels, puis achetez des compétences N1. Aucun effet automatique n’est appliqué.</p><p class="note">Générales : toujours accessibles. Premier GV gratuit ; deuxième 2 points ; troisième 6 points ; quatrième 8 points.</p>'+
'<label>Groupe principal (gratuit)</label>'+select("group",GROUPS,d.primaryVocationalGroupId)+
'<div id="additional-groups"></div><p id="skill-budget"></p><label>Catalogue des compétences</label><input id="skill-search" placeholder="Rechercher une compétence (nom ou GV)"><div id="skill-results"></div><h4>Compétences choisies</h4><div id="skill-selected"></div>';
}else if(key==="stats"){
const racial=racialStats(),final=finalStats(),errors=statsErrors();
html='<label>Archétype de statistiques</label>'+select("preset",presets.map(x=>[x.id,x.label]),d.presetId,"Répartition personnalisée")+'<p>Base : <strong>'+sum+' / 480</strong> points · Bonus raciaux appliqués séparément.</p>'+(errors.length?'<p class="note">'+esc(errors.join(" · "))+'</p>':'<p class="note">Répartition de base valide.</p>')+
STATS.map(k=>'<div class="wizard-stat"><label for="stat-'+k+'">'+esc(k.toUpperCase())+'</label><input id="stat-'+k+'" data-stat="'+k+'" type="number" min="0" max="100" step="1" value="'+esc(d.baseStats[k])+'"><span>Racial '+(racial[k]>=0?"+":"")+(racial[k]||0)+' → <strong>'+final[k]+'</strong></span></div>').join("")+'<p class="note">Modificateurs raciaux des ressources (hors 12 statistiques) : '+esc(Object.entries(racialResources()).map(([k,v])=>k.toUpperCase()+' '+(v>=0?'+':'')+v).join(' · ')||'Aucun')+'</p><p class="note">Formules Foundry : PV = ⌊(PHY + VITA)/2⌋ ; SM = ⌊(MENT + PSYCH)/2⌋ ; PF = VITA + PHY. Les primaires PHY et MENT ne sont pas encore saisies dans ce formulaire : aucun maximum fictif n’est calculé.</p><button id="balance" type="button">Répartition équilibrée (40 partout)</button>';
}else if(key==="token"){
html='<p>La bibliothèque de tokens Foundry n’est pas intégrée à la PWA. Conservez ici une préférence visuelle, sans inventer de fichier.</p>'+field("token","Description du token souhaité",d.tokenDescription);
}else if(key==="chance"){
const bonus=d.heritageId==="chance-accrue"?5:0;html='<p>Chance : plafond Foundry par défaut 100, augmenté de +5 par le don Chance accrue. Valeur actuelle du brouillon, sans jet automatique.</p><p class="note">Maximum indicatif : <strong>'+(100+bonus)+'</strong></p>'+field("chance","Chance actuelle",d.chance??"","number");
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
const values=[p?.label||"Non choisi",d.elementSlots.filter(x=>x?.elementId).map(x=>x.elementId+" N"+x.level).join(", ")||"Aucun",title(d.competenceId)||"—",(BONUS_INFO[d.heritageId]?.[0]||title(d.heritageId)||"—")+(d.heritageDetail?" — "+title(d.heritageDetail):""),[d.primaryVocationalGroupId,...(d.additionalVocationalGroupIds||[])].map(id=>GROUPS.find(x=>x[0]===id)?.[1]).filter(Boolean).join(", ")+" · "+(d.selectedSkillIds||[]).length+" compétences choisies",sum+" / 480",d.tokenDescription||"—",d.chance??"—",d.age??"—",(d.spiritId?spirits.find(x=>x.id===d.spiritId)?.label||d.spiritId:"Aucun")+(d.spirits?" · "+d.spirits:""),d.traits.filter(Boolean).join(", ")||"—",d.extra||"—",record.name||"Sans nom"];
html='<p>Récapitulatif du brouillon indépendant de Foundry.</p>'+(creationErrors().length?'<p class="note"><strong>À corriger :</strong> '+esc(creationErrors().join(" · "))+'</p>':'<p class="note">Contrôles de base satisfaits ; règles particulières non garanties.</p>')+'<p>Statistiques finales : '+esc(STATS.map(k=>k.toUpperCase()+" "+finalStats()[k]).join(" · "))+'</p>'+STEPS.slice(0,-1).map(([id,l],i)=>'<div class="wizard-summary"><strong>'+esc(l)+'</strong><p>'+esc(values[i])+'</p></div>').join("");
}
host.innerHTML='<button id="wiz-close" class="back">← Retour au personnage</button><p class="eyebrow">Création HINGA · '+(step+1)+' / 14</p><h3>'+esc(label)+'</h3><div class="wizard-progress"><span style="width:'+((step+1)/14*100)+'%"></span></div>'+html+'<div class="char-actions"><button id="prev" '+(step===0?"disabled":"")+'>← Précédent</button><button id="next">'+(step===13?"Terminer le brouillon":"Suivant →")+'</button></div><p class="note">Enregistrement local automatique · Pas de synchronisation Foundry</p>';
host.querySelector("#wiz-close").onclick=()=>onClose();
host.querySelector("#prev").onclick=()=>{step--;d.wizardStep=step;save();render()};
host.querySelector("#next").onclick=()=>{if(step<13){step++;d.wizardStep=step;save();render()}else{const errors=creationErrors();if(errors.length){alert("Création incomplète : "+errors.join(" · "));return}d.wizardStep=13;save();onClose()}};
bind("#p",el=>{if(d.peupleId!==el.value){d.peupleId=el.value;d.competenceId="";d.heritageId="";d.heritageDetail="";d.elementSlots=[]}});
bind("#gender",el=>d.gender=el.value);
bind('[id^="element-"]',el=>{const i=Number(el.id.split("-")[1]);const id=el.value;if(id&&d.elementSlots.some((x,j)=>j!==i&&x?.elementId===id)){d.elementSlots[i]={elementId:"",level:0};return}d.elementSlots[i]={elementId:id,level:d.elementSlots[i]?.level??0}});
bind('[id^="level-"]',el=>{const i=Number(el.id.split("-")[1]);d.elementSlots[i]??={elementId:"",level:0};d.elementSlots[i].level=Number(el.value)});
bind("#competence",el=>d.competenceId=el.value);
bind("#heritage",el=>{d.heritageId=el.value;d.heritageDetail=""});
bind("#heritage-detail",el=>d.heritageDetail=el.value);
bind("#group",el=>{d.primaryVocationalGroupId=el.value;d.additionalVocationalGroupIds=(d.additionalVocationalGroupIds||[]).filter(id=>id!==el.value)});
bind("#preset",el=>{d.presetId=el.value;const preset=presets.find(x=>x.id===el.value);if(preset)d.baseStats={...preset.stats}});
bind("#spirit",el=>d.spiritId=el.value);
bind("[data-stat]",el=>{const n=Number(el.value);if(Number.isInteger(n)&&n>=0&&n<=100)d.baseStats[el.dataset.stat]=n});
bind("#token",el=>d.tokenDescription=el.value);
bind("#chance",el=>d.chance=el.value===""?"":Number(el.value));
bind("#age",el=>d.age=el.value===""?"":Number(el.value));
bind("#spirits",el=>d.spirits=el.value);
const search=host.querySelector("#skill-search");
if(search){
d.selectedSkillIds??=[];d.additionalVocationalGroupIds??=[];
const cost={D:1,C:2,B:3,A:4,S:5};const budgetMax=()=>12+(d.heritageId==="point-competence"?1:0);
const normalize=g=>GROUPS.find(([id,label])=>g===id||g===label)?.[0]||(g==="Générales"||g==="Generales"?"generales":null);
const owned=()=>[d.primaryVocationalGroupId,...d.additionalVocationalGroupIds].filter(Boolean);
const groupCost=()=>d.additionalVocationalGroupIds.reduce((n,_,i)=>n+(i===0?2:(i+2)*2),0);
const skillCost=id=>cost[skills.find(x=>x.id===id)?.tier]||0;
const skillSpent=()=>d.selectedSkillIds.reduce((n,id)=>n+(freeSkillIds().includes(id)?0:skillCost(id)),0);
const eligible=sk=>Array.isArray(sk.gv)&&sk.gv.some(g=>normalize(g)==="generales"||owned().includes(normalize(g)));
const freeSkillIds=()=>{const p=people();if(!p)return [];const ids=d.heritageId==="double-heritage"?p.competenceIds:[d.competenceId];if(d.heritageId==="adaptation-environnementale"){const detail=p.bonuses.find(x=>x.id===d.heritageId)?.detail||d.heritageDetail;ids.push(ENV_SKILLS[detail])}return ids.filter(Boolean)};const valid=sk=>sk&&cost[sk.tier]&&sk.status!=="deferred"&&eligible(sk);
const selected=host.querySelector("#skill-selected"),results=host.querySelector("#skill-results"),groups=host.querySelector("#additional-groups"),budget=host.querySelector("#skill-budget");
function draw(){
const spent=skillSpent()+groupCost(),remaining=budgetMax()-spent;
const invalid=d.selectedSkillIds.filter(id=>!freeSkillIds().includes(id)&&!valid(skills.find(x=>x.id===id)));
budget.textContent=""+budgetMax()+" points initiaux · GV : "+groupCost()+" · Compétences : "+skillSpent()+" · Restants : "+remaining+(invalid.length?" · "+invalid.length+" choix à corriger":"")+(remaining<0?" · Budget dépassé":"");
budget.textContent+=" · Compétences culturelles gratuites : "+(freeSkillIds().map(id=>skills.find(x=>x.id===id)?.name||title(id)).join(", ")||"à choisir");groups.replaceChildren();
for(const id of d.additionalVocationalGroupIds){const line=document.createElement("div");line.className="wizard-pair";const label=document.createElement("span");label.textContent=GROUPS.find(x=>x[0]===id)?.[1]||id;const remove=document.createElement("button");remove.type="button";remove.textContent="Retirer";remove.onclick=()=>{d.additionalVocationalGroupIds=d.additionalVocationalGroupIds.filter(x=>x!==id);save();draw()};line.append(label,remove);groups.append(line)}
const options=GROUPS.filter(x=>!owned().includes(x[0]));if(options.length&&d.primaryVocationalGroupId){const sel=document.createElement("select");sel.innerHTML='<option value="">Ajouter un GV (coût '+(owned().length===1?2:(owned().length+1)*2)+' points)</option>'+options.map(([id,label])=>'<option value="'+esc(id)+'">'+esc(label)+'</option>').join("");sel.onchange=()=>{const c=owned().length===1?2:(owned().length+1)*2;if(!sel.value)return;if(spent+c>budgetMax()){alert("Points insuffisants pour ce groupe.");sel.value="";return}d.additionalVocationalGroupIds.push(sel.value);save();draw()};groups.append(sel)}
selected.replaceChildren();if(!d.selectedSkillIds.length)selected.textContent="Aucune compétence achetée.";
for(const id of d.selectedSkillIds){const sk=skills.find(x=>x.id===id);const line=document.createElement("div");line.className="wizard-pair";const name=document.createElement("span");name.textContent=(sk?.name||id)+" · N1 · "+(skillCost(id)||"?")+" pt"+(skillCost(id)>1?"s":"")+(valid(sk)?"":" · À CORRIGER");const remove=document.createElement("button");remove.type="button";remove.textContent="Retirer";remove.onclick=()=>{d.selectedSkillIds=d.selectedSkillIds.filter(x=>x!==id);save();draw()};line.append(name,remove);selected.append(line)}
results.replaceChildren();const q=search.value.trim().toLocaleLowerCase("fr");const visible=skills.filter(sk=>(!q||sk.name.toLocaleLowerCase("fr").includes(q)||sk.gv?.some(g=>g.toLocaleLowerCase("fr").includes(q)))&&(q.length>=2||eligible(sk))).slice(0,45);
for(const sk of visible){const b=document.createElement("button");b.type="button";b.className="tab";b.style.margin="3px";const already=d.selectedSkillIds.includes(sk.id);b.textContent=(already?"✓ ":"＋ ")+sk.name+" · "+(sk.tier||"?")+" ("+sk.gv.join(", ")+")"+(sk.status==="deferred"?" · Différée":"");b.onclick=()=>{if(already){d.selectedSkillIds=d.selectedSkillIds.filter(x=>x!==sk.id)}else{if(!valid(sk)&&!freeSkillIds().includes(sk.id)){alert("Compétence indisponible, sans rang, ou GV non débloqué.");return}if(invalid.length||remaining<(freeSkillIds().includes(sk.id)?0:skillCost(sk.id))){alert("Budget insuffisant ou anciens choix à corriger.");return}d.selectedSkillIds.push(sk.id)}save();draw()};results.append(b)}
if(!visible.length)results.textContent="Aucune compétence correspondante.";
}
search.oninput=draw;draw();
}
bind('[id^="trait-"]',el=>d.traits[Number(el.id.split("-")[1])]=el.value);
bind("#extra",el=>d.extra=el.value);
bind("#name",el=>record.name=el.value);
const balance=host.querySelector("#balance");if(balance)balance.onclick=()=>{d.baseStats=Object.fromEntries(STATS.map(k=>[k,40]));save();render()};

}
render();
}
