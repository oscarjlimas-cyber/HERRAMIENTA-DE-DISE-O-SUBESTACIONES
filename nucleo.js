"use strict";
/* =====================================================================
   SUBE · núcleo de la interfaz: utilidades, estado, formularios,
   tablas editables, memoria de cálculo, pestañas y archivos de proyecto.
   Los módulos (modulos.js) agregan sus formularios y sus funciones de dibujo.
   ===================================================================== */
const $=id=>document.getElementById(id);
const NF={};const fm=(x,d=2)=>{if(x==null||!Number.isFinite(+x))return"—";(NF[d]=NF[d]||new Intl.NumberFormat("es-CO",{minimumFractionDigits:d,maximumFractionDigits:d,useGrouping:false}));return NF[d].format(x)};
const fmU=u=>fm(u,u%1?1:0);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
/* notación de la memoria */
const I=s=>`<i>${s}</i>`,Sb=(a,b)=>`${a}<sub>${b}</sub>`,F=(a,b)=>`<span class="fr"><span>${a}</span><span>${b}</span></span>`,Q=x=>`√<span class="sq">${x}</span>`;
const R=t=>`<span class="r">${t}</span>`,AD=t=>`<span class="ad">${t}</span>`,BD=t=>`<span class="bd">${t}</span>`,MU=t=>` <span class="mu">${t}</span>`;
const pill=(c,t)=>`<span class="pill ${c}">${t}</span>`;
const okp=(b,t1="Cumple",t0="No cumple")=>pill(b?"ok":"no",b?t1:t0);
let toastT;function toast(t){const e=$("toast");e.textContent=t;e.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>e.hidden=true,2800)}
function verdict(cls,title,text){const ic={ok:"✔",wa:"!",no:"✘"}[cls];return `<div class="verdict ${cls}"><span class="ic" aria-hidden="true">${ic}</span><div><b>${title}</b>${text?`<p>${text}</p>`:""}</div></div>`}
const kpi=(lab,val,unit,sub,cls="")=>`<div class="kpi ${cls}"><span>${lab}</span><b>${val}${unit?`<small>${unit}</small>`:""}</b>${sub?`<em>${sub}</em>`:""}</div>`;
function setSt(id,c){const e=$(id);if(e)e.className="st "+c}
const groupBy=(arr,key,map)=>{const g=new Map();arr.forEach(x=>{const k=key(x);if(!g.has(k))g.set(k,[]);g.get(k).push(map(x))});return [...g].map(([k,o])=>({g:k,o}))};

const {DEF,CAT,CFG,BIL_IEC,POL,AISL,MAT,CONN,MEJ,SIZES}=SUBE;
let S=SUBE.load();
function save(){SUBE.save(S)}

/* ============================================================
   Formularios: se generan desde listas de campos
   ============================================================ */
const num=(mod,k,label,unit,opt={})=>({mod,k,label,unit,type:"num",...opt});
const sel=(mod,k,label,options,opt={})=>({mod,k,label,options,type:"sel",...opt});
const chk=(mod,k,label,opt={})=>({mod,k,label,type:"chk",...opt});
const txt=(mod,k,label,opt={})=>({mod,k,label,type:"txt",...opt});
const FORMS={};
const NUMSEL=new Set();       /* claves de listas desplegables cuyo valor es numérico */
function fieldHTML(f){
  if(f.show&&!f.show())return "";
  if(typeof f.label==="function")f={...f,label:f.label()};
  const id=`in-${f.mod}-${f.k}-${Math.random().toString(36).slice(2,6)}`,v=S[f.mod][f.k],cls=`fld${f.wide?" wide":""}`,dk=`data-mod="${f.mod}" data-k="${f.k}"`,dis=f.lock&&f.lock()?" disabled":"";
  const hint=f.hint?`<span class="hint">${typeof f.hint==="function"?f.hint():f.hint}</span>`:"";
  if(f.type==="chk")return `<label class="chk ${f.wide?"fld wide":""}" for="${id}"><input type="checkbox" id="${id}" ${dk} ${v?"checked":""}> ${f.label}</label>`;
  if(f.type==="sel"){if(f.num)NUMSEL.add(f.k);const op=([ov,ol])=>`<option value="${ov}" ${String(v)===String(ov)?"selected":""}>${esc(ol)}</option>`,opts=typeof f.options==="function"?f.options():f.options;
    return `<label class="${cls}" for="${id}"><span>${f.label}</span><select id="${id}" ${dk}${dis}>${opts.map(o=>Array.isArray(o)?op(o):`<optgroup label="${esc(o.g)}">${o.o.map(op).join("")}</optgroup>`).join("")}</select>${hint}</label>`}
  if(f.type==="txt")return `<label class="${cls}" for="${id}"><span>${f.label}</span><span class="u"><input id="${id}" type="text" value="${esc(v)}" ${dk}></span>${hint}</label>`;
  return `<label class="${cls}" for="${id}"><span>${f.label}</span><span class="u"><input id="${id}" type="number" inputmode="decimal" step="${f.step||"any"}" value="${esc(v)}" ${dk}${dis}>${f.unit?`<em>${f.unit}</em>`:""}</span>${hint}</label>`;
}
let HOOK={normalize:()=>{},render:()=>{}};
function buildForms(){HOOK.normalize();for(const [box,fs] of Object.entries(FORMS)){const e=$(box);if(e)e.innerHTML=fs.map(fieldHTML).join("")}buildET()}
/* refresca en pantalla los campos bloqueados (vinculados a otro módulo) */
function syncLocked(){for(const fs of Object.values(FORMS))fs.forEach(f=>{if(!f.lock)return;const on=!!f.lock();
  document.querySelectorAll(`[data-mod="${f.mod}"][data-k="${f.k}"]`).forEach(e=>{e.disabled=on;if(on&&document.activeElement!==e)e.value=S[f.mod][f.k]})})}
document.addEventListener("input",e=>{const t=e.target;if(!t.dataset||!t.dataset.mod)return;const m=t.dataset.mod,k=t.dataset.k;
  let v=t.type==="checkbox"?t.checked:t.value;if(t.type==="number"||NUMSEL.has(k))v=parseFloat(v);
  if(t.type==="number"&&!Number.isFinite(v))return;
  S[m][k]=v;document.querySelectorAll(`[data-mod="${m}"][data-k="${k}"]`).forEach(o=>{if(o!==t){if(o.type==="checkbox")o.checked=v;else o.value=v}});
  HOOK.change&&HOOK.change(m,k);save();
  if(t.tagName==="SELECT"||t.type==="checkbox"){buildForms();renderAll();HOOK.auto&&HOOK.auto(m,k)}else renderAll()});
/* al terminar de escribir un número (Enter o salir del campo) se revisan las selecciones de catálogo */
document.addEventListener("change",e=>{const t=e.target;if(!t.dataset||!t.dataset.mod||t.tagName==="SELECT"||t.type==="checkbox")return;HOOK.auto&&HOOK.auto(t.dataset.mod,t.dataset.k)});

/* ============================================================
   Tablas editables (listas de equipos, conductores, elementos)
   ============================================================ */
const ET={};
function etHTML(id){const d=ET[id];if(!d)return"";const rows=d.get();
  const th=`<tr>${d.cols.map(c=>`<th class="${c.type==="txt"||c.type==="sel"?"l":""}">${c.t}</th>`).join("")}${d.res.map(r=>`<th>${r}</th>`).join("")}<th></th></tr>`;
  const cell=(c,r,i)=>{const v=r[c.k],dk=`data-et="${id}" data-i="${i}" data-k="${c.k}"`;
    if(c.show&&!c.show(r))return `<td class="mut" style="text-align:center">—</td>`;
    if(c.type==="txt")return `<td><input type="text" value="${esc(v)}" ${dk}${c.list?` list="${id}-dl-${c.k}"`:""} style="min-width:${c.w||150}px" aria-label="${esc(c.t)}"></td>`;
    if(c.type==="chk")return `<td style="text-align:center"><input type="checkbox" ${v?"checked":""} ${dk} aria-label="${esc(c.t)}"></td>`;
    if(c.type==="sel"){const opts=typeof c.options==="function"?c.options():c.options;return `<td><select ${dk} style="min-width:${c.w||110}px" aria-label="${esc(c.t)}">${opts.map(([ov,ol])=>`<option value="${ov}" ${String(v)===String(ov)?"selected":""}>${esc(ol)}</option>`).join("")}</select></td>`}
    return `<td><input type="number" step="${c.step||"any"}" inputmode="decimal" value="${esc(v)}" ${dk} style="width:${c.w||78}px" aria-label="${esc(c.t)}"></td>`};
  const body=rows.map((r,i)=>`<tr>${d.cols.map(c=>cell(c,r,i)).join("")}${d.res.map((_,j)=>`<td class="res" id="${id}-${i}-${j}"></td>`).join("")}<td><button class="del" type="button" data-etdel="${id}" data-i="${i}" title="Quitar esta fila" aria-label="Quitar fila ${i+1}">×</button></td></tr>`).join("");
  const dls=d.cols.filter(c=>c.list).map(c=>`<datalist id="${id}-dl-${c.k}">${c.list().map(x=>`<option value="${esc(x)}"></option>`).join("")}</datalist>`).join("");
  const addSel=d.addOpts?`<select id="${id}-addsel" aria-label="Equipo que se agrega">${d.addOpts().map(o=>Array.isArray(o)?`<option value="${esc(o[0])}">${esc(o[1])}</option>`:`<optgroup label="${esc(o.g)}">${o.o.map(z=>`<option value="${esc(z[0])}">${esc(z[1])}</option>`).join("")}</optgroup>`).join("")}</select>`:"";
  return `${dls}<table class="et">${th}${body}</table><div class="etbar">${addSel}<button class="btn" type="button" data-etadd="${id}">+ Agregar ${d.addOpts?"":"fila"}</button>${d.reset?`<button class="btn" type="button" data-etreset="${id}">Volver a las filas del caso base</button>`:""}</div>`}
function buildET(){for(const id of Object.keys(ET)){const box=$(ET[id].box);if(box)box.innerHTML=etHTML(id)}}
function etRes(id,i,vals){vals.forEach((h,j)=>{const e=$(`${id}-${i}-${j}`);if(e)e.innerHTML=h})}
document.addEventListener("input",e=>{const t=e.target;if(!t.dataset||!t.dataset.et)return;const d=ET[t.dataset.et],i=+t.dataset.i,k=t.dataset.k,c=d.cols.find(x=>x.k===k);
  let v=t.type==="checkbox"?t.checked:t.value;if(t.type==="number"||(c&&c.num)){v=parseFloat(v);if(!Number.isFinite(v))return}
  d.get()[i][k]=v;save();if(t.tagName==="SELECT"||t.type==="checkbox"||(c&&c.rebuild))buildET();renderAll()});
document.addEventListener("change",e=>{const t=e.target;if(t.dataset&&t.dataset.et&&t.type==="text"){const c=ET[t.dataset.et].cols.find(x=>x.k===t.dataset.k);if(c&&c.relabel){buildET();renderAll()}}});
document.addEventListener("click",e=>{const a=e.target.closest("[data-etadd],[data-etdel],[data-etreset]");if(!a)return;
  if(a.dataset.etadd){const d=ET[a.dataset.etadd],sl=$(a.dataset.etadd+"-addsel");d.get().push(d.add(sl?sl.value:undefined));}
  else if(a.dataset.etdel){const d=ET[a.dataset.etdel];d.get().splice(+a.dataset.i,1);if(d.onDel)d.onDel(+a.dataset.i)}
  else{const d=ET[a.dataset.etreset];d.reset();toast("Filas del caso base restablecidas.")}
  save();buildET();renderAll()});

/* ============================================================
   Memoria de cálculo
   ============================================================ */
const MEMO={};
function memo(id,st){let h="",sec="";st.forEach((s,i)=>{if(s.sec!==sec){sec=s.sec;h+=`<p class="memosec">${sec}</p>`}
  h+=`<div class="step"><div class="n">${i+1}</div><div><h4>${s.t}</h4><p class="q">${s.q}</p>${s.eqs.map(e=>`<div class="eq">${e}</div>`).join("")}${s.norma?`<div class="norma">${s.norma}</div>`:""}</div></div>`});
  $(id).innerHTML=h;MEMO[id]=st}
const memoList=()=>{const st=[];return{st,add:(sec,t,q,eqs,norma)=>st.push({sec,t,q,eqs,norma})}};
function htmlToText(h){const d=document.createElement("div");d.innerHTML=h.replace(/<span class="fr"><span>(.*?)<\/span><span>(.*?)<\/span><\/span>/g,"($1)/($2)").replace(/<sup>(.*?)<\/sup>/g,"^($1)").replace(/<span class="(ad|bd)">(.*?)<\/span>/g,"  → $2");return d.textContent.replace(/\s+/g," ").trim()}
function copyText(t){const done=()=>toast("Copiado. Péguelo en Word o Excel.");
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(done,()=>fallback());else fallback();
  function fallback(){const ta=document.createElement("textarea");ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");done()}catch(e){toast("No se pudo copiar: seleccione el texto a mano.")}ta.remove()}}
document.addEventListener("click",e=>{const b=e.target.closest(".copyMemo");if(!b)return;const st=MEMO[b.dataset.memo]||[];
  copyText(st.map((s,i)=>`${i+1}. ${s.t}\n${htmlToText(s.q)}\n`+s.eqs.map(x=>"   "+htmlToText(x)).join("\n")+(s.norma?`\n   Norma: ${s.norma}`:"")).join("\n\n"))});

/* ============================================================
   Pestañas, archivos de proyecto e impresión
   ============================================================ */
const TABS=["resumen","aislamiento","aisladores","distancias","conductores","equipos","malla","apantallamiento","configuraciones","normas"];
function showTab(t,push){if(!TABS.includes(t))t="resumen";
  document.querySelectorAll(".tab").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.tab===t)));
  TABS.forEach(x=>$("p-"+x).hidden=x!==t);
  if(push&&location.hash!=="#"+t){try{history.replaceState(null,"","#"+t)}catch(e){location.hash=t}}
  window.scrollTo({top:0})}
function setState(ns,msg){S=ns;save();buildForms();renderAll();if(msg)toast(msg)}
function renderAll(){HOOK.normalize();HOOK.render();syncLocked()}
function initNucleo(){
  document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.tab,true)));
  $("flow").addEventListener("click",e=>{const b=e.target.closest("[data-go]");if(b)showTab(b.dataset.go,true)});
  window.addEventListener("hashchange",()=>showTab(location.hash.slice(1)));
  $("btnResetAll").addEventListener("click",()=>setState(clone(DEF),"Caso base S/E Termales 115 kV cargado."));
  $("btnNew").addEventListener("click",()=>{const n=clone(DEF);Object.assign(n.proy,{nombre:"Nueva subestación",lugar:"Sitio del proyecto",base:false});n.eq.rows=[];Object.assign(n.dis,{Wb:0,sPlan:0,dFc:0,amPlan:0,hremPlan:0,dHplan:0});Object.assign(n.eq,{sEq:0,base:0});Object.assign(n.mal,{linkI:true,IfTipo:"sim"});
    setState(n,"Proyecto nuevo: escriba sus datos y pulse «Diseñar con estos datos».");$("proyCard").open=true;const i=document.querySelector('#fProy input[type="text"]');if(i){i.focus();i.select()}});
  $("btnSave").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({app:"sube-diseno",v:6,fecha:new Date().toISOString(),...S},null,1)],{type:"application/json"}),a=document.createElement("a");
    a.href=URL.createObjectURL(blob);a.download=(String(S.proy.nombre).normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^A-Za-z0-9]+/g,"-").replace(/^-|-$/g,"")||"subestacion")+".json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast("Proyecto guardado en un archivo .json.")});
  $("btnDis").addEventListener("click",()=>HOOK.disenar&&HOOK.disenar());
  $("btnOpen").addEventListener("click",()=>$("fileOpen").click());
  $("fileOpen").addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();
    rd.onload=()=>{try{const s=JSON.parse(rd.result);if(!s||typeof s!=="object"||!s.g||!s.ais||!s.dis||!s.mal)throw 0;const n=clone(DEF);
        for(const m of Object.keys(DEF))if(s[m]&&typeof s[m]==="object")for(const k of Object.keys(DEF[m]))if(k in s[m]&&typeof s[m][k]===typeof DEF[m][k]&&Array.isArray(s[m][k])===Array.isArray(DEF[m][k]))n[m][k]=s[m][k];
        if(!s.proy)n.proy.base=false;setState(n,`Proyecto «${n.proy.nombre}» abierto.`)}catch(x){toast("Ese archivo no es un proyecto de esta herramienta.")}e.target.value=""};
    rd.readAsText(f)});
  const framed=(()=>{try{return window.self!==window.top}catch(e){return true}})();
  document.querySelectorAll(".printBtn").forEach(b=>{if(framed)b.hidden=true;else b.addEventListener("click",()=>window.print())});
  buildForms();renderAll();showTab(location.hash.slice(1)||"resumen");
}
