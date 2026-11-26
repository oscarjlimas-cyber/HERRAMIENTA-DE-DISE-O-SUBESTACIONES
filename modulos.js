"use strict";
/* =====================================================================
   SUBE · módulos de la herramienta de diseño
   Formularios, cálculo en pantalla, gráficas y memoria de cada módulo.
   ===================================================================== */
const {calcAis,calcIns,calcDis,calcCon,calcEq,calcMal,calcApa}=SUBE;
let RA,RI,RD,RC,RE,RM,RP;
let AUTO=[];                       /* últimos ajustes automáticos de equipos de catálogo */
const cfgOf=()=>CFG[S.proy.cfg]||CFG.bpt;
const nCirc=()=>Math.max(1,Math.round((+S.proy.nLin||0)+(+S.proy.nTr||0)));
const nRes=()=>Math.max(0,Math.round(+S.proy.nRes||0));
const dpsHas=id=>{const d=calcAis(S.g,{...S.ais,dpsCat:id,dpsUr:0}).dps;return !!(d&&d.row)};
const bilOpts=()=>{const b=BIL_IEC[S.g.um]||[],i0=SUBE.BIL_SERIE.indexOf(b[0]);return i0<0?b:SUBE.BIL_SERIE.slice(i0,i0+6)};
const insName=A=>A.tipo==="disco"?A.n.split(" (")[0]:A.n.replace("Polimérico Siemens ","Siemens ");
const CB=t=>()=>S.proy.base?"Caso base: "+t:"";                 /* nota que solo aparece con el caso base cargado */
const trTipo=()=>SUBE.TR_TIPO[S.proy.trTipo]||SUBE.TR_TIPO.trif;
const nU=()=>trTipo()[1];
const kv=v=>`${fmU(+v)} kV`;
const minus=t=>t.charAt(0).toLowerCase()+t.slice(1);
const tensTxt=()=>[S.proy.v1,S.proy.un,S.proy.v3].map(Number).filter(v=>v>0).sort((a,b)=>b-a).map(v=>fmU(v)).join(" / ")+" kV";
const trafoTxt=()=>{const p=S.proy;if(!(+p.nTr>0))return"Sin transformación";const t=trTipo();
  return `${p.nTr} × ${t[1]>1?`(${t[1]} × ${fmU(+p.S1)} MVA)`:`${fmU(+p.S1)} MVA`} ${t[2]}${p.reserva?" + unidad de reserva":""}`};
/* Lista con «Otro valor»: el valor queda en valKey; la lista, en selKey */
const OTRO="otro";
function selO(mod,selKey,valKey,label,opts,unit,opt={}){
  return [sel(mod,selKey,label,()=>{const o=typeof opts==="function"?opts():opts;return [...o,[OTRO,"Otro valor…"]]},{wide:opt.wide,hint:opt.hint}),
          num(mod,valKey,"Valor","",{unit,show:()=>S[mod][selKey]===OTRO,step:opt.step,hint:opt.hint2})].map(f=>({...f,unit:f.unit||unit}));
}
/* Patios desde 34,5 kV: los catálogos incluidos son de pararrayos y aisladores de estación */
const UN_OPTS=()=>groupBy(SUBE.UN_CO.filter(x=>x[0]>=34.5),x=>x[1],x=>[String(x[0]),kv(x[0])]);
/* Pareja usual de tensiones de transformación en Colombia para cada tensión del patio */
const TR_PAR={500:230,230:115,220:110,115:230,110:220,66:13.8,57.5:13.8,44:13.8,34.5:13.8};
const S_OPTS=()=>[{g:"Serie R10 (IEC 60076-1)",o:SUBE.S_R10.map(v=>[String(v),`${fmU(v)} MVA`])},{g:"Usuales en el STN y STR",o:SUBE.S_CO.map(v=>[String(v),`${fmU(v)} MVA`])}];
const SEL_PAIRS={unSel:"un",v1Sel:"v1",v3Sel:"v3",sSel:"S1"};
/* Configuración y by-pass en una sola lista: «bs» o «bs+bp» */
const CFG_OPTS=()=>Object.entries(CFG).flatMap(([k,c])=>c.bp?[[k,c.n+" sin by-pass"],[k+"+bp",c.n+" con by-pass"]]:[[k,c.n]]);
const cfgNombre=(k,bp)=>CFG[k].n+(CFG[k].bp?(bp?" con by-pass":" sin by-pass"):"");

/* ============================================================
   Formularios
   ============================================================ */
Object.assign(FORMS,{
  fProy:[txt("proy","nombre","Nombre de la subestación",{wide:true}),txt("proy","lugar","Ubicación",{wide:true}),
    ...selO("proy","unSel","un","Tensión nominal del patio que se diseña",UN_OPTS,"kV",{wide:true,hint:()=>`Tensiones normalizadas en Colombia, desde 34,5 kV. Um = ${kv(S.g.um)} (IEC 60038).`}),
    ...selO("proy","v1Sel","v1","Tensión del otro devanado",()=>[["0","Ninguna (sin transformación)"],...SUBE.UN_CO.map(x=>[String(x[0]),kv(x[0])])],"kV",{hint:"Del transformador o autotransformador."}),
    ...selO("proy","v3Sel","v3","Terciario",()=>[["0","Sin terciario"],...[11.4,13.2,13.8,34.5,44].map(v=>[String(v),kv(v)])],"kV"),
    sel("proy","trTipo","Tipo de transformador",Object.entries(SUBE.TR_TIPO).map(([k,v])=>[k,v[0]]),{wide:true}),
    ...selO("proy","sSel","S1","Potencia por unidad",S_OPTS,"MVA",{hint:"La máxima, con la última etapa de enfriamiento."}),
    sel("proy","refr","Enfriamiento",["ONAN","ONAN/ONAF","ONAN/ONAF/OFAF","ONAF/OFAF","OFAF","ODAF"].map(v=>[v,v])),
    chk("proy","reserva","Unidad de reserva"),
    sel("proy","cfgSel","Configuración de barras",CFG_OPTS,{wide:true,hint:()=>cfgOf().bp?"Se comparan en la pestaña Configuraciones.":"By-pass: no aplica en esta configuración. "+cfgOf().bpNota}),
    num("proy","nLin","Circuitos de línea","",{step:1}),num("proy","nTr","Circuitos de transformación","",{step:1,hint:"Uno por banco o transformador."}),num("proy","nRes","Bahías de reserva","",{step:1,hint:"Previstas pero sin equipar."}),
    sel("proy","tramos","Seccionamiento de barras",()=>[[1,"Sin seccionamiento: barra continua"],[2,"Barra partida en 2 tramos"],[3,"Barra partida en 3 tramos"],[4,"Barra partida en 4 tramos"]],{num:true,wide:true,show:()=>!!cfgOf().sb,hint:()=>`Corte longitudinal de ${cfgOf().sb>1?"cada una de las dos barras":S.proy.cfg==="bpt"?"la barra principal":"la barra"} para dividir la subestación.`}),
    sel("proy","seccTipo","Elemento del seccionamiento",[["sec","Seccionador de barras"],["int","Interruptor de acople longitudinal (con dos seccionadores)"]],{wide:true,show:()=>!!cfgOf().sb&&+S.proy.tramos>1})],
  /* aislamiento */
  fAisSys:[sel("g","um","Tensión máxima Um",Object.keys(BIL_IEC).map(Number).sort((a,b)=>a-b).map(u=>[u,fmU(u)+" kV"]),{num:true,hint:()=>`Sale de la tensión nominal (${kv(S.proy.un)}).`}),num("g","alt","Altitud del sitio","msnm",{step:50}),num("g","t","Temperatura media","°C"),
    num("ais","mp","Margen de protección mínimo","%",{hint:"BIL ≥ (1 + MP)·NPR corregido. Lo usual: 20 a 40 %."})],
  fAisAdv:[num("ais","ke","Factor de falla a tierra ke","",{hint:"1,4 neutro sólido (conservador)."}),num("ais","ko","Factor ko","",{hint:"Operación continua: 0,8"}),num("ais","kt","Factor kt (TOV 1 s)",""),num("ais","S","Pendiente del rayo S","kV/µs"),
    num("ais","Ufo","Flameo de la cadena de línea","kV",{hint:"Para estimar la corriente del pararrayos."}),num("ais","Zl","Impedancia de la línea","Ω")],
  fAisDps:[sel("ais","dpsCat","Catálogo",()=>[["man","Personalizado (datos de la ficha técnica)"],...groupBy(CAT.DPS.filter(d=>dpsHas(d.id)),d=>d.marca,d=>[d.id,d.n])],{wide:true,hint:"Solo aparecen las series que tienen valores para esta Um."}),
    sel("ais","dpsUr","Tensión asignada Ur",()=>{const d=calcAis(S.g,S.ais).dps;return d?d.lst.map(r=>[r[0],`${r[0]} kV · Upl ${fm(r[5],0)} kV`]):[]},{wide:true,num:true,show:()=>S.ais.dpsCat!=="man"}),
    sel("ais","npmI","Corriente del impulso de maniobra",[["0","0,5 kA"],["1","1 kA"],["2","2 kA"]],{num:true,show:()=>S.ais.dpsCat!=="man",hint:"IEC 60099-4: 0,5 kA hasta 145 kV."}),
    num("ais","ur","Tensión asignada Ur","kV",{show:()=>S.ais.dpsCat==="man"}),num("ais","uc","Operación continua Uc","kV",{show:()=>S.ais.dpsCat==="man"}),
    num("ais","npr","Protección al rayo (10 kA)","kV",{show:()=>S.ais.dpsCat==="man"}),num("ais","npm","Protección a maniobra","kV",{show:()=>S.ais.dpsCat==="man"})],
  fAisHou:[sel("ais","hous","Envolvente",()=>[...(calcAis(S.g,S.ais).sie3EL2?CAT.HOUS.map(h=>[h.id,`${h.n} · ${h.li} kV · fuga ${h.fuga} mm`]):[["cat","La estándar del catálogo para esa Ur (sin verificar aparte)"]]),["custom","Personalizada (datos de la ficha)"]],{wide:true,hint:()=>calcAis(S.g,S.ais).sie3EL2?"Siemens 3EL2: envolventes del catálogo (p. 45).":"Este catálogo no publica envolventes por separado: se toma la estándar de esa Ur. Para verificarla, escriba sus datos como personalizada."}),
    num("ais","hBIL","Aislamiento pedido a la envolvente","kV BIL",{hint:()=>S.ais.estr==="dps"?"0 = el nivel normalizado siguiente al de los equipos.":"0 = el mayor BIL de los equipos."}),num("ais","hAC","60 Hz pedido a la envolvente","kV",{hint:"0 = el que corresponde a ese BIL."}),num("ais","sllReq","Carga de servicio requerida","N",{hint:"Referencia sísmica: 400 N."}),
    num("ais","cHli","Rayo de la envolvente","kV",{show:()=>S.ais.hous==="custom"}),num("ais","cHpf","60 Hz húmedo","kV",{show:()=>S.ais.hous==="custom"}),num("ais","cHfuga","Fuga","mm",{show:()=>S.ais.hous==="custom"}),num("ais","cHsll","SLL","N",{show:()=>S.ais.hous==="custom"})],
  fAisBil:[sel("ais","estr","Cuando la distancia al pararrayos no alcanza",[["mezcla","Dos niveles: BIL mayor solo en los equipos lejanos"],["general","Subir el BIL general (todos los equipos)"],["dps","Subir solo el BIL de la envolvente del DPS"]],{wide:true,
      hint:()=>({mezcla:"Los equipos cercanos llevan el nivel principal y los lejanos uno mayor.",general:"Todos los equipos llevan el mismo nivel, el que protege la distancia más larga.",dps:"Los equipos quedan con el nivel principal y solo la envolvente del pararrayos sube. Ojo: eso no alarga la distancia protegida."})[S.ais.estr]}),
    sel("ais","bilG","BIL de todos los equipos",()=>[[0,"Automático"],...bilOpts().map(b=>[b,`${b} kV (clase ${fmU(SUBE.umClase(S.g.um,b)||0)} kV)`])],{num:true,wide:true,show:()=>S.ais.estr==="general"}),
    sel("ais","bil1",S.ais&&S.ais.estr==="mezcla"?"Nivel principal (equipos cercanos)":"BIL de los equipos",()=>[[0,"Automático"],...(BIL_IEC[S.g.um]||[]).map(b=>[b,`${b} kV`])],{num:true,wide:true,show:()=>S.ais.estr!=="general",hint:"Los normalizados para la Um del sistema."}),
    sel("ais","bil2","Nivel para equipos lejanos",()=>[[0,"Automático (si hace falta)"],...bilOpts().filter(b=>b>(calcAis(S.g,{...S.ais,bil2:0}).BIL||0)).map(b=>[b,`${b} kV (clase ${fmU(SUBE.umClase(S.g.um,b)||0)} kV)`])],{num:true,wide:true,show:()=>S.ais.estr==="mezcla"}),
    chk("ais","distAuto","Tomar la distancia más larga de la tabla de equipos",{wide:true}),
    num("ais","dist","Distancia DPS–equipo más larga","m",{lock:()=>!!S.ais.distAuto,hint:"La usa la selección automática de los niveles."})],
  fAisPol:[sel("ais","pol","Nivel de contaminación (IEC TS 60815)",Object.entries(POL).map(([k,v])=>[k,`${v[0]} · ${fm(v[1],1)} mm/kV`]),{wide:true}),
    sel("ais","kd","Factor de diámetro kd",[["1","1,0 · diámetro ≤ 300 mm"],["1.1","1,1 · 300 a 500 mm"],["1.2","1,2 · más de 500 mm"]],{wide:true,num:true})],
  /* aisladores */
  fInsReq:[sel("ins","bilSrc","Nivel de aislamiento de la cadena",[["1","El nivel de los equipos (principal)"],["2","El mayor nivel de la subestación"],["man","Otro valor"]],{wide:true,hint:"Las cadenas de los extremos de las barras suelen quedar lejos de un pararrayos."}),
    num("ins","BIL","BIL de la cadena","kV",{show:()=>S.ins.bilSrc==="man"}),num("ins","sig","Desviación del flameo σ","%",{hint:"CFO ≥ BIL/(1 − 1,3σ); 3 % es lo usual."})],
  fInsAis:[sel("ins","ins","Aislador",()=>[["custom","Personalizado (datos de la ficha técnica)"],...groupBy(CAT.AIS,a=>a.fam==="qs"?"Hubbell · Quadri*Sil (suspensión polimérica)":a.tipo==="pol"?`Siemens · 3FL (Um ${fmU(a.um)} kV)`:"Discos de vidrio o porcelana",a=>[a.id,a.tipo==="pol"?`${a.n.replace("Polimérico Siemens ","").replace("Quadri*Sil ","")} · fuga ${a.fuga} mm · arco ${a.arco} mm`:a.n])],{wide:true}),
    num("ins","nD","Número de discos","",{step:1,hint:"0 = el mínimo que cumple.",show:()=>insTipo()==="disco"}),num("ins","extra","Discos adicionales","",{step:1,hint:"Por mantenimiento en caliente o discos dañados.",show:()=>insTipo()==="disco"}),
    sel("ins","cTipo","Tipo",[["pol","Polimérico (una pieza)"],["disco","Cadena de discos"]],{show:()=>S.ins.ins==="custom"}),
    num("ins","cFuga","Fuga (por disco si es cadena)","mm",{show:()=>S.ins.ins==="custom"}),num("ins","cArco","Distancia de arco","mm",{show:()=>S.ins.ins==="custom"&&S.ins.cTipo!=="disco"}),num("ins","cPaso","Paso del disco","mm",{show:()=>S.ins.ins==="custom"&&S.ins.cTipo==="disco"}),
    num("ins","cCfo","Flameo crítico CFO","kV",{show:()=>S.ins.ins==="custom"&&S.ins.cTipo!=="disco"}),num("ins","cLiwv","Soportado al rayo","kV",{show:()=>S.ins.ins==="custom"&&S.ins.cTipo!=="disco"}),num("ins","cPf","60 Hz húmedo","kV",{show:()=>S.ins.ins==="custom"&&S.ins.cTipo!=="disco"}),num("ins","cSml","Carga mecánica SML","kN",{show:()=>S.ins.ins==="custom"})],
  fInsMec:[num("ins","T","Tiro máximo del conductor","kN",{hint:"El mayor, normalmente en cortocircuito (IEC 60865-1)."}),num("ins","FS","Factor de seguridad","",{step:0.1}),num("ins","n","Cantidad de cadenas","",{step:1,hint:"Solo informativo (amarres, remates y repuestos)."})]
});
const insTipo=()=>S.ins.ins==="custom"?(S.ins.cTipo==="disco"?"disco":"pol"):((AISL[S.ins.ins]||{}).tipo||"pol");

/* ============================================================
   Reacciones a los cambios de datos
   ============================================================ */
function umCambio(){S.ais.bil1=0;S.ais.bil2=0;S.ais.bilG=0;S.ais.hBIL=0;S.ais.hAC=0;S.ais.dpsUr=0;HOOK.normalize();elegirEnvolvente()}
function elegirEnvolvente(){const a=calcAis(S.g,S.ais);if(!a.sie3EL2)return null;
  const h=CAT.HOUS.find(x=>x.li>=a.hBIL*a.Ka-1e-9&&x.pf>=a.hAC*a.Ka-1e-9&&x.fuga>=a.Lreq-1e-9&&x.sll>=S.ais.sllReq-1e-9);if(h&&h.id!==S.ais.hous){const old=S.ais.hous;S.ais.hous=h.id;return [old,h.id]}return null}
HOOK.change=(m,k)=>{
  const p=S.proy;
  if(m==="proy"&&SEL_PAIRS[k]&&p[k]!==OTRO)p[SEL_PAIRS[k]]=+p[k];
  if(m==="proy"&&(k==="unSel"||k==="un")){const um=SUBE.umDe(+p.un);if(um!==S.g.um){S.g.um=um;umCambio()}
    /* si la transformación queda incoherente con la nueva tensión, se propone la pareja usual */
    if(+p.v1===+p.un&&TR_PAR[+p.un]){p.v1=TR_PAR[+p.un];p.v1Sel=String(p.v1)}
    if(+p.v3>0&&(+p.v3>=Math.min(+p.un,+p.v1||Infinity)||+p.v3===+p.v1)){p.v3=0;p.v3Sel="0"}}
  if(m==="g"&&k==="um")umCambio();
  if(m==="proy"&&k==="cfgSel"){const [c,b]=String(p.cfgSel).split("+");p.cfg=c;p.bypass=b==="bp"?1:0}
  if(m==="proy"&&k==="cfg"&&!cfgOf().bp)p.bypass=0;
  if(m==="ais"&&(k==="dpsCat"||k==="dpsUr"||k==="estr"||k==="bil1"||k==="bil2"||k==="bilG"))elegirEnvolvente();
};
HOOK.normalize=()=>{
  if(S.ais.dpsCat!=="man"&&!dpsHas(S.ais.dpsCat)){const alt=CAT.DPS.find(d=>dpsHas(d.id));S.ais.dpsCat=alt?alt.id:"man"}
  const a=calcAis(S.g,S.ais);if(a.dps&&a.dps.row)S.ais.dpsUr=a.ur;
  if(!a.sie3EL2&&S.ais.hous!=="custom")S.ais.hous="cat";
  if(a.sie3EL2&&S.ais.hous==="cat")elegirEnvolvente();
  if(+S.ais.bil1>0&&!(BIL_IEC[S.g.um]||[]).includes(+S.ais.bil1))S.ais.bil1=0;
  if(+S.ais.bilG>0&&!bilOpts().includes(+S.ais.bilG))S.ais.bilG=0;
  if(S.ins.ins!=="custom"&&!AISL[S.ins.ins])S.ins.ins="custom";
  if(!CFG[S.proy.cfg])S.proy.cfg=DEF.proy.cfg;
  if(!cfgOf().bp)S.proy.bypass=0;
  if(!cfgOf().sb)S.proy.tramos=1;
  S.proy.cfgSel=S.proy.cfg+(cfgOf().bp&&S.proy.bypass?"+bp":"");
  if(S.ais.distAuto){const ls=(S.eq.rows||[]).map(r=>+r.l).filter(Number.isFinite);if(ls.length)S.ais.dist=Math.max(...ls)}
};

/* ============================================================
   Selección automática: si un dato de entrada deja un equipo de
   catálogo sin cumplir, se cambia por el primero que sí cumple.
   Las elecciones que el usuario hace a mano no se corrigen solas.
   ============================================================ */
const SELK=new Set(["ais.dpsCat","ais.dpsUr","ais.npmI","ais.hous","ais.bil1","ais.bil2","ais.bilG","ais.estr","ins.ins","ins.nD","ins.extra","ins.cTipo","con.cond","con.nsub","con.cL","con.cT","con.nCL","con.nCT","mal.size","mal.mat","mal.conn","mal.mej"]);
function ctxCon(){const D=calcDis(S.g,{...S.dis,BIL:S.dis.link&&RA&&RA.BIL?RA.BIL:S.dis.BIL}),I=corrientes();return{D,ctx:{Sf:S.con.link?D.sPlan:0,rig:S.dis.barra==="rig",Ilin:I.Ilin,Itr:I.Itr}}}
/* Conexión de bahía más liviana que lleva la corriente: menos conductores por fase y, entre ellos, la menor sección */
function mejorConexion(I,cap){for(const r of [1.1,1])for(let n=1;n<=4;n++){const x=[...CAT.COND].sort((p,q)=>p.aAl-q.aAl).find(z=>cap(z,n)>=r*I);if(x)return [x,n]}return null}
/* Malla: la retícula más abierta que cumple; el mejoramiento del terreno solo si con el suelo natural no se puede */
function optimMal(p){
  const Ds=[10,8,7,6,5,4.5,4,3.5,3,2.5],mejs=["no",p.mej&&p.mej!=="no"?p.mej:"favigel"];
  for(const mj of mejs)for(const D of Ds){const q={...p,mej:mj,nCx:Math.max(2,Math.round(p.Ly/D)+1),nCy:Math.max(2,Math.round(p.Lx/D)+1)};if(calcMal(q).ok)return q}
  return null;
}
/* Apantallamiento generado a partir del diseño (proyectos nuevos): alturas de distancias, BIL de aislamiento y cadena de aisladores */
function genApa(){
  const A=calcAis(S.g,S.ais),{D}=ctxCon(),I=calcIns(S.g,S.ins,A),BIL=A.BIL||550,w=I.w||2,Wb=S.dis.Wb>0?+S.dis.Wb:D.WbMin,ru=(x,s)=>Math.ceil(x/s-1e-9)*s;
  const dBus=(CAT.COND.find(c=>c.id===S.con.cond)||{d:30}).d,dCx=(CAT.COND.find(c=>c.id===S.con.cL)||{d:28}).d;
  const hT=D.heqA+0.8,hEq=D.heqA+1.3,h3=Math.max(ru(D.amarreA+D.SfA+D.DfeA,0.5),D.hremA),ph3=Math.max(D.SfA,D.sEqA||0);
  S.apa.sm=[{n:"Conexiones de nivel 1",hmax:+(hT+0.1).toFixed(2),hmin:+hT.toFixed(2),dmm:dCx,base:"BIL",bil:BIL,w:+w.toFixed(2)},
    {n:"Barras",hmax:+D.amarreA.toFixed(2),hmin:+D.hbLow.toFixed(2),dmm:dBus,base:"CFO",bil:BIL,w:+w.toFixed(2)},
    {n:"Nivel 3: retorno y salidas",hmax:h3,hmin:+(h3-0.026*S.apa.vanoG).toFixed(2),dmm:dCx,base:"BIL",bil:BIL,w:+w.toFixed(2)}];
  S.apa.ver=[{n:"Patio: fase central de nivel 3",sm:2,apo:"2c",kf:0.24,s:+Wb.toFixed(2),x:+(Wb/2).toFixed(2),de:+(h3-0.01).toFixed(2),beta:true},
    {n:"Patio: fases extremas de nivel 3",sm:2,apo:"2c",kf:0.24,s:+Wb.toFixed(2),x:+Math.max(0,Wb/2-ph3).toFixed(2),de:+(h3-0.01).toFixed(2),beta:true},
    {n:"Patio: barras",sm:1,apo:"2c",kf:0.67,s:+Wb.toFixed(2),x:+(Wb/2).toFixed(2),de:+D.amarreA.toFixed(2),beta:true},
    {n:"Patio: equipos de nivel 1",sm:0,apo:"2c",kf:1,s:+Wb.toFixed(2),x:+(Wb/2).toFixed(2),de:+hEq.toFixed(2),beta:true},
    {n:"Salida de línea: DPS",sm:0,apo:"cs",kf:0.35,s:0,x:4,de:+hEq.toFixed(2),beta:false}];
  S.apa.s2d=+Wb.toFixed(2);
  const setH=hG=>{S.apa.hG=hG;const f=S.apa.alfa*S.apa.vanoG;S.apa.ver.forEach(v=>{v.h1=+(hG-v.kf*f).toFixed(2);v.h2=v.apo==="2d"?v.h1:v.apo==="cs"?0:v.h1})};
  for(let hG=ru(h3+1.5,0.5);hG<=h3+25;hG+=0.5){setH(hG);if(calcApa(S.g,S.apa).okPatio)return hG}
  setH(ru(h3+4,0.5));return null;
}
/* Sube los cables de guarda (y las alturas de cable en la tabla de elementos) hasta que el patio quede protegido */
function subirGuarda(){const p=S.apa,h0=+p.hG;for(let dh=0.5;dh<=15;dh+=0.5){const q={...p,hG:h0+dh,ver:p.ver.map(v=>({...v,h1:+v.h1+dh,h2:+v.h2>0?+v.h2+dh:+v.h2}))};
  if(calcApa(S.g,q).okPatio){Object.assign(p,{hG:q.hG,ver:q.ver});return dh}}return 0}
function autoFix(opt){
  const g=S.g,msg=[];let a=calcAis(g,S.ais);
  /* 1. pararrayos: la menor Ur que aguanta la operación continua y la sobretensión temporal */
  const urOk=x=>{const t=calcAis(g,{...S.ais,dpsUr:x[0]});return t.okUr&&t.okUc&&t.okTOV};
  if(a.dps&&a.dps.row&&(opt||!(a.okUr&&a.okUc&&a.okTOV))){const r=a.dps.lst.find(urOk);
    if(r&&r[0]!==a.ur){msg.push(`Pararrayos: Ur ${a.ur} → ${r[0]} kV (${opt?"la menor que cumple":"el anterior no aguantaba la tensión de operación o la sobretensión temporal"}).`);S.ais.dpsUr=r[0]}}
  /* 2. niveles de aislamiento */
  a=calcAis(g,S.ais);
  if(opt){["bil1","bil2","bilG"].forEach(k=>S.ais[k]=0)}
  else{if(!a.L1||!a.L1.ok){const k=a.estr==="general"?"bilG":"bil1";if(+S.ais[k]>0){msg.push(`BIL ${S.ais[k]} kV no da el margen pedido: se deja en automático.`);S.ais[k]=0}}
    a=calcAis(g,S.ais);if(a.L2&&!a.L2.ok&&+S.ais.bil2>0){msg.push(`BIL ${S.ais.bil2} kV para equipos lejanos no cumple: se deja en automático.`);S.ais.bil2=0}}
  /* 3. envolvente */
  a=calcAis(g,S.ais);if(a.sie3EL2&&a.H&&(opt||!a.okH)){const c=elegirEnvolvente();if(c)msg.push(`Envolvente del pararrayos: ${c[0]} → ${c[1]} (${opt?"la menor que cumple":"la anterior no daba el aislamiento o la fuga pedidos"}).`)}
  /* 4. cadena de aisladores: la más corta que cumple */
  a=calcAis(g,S.ais);let i=calcIns(g,S.ins,a);
  if(S.ins.ins!=="custom"&&(opt||!i.ok)){
    if(!opt&&i.A.tipo==="disco"&&(+S.ins.nD>0)){S.ins.nD=0;i=calcIns(g,S.ins,a);if(i.ok)msg.push(`Cadena: el número de discos pasa a automático (${i.nd} discos).`)}
    if(opt||!i.ok){const fam=x=>x.fam||x.tipo,f0=fam(i.A),largo=x=>x.tipo==="disco"?calcIns(g,{...S.ins,ins:x.id,nD:0},a).w:x.arco/1000;
      const c=CAT.AIS.filter(x=>calcIns(g,{...S.ins,ins:x.id,nD:0},a).ok).sort((x,y)=>opt?largo(x)-largo(y):(fam(x)===f0?0:1)-(fam(y)===f0?0:1)||largo(x)-largo(y))[0];
      if(c&&(c.id!==S.ins.ins||+S.ins.nD>0)){msg.push(`Aislador: ${insName(i.A)} → ${insName(c)} (${opt?"la cadena más corta que cumple":"el anterior no cumplía "+i.chk.filter(x=>!x.ok).map(x=>x.k).join(", ")}).`);S.ins.ins=c.id;S.ins.nD=0}}}
  /* 5. conductor de barras y conexiones: el más liviano que cumple */
  if(S.con.linkI)S.con.Idis=Math.round(corrientes().IBP*10)/10;
  const {ctx}=ctxCon();let c=calcCon(g,S.con,ctx);
  if(S.con.cond!=="custom"&&(opt||!(c.okAmp&&c.okCor&&c.okTh))){const tipo=c.cat&&c.cat.tipo,cs=[...CAT.COND].sort((x,y)=>opt?x.aAl-y.aAl:(x.tipo===tipo?0:1)-(y.tipo===tipo?0:1)||x.aAl-y.aAl);let pick=null;
    for(let n=opt?1:Math.max(1,+S.con.nsub||1);n<=4&&!pick;n++)for(const x of cs){const t=calcCon(g,{...S.con,cond:x.id,nsub:n},ctx);if(t.okAmp&&t.okCor&&t.okTh){pick=[x,n];break}}
    if(pick&&(pick[0].id!==S.con.cond||pick[1]!==(+S.con.nsub||1))){msg.push(`Conductor de barras: ${c.nombre.split(" · ").slice(0,2).join(" ")} → ${pick[1]>1?pick[1]+" × ":""}${pick[0].n.split(" · ").slice(0,2).join(" ")} (${opt?"el más liviano que lleva la corriente, sin corona y con el cortocircuito":"el anterior no llevaba la corriente, tenía corona o no aguantaba el cortocircuito"}).`);S.con.cond=pick[0].id;S.con.nsub=pick[1]}}
  [["cL","nCL",ctx.Ilin,"línea"],["cT","nCT",ctx.Itr,"transformación"]].forEach(([k,kn,I,t])=>{const cur=CAT.COND.find(x=>x.id===S.con[k]);if(!cur||!(I>0))return;
    const n0=Math.max(1,+S.con[kn]||1),cap=(z,n)=>n*SUBE.ampCond(z,g,S.con,S.con.Tc).I;if(!opt&&cap(cur,n0)>=I)return;
    const pick=mejorConexion(I,cap);if(pick&&(pick[0].id!==cur.id||pick[1]!==n0)){msg.push(`Conexión de bahía de ${t}: ${n0>1?n0+" × ":""}${cur.id} → ${pick[1]>1?pick[1]+" × ":""}${pick[0].id} (${opt?"la opción más liviana que lleva":"no llevaba"} ${fm(I,0)} A).`);S.con[k]=pick[0].id;S.con[kn]=pick[1]}});
  /* 5b. equipos: corta duración con reserva frente a la falla a tierra */
  if(opt&&!S.eq.ikMargen){const dD=ctxCon().D,e0=calcEq(g,S.proy,S.eq,a,dD);S.eq.ikMargen=true;const e1=calcEq(g,S.proy,S.eq,a,dD);if(e1.Ik!==e0.Ik)msg.push(`Equipos: corta duración de ${fm(e1.Ik,1)} kA (la falla a tierra de ${fm(S.eq.I1,2)} kA dejaba los de ${fm(e0.Ik,1)} kA al ${fm(100*S.eq.I1/e0.Ik,0)} %).`)}
  /* 6. malla: conductor mínimo, retícula más abierta que cumple y mejoramiento del terreno solo si hace falta */
  if(S.mal.linkI){S.mal.If=S.eq.I1;S.mal.XR=S.eq.XR;S.mal.IfTipo="sim"}
  let m=calcMal(S.mal);
  {const k=Object.keys(SIZES).find(z=>SIZES[z][1]>=m.Amin);if(k&&k!==S.mal.size&&(opt||!m.okCond)){msg.push(`Conductor de la malla: ${SIZES[S.mal.size][0]} → ${SIZES[k][0]} (mínimo ${fm(m.Amin,1)} mm²).`);S.mal.size=k;m=calcMal(S.mal)}}
  if(S.mal.mej!=="no"&&calcMal({...S.mal,mej:"no"}).ok&&!opt){msg.push(`Malla: con el suelo natural ya cumple, así que no hace falta mejorar el terreno.`);S.mal.mej="no";m=calcMal(S.mal)}
  if(opt||!m.ok){const q=optimMal(S.mal);
    if(q&&(q.nCx!==S.mal.nCx||q.nCy!==S.mal.nCy||q.mej!==S.mal.mej)){const r=calcMal(q);
      msg.push(`Malla: retícula de ${fm(r.Dx,2)} × ${fm(r.Dy,2)} m${q.mej!=="no"?` con ${MEJ[q.mej].n} (con el suelo natural no se alcanza a cumplir)`:" con el suelo natural"}${S.mal.mej!=="no"&&q.mej==="no"?"; el mejoramiento del terreno no hace falta":""}.`);
      Object.assign(S.mal,{nCx:q.nCx,nCy:q.nCy,mej:q.mej})}}
  /* 7. apantallamiento */
  if(opt){const h=genApa();msg.push(h?`Apantallamiento: cables de guarda a ${fm(h,1)} m, generados con las alturas, el BIL y la cadena del diseño.`:"Apantallamiento: con cables de guarda de hasta 25 m sobre el nivel 3 no se protege todo el patio; revise la tabla de elementos.")}
  else{const ap=calcApa(g,S.apa);if(!ap.okPatio){const dh=subirGuarda();if(dh)msg.push(`Apantallamiento: cables de guarda ${fm(dh,1)} m más altos (${fm(S.apa.hG,1)} m) para proteger todo el patio.`)}}
  {const ap=calcApa(g,S.apa);if(!ap.okMast){const h0=+S.apa.hM;for(let h=h0+0.5;h<=+S.apa.deM+12;h+=0.5){if(calcApa(g,{...S.apa,hM:h}).okMast){S.apa.hM=h;msg.push(`Casa de control: puntas captadoras a ${fm(h,1)} m (antes ${fm(h0,1)} m).`);break}}}}
  return msg;
}
function aplicarAuto(silencio,opt){const msg=autoFix(!!opt);if(msg.length){const t=new Date().toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"});AUTO=[...msg.map(x=>[t,x]),...AUTO].slice(0,14);save();buildForms();renderAll();if(!silencio)toast(msg.length===1?msg[0]:`Se ajustaron ${msg.length} selecciones para que cumplan. Detalle en el Resumen.`)}return msg}
HOOK.disenar=()=>disenar();
HOOK.auto=(m,k)=>{if(SELK.has(m+"."+k))return;aplicarAuto()};
/* Botón Diseñar: recalcula todo, corrige lo que no cumple y muestra el resumen */
function disenar(){HOOK.normalize();elegirEnvolvente();const msg=aplicarAuto(true,!S.proy.base);renderAll();showTab("resumen",true);
  const nNo=[RA.ok,RI.ok,RC.ok,RE.ok,RM.ok,RP.ok].filter(x=>!x).length;
  toast(`Diseño calculado${msg.length?` con ${msg.length} ajuste${msg.length>1?"s":""} automático${msg.length>1?"s":""}`:""}. ${nNo?`${nNo} módulo${nNo>1?"s":""} por revisar.`:"Todos los módulos cumplen."}`)}
/* Corrientes de diseño (las mismas del módulo de equipos) */
function corrientes(){const p=S.proy,x=Math.max(1,+p.nLin||1),y=Math.max(1,+p.nTr||1),Inom=y*nU()*(+p.S1)*1e6/(Math.sqrt(3)*p.un*1e3);return{Inom,Ilin:S.eq.fc*Inom/x,Itr:S.eq.fc*Inom/y,IBP:S.eq.fc*Inom}}

/* ============================================================
   Encabezado
   ============================================================ */
function renderHdr(){
  const p=S.proy,c=cfgOf(),n=nCirc(),r=nRes();
  document.title=`${p.nombre} ${fmU(+p.un)} kV · Diseño de subestaciones`;
  $("hT").innerHTML=`${esc(p.nombre)} <em>${fmU(+p.un)} kV</em>`;
  const ce=SUBE.cuentaEquipos(p);
  $("ficha").innerHTML=[["Tensiones",tensTxt()],["Tensión máxima Um",fmU(S.g.um)+" kV"],[`Configuración`,cfgNombre(p.cfg,ce.bypass)+(ce.juntas?` · barra partida en ${ce.tramos} tramos`:"")],["Campos",`${ce.campos} equipados${r?` + ${r} de reserva`:""} · ${ce.int} interruptores, ${ce.secT} seccionadores`],["Transformación",esc(trafoTxt())],["Ubicación",`${esc(p.lugar)} · ${fm(S.g.alt,0)} msnm`],["Cortocircuito",`3F ${fm(S.eq.Isc,1)} kA · 1F ${fm(S.eq.I1,2)} kA`],["Aislamiento",RA&&RA.BIL?`BIL ${RA.BIL}${RA.BIL2?" / "+RA.BIL2:""} kV`:"—"]]
    .map(([a,b])=>`<div><span>${a}</span><b>${b}</b></div>`).join("");
  $("proyHint").textContent=p.base?"caso base del curso":"proyecto propio";
}

/* ============================================================
   Aislamiento
   ============================================================ */
function renderAis(){
  const g=S.g,p=S.ais,o=RA=calcAis(g,p),L1=o.L1,L2=o.L2,mpT=fm(p.mp,0)+" %";
  const fails=[];if(!o.okUr)fails.push(`Ur ${fm(o.ur,0)} kV es menor que la mínima de ${fm(o.Rn,1)} kV`);if(!o.okUc)fails.push(`Uc ${fm(o.uc,0)} kV es menor que la tensión de operación ${fm(o.COV,1)} kV`);
  if(!o.okTOV)fails.push("el pararrayos no aguanta la sobretensión temporal");if(!L1)fails.push("ningún BIL de la Um del sistema cumple");else if(!L1.ok)fails.push(`BIL ${L1.BIL} kV no da el margen pedido`);
  if(L2&&!L2.ok)fails.push(`BIL ${L2.BIL} kV no cumple`);if(!o.okH)fails.push("la envolvente del pararrayos no cumple");
  $("vAis").innerHTML=o.ok?verdict("ok",`BIL ${o.BIL} kV${L2?` y ${L2.BIL} kV`:""} con ${esc(o.dpsN)}`,`Con margen del ${mpT} el BIL requerido es ${fm(o.BILreq,1)} kV. El pararrayos protege los equipos de ${o.BIL} kV hasta ${fm(o.lmax1,1)} m${L2?` y los de ${L2.BIL} kV hasta ${fm(o.lmax2,1)} m`:""} de recorrido de conductor.`)
    :verdict("no","La coordinación no cumple todavía","Motivo: "+fails.join("; ")+".");
  const dpsN=o.estr==="dps"?`<div class="note wa" style="margin-top:10px">Estrategia «solo la envolvente del DPS»: los equipos quedan con BIL ${o.BIL} kV y la envolvente del pararrayos sube a ${fm(o.hBIL,0)} kV. La distancia protegida sigue siendo ${fm(o.lmax1,1)} m, porque depende del BIL del equipo protegido y no del aislamiento propio del pararrayos.</div>`:"";
  if(dpsN)$("vAis").innerHTML+=dpsN;
  $("kAis").innerHTML=kpi("BIL requerido",fm(o.BILreq,1),"kV",`${fm(o.kmin,2)} × ${fm(o.NPRc,1)} kV`,"hl")+kpi(o.estr==="mezcla"?"Nivel principal":"BIL de los equipos",o.BIL??"—","kV BIL",L1?`clase ${fmU(L1.um)} kV · ${L1.ac?L1.ac+" kV a 60 Hz":"rango II: rige la maniobra"}`:"","hl")+kpi("Distancia máx. con ese nivel",fm(o.lmax1,1),"m",`MP ≥ ${mpT}`,"hl")+
    (L2?kpi("Nivel para equipos lejanos",L2.BIL,"kV BIL",`clase ${fmU(L2.um)} kV · ${L2.ac?L2.ac+" kV a 60 Hz":"rango II: rige la maniobra"}`)+kpi("Distancia máx. con ese nivel",fm(o.lmax2,1),"m",`MP ≥ ${mpT}`):"")+
    kpi("Factor de altitud Ka",fm(o.Ka,3),"",`${fm(g.alt,0)} m · ref. 1000 m`)+kpi("Protección corregida",fm(o.NPRc,1),"kV",`NPR ${fm(o.npr,0)} kV × Ka`)+kpi("Ur mínima",fm(o.Rn,2),"kV",`catálogo ${fm(o.ur,0)} kV`,o.okUr?"":"bad")+kpi("Fuga mínima",fm(o.Lreq,0),"mm",`${fm(o.kf,1)} mm/kV × ${fmU(g.um)} × ${fm(p.kd,1)}`);
  const m=(b,t)=>pill(b?"ok":"no",t),used=f=>f===L1?pill("ok",o.estr==="mezcla"?"Principal":"Equipos"):f===L2?pill("ok","Equipos lejanos"):f.ok?pill("wa","Cumple"):pill("no","No cumple");
  $("tAis").innerHTML=`<tr><th class="l">BIL</th><th>Clase Um</th><th>60 Hz</th><th>BIL/NPR' (≥ ${fm(o.kmin,2)})</th><th>BSL aire</th><th>BSL aceite</th><th>BSL/NPM' (&gt; 1,15)</th><th>Distancia máx.</th><th class="l">Uso</th></tr>`+
    o.filas.map(r=>`<tr class="${r===L1||r===L2?"sel":""}"><td class="l"><b>${r.BIL} kV</b></td><td>${fmU(r.um||0)} kV</td><td>${r.ac??"—"} kV</td><td>${m(r.c1,fm(r.K1))}</td><td>${fm(r.BSLa,1)} → ${r.BSLaN}</td><td>${fm(r.BSLo,1)} → ${r.BSLoN}</td><td>${m(r.c2,fm(Math.min(r.KMa,r.KMo)))}</td><td>${fm(r.dmax,1)} m</td><td class="l">${used(r)}</td></tr>`).join("")+
    `<tr><td colspan="9" class="l mut" style="white-space:normal;font-size:12.5px">BSL calculado como 0,75·BIL en aire y 0,83·BIL en aceite y llevado al valor normalizado inmediatamente inferior (IEC 60071-1), para no atribuir al equipo una soportabilidad mayor. NPR' y NPM' son los niveles de protección corregidos por altitud: ${fm(o.NPRc,1)} y ${fm(o.NPMc,1)} kV.</td></tr>`;
  $("chAis").innerHTML=chartMP(o,p);
  $("tMP").innerHTML=`<tr><th>Distancia l</th><th>Tensión en el equipo U₂</th>${L1?`<th>MP con BIL ${L1.BIL}</th>`:""}${L2?`<th>MP con BIL ${L2.BIL}</th>`:""}</tr>`+o.tabla.map(t=>`<tr><td>${fm(t.l,1)} m</td><td>${fm(t.U2,1)} kV</td>${L1?`<td>${m(t.mp1>=o.kmin-1-1e-9,fm(100*t.mp1,0)+" %")}</td>`:""}${L2?`<td>${m(t.mp2>=o.kmin-1-1e-9,fm(100*t.mp2,0)+" %")}</td>`:""}</tr>`).join("");
  const H=o.H,rows=[["Tensión asignada frente a la mínima",`Ur ${fm(o.ur,0)} kV`,`≥ ${fm(o.Rn,2)} kV`,o.okUr],["Operación continua frente a Um/√3",`Uc ${fm(o.uc,0)} kV`,`≥ ${fm(o.COV,2)} kV`,o.okUc],["Sobretensión temporal de 1 s",`kt·Ur = ${fm(o.capTOV,1)} kV`,`≥ ${fm(o.TOV,2)} kV`,o.okTOV]];
  if(H)rows.push([`${esc(H.n)}: impulso de rayo`,`${fm(H.li,0)} kV`,`≥ ${fm(o.hBIL,0)} × Ka = ${fm(o.hLi,0)} kV`,o.okHli],["Envolvente: 60 Hz en húmedo",`${fm(H.pf,0)} kV`,`≥ ${fm(o.hAC,0)} × Ka = ${fm(o.hPf,0)} kV`,o.okHpf],["Envolvente: distancia de fuga",`${fm(H.fuga,0)} mm`,`≥ ${fm(o.Lreq,0)} mm`,o.okHf],["Envolvente: carga de servicio (SLL)",`${fm(H.sll,0)} N`,`≥ ${fm(p.sllReq,0)} N`,o.okHs]);
  $("tDps").innerHTML=`<tr><th class="l">Verificación</th><th>Pararrayos</th><th>Exigido</th><th class="l">Estado</th></tr>`+rows.map(r=>`<tr><td class="l">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td class="l">${okp(r[3])}</td></tr>`).join("")+
    `<tr><td class="l">Corriente de rayo esperada en el pararrayos</td><td>${fm(o.Imax,1)} kA</td><td class="l mut" colspan="2" style="white-space:normal">(2·${fm(p.Ufo,0)} − ${fm(o.npr,0)}) / ${fm(p.Zl,0)} Ω. Informativo: debe quedar por debajo de la corriente nominal de descarga (10 kA).</td></tr>`;
  memo("memoAis",memoAis(o,g,p));
  setSt("st-ais",o.ok?"ok":"no");
}
function chartMP(o,p){
  if(!o.L1)return"";const W=640,H=270,pl=48,pr=16,pt=14,pb=38,lM=Math.max(50,Math.ceil((o.lmax2||o.lmax1)*1.2/10)*10),mpMax=Math.max(130,Math.ceil(100*o.MPl((o.L2||o.L1).BIL,0)/50)*50),mpMin=-20;
  const X=l=>pl+(W-pl-pr)*l/lM,Y=v=>pt+(H-pt-pb)*(1-(v-mpMin)/(mpMax-mpMin));let s="";
  for(let v=0;v<=mpMax;v+=50)s+=`<line x1="${pl}" y1="${Y(v)}" x2="${W-pr}" y2="${Y(v)}" stroke="var(--line)"/><text x="${pl-6}" y="${Y(v)+4}" font-size="11" text-anchor="end" fill="var(--muted)">${v} %</text>`;
  for(let l=0;l<=lM;l+=10)s+=`<text x="${X(l)}" y="${H-pb+16}" font-size="11" text-anchor="middle" fill="var(--muted)">${l}</text>`;
  s+=`<text x="${(pl+W-pr)/2}" y="${H-4}" font-size="11" text-anchor="middle" fill="var(--muted)">Recorrido de conductor entre el pararrayos y el equipo (m)</text>`;
  const mp=p.mp;s+=`<line x1="${pl}" y1="${Y(mp)}" x2="${W-pr}" y2="${Y(mp)}" stroke="var(--no)" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${W-pr}" y="${Y(mp)-5}" font-size="11" text-anchor="end" fill="var(--no)" font-weight="600">margen mínimo ${fm(mp,0)} %</text>`;
  const curve=(L,c,lab)=>{const pts=[];for(let l=0;l<=lM;l+=lM/80)pts.push(`${X(l).toFixed(1)},${Y(Math.max(mpMin,100*o.MPl(L.BIL,l))).toFixed(1)}`);
    return `<polyline points="${pts.join(" ")}" fill="none" stroke="${c}" stroke-width="2.4"/><line x1="${X(L.dmax)}" y1="${Y(mp)}" x2="${X(L.dmax)}" y2="${H-pb}" stroke="${c}" stroke-dasharray="3 3"/><circle cx="${X(L.dmax)}" cy="${Y(mp)}" r="4.5" fill="${c}"/><text x="${X(L.dmax)+5}" y="${H-pb-6}" font-size="11.5" fill="${c}" font-weight="600">${fm(L.dmax,1)} m</text><text x="${X(2)}" y="${Y(100*o.MPl(L.BIL,2))-7}" font-size="12" fill="${c}" font-weight="700">${lab}</text>`};
  s+=curve(o.L1,"var(--chart1)",`BIL ${o.L1.BIL} kV`);if(o.L2)s+=curve(o.L2,"var(--chart2)",`BIL ${o.L2.BIL} kV`);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Margen de protección según la distancia">${s}</svg><p class="norma" style="margin:2px 0 0">MP = BIL / (NPR' + 2·S·l/c) − 1, con S = ${fm(p.S,0)} kV/µs y c = 300 m/µs. Cada equipo debe quedar a la izquierda de la línea punteada de su nivel.</p>`;
}
function memoAis(o,g,p){
  const {st,add}=memoList(),L1=o.L1,L2=o.L2;
  add("Pararrayos","Tensión de operación continua",`Es la tensión fase–tierra que el pararrayos soporta todo el tiempo.`,
    [`COV = ${F(Sb(I("U"),"m"),"√3")} = ${F(fmU(g.um),"√3")} = ${R(fm(o.COV)+" kV")} ; ${Sb(I("U"),"c")} = ${fm(o.uc,0)} kV ${o.okUc?AD("≥ COV"):BD("< COV")}`],"IEC 60099-5");
  add("Pararrayos","Sobretensión temporal y tensión asignada mínima",`Durante una falla a tierra la tensión sube ${fm(p.ke,1)} veces. Se toma la mayor de las dos tensiones asignadas mínimas.`,
    [`TOV = ${Sb(I("k"),"e")}·COV = ${fm(p.ke,2)}·${fm(o.COV)} = ${R(fm(o.TOV)+" kV")}`,
     `${Sb(I("R"),"o")} = ${F("COV",Sb(I("k"),"o"))} = ${F(fm(o.COV),fm(p.ko,2))} = ${fm(o.Ro)} kV ; ${Sb(I("R"),"e")} = ${F("TOV",Sb(I("k"),"t"))} = ${F(fm(o.TOV),fm(p.kt,2))} = ${fm(o.Re)} kV`,
     `${Sb(I("R"),"n")} = máx(${Sb(I("R"),"o")}, ${Sb(I("R"),"e")}) = ${R(fm(o.Rn)+" kV")} → ${Sb(I("U"),"r")} = ${fm(o.ur,0)} kV ${o.okUr?AD("Cumple"):BD("No cumple")} ; ${Sb(I("k"),"t")}·${Sb(I("U"),"r")} = ${fm(o.capTOV,1)} kV ${o.okTOV?"≥":"<"} TOV`],"IEC 60099-5");
  add("Pararrayos","Niveles de protección",`${esc(o.dpsN)}. NPR: tensión residual con 10 kA (8/20 µs). NPM: con ${o.iSw?fm(o.iSw,1)+" kA":"la corriente de su clase"} (30/60 µs).`,
    [`NPR = ${R(fm(o.npr,0)+" kV")} ; NPM = ${R(fm(o.npm,0)+" kV")}`],o.dps&&o.dps.row?"Catálogo del fabricante":"Ficha técnica");
  add("Altitud","Corrección por altura",`A ${fm(g.alt,0)} m el aire aísla menos. Con el método convencional se corrigen los niveles de protección con el factor referido a 1000 m.`,
    [`${Sb(I("K"),"a")} = ${I("e")}<sup>(${I("H")} − 1000)/8150</sup> = ${I("e")}<sup>(${fm(g.alt,0)} − 1000)/8150</sup> = ${R(fm(o.Ka,4))}`,
     `NPR' = ${fm(o.npr,0)}·${fm(o.Ka,4)} = ${R(fm(o.NPRc,1)+" kV")} ; NPM' = ${fm(o.npm,0)}·${fm(o.Ka,4)} = ${R(fm(o.NPMc,1)+" kV")}`],"IEC 60071-2");
  add("Nivel de aislamiento","BIL requerido",`Con el margen de protección mínimo del ${fm(p.mp,0)} % en bornes del pararrayos:`,
    [`${Sb("BIL","req")} = ${fm(o.kmin,2)}·NPR' = ${fm(o.kmin,2)}·${fm(o.NPRc,1)} = ${R(fm(o.BILreq,1)+" kV")}`],"IEC 60071-1");
  add("Nivel de aislamiento","Efecto de la distancia",`La onda viaja por el conductor y se refleja en el equipo, que ve una tensión mayor que la del pararrayos. Por eso cada nivel solo protege hasta cierta distancia.`,
    [`${Sb(I("U"),"2")} = NPR' + ${F("2"+I("S")+I("l"),I("c"))} ; MP = ${F("BIL − "+Sb(I("U"),"2"),Sb(I("U"),"2"))} ≥ ${fm(p.mp,0)} % → ${Sb(I("l"),"máx")} = (${F("BIL",fm(o.kmin,2))} − NPR')·${F(I("c"),"2"+I("S"))}`,
     ...[L1,L2].filter(Boolean).map(L=>`BIL ${L.BIL} kV: ${Sb(I("l"),"máx")} = (${fm(L.BIL/o.kmin,1)} − ${fm(o.NPRc,1)})·${F("300","2·"+fm(p.S,0))} = ${R(fm(L.dmax,1)+" m")}`)],"IEC 60071-2 · método convencional");
  [L1,L2].filter(Boolean).forEach(L=>add("Nivel de aislamiento",`Verificación del BIL ${L.BIL} kV`,`Equipo de clase Um = ${fmU(L.um)} kV (${L.ac?L.ac+" kV a 60 Hz":"rango II: se especifica la soportada a impulso de maniobra"}). El BSL calculado se lleva al normalizado inmediatamente inferior.`,
    [`BSL aire = 0,75·${L.BIL} = ${fm(L.BSLa,1)} → ${L.BSLaN} kV ; BSL aceite = 0,83·${L.BIL} = ${fm(L.BSLo,1)} → ${L.BSLoN} kV`,
     `${F("BSL","NPM'")} = ${F(L.BSLaN,fm(o.NPMc,1))} = ${R(fm(L.KMa))} y ${F(L.BSLoN,fm(o.NPMc,1))} = ${R(fm(L.KMo))} ${L.c2?AD("> 1,15"):BD("≤ 1,15")}`,
     `IEC 60071-2: ${Sb(I("U"),"cw")} = ${F(L.BIL,"1,05·"+fm(o.Ka0,3))} = ${fm(L.Ucwe,1)} kV → ${I("l")} = ${fm(L.le,1)} m (externo) ; ${F(L.BIL,"1,15")} = ${fm(L.Ucwi,1)} kV → ${fm(L.li,1)} m (interno)`+MU(`gobierna el margen del ${fm(p.mp,0)} %: ${fm(L.dmax,1)} m`)],"IEC 60071-1/2"));
  add("Contaminación","Distancia de fuga mínima",`Nivel ${POL[p.pol][0].toLowerCase()}. La fuga se calcula con la Um del sistema y es la misma para todos los equipos y cadenas.`,
    [`${Sb(I("D"),"f")} = ${Sb(I("k"),"f")}·${Sb(I("U"),"m")}·${Sb(I("k"),"d")} = ${fm(o.kf,1)}·${fmU(g.um)}·${fm(p.kd,1)} = ${fm(o.Lcalc,1)} → ${R(fm(o.Lreq,0)+" mm")}`],"IEC TS 60815");
  if(o.H)add("Pararrayos","Aislamiento de la envolvente",`La envolvente es el aislamiento propio del pararrayos. Se le pide el nivel de ${fm(o.hBIL,0)} kV corregido a la altitud del sitio.`,
    [`${fm(o.H.li,0)} kV ${o.okHli?"≥":"<"} ${fm(o.hBIL,0)}·${fm(o.Ka,3)} = ${fm(o.hLi,0)} kV ; ${fm(o.H.pf,0)} kV ${o.okHpf?"≥":"<"} ${fm(o.hAC,0)}·${fm(o.Ka,3)} = ${fm(o.hPf,0)} kV ; fuga ${fm(o.H.fuga,0)} mm ${o.okHf?"≥":"<"} ${fm(o.Lreq,0)} mm ${o.okH?AD("Cumple"):BD("No cumple")}`],"Catálogo Siemens 3EL2 · IEC 60099-4");
  return st;
}

/* ============================================================
   Aisladores
   ============================================================ */
function renderIns(){
  const g=S.g,p=S.ins,o=RI=calcIns(g,p,RA),A=o.A,disc=A.tipo==="disco";
  const bad=o.chk.filter(c=>!c.ok).map(c=>c.t.split(" (")[0].toLowerCase());
  const nom=disc?`${o.nd} × ${insName(A)}`:insName(A);
  $("vIns").innerHTML=o.ok?verdict("ok",`${esc(nom)}: cumple para BIL ${o.BIL} kV`,`Fuga ${fm(o.fuga,0)} mm (se piden ${fm(o.Lreq,0)} mm), arco ${fm(o.arco,2)} m (se piden ${fm(o.dReq,2)} m) y flameo de ${fm(o.cfoC,0)} kV a ${fm(g.alt,0)} m (se piden ${fm(o.cfoReq,0)} kV).`)
    :verdict("no",`${esc(nom)}: no cumple`,"Falla: "+bad.join("; ")+". Pruebe un aislador más largo o con más fuga.");
  $("kIns").innerHTML=kpi("BIL de la cadena",o.BIL,"kV",`60 Hz: ${o.AC} kV`,"hl")+kpi("Fuga mínima",fm(o.Lreq,0),"mm","del módulo de aislamiento")+kpi("Arco mínimo",fm(o.dReq,2),"m","fase–tierra IEC / RETIE")+kpi("CFO mínimo",fm(o.cfoReq,0),"kV",`BIL / ${fm(o.fCfo,3)}`)+
    (disc?kpi("Discos",o.nd,"",`mínimo ${o.nAuto}: fuga ${o.nF}, arco ${o.nA}, CFO ${o.nC}`,"hl"):"")+kpi("Longitud",o.lon?fm(o.lon,0):"—","mm",disc?`${o.nd} × ${A.paso} mm`:"de catálogo")+kpi("Factor de altitud",fm(o.Ka,3),"","referido a 1000 m")+kpi("Carga de diseño",fm(o.Fd,1),"kN",`${fm(p.FS,1)} × ${fm(p.T,1)} kN · ${fm(p.n,0)} cadenas`);
  $("barIns").innerHTML=`<div class="bars">${o.chk.map(c=>{const r=c.v/c.lim,w=Math.min(100,100*r/2),col=c.ok?"var(--ok)":"var(--no)";
    return `<div class="bar"><span>${c.t}</span><b>${fm(100*(r-1),0)} %</b><div class="tr"><i style="width:${w}%;background:${col}"></i><i style="left:50%;width:2px;background:var(--ink);opacity:.5"></i></div></div>`}).join("")}</div><p class="norma" style="margin:8px 0 0">Cada barra compara lo que da el aislador con lo exigido; la marca central es el mínimo y el porcentaje, la holgura.</p>`;
  $("tIns").innerHTML=`<tr><th class="l">Verificación</th><th>Aislador</th><th>Exigido</th><th class="l">Estado</th></tr>`+o.chk.map(c=>`<tr><td class="l">${c.t}</td><td>${fm(c.v,c.d)} ${c.u}</td><td>≥ ${fm(c.lim,c.d)} ${c.u}</td><td class="l">${okp(c.ok)}</td></tr>`).join("")+
    (disc?`<tr><td class="l mut" colspan="4" style="white-space:normal">Cadena de discos: el arco se toma igual a la longitud de la cadena y el CFO con la ecuación 5.9 de Mejía Villegas, CFO = 0,94·585·w. No se verifica el 60 Hz húmedo porque el dato es por disco.</td></tr>`:"")+
    (o.cfoEst?`<tr><td class="l mut" colspan="4" style="white-space:normal">El fabricante no publica el CFO de esta referencia: se estima como LIWV/(1 − 1,3σ) = ${fm(o.cfo,0)} kV.</td></tr>`:"")+(!disc&&o.liwv==null?`<tr><td class="l mut" colspan="4" style="white-space:normal">El fabricante no publica el soportado al rayo de esta referencia: se verifica con el CFO.</td></tr>`:"");
  const cands=CAT.AIS.filter(a=>a.fam==="qs"||a.tipo==="disco"||(a.um&&a.um>=g.um&&a.um<=g.um*1.4));
  $("tInsCmp").innerHTML=`<tr><th class="l">Aislador</th><th>Fuga</th><th>Arco</th><th>CFO / Ka</th><th>Rayo / Ka</th><th>SML</th><th class="l">Resultado</th></tr>`+
    cands.map(a=>{const r=calcIns(g,{...p,ins:a.id,nD:0},RA),f=r.chk.filter(c=>!c.ok).map(c=>c.k);return `<tr class="${a.id===p.ins?"sel":""}"><td class="l">${esc(a.tipo==="disco"?`${r.nd} × ${insName(a)}`:insName(a))}</td><td>${fm(r.fuga,0)} mm</td><td>${fm(r.arco,2)} m</td><td>${fm(r.cfoC,0)} kV</td><td>${r.liwvC?fm(r.liwvC,0)+" kV":"—"}</td><td>${fm(a.sml,0)} kN</td><td class="l">${f.length?pill("no","Falla: "+f.join(", ")):pill("ok","Cumple")}</td></tr>`}).join("");
  memo("memoIns",memoIns(o,g,p));
  setSt("st-ins",o.ok?"ok":"no");
}
function memoIns(o,g,p){
  const {st,add}=memoList(),A=o.A,disc=A.tipo==="disco";
  add("Requisitos","Nivel de aislamiento de la cadena",`Se usa BIL ${o.BIL} kV. ${p.bilSrc==="2"?"Las cadenas de los extremos de las barras y del nivel 3 quedan lejos de un pararrayos, así que se piden todas con el nivel de equipos lejanos para que los repuestos sirvan en cualquier posición.":""}`,
    [`BIL = ${R(o.BIL+" kV")} ; 60 Hz, 1 min = ${R(o.AC+" kV")} ; ${Sb(I("d"),"f-t")} = ${R(fm(o.dReq,2)+" m")}`+MU("distancia mínima fase–tierra para ese BIL (IEC 60071-2, RETIE)")],"IEC 60071-1 · RETIE");
  add("Requisitos","Flameo crítico mínimo",`El BIL es la tensión que el aislamiento aguanta el 90 % de las veces. Con una desviación del ${fm(p.sig,0)} % el flameo crítico (50 %) debe ser mayor.`,
    [`${Sb("CFO","mín")} = ${F("BIL","1 − 1,3σ")} = ${F(o.BIL,fm(o.fCfo,3))} = ${R(fm(o.cfoReq,0)+" kV")}`],"IEEE 1313.2 · IEC 60071-2");
  if(disc)add("Cadena de discos","Número de discos",`Se toma el mayor número que pide cada criterio. Cada disco aporta ${A.fuga} mm de fuga y ${A.paso} mm de longitud.`,
    [`fuga: ${F(fm(o.Lreq,0),A.fuga)} → ${o.nF} ; arco: ${F(fm(o.dReq,2),fm(A.paso/1000,3))} → ${o.nA} ; CFO: ${F(fm(o.cfoReq,0)+"·"+fm(o.Ka,3),"0,94·585·"+fm(A.paso/1000,3))} → ${o.nC}`,
     `${I("n")} = ${R(o.nd+" discos")}${+p.extra?MU("incluye "+p.extra+" adicionales"):""} ; ${I("w")} = ${fm(o.w,3)} m ; CFO = 0,94·585·${fm(o.w,3)} = ${R(fm(o.cfo,0)+" kV")}`],"Mejía Villegas ec. 5.9");
  add("Verificación","Corrección por altitud",`Los valores del catálogo son a nivel del mar o a 1000 m; a ${fm(g.alt,0)} m se dividen por el factor de altitud.`,
    [`${Sb(I("K"),"a")} = ${fm(o.Ka,4)} ; CFO' = ${F(fm(o.cfo,0),fm(o.Ka,3))} = ${R(fm(o.cfoC,0)+" kV")} ${o.cfoC>=o.cfoReq?AD("≥ "+fm(o.cfoReq,0)+" kV"):BD("< "+fm(o.cfoReq,0)+" kV")}`,
     ...(o.liwvC!=null?[`LIWV' = ${F(fm(o.liwv,0),fm(o.Ka,3))} = ${R(fm(o.liwvC,0)+" kV")} ${o.liwvC>=o.BIL?AD("≥ "+o.BIL+" kV"):BD("< "+o.BIL+" kV")}`]:[]),
     ...(o.pfC!=null?[`60 Hz' = ${F(fm(o.pf,0),fm(o.Ka,3))} = ${R(fm(o.pfC,0)+" kV")} ${o.pfC>=o.AC?AD("≥ "+o.AC+" kV"):BD("< "+o.AC+" kV")}`]:[])],"IEC 60071-2");
  add("Verificación","Fuga y arco",`${esc(A.n)}.`,
    [`fuga = ${R(fm(o.fuga,0)+" mm")} ${o.fuga>=o.Lreq?AD("≥ "+fm(o.Lreq,0)+" mm"):BD("< "+fm(o.Lreq,0)+" mm")} ; arco = ${R(fm(o.arco,3)+" m")} ${o.arco>=o.dReq?AD("≥ "+fm(o.dReq,2)+" m"):BD("< "+fm(o.dReq,2)+" m")}`],"IEC TS 60815 · IEC 60071-2");
  add("Verificación","Carga mecánica",`La cadena debe aguantar el mayor tiro del conductor, que se da en cortocircuito, con un factor de seguridad.`,
    [`${Sb(I("F"),"d")} = ${fm(p.FS,1)}·${fm(p.T,1)} = ${R(fm(o.Fd,1)+" kN")} ; SML = ${fm(A.sml,0)} kN ${A.sml>=o.Fd?AD("Cumple ("+fm(100*o.Fd/A.sml,0)+" %)"):BD("No cumple")}`],"IEC 61109 · IEC 60865-1");
  return st;
}

/* ============================================================
   Formularios: distancias, conductores y equipos
   ============================================================ */
Object.assign(FORMS,{
  fDisBase:[chk("dis","link","Usar el BIL principal del módulo de aislamiento",{wide:true}),num("dis","BIL","BIL","kV",{step:5,lock:()=>!!S.dis.link}),num("g","alt","Altitud","msnm",{step:50}),num("g","t","Temperatura media","°C"),
    sel("dis","dMode","Densidad del aire δ",[["none","Sin corrección: el BIL ya incluye la altura (caso base)"],["iec","Corregir con presión exponencial"],["baro","Corregir con fórmula barométrica"],["man","Valor manual"]],{wide:true}),
    num("dis","dMan","δ manual","",{show:()=>S.dis.dMode==="man"}),num("dis","fff","Factor fase–fase","",{step:0.05,hint:"1,15 deja holgura sobre la fase–tierra."}),num("dis","galibo","Gálibo del vehículo","m",{step:0.1}),chk("dis","rnd","Redondear a múltiplos de 0,05 m hacia arriba",{wide:true})],
  fDisAdv:[num("dis","Es","Gradiente crítico Es","kV/m",{step:10}),num("dis","kS","Factor de seguridad",""),num("dis","nExp","Exponente de δ",""),num("dis","kVB","Factor del valor básico","")],
  fDisBar:[sel("dis","barra","Tipo de barraje",[["flex","Flexible (cable tendido)"],["rig","Rígido (tubo)"]],{wide:true}),
    sel("dis","cond","Conductor",[["ACSR","Cable de aluminio (K = 10)"],["Cu","Cobre (K = 1,75)"],["otro","Otro (K manual)"]],{show:()=>S.dis.barra==="flex"}),num("dis","K","Constante K","",{show:()=>S.dis.barra==="flex",lock:()=>S.dis.cond!=="otro"}),
    num("dis","vano","Vano de barras","m",{step:0.5,show:()=>S.dis.barra==="flex",hint:"Distancia entre pórticos de barras."}),
    sel("dis","fMode","Flecha",[["pct","% del vano"],["val","Valor en metros"],["ten","Por tensión de tendido"]],{show:()=>S.dis.barra==="flex"}),
    num("dis","pct","Flecha","% vano",{step:0.1,show:()=>S.dis.barra==="flex"&&S.dis.fMode==="pct"}),num("dis","fVal","Flecha","m",{step:0.01,show:()=>S.dis.barra==="flex"&&S.dis.fMode==="val"}),
    num("dis","w","Peso del conductor","kg/m",{step:0.001,show:()=>S.dis.barra==="flex"&&S.dis.fMode==="ten"}),num("dis","Fh","Tensión horizontal","kgf",{step:10,show:()=>S.dis.barra==="flex"&&S.dis.fMode==="ten"})],
  fDisPlan:[num("dis","Wb","Ancho de bahía","m",{step:0.5,hint:"0 = no verificar"}),num("dis","sPlan","Separación entre fases de barras","m",{step:0.05}),num("dis","dFc","Fase exterior a columna","m",{step:0.05}),
    num("dis","amPlan","Amarre de barras","m",{step:0.5,hint:"0 = el calculado, redondeado a 0,5 m"}),num("dis","hremPlan","Remate de líneas","m",{step:0.5}),num("dis","dHplan","Partes vivas de bahías vecinas","m",{step:0.05,hint:"Separación horizontal mínima."}),
    num("dis","Fsec","Seccionador abierto: ancho F","m",{step:0.05,hint:"Cota F del catálogo. 0 = no considerar."})],
  /* conductores */
  fConCon:[sel("con","cond","Conductor",()=>[["custom","Personalizado (datos de la ficha técnica)"],...groupBy(CAT.COND,c=>c.tipo==="AAC"?"AAC · aluminio puro (ASTM B231)":"ACSR · Prysmian / Procables (Colombia)",c=>[c.id,c.n])],{wide:true}),
    num("con","d","Diámetro","mm",{show:()=>S.con.cond==="custom"}),num("con","w","Peso","kg/m",{show:()=>S.con.cond==="custom"}),num("con","rts","Carga de rotura","kgf",{show:()=>S.con.cond==="custom"}),
    num("con","r20","Resistencia c.c. a 20 °C","Ω/km",{show:()=>S.con.cond==="custom"}),num("con","aAl","Sección de aluminio","mm²",{show:()=>S.con.cond==="custom"}),
    num("con","nsub","Subconductores por fase","",{step:1}),num("con","sep","Separación del haz","cm",{show:()=>S.con.nsub>1})],
  fConAmp:[chk("con","linkI","Usar la corriente de la barra principal (módulo de equipos)",{wide:true}),num("con","Idis","Corriente de diseño","A",{lock:()=>!!S.con.linkI}),num("con","Ta","Temperatura ambiente máxima","°C"),num("con","Tc","Temperatura máxima del conductor","°C",{hint:"75 °C es el límite habitual."})],
  fConAdv:[num("con","vv","Viento","m/s",{hint:"0,61 m/s: viento mínimo de referencia."}),num("con","eps","Emisividad","",{step:0.05}),num("con","abs","Absortividad solar","",{step:0.05}),num("con","Qs","Radiación solar","W/m²"),num("con","kac","Factor de resistencia en c.a.","",{step:0.01}),num("con","m","Factor de superficie m","",{step:0.01,hint:"Corona: 0,85 para cable trenzado."})],
  fConCc:[chk("con","link","Tomar separación entre fases, vano y flecha del módulo de distancias",{wide:true}),num("con","a","Separación entre fases","m",{lock:()=>!!S.con.link}),
    num("con","Ik","Cortocircuito de diseño","kA",{hint:"Corriente de corta duración de los equipos."}),num("con","kip","Factor de pico ip / Ik","",{hint:"2,6 a 60 Hz"}),num("con","tk","Duración","s"),num("con","te","Temperatura final admisible","°C",{hint:"Aluminio: 200 °C (IEC 60865-1)."})],
  fConMec:[num("con","L","Vano de las barras","m",{step:0.5,lock:()=>!!S.con.link}),sel("con","mMode","Dato del tendido",[["flecha","Flecha → tensión"],["tension","Tensión → flecha"]],{show:()=>S.dis.barra!=="rig"}),
    num("con","f","Flecha","m",{step:0.01,show:()=>S.dis.barra!=="rig"&&S.con.mMode==="flecha",lock:()=>!!S.con.link}),num("con","T","Tensión de tendido por conductor","kgf",{step:10,show:()=>S.dis.barra!=="rig"&&S.con.mMode!=="flecha"}),
    num("con","tubD","Tubo: diámetro exterior","mm",{show:()=>S.dis.barra==="rig"}),num("con","tubT","Tubo: espesor","mm",{show:()=>S.dis.barra==="rig"}),num("con","tubL","Distancia entre soportes","m",{show:()=>S.dis.barra==="rig"}),
    num("con","tubRp","Límite elástico Rp0,2","MPa",{show:()=>S.dis.barra==="rig"}),num("con","tubB","Factor de apoyo β","",{show:()=>S.dis.barra==="rig"})],
  fConCx:[sel("con","cL","Bahía de línea",()=>[["none","No verificar"],...CAT.COND.map(c=>[c.id,c.n])],{wide:true}),sel("con","nCL","Conductores por fase (línea)",[[1,"1"],[2,"2"],[3,"3"],[4,"4"]],{num:true,show:()=>S.con.cL!=="none"}),
    sel("con","cT","Bahía de transformación",()=>[["none","No verificar"],...CAT.COND.map(c=>[c.id,c.n])],{wide:true}),sel("con","nCT","Conductores por fase (transformación)",[[1,"1"],[2,"2"],[3,"3"],[4,"4"]],{num:true,show:()=>S.con.cT!=="none"})],
  /* equipos */
  fEqI:[sel("proy","trTipo","Tipo de transformador",Object.entries(SUBE.TR_TIPO).map(([k,v])=>[k,v[0]]),{wide:true}),...selO("proy","sSel","S1","Potencia por unidad",S_OPTS,"MVA"),num("proy","nTr","Circuitos de transformación","",{step:1}),num("proy","nLin","Circuitos de línea","",{step:1}),num("eq","fc","Factor de sobrecarga y crecimiento","",{step:0.05})],
  fEqCc:[num("eq","Isc","Falla trifásica en barras","kA",{hint:CB("30 kA del enunciado.")}),num("eq","I1","Falla a tierra en barras","kA",{hint:"Del estudio de cortocircuito."}),num("eq","XR","Relación X/R",""),chk("eq","ikMargen","Corta duración con 5 % de reserva frente a la falla",{wide:true,hint:"Si no se marca, se toma la normalizada que cubre la falla trifásica."})],
  fEqSec:[num("eq","Feq","Ancho abierto F","m",{step:0.01,hint:"Cota F del catálogo del seccionador."}),num("eq","Dais","Altura del aislador D","m",{step:0.001,hint:"Del catálogo del seccionador."}),num("eq","sEq","Separación entre polos (plano)","m",{step:0.05,hint:"0 = no verificar"}),num("eq","base","Altura de la base (plano)","m",{step:0.05})]
});
const TIPOS_EQ=()=>{const ce=SUBE.cuentaEquipos(S.proy),sec={barra:"Seccionador de barra (89-1)",transf:"Seccionador de transferencia (89-T)",acople:"Seccionador del acople (89-3)",interr:"Seccionador de interruptor",salida:"Seccionador de salida (89-L)",bypass:"Seccionador de by-pass (89-BY)",seccB:"Seccionador de barras (seccionamiento)"};
  return [{g:"Maniobra",o:[["Interruptor 52","Interruptor (52)"],...(ce.conInt?[["Interruptor de acople longitudinal","Interruptor de acople longitudinal (seccionamiento)"]]:[]),...Object.keys(ce.sec).map(k=>[sec[k],sec[k]])]},{g:"Medida y protección",o:[["Transformador de corriente (CT)","Transformador de corriente (CT)"],["PT de línea","Transformador de tensión de línea (PT)"],["PT de barra","Transformador de tensión de barra (PT)"],["Transformador de tensión capacitivo","Transformador de tensión capacitivo"],["Trampa de onda","Trampa de onda"]]},
    {g:"Transformación y conexiones",o:[["Bornes del transformador","Bornes del transformador"],["Nodo de conexión","Nodo de conexión"],["Otro equipo","Otro equipo"]]}]};
ET.etEq={box:"etEq",get:()=>S.eq.rows,addOpts:TIPOS_EQ,cols:[{k:"n",t:"Equipo",type:"txt",w:180,list:()=>TIPOS_EQ().flatMap(g=>g.o.map(o=>o[0]))},{k:"b",t:"Bahías",type:"txt",w:80},{k:"dps",t:"Pararrayos más cercano",type:"txt",w:120},{k:"l",t:"l (m)",type:"num",step:0.5}],
  res:["MP nivel 1","MP nivel 2","BIL asignado"],add:v=>({n:v||"Equipo nuevo",b:"",dps:"",l:10}),reset:()=>{S.eq.rows=clone(SUBE.EQ_BASE)}};

/* ============================================================
   Distancias
   ============================================================ */
function renderDis(){
  const p=S.dis;if(p.link&&RA&&RA.BIL){p.BIL=RA.BIL;p.BSL=RA.L1&&RA.L1.rII?RA.L1.BSLaN:0}else if(!(S.g.um>245))p.BSL=0;
  if(p.cond==="ACSR")p.K=10;else if(p.cond==="Cu")p.K=1.75;
  const r=RD=calcDis(S.g,p),fl=r.flex;
  const hard=r.checks.filter(c=>!c.ok&&c.lvl==="no"),soft=r.checks.filter(c=>!c.ok&&c.lvl==="wa");
  $("vDis").innerHTML=hard.length?verdict("no","Hay criterios que no cumplen",hard.map(c=>c.txt).join("; ")+"."):soft.length?verdict("wa","Distancias calculadas, con una observación",soft.map(c=>c.txt+": "+c.bad).join("; ")+"."):verdict("ok",p.Wb>0||p.sPlan>0||p.amPlan>0?"Todas las distancias cumplen y la disposición del plano las respeta":"Todas las distancias cumplen",`BIL ${p.BIL} kV · ${p.dMode==="none"?"sin volver a corregir por altitud (el BIL ya la incluye)":"δ = "+fm(r.delta,3)}. Donde la tabla IEC / RETIE pide más que la fórmula, se adopta la tabla.`);
  $("kDis").innerHTML=kpi("Fase–tierra",fm(r.dftA),"m",`tabla ${fm(r.R&&r.R[1])} · fórmula ${fm(r.dft,3)}`,"hl")+kpi("Fase–fase",fm(r.dffA),"m",`${fm(p.fff)} × fase–tierra`,"hl")+kpi("Valor básico",fm(r.VBa),"m",`${fm(p.kVB,2)} × fase–tierra`)+
    kpi("Circulación de personal",fm(r.DvA),"m","VB + 2,25")+kpi("Trabajo horizontal",fm(r.DhA),"m","VB + 1,75")+kpi("Trabajo vertical",fm(r.DtvA),"m","VB + 1,25")+kpi("Vehículos",fm(r.HvehA),"m",`VB + ${fm(p.galibo,2)} + 0,70`)+
    (fl?kpi("Flecha",fm(r.f_m),"m",p.fMode==="pct"?`${fm(p.pct,1)} % de ${fm(p.vano,0)} m`:p.fMode==="val"?"dato":"L²·w/(8·Fh)"):"")+kpi("Separación entre fases",fm(r.SfA),"m",fl?`plano: ${fm(r.sPlan)} m`:"= fase–fase","hl")+kpi("Altura de equipos",fm(r.heqA),"m","2,30 + 0,0105·Um","hl")+
    kpi(fl?"Amarre de barras":"Altura de barras",fm(r.amarreA),"m",`punto bajo ${fm(r.hbLow)} m · mín. ${fm(r.hbReq)}${r.hbVeh?" (vehículos)":""}`,"hl")+kpi("Remate de líneas",fm(r.hremA),"m",p.hremPlan>0?`plano ${fm(p.hremPlan,2)} m`:r.hremVeh?"rige la circulación de vehículos":"5,0 + 0,006·Um ≥ 6 m")+kpi("Ancho mínimo de bahía",fm(r.WbMin),"m",p.Wb>0?`hay ${fm(p.Wb,2)} m`:"2·Sf + 2·fase–estructura",p.Wb>0&&p.Wb<r.WbMin?"bad":"");
  $("tDisChk").innerHTML=`<tr><th class="l">Criterio</th><th>Comparación</th><th class="l">Resultado</th></tr>`+r.checks.map(c=>`<tr><td class="l">${c.txt}</td><td>${c.cmp}</td><td class="l">${c.ok?pill("ok","Cumple"):c.lvl==="info"?pill("ok",c.bad):pill(c.lvl,c.bad)}</td></tr>`).join("");
  $("tCons").innerHTML=`<tr><th class="l">Distancia</th><th class="l">Expresión</th><th>Calculado (m)</th><th>Tabla (m)</th><th>Adoptado (m)</th></tr>`+consRows(r).map(x=>x[0]==="g"?`<tr class="grp"><td colspan="5">${x[1]}</td></tr>`:`<tr><td class="l">${x[0]}</td><td class="l mut">${x[1]}</td><td>${x[2]==null?"—":fm(x[2],3)}</td><td>${x[3]==null?"—":fm(x[3])}</td><td><b>${fm(x[4])}</b></td></tr>`).join("");
  $("consNote").textContent=(r.R?(r.retie.exact?`Fila de la tabla RETIE / IEC para BIL ${p.BIL} kV.`:`BIL ${p.BIL} kV fuera de las filas de la tabla: valores interpolados.`):"BIL fuera de la tabla RETIE.")+" Se adopta el múltiplo de 0,05 m inmediatamente superior; nunca se redondea hacia abajo.";
  $("svgDis").innerHTML=svgDis(r);
  memo("memoDis",memoDis(r));
  setSt("st-dis",hard.length?"no":soft.length?"wa":"ok");
}
function consRows(r){const Rw=r.R||[],p=r.p,fl=r.flex;return[
  ["g","Distancias mínimas"],["Fase–tierra","máx(fórmula, tabla IEC / RETIE)",r.dft,Rw[1],r.dftA],["Fase–fase",`${fm(p.fff)}·d f-t`,r.dff,null,r.dffA],
  ["g","Distancias de seguridad (RETIE)"],["Valor básico VB",`${fm(p.kVB,2)}·d f-t`,r.VB,Rw[2],r.VBa],["Circulación de personal","VB + 2,25",r.Dv,Rw[3],r.DvA],["Zona de trabajo horizontal","VB + 1,75",r.Dh,Rw[4],r.DhA],["Zona de trabajo vertical","VB + 1,25",r.Dtv,Rw[5],r.DtvA],["Circulación de vehículos",`VB + ${fm(p.galibo)} + 0,70`,r.Hveh,null,r.HvehA],["Distancia al encerramiento R","RETIE Tabla 3.22.1.a",null,r.Rcer.R,r.Rcer.R],
  ["g","Flecha y flexibilidad"],...(fl?[["Flecha f",p.fMode==="pct"?`${fm(p.pct,1)} % del vano de ${fm(p.vano,1)} m`:p.fMode==="val"?"dato":"L²·w/(8·Fh)",r.f_m,null,r.f_m]]:[]),["Separación entre fases Sf",fl?"d f-f + K√f [cm]":"d f-f",r.Sf,null,r.SfA],["Fase–estructura flexible",fl?"d f-t + K√f [cm]":"d f-t",r.Dfe,null,r.DfeA],
  ...(r.sEq?[["Separación entre polos del seccionador","F + d f-f",r.sEq,null,r.sEqA]]:[]),["Ancho mínimo de bahía",`2·${r.sEq?"máx(Sf, polos)":"Sf"} + 2·D f-e`,r.WbMin,null,p.Wb>0?p.Wb:r.WbMin],
  ["g","Alturas de diseño (Mejía Villegas)"],["Altura de equipos","2,30 + 0,0105·Um",r.heqF,null,r.heqA],["Barras, punto más bajo","5,0 + 0,0125·Um",r.hbF,null,r.hbLow],...(fl?[["Amarre de barras en pórtico","h barras + f",r.amarre,null,r.amarreA]]:[]),["Remate de líneas","5,0 + 0,006·Um ≥ 6",r.hremF,null,r.hremA]]}
function memoDis(r){
  const p=r.p,g=r.g,fl=r.flex,Rw=r.R||[],{st,add}=memoList(),A=v=>AD("Adoptado "+fm(v)+" m"),n3=x=>fm(x,3),n2=x=>fm(x,2),n4=x=>fm(x,4);
  if(p.dMode==="iec")add("Condiciones del sitio","Densidad relativa del aire",`Corrige la capacidad aislante del aire por altura (${fm(g.alt,0)} msnm) y temperatura (${fm(g.t,0)} °C).`,[`${I("p")} = 101,3·${I("e")}<sup>−${I("h")}/8150</sup> = ${R(fm(r.pk,2)+" kPa")}`,`${I("δ")} = ${F(I("p"),"101,3")}·${F("293","273 + "+I("t"))} = ${R(n4(r.delta))}`],"IEC 60071-2");
  else if(p.dMode==="baro")add("Condiciones del sitio","Densidad relativa del aire","Presión barométrica según la altura del sitio.",[`log ${I("b")} = log 76 − ${F(I("h"),"18 336")} → ${I("b")} = ${R(n2(r.b)+" cmHg")}`,`${I("δ")} = ${F("3,92·"+I("b"),"273 + "+I("t"))} = ${R(n4(r.delta))}`],"Apuntes del curso");
  else add("Condiciones del sitio","Corrección por altitud",p.dMode==="none"?`<b>No se aplica Ka a las distancias</b>: el BIL de ${p.BIL} kV ya quedó corregido por altitud en la coordinación de aislamiento. Corregir otra vez sería contar la altura dos veces.`:"Valor fijado por el usuario.",[`${I("δ")} = ${R(n4(r.delta))}`],"IEC 60071-2");
  add("Distancias mínimas","Fase–tierra",`Separación en el aire entre una parte energizada y una estructura a tierra para el BIL de ${p.BIL} kV (configuración conductor–estructura).`,
    [`Tabla IEC 60071 / RETIE: ${Sb(I("d"),"f-t")} = ${R(n2(Rw[1])+" m")} ; fórmula del curso: ${fm(p.kS)}·${r.delta===1?"":"δ<sup>−"+fm(p.nExp,1)+"</sup>·"}${F("BIL",Sb(I("E"),"s"))} = ${n3(r.dft)} m`+A(r.dftA)],"IEC 60071-2 · IEC 61936-1 · RETIE");
  if(r.dSI)add("Distancias mínimas","Distancia por impulso de maniobra",`Por encima de 245 kV (rango II) el impulso de maniobra puede exigir más distancia que el rayo.`,[`${Sb(I("d"),"maniobra")} = ${R(n3(r.dSI)+" m")}`],"IEC 60071-2 Tabla A.2");
  add("Distancias mínimas","Fase–fase",`En el rango I la IEC asigna la misma distancia fase–fase que fase–tierra frente al rayo; el factor ${fm(p.fff)} es un criterio de diseño que deja holgura entre fases.`,
    [`${Sb(I("d"),"f-f")} = ${fm(p.fff)}·${n2(r.dftBase)} = ${R(n3(r.dff)+" m")}`+A(r.dffA)],"IEC 60071-2 · Mejía Villegas");
  add("Distancias de seguridad","Valor básico",`Es la distancia fase–tierra aumentada un 10 %. Sobre ella se suma la zona de seguridad de cada actividad.`,[`${Sb(I("V"),"o")} = ${fm(p.kVB,2)}·${n2(r.dftBase)} = ${R(n2(r.VBa)+" m")}`],"RETIE Tabla 3.22.1.c");
  add("Distancias de seguridad","Personal y zonas de trabajo",`Una persona con los brazos levantados alcanza 2,25 m; al trabajar sobre un equipo se dejan 1,75 m en horizontal y 1,25 m en vertical.`,
    [`${Sb(I("H"),"v")} = ${n2(r.VBa)} + 2,25 = ${R(n2(r.Dv)+" m")}`+A(r.DvA),`${Sb(I("D"),"h")} = ${n2(r.VBa)} + 1,75 = ${R(n2(r.Dh)+" m")}`+A(r.DhA),`${Sb(I("D"),"v")} = ${n2(r.VBa)} + 1,25 = ${R(n2(r.Dtv)+" m")}`+A(r.DtvA)],"RETIE");
  add("Distancias de seguridad","Circulación de vehículos",`Altura libre sobre las vías para una grúa o carro canasta de ${fm(p.galibo,2)} m, más 0,70 m de tolerancia.`,[`${Sb(I("D"),"veh")} = ${n2(r.VBa)} + ${n2(p.galibo)} + 0,70 = ${R(n2(r.Hveh)+" m")}`+A(r.HvehA)],"RETIE");
  if(fl)add("Flecha y flexibilidad","Distancia de flexibilidad",`Las barras tendidas cuelgan y se mueven con el viento o en un cortocircuito; a la distancia mínima se le suma un término que crece con la flecha (d y f en cm).`,
    [p.fMode==="pct"?`${I("f")} = ${fm(p.pct,1)} %·${fm(p.vano,2)} = ${R(n2(r.f_m)+" m")}`:p.fMode==="val"?`${I("f")} = ${R(n2(r.f_m)+" m")}`:`${I("f")} = ${F(I("L")+"²·"+I("w"),"8·"+Sb(I("F"),"h"))} = ${R(n3(r.f_m)+" m")}`,
     `${Sb(I("S"),"f")} = ${Sb(I("d"),"f-f")} + ${fm(p.K)}${Q(I("f"))} = ${fm(r.dffA*100,0)} + ${fm(p.K)}·${Q(fm(r.f_cm,0))} = ${R(fm(r.Sf*100,1)+" cm")}`+A(r.SfA),
     `${Sb(I("D"),"f-e")} = ${Sb(I("d"),"f-t")} + ${fm(p.K)}${Q(I("f"))} = ${fm(r.dftA*100,0)} + ${fm(r.sway,1)} = ${R(fm(r.Dfe*100,1)+" cm")}`+A(r.DfeA)],"Mejía Villegas");
  add("Flecha y flexibilidad","Ancho de bahía",`En cada bahía hay tres fases con dos separaciones entre ellas y una distancia a cada columna.${r.sEq?` Con un seccionador de apertura central, los brazos abiertos giran hacia las fases vecinas: los polos deben quedar a F + d f-f = ${n2(r.sEqA)} m.`:""}`,
    [`${Sb(I("W"),"b,mín")} = 2·${n2(Math.max(r.SfA,r.sEqA))} + 2·${n2(r.DfeA)} = ${R(n2(r.WbMin)+" m")}`+(p.Wb>0?MU(`${p.Wb>=r.WbMin?"≤":">"} ${n2(p.Wb)} m de diseño`):"")],"Mejía Villegas");
  add("Alturas de diseño","Altura de equipos","Altura mínima de las partes energizadas de los equipos; además debe cubrir la circulación de personal.",[`${Sb(I("h"),"s")} = 2,30 + 0,0105·${fmU(g.um)} = ${R(n2(r.heqF)+" m")} ; ≥ ${Sb(I("H"),"v")} = ${n2(r.Dv)} m`+A(r.heqA)],"Mejía Villegas");
  add("Alturas de diseño","Barras colectoras",fl?"La fórmula da el punto más bajo del conductor, en la mitad del vano; el amarre va una flecha más arriba.":"Altura de las barras sobre el suelo.",
    [`${Sb(I("h"),"b")} = 5,0 + 0,0125·${fmU(g.um)} = ${R(n2(r.hbF)+" m")}`+(r.hbVeh?` ; vehículos ${n2(r.Hveh)} m ${MU("rige la circulación de vehículos")}`:""),...(fl?[`${Sb(I("h"),"amarre")} = ${n2(r.hbReq)} + ${n2(r.f_m)} = ${R(n2(r.amarre)+" m")}`+A(r.amarreA)+MU(`punto más bajo ${n2(r.hbLow)} m`)]:[A(r.amarreA)])],"Mejía Villegas");
  add("Alturas de diseño","Remate de líneas","Altura a la que llegan las líneas al pórtico; la referencia exige como mínimo 6 m.",[`${Sb(I("h"),"l")} = 5,0 + 0,006·${fmU(g.um)} = ${R(n2(r.hremF)+" m")} ≥ 6 m`+(r.hremVeh?` ; vehículos ${n2(r.Hveh)} m ${MU("rige la circulación de vehículos")}`:"")+A(r.hremA)],"Mejía Villegas");
  return st;
}
function svgDis(r){
  const p=r.p,Wb=r.Wb,s=r.flex?r.sPlan:r.SfA,half=Wb/2,xs=[-s,0,s],VB=r.VBa,top=Math.max(r.amarreA+0.6,r.hbLow+VB+0.25)+0.9;
  const vw=820,vh=460,padL=90,padR=130,padB=60,sc=Math.min((vw-padL-padR)/(Wb+1.6),(vh-20-padB)/top);
  const X=x=>padL+(vw-padL-padR)/2+x*sc,Y=y=>vh-padB-y*sc;
  const L=(x1,y1,x2,y2,c,w=1.5,da="")=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}"${da?` stroke-dasharray="${da}"`:""}/>`;
  const T=(x,y,t,a="middle",c="var(--ink)",w="400",z=12)=>`<text x="${x}" y="${y}" font-size="${z}" text-anchor="${a}" fill="${c}" font-weight="${w}">${t}</text>`;
  let g=`<rect x="${X(-half-0.5)}" y="${Y(2.25)}" width="${(Wb+1)*sc}" height="${2.25*sc}" fill="var(--safe)" opacity=".8"/>`;
  const zs=`fill="var(--zone)" opacity=".6" stroke="var(--live)" stroke-opacity=".4" stroke-dasharray="4 3"`;
  xs.forEach(x=>{g+=`<circle cx="${X(x)}" cy="${Y(r.hbLow)}" r="${VB*sc}" ${zs}/>`;g+=`<rect x="${X(x-0.25-VB)}" y="${Y(r.heqA+0.35+VB)}" width="${(0.5+2*VB)*sc}" height="${(0.35+2*VB)*sc}" rx="${VB*sc}" ${zs}/>`});
  g+=L(X(-half-0.8),Y(0),X(half+0.8),Y(0),"var(--muted)",2);
  const colTop=r.amarreA+0.6;
  [-half,half].forEach(x=>g+=`<rect x="${X(x)-5}" y="${Y(colTop)}" width="10" height="${colTop*sc}" fill="var(--steel)"/>`);
  g+=`<rect x="${X(-half)-5}" y="${Y(colTop)-8}" width="${Wb*sc+10}" height="8" fill="var(--steel)"/>`;
  xs.forEach(x=>{g+=L(X(x),Y(colTop),X(x),Y(r.hbLow)+5,"var(--steel)",3,"3 2");g+=`<circle cx="${X(x)}" cy="${Y(r.hbLow)}" r="5" fill="var(--live)"/>`;
    g+=`<rect x="${X(x)-4}" y="${Y(r.heqA-1)}" width="8" height="${(r.heqA-1)*sc}" fill="var(--steel)"/>`;
    for(let i=0;i<5;i++)g+=`<rect x="${X(x)-7}" y="${Y(r.heqA-1+0.2*(i+1))}" width="14" height="${Math.max(2,0.1*sc)}" rx="2" fill="var(--muted)"/>`;
    g+=`<rect x="${X(x)-0.25*sc}" y="${Y(r.heqA+0.35)}" width="${0.5*sc}" height="${0.35*sc}" rx="3" fill="var(--live)"/>`;g+=L(X(x),Y(r.heqA+0.35),X(x),Y(r.hbLow)+5,"var(--live)",2,"5 3")});
  const px=X(-s/2);
  g+=`<g stroke="var(--ink)" stroke-width="2" fill="none" stroke-linecap="round"><circle cx="${px}" cy="${Y(1.62)}" r="${0.12*sc}" fill="none"/>`+L(px,Y(1.5),px,Y(0.9),"var(--ink)",2)+L(px,Y(0.9),px-0.18*sc,Y(0),"var(--ink)",2)+L(px,Y(0.9),px+0.18*sc,Y(0),"var(--ink)",2)+L(px,Y(1.4),px-0.22*sc,Y(2.25),"var(--ink)",2)+L(px,Y(1.4),px+0.22*sc,Y(2.25),"var(--ink)",2)+`</g>`;
  /* guiño al profe: camiseta azul y blanca de su equipo y un violín en alto (no cambia las medidas: las manos siguen en 2,25 m) */
  {const u=sc/100,hx=px-0.22*sc,hy=Y(2.25),bx=px+0.22*sc;
   g+=`<g aria-label="Persona con camiseta azul y violín"><title>Un saludo al profe: violín en mano y la camiseta azul</title>`+
     `<path d="M${px-0.16*sc} ${Y(1.47)}L${px-0.08*sc} ${Y(1.5)}Q${px} ${Y(1.44)} ${px+0.08*sc} ${Y(1.5)}L${px+0.16*sc} ${Y(1.47)}L${px+0.13*sc} ${Y(0.92)}L${px-0.13*sc} ${Y(0.92)}Z" fill="#1d4fa3" stroke="var(--ink)" stroke-width="1.2"/>`+
     `<path d="M${px-0.07*sc} ${Y(1.49)}L${px} ${Y(1.4)}L${px+0.07*sc} ${Y(1.49)}" fill="none" stroke="#fff" stroke-width="2"/>`+
     `<rect x="${px-0.13*sc}" y="${Y(1.06)}" width="${0.26*sc}" height="${Math.max(2,0.04*sc)}" fill="#fff"/>`+
     `<g transform="translate(${hx} ${hy}) rotate(30) scale(${1.15*u})"><path d="M0 18 C-11 18 -11 34 -10 40 C-9 47 -6 49 -9 55 C-12 62 -11 72 0 72 C11 72 12 62 9 55 C6 49 9 47 10 40 C11 34 11 18 0 18Z" fill="#a0612e" stroke="#4a2a12" stroke-width="${1.6/u}"/>`+
       `<rect x="-1.4" y="-6" width="2.8" height="26" fill="#2b1a0c"/><circle cx="0" cy="-8" r="2.6" fill="#4a2a12"/>`+
       `<path d="M-4 46 q-1.5 5 0 10 M4 46 q1.5 5 0 10" fill="none" stroke="#2b1a0c" stroke-width="${1/u}"/><rect x="-4" y="62" width="8" height="2.2" fill="#2b1a0c"/></g>`+
     `<g transform="translate(${bx} ${hy}) rotate(-30) scale(${1.15*u})"><line x1="0" y1="-8" x2="0" y2="58" stroke="#4a2a12" stroke-width="${1.6/u}" stroke-linecap="round"/><line x1="2.2" y1="-6" x2="2.2" y2="54" stroke="#e9dcc3" stroke-width="${1/u}"/></g></g>`}
  const A="var(--link)";
  const dV=(x,y0,y1,lab,side)=>{const xx=X(x);return L(xx,Y(y0),xx,Y(y1),A,1.2)+L(xx-4,Y(y0),xx+4,Y(y0),A,1.2)+L(xx-4,Y(y1),xx+4,Y(y1),A,1.2)+T(xx+6*side,(Y(y0)+Y(y1))/2+4,lab,side>0?"start":"end",A,"600")};
  const dH=(x0,x1,y,lab,below)=>L(X(x0),Y(y),X(x1),Y(y),A,1.2)+L(X(x0),Y(y)-4,X(x0),Y(y)+4,A,1.2)+L(X(x1),Y(y)-4,X(x1),Y(y)+4,A,1.2)+T((X(x0)+X(x1))/2,below?Y(y)+16:Y(y)-6,lab,"middle",A,"600");
  g+=dV(-half-0.4,0,r.hbLow,`barras ${fm(r.hbLow)} m`,-1);
  if(r.flex)g+=L(X(-half)-14,Y(r.amarreA),X(-half)+14,Y(r.amarreA),A,1.4,"3 2")+T(X(-half)-18,Y(r.amarreA)+4,`amarre ${fm(r.amarreA)} m`,"end",A,"600");
  g+=dV(half+0.4,0,r.heqA,`equipos ${fm(r.heqA)} m`,1);g+=dV(-s/2+0.45,0,2.25,"2,25 m",1);
  g+=dH(-s,0,r.hbLow+VB+0.25,`fases a ${fm(s)} m (mín. ${fm(r.SfA)})`);g+=dH(-half,half,-0.35,`Bahía ${fm(Wb)} m${p.Wb>0?` (mín. ${fm(r.WbMin)} m)`:""}`,true);
  g+=L(X(s),Y(r.heqA+0.175),X(s)+VB*sc*0.7071,Y(r.heqA+0.175)-VB*sc*0.7071,"var(--live)",1.4)+T(X(s)+VB*sc*0.7071+4,Y(r.heqA+0.175)-VB*sc*0.7071-4,`VB ${fm(VB)} m`,"start","var(--live)","600");
  g+=T(X(half)+10,Y(colTop)+4,`${fmU(r.g.um)} kV · BIL ${p.BIL} kV`,"start","var(--muted)");
  return `<svg viewBox="0 0 ${vw} ${vh}" width="100%" style="min-width:520px" role="img" aria-label="Corte transversal de una bahía">${g}</svg>`;
}

/* ============================================================
   Conductores y barrajes
   ============================================================ */
function renderCon(){
  const g=S.g,p=S.con,rig=S.dis.barra==="rig";
  if(p.link&&RD){p.a=RD.sPlan;p.L=S.dis.vano;if(RD.flex){p.f=Math.round(RD.f_m*1000)/1000}}
  if(p.linkI)p.Idis=Math.round(corrientes().IBP*10)/10;
  const o=RC=calcCon(g,p,{Sf:p.link&&RD?RD.sPlan:0,rig,Ilin:RE0().Ilin,Itr:RE0().Itr});
  const fails=[];if(!o.okAmp)fails.push("no lleva la corriente de diseño");if(!o.okCor)fails.push("hay efecto corona");if(!o.okTh)fails.push("no aguanta térmicamente el cortocircuito");if(rig?!o.okTub:!o.okT)fails.push(rig?"el tubo se pasa de esfuerzo":"la tensión de tendido supera el 25 % de la rotura");o.cx.filter(x=>!x.ok).forEach(x=>fails.push(x.t.toLowerCase()+" sobrecargada"));
  const nom=`${o.n>1?o.n+" × ":""}${o.nombre}${o.n>1?" por fase":""}`;
  $("vCon").innerHTML=o.ok?verdict("ok",`${esc(nom)}: cumple`,`Lleva ${fm(o.Icap,0)} A a ${fm(p.Tc,0)} °C y ${fm(g.alt,0)} m (se piden ${fm(p.Idis,1)} A, ${fm(100*o.uso,0)} %), no hay corona y aguanta ${fm(o.Ith,1)} kA durante ${fm(p.tk,1)} s.`)
    :verdict("no",`${esc(nom)}: no cumple todavía`,"Motivo: "+fails.join("; ")+".");
  $("kCon").innerHTML=kpi("Capacidad de la fase",fm(o.Icap,0),"A",`${fm(100*o.uso,0)} % ocupada con ${fm(p.Idis,0)} A`,o.okAmp?"hl":"bad")+kpi("Gradiente en la superficie",fm(o.Emax,2),"kV/cm",`crítico ${fm(o.E0,2)} kV/cm`,o.okCor?"hl":"bad")+
    kpi("Sección mínima por cortocircuito",fm(o.Amin,0),"mm²",`tiene ${fm(o.n*o.aAl,0)} mm²`,o.okTh?"hl":"bad")+kpi("Cortocircuito admisible",fm(o.Ith,1),"kA",`${fm(p.tk,1)} s · se piden ${fm(p.Ik,1)} kA`)+
    kpi("Fuerza pico entre fases",fm(o.Fp,0),"N/m",`ip ${fm(o.ip,1)} kA · fases a ${fm(o.a,2)} m`)+
    (rig?kpi("Esfuerzo en el tubo",fm(o.sig,0),"MPa",`admisible ${fm(o.sigAdm,0)} MPa`,o.okTub?"hl":"bad"):kpi("Flecha",fm(o.f,2),"m",`${fm(o.fPct,1)} % de ${fm(p.L,1)} m`)+kpi("Tensión de tendido",fm(o.T,0),"kgf",`${fm(o.pctRts,1)} % de la rotura`,o.okT?"":"bad"));
  $("tCon").innerHTML=`<tr><th class="l">Criterio</th><th>Calculado</th><th>Límite</th><th class="l">Estado</th></tr>
   <tr><td class="l">Capacidad de corriente (IEEE 738)</td><td>${fm(o.Icap,0)} A</td><td>≥ ${fm(p.Idis,1)} A</td><td class="l">${okp(o.okAmp)}</td></tr>
   <tr><td class="l">Efecto corona: gradiente en la superficie (Peek)</td><td>${fm(o.Emax,2)} kV/cm</td><td>≤ ${fm(o.E0,2)} kV/cm</td><td class="l">${okp(o.okCor)}</td></tr>
   <tr><td class="l">Cortocircuito térmico (IEC 60865-1)</td><td>${fm(o.n*o.aAl,0)} mm²</td><td>≥ ${fm(o.Amin,0)} mm²</td><td class="l">${okp(o.okTh)}</td></tr>`+
   (rig?`<tr><td class="l">Tubo: esfuerzo de flexión en cortocircuito</td><td>${fm(o.sig,0)} MPa</td><td>≤ ${fm(o.sigAdm,0)} MPa</td><td class="l">${okp(o.okTub)}</td></tr>`
       :`<tr><td class="l">Tensión de tendido</td><td>${fm(o.pctRts,1)} % de la rotura</td><td>≤ 25 %</td><td class="l">${okp(o.okT)}</td></tr>
   <tr><td class="l">Balanceo de los cables en cortocircuito</td><td>${fm(o.ang,0)}°</td><td class="l mut" colspan="2" style="white-space:normal">Informativo. La distancia mínima durante el balanceo se verifica con el método completo de IEC 60865-1 (debe quedar al menos el 50 % de la fase–fase).</td></tr>`)+
   o.cx.map(x=>`<tr><td class="l">${x.t}: ${x.n>1?x.n+" × ":""}${esc(x.C.n)}</td><td>${fm(x.Ia,0)} A</td><td>≥ ${fm(x.I,1)} A</td><td class="l">${okp(x.ok,`Cumple (${fm(100*x.uso,0)} %)`)}</td></tr>`).join("")+
   (o.cat?`<tr><td class="l">Comprobación con el catálogo</td><td>${fm(SUBE.amp738({D:o.d/1000,R:o.r20*p.kac*(1+0.00403*55)/1000,Ta:25,Tc:75,V:0.61,phi:90,He:0,eps:0.5,alpha:0.5,Qs:1000}).I,0)} A</td><td>${fm(o.cat.amp,0)} A de catálogo</td><td class="l mut" style="white-space:normal">A 75 °C, ambiente 25 °C, viento 0,61 m/s, a nivel del mar.</td></tr>`:"");
  $("chCon").innerHTML=chartCon(g,p,rig);
  memo("memoCon",memoCon(o,g,p,rig));
  setSt("st-con",o.ok?"ok":"no");
}
function chartCon(g,p,rig){
  const Ts=[];for(let T=Math.max(40,Math.ceil((p.Ta+5)/5)*5);T<=100;T+=5)Ts.push(T);
  const pts=Ts.map(T=>({T,I:calcCon(g,{...p,Tc:T},{rig}).Icap})),W=520,H=240,pl=50,pr=14,pt=12,pb=36,maxY=Math.max(p.Idis,...pts.map(q=>q.I))*1.1||1,t0=Ts[0],t1=100;
  const X=t=>pl+(W-pl-pr)*(t-t0)/Math.max(1,t1-t0),Y=v=>pt+(H-pt-pb)*(1-v/maxY);let s="";
  const step=maxY>4000?1000:maxY>2000?500:maxY>800?250:100;
  for(let v=0;v<=maxY;v+=step)s+=`<line x1="${pl}" y1="${Y(v)}" x2="${W-pr}" y2="${Y(v)}" stroke="var(--line)"/><text x="${pl-6}" y="${Y(v)+4}" font-size="11" text-anchor="end" fill="var(--muted)">${v}</text>`;
  Ts.filter(t=>t%10===0).forEach(t=>s+=`<text x="${X(t)}" y="${H-pb+16}" font-size="11" text-anchor="middle" fill="var(--muted)">${t}</text>`);
  s+=`<text x="${(pl+W-pr)/2}" y="${H-4}" font-size="11" text-anchor="middle" fill="var(--muted)">Temperatura del conductor (°C) · corriente en A</text>`;
  s+=`<line x1="${pl}" y1="${Y(p.Idis)}" x2="${W-pr}" y2="${Y(p.Idis)}" stroke="var(--no)" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${W-pr}" y="${Y(p.Idis)-5}" font-size="11" text-anchor="end" fill="var(--no)" font-weight="600">diseño ${fm(p.Idis,0)} A</text>`;
  s+=`<polyline points="${pts.map(q=>`${X(q.T)},${Y(q.I)}`).join(" ")}" fill="none" stroke="var(--chart1)" stroke-width="2.2"/>`+pts.map(q=>`<circle cx="${X(q.T)}" cy="${Y(q.I)}" r="${q.T===p.Tc?5:3}" fill="var(--chart1)"/>`).join("");
  if(p.Tc>=t0&&p.Tc<=t1)s+=`<line x1="${X(p.Tc)}" y1="${pt}" x2="${X(p.Tc)}" y2="${H-pb}" stroke="var(--ink)" stroke-opacity=".35" stroke-dasharray="2 3"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Capacidad de corriente según la temperatura del conductor">${s}</svg>`;
}
function memoCon(o,g,p,rig){
  const {st,add}=memoList(),A=o.amp,hz=o.n>1;
  add("Capacidad de corriente","Resistencia a la temperatura de operación",`${esc(o.nombre)}: ${fm(o.d,1)} mm de diámetro y ${fm(o.r20,4)} Ω/km a 20 °C. El factor ${fm(p.kac,2)} agrega el efecto de la corriente alterna.`,
    [`${Sb(I("R"),"Tc")} = ${fm(o.r20,4)}·${fm(p.kac,2)}·[1 + 0,00403·(${fm(p.Tc,0)} − 20)] = ${R(fm(o.RTc*1000,4)+" Ω/km")}`],"IEEE 738");
  add("Capacidad de corriente","Balance térmico del conductor",`El conductor se calienta por la corriente y el sol, y se enfría por el viento y por radiación. A ${fm(g.alt,0)} m el aire es menos denso y enfría menos.`,
    [`${Sb(I("q"),"c")} = ${R(fm(A.qc,1)+" W/m")} ; ${Sb(I("q"),"r")} = ${R(fm(A.qr,1)+" W/m")} ; ${Sb(I("q"),"s")} = ${R(fm(A.qs,1)+" W/m")}`,
     `${I("I")} = ${Q(F(Sb(I("q"),"c")+" + "+Sb(I("q"),"r")+" − "+Sb(I("q"),"s"),Sb(I("R"),"Tc")))} = ${R(fm(A.I,0)+" A")}${hz?` ; por fase: ${o.n}·${fm(A.I,0)} = ${R(fm(o.Icap,0)+" A")}`:""} ${o.okAmp?AD("≥ "+fm(p.Idis,1)+" A"):BD("< "+fm(p.Idis,1)+" A")}`],"IEEE Std 738");
  add("Efecto corona","Gradiente en la superficie",`Si el campo en la superficie del conductor supera el que el aire aguanta, el aire se ioniza: hay pérdidas, ruido e interferencia. Fases a ${fm(o.a,2)} m.`,
    [`δ = ${F("3,92·"+fm(o.b,1),"273 + "+fm(g.t,0))} = ${R(fm(o.delta,3))} ; ${Sb(I("E"),"0")} = 21,1·${fm(p.m,2)}·${fm(o.delta,3)} = ${R(fm(o.E0,2)+" kV/cm")}`,
     `${Sb(I("E"),"máx")} = ${F(Sb(I("U"),"m")+"/√3",(hz?I("n")+"·":"")+I("r")+"·ln("+I("a")+"/"+Sb(I("r"),hz?"eq":"")+")")} = ${R(fm(o.Emax,2)+" kV/cm")} ${o.okCor?AD("sin corona"):BD("hay corona")}`],"Peek");
  add("Cortocircuito","Sección mínima",`El aluminio puede pasar de ${fm(p.Tc,0)} °C a ${fm(p.te,0)} °C durante la falla. Eso fija una densidad de corriente admisible durante 1 s.`,
    [`${Sb(I("S"),"thr")} = ${R(fm(o.Sthr,1)+" A/mm²")} ; ${Sb(I("A"),"mín")} = ${F(Sb(I("I"),"k")+"·"+Q(Sb(I("t"),"k")),Sb(I("S"),"thr"))} = ${F(fm(p.Ik*1000,0)+"·"+Q(fm(p.tk,1)),fm(o.Sthr,1))} = ${R(fm(o.Amin,0)+" mm²")} ${o.okTh?AD("≤ "+fm(o.n*o.aAl,0)+" mm²"):BD("> "+fm(o.n*o.aAl,0)+" mm²")}`],"IEC 60865-1");
  add("Cortocircuito","Fuerza entre fases",`Es la carga con la que se diseñan cadenas, pórticos y conectores.`,
    [`${Sb(I("i"),"p")} = ${fm(p.kip,2)}·${fm(p.Ik,1)} = ${R(fm(o.ip,1)+" kA")} ; ${I("F")} = 2·10<sup>−7</sup>·${F("√3","2")}·${F(Sb(I("i"),"p")+"²",I("a"))} = ${R(fm(o.Fp,0)+" N/m")}`],"IEC 60865-1");
  if(rig)add("Barraje rígido","Esfuerzo en el tubo",`Tubo de ${fm(p.tubD,0)} × ${fm(p.tubT,1)} mm apoyado cada ${fm(p.tubL,1)} m.`,
    [`σ = β·${F(I("F")+"·"+I("l")+"²","8·"+I("Z"))} = ${R(fm(o.sig,0)+" MPa")} ; ${Sb("σ","adm")} = ${fm(o.q,2)}·${fm(p.tubRp,0)} = ${R(fm(o.sigAdm,0)+" MPa")} ${o.okTub?AD("cumple"):BD("no cumple")}`],"IEC 60865-1");
  else add("Tendido","Flecha y tensión",p.mMode==="flecha"?`Con la flecha fijada (${fm(o.f,2)} m) la tensión de tendido sale de la parábola del vano.`:`Con la tensión fijada se obtiene la flecha.`,
    [`${I("T")} = ${F(I("w")+"·"+I("L")+"²","8·"+I("f"))} = ${F(fm(o.w,3)+"·"+fm(p.L,1)+"²","8·"+fm(o.f,3))} = ${R(fm(o.T,0)+" kgf")} ; ${F(I("T"),"RTS")} = ${R(fm(o.pctRts,1)+" %")} ${o.okT?AD("≤ 25 %"):BD("> 25 %")}`],"Parábola del vano");
  o.cx.forEach(x=>add("Conexiones de bahía",x.t,`${x.n>1?x.n+" conductores por fase · ":""}${esc(x.C.n)} a ${fm(p.Tc,0)} °C, ${fm(p.Ta,0)} °C de ambiente y ${fm(g.alt,0)} m.`,[`${I("I")} = ${R(fm(x.Ia,0)+" A")} ${x.ok?AD("≥ "+fm(x.I,1)+" A ("+fm(100*x.uso,0)+" %)"):BD("< "+fm(x.I,1)+" A")}`],"IEEE 738"));
  return st;
}

/* ============================================================
   Equipos
   ============================================================ */
const RE0=corrientes;
function renderEq(){
  const g=S.g,p=S.eq,o=RE=calcEq(g,S.proy,p,RA,RD),B1=RA.BIL,B2=RA.BIL2,mp=RA.kmin-1;
  const pend=o.rows.filter(r=>r.asg==null);
  const msg=[];if(pend.length)msg.push(`${pend.length} equipo${pend.length>1?"s quedan":" queda"} a más de ${fm(RA.lmax2,1)} m de un pararrayos`);if(!o.okS)msg.push("los polos del seccionador están muy juntos");if(!o.okBase)msg.push("la base del seccionador está muy baja");if(o.u3>1||o.u1>1)msg.push("la falla supera la corriente asignada");
  $("vEq").innerHTML=o.ok?verdict("ok","Todos los equipos quedan protegidos",`${o.n1} con BIL ${B1} kV${B2?` y ${o.n2} con BIL ${B2} kV`:""}. Corrientes asignadas de ${fm(o.rLin,0)} A en bahías y ${fm(o.rBP,0)} A en la barra principal; ${fm(o.Ik,1)} kA / 1 s y ${fm(o.ipA,0)} kA de pico.`)
    :verdict("no","Hay equipos por resolver",msg.join("; ")+".");
  $("kEq").innerHTML=kpi("Potencia máxima",fm(o.Smax,0),"MVA",`${S.proy.nTr} × ${o.nU} × ${fm(+S.proy.S1,0)} MVA`)+kpi("Corriente de la barra principal",fm(o.IBP,1),"A",`asignada ${fm(o.rBP,0)} A`,"hl")+kpi("Corriente de bahía",fm(Math.max(o.Ilin,o.Itr),1),"A",`asignada ${fm(Math.max(o.rLin,o.rTr),0)} A`,"hl")+
    kpi("Corta duración asignada",fm(o.Ik,1),"kA",`1 s · falla ${fm(p.Isc,1)} kA (${fm(100*o.u3,0)} %)`,o.u3<=1?"hl":"bad")+kpi("Pico asignado",fm(o.ipA,0),"kA",`calculado ${fm(o.ip3,1)} kA (${fm(100*o.uip,0)} %)`,o.uip<=1?"":"bad")+
    kpi(`Equipos con BIL ${B1} kV`,o.n1,"",`a ${fm(RA.lmax1,1)} m o menos`)+(B2?kpi(`Equipos con BIL ${B2} kV`,o.n2,"",`hasta ${fm(RA.lmax2,1)} m`):"")+kpi("Sin protección suficiente",o.nNo,"",o.nNo?"mover o agregar pararrayos":"ninguno",o.nNo?"bad":"");
  $("tEqI").innerHTML=`<tr><th class="l">Elemento</th><th>Corriente de diseño</th><th>Asignada</th><th class="l">Nota</th></tr>`+
    [["Bahía de línea",o.Ilin,o.rLin,`1,2·Inom / ${S.proy.nLin} líneas`],["Bahía de transformador",o.Itr,o.rTr,`1,2·Inom / ${S.proy.nTr} bancos`],["Bahía y barra de transferencia",o.IBT,o.rBT,"la mayor de las bahías (una a la vez)"],["Barra principal",o.IBP,o.rBP,"recoge todas las bahías"]]
      .map(r=>`<tr><td class="l">${r[0]}</td><td>${fm(r[1],1)} A</td><td><b>${fm(r[2],0)} A</b></td><td class="l mut">${r[3]}</td></tr>`).join("")+
    `<tr class="grp"><td colspan="4">Cortocircuito (IEC 62271-1 · IEC 60909)</td></tr>
     <tr><td class="l">Falla trifásica en barras</td><td>${fm(p.Isc,2)} kA · pico ${fm(o.ip3,1)} kA</td><td><b>${fm(o.Ik,1)} kA / ${fm(o.ipA,0)} kA</b></td><td class="l">${pill(o.u3<=0.95?"ok":"wa",`${fm(100*o.u3,0)} % y ${fm(100*o.uip,0)} %`)}</td></tr>
     <tr><td class="l">Falla a tierra en barras</td><td>${fm(p.I1,2)} kA · pico ${fm(o.ip1,1)} kA</td><td><b>${fm(o.Ik,1)} kA / ${fm(o.ipA,0)} kA</b></td><td class="l">${pill(o.u1<=0.95?"ok":"wa",`${fm(100*o.u1,0)} % y ${fm(100*o.uip1,0)} %`)}${o.Ik40>o.Ik?` <span class="mut">Se recomienda pedir ${fm(o.Ik40,0)} kA en interruptores y seccionadores.</span>`:""}</td></tr>
     <tr><td class="l">Potencia de cortocircuito</td><td>${fm(o.Scc,0)} MVA</td><td></td><td class="l mut">√3 · ${fmU(S.proy.un)} kV · ${fm(p.Isc,1)} kA</td></tr>`;
  {const ce=o.cnt,c=cfgOf(),nL=+S.proy.nLin||0,nT=+S.proy.nTr||0;
   $("tEqMan").innerHTML=`<tr><th class="l">Equipo</th><th>Cantidad</th><th class="l">De dónde sale</th></tr><tr><td class="l">Interruptores (52)</td><td><b>${ce.int}</b></td><td class="l mut">${c.n}: ${ce.n} circuitos (${nL} de línea y ${nT} de transformación)${c.extra?` más ${c.extra} de acople o transferencia`:""}${ce.conInt?` más ${ce.juntas} de acople longitudinal (seccionamiento de barras)`:""}</td></tr>`+
     Object.entries(ce.sec).map(([k,v])=>`<tr><td class="l">Seccionadores ${minus(SUBE.SEC_T[k])}</td><td><b>${v}</b></td><td class="l mut">${{bypass:"Uno por interruptor de circuito",salida:"Uno por circuito, del lado de la línea o del transformador",seccB:ce.conInt?`Dos por cada acople longitudinal (${ce.juntas})`:`Uno por cada corte de barra: ${ce.tramos} tramos${c.sb>1?" en cada una de las dos barras":""}`}[k]||""}</td></tr>`).join("")+
     `<tr class="grp"><td>Total de seccionadores</td><td>${ce.secT}</td><td class="l">${c.bp?(ce.bypass?"Con by-pass.":"Sin by-pass (se puede elegir «con by-pass» en la configuración del proyecto)."):"By-pass: no aplica. "+c.bpNota}${c.sb?(ce.juntas?` Barra partida en ${ce.tramos} tramos.`:" Barra continua, sin seccionamiento."):""}</td></tr>`}
  $("chEq").innerHTML=chartEq(o);
  o.rows.forEach((r,i)=>etRes("etEq",i,[r.m1==null?"—":pill(r.m1>=mp-1e-9?"ok":"no",fm(100*r.m1,0)+" %"),r.m2==null?"—":pill(r.m2>=mp-1e-9?"ok":"no",fm(100*r.m2,0)+" %"),r.asg?`<b>${r.asg} kV</b>`:pill("no","No cumple")]));
  $("tEqReq").innerHTML=`<tr><th class="l">Requisito</th>${o.niv.map(n=>`<th>BIL ${n.BIL} kV</th>`).join("")}<th class="l">Nota</th></tr>`+
    [["Clase de tensión Um",n=>`${fmU(n.um)} kV`,"Equipo de la clase que normaliza ese BIL"],["Impulso de rayo a tierra / a través",n=>`${n.BIL} / ${n.iso?n.iso[0]:"—"} kV`,"A través: distancia de seccionamiento (IEC 62271-1)"],["60 Hz, 1 min a tierra / a través",n=>`${n.ac??"—"} / ${n.iso?n.iso[1]:"—"} kV`,""],
     ["Corriente asignada",()=>`${fm(o.rLin,0)} A bahías · ${fm(o.rBP,0)} A barra`,""],["Corta duración / pico",()=>`${fm(o.Ik40,1)} kA / ${fm(2.6*o.Ik40,0)} kA`,o.Ik40>o.Ik?"Recomendado por la falla a tierra":""],
     ["Distancia de fuga",()=>`≥ ${fm(RA.Lreq,0)} mm`,"Con la Um del sistema, igual para los dos niveles"],["Altitud y sismo",()=>`${fm(g.alt,0)} m · IEEE 693 alto`,"Pedir versión para la altitud del sitio"],["Equipos con este nivel",n=>`${o.rows.filter(r=>r.asg===n.BIL).length} de ${o.rows.length}`,"Según la tabla de distancias"]]
      .map(r=>`<tr><td class="l">${r[0]}</td>${o.niv.map(n=>`<td>${r[1](n)}</td>`).join("")}<td class="l mut" style="white-space:normal">${r[2]}</td></tr>`).join("")+
    `<tr class="grp"><td colspan="${o.niv.length+2}">Seccionador de apertura central</td></tr>
     <tr><td class="l">Separación entre polos</td><td colspan="${o.niv.length}">${p.sEq>0?fm(p.sEq,2)+" m":"Mínima"} ≥ F + d f-f = ${fm(p.Feq,2)} + ${fm(RD.dffA,2)} = ${fm(o.sReq,2)} m</td><td class="l">${okp(o.okS)}</td></tr>
     <tr><td class="l">Altura de la base</td><td colspan="${o.niv.length}">${p.base>0?fm(p.base,2)+" m":"Mínima"} ≥ hs − D = ${fm(RD.heqA,2)} − ${fm(p.Dais,3)} = ${fm(o.baseReq,2)} m</td><td class="l">${okp(o.okBase)}</td></tr>`;
  memo("memoEq",memoEq(o,g,p));
  setSt("st-eq",o.ok?"ok":"no");
}
function chartEq(o){
  const rows=o.rows;if(!rows.length)return"";const l1=RA.lmax1,l2=RA.lmax2,lM=Math.max(50,Math.ceil(Math.max(l2,...rows.map(r=>r.l))*1.12/5)*5);
  const W=680,rh=22,pl=230,pr=20,pt=24,H=pt+rows.length*rh+30,X=l=>pl+(W-pl-pr)*Math.min(l,lM)/lM;let s="";
  s+=`<rect x="${X(0)}" y="${pt-6}" width="${X(l1)-X(0)}" height="${rows.length*rh+6}" fill="var(--okbg)"/>`;
  if(RA.BIL2)s+=`<rect x="${X(l1)}" y="${pt-6}" width="${X(l2)-X(l1)}" height="${rows.length*rh+6}" fill="var(--safe)" opacity=".7"/>`;
  s+=`<rect x="${X(RA.BIL2?l2:l1)}" y="${pt-6}" width="${X(lM)-X(RA.BIL2?l2:l1)}" height="${rows.length*rh+6}" fill="var(--nobg)"/>`;
  s+=`<text x="${(X(0)+X(l1))/2}" y="${pt-10}" font-size="11" text-anchor="middle" fill="var(--ok)" font-weight="700">BIL ${RA.BIL} kV</text>`;
  if(RA.BIL2)s+=`<text x="${(X(l1)+X(l2))/2}" y="${pt-10}" font-size="11" text-anchor="middle" fill="var(--link)" font-weight="700">BIL ${RA.BIL2} kV</text>`;
  s+=`<text x="${(X(RA.BIL2?l2:l1)+X(lM))/2}" y="${pt-10}" font-size="11" text-anchor="middle" fill="var(--no)" font-weight="700">sin protección</text>`;
  rows.forEach((r,i)=>{const y=pt+i*rh+rh/2,c=r.asg==null?"var(--no)":r.asg===RA.BIL?"var(--ok)":"var(--link)";
    s+=`<text x="${pl-8}" y="${y+4}" font-size="11.5" text-anchor="end" fill="var(--ink)">${esc((r.n+(r.b?" · "+r.b:"")).slice(0,38))}</text><line x1="${pl}" y1="${y}" x2="${X(r.l)}" y2="${y}" stroke="var(--line)"/><circle cx="${X(r.l)}" cy="${y}" r="5.5" fill="${c}"/><text x="${X(r.l)+9}" y="${y+4}" font-size="11" fill="var(--muted)">${fm(r.l,1)}</text>`});
  for(let l=0;l<=lM;l+=10)s+=`<text x="${X(l)}" y="${H-8}" font-size="11" text-anchor="middle" fill="var(--muted)">${l} m</text>`;
  [l1,RA.BIL2?l2:null].filter(Boolean).forEach(l=>s+=`<line x1="${X(l)}" y1="${pt-6}" x2="${X(l)}" y2="${H-22}" stroke="var(--ink)" stroke-opacity=".4" stroke-dasharray="3 3"/>`);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="min-width:560px" role="img" aria-label="Distancia de cada equipo al pararrayos y nivel asignado">${s}</svg>`;
}
function memoEq(o,g,p){
  const {st,add}=memoList(),pr=S.proy;
  add("Corrientes","Potencia y corriente máximas",`${esc(trafoTxt())} y ${pr.nLin} líneas.`,
    [`${Sb(I("S"),"máx")} = ${pr.nTr}·${o.nU}·${fm(+pr.S1,0)} = ${R(fm(o.Smax,0)+" MVA")} ; ${Sb(I("I"),"nom")} = ${F(fm(o.Smax,0)+"·10⁶","√3·"+fmU(pr.un)+"·10³")} = ${R(fm(o.Inom,1)+" A")}`],"IEC 62271-1");
  add("Corrientes","Corrientes de diseño",`Con un factor de sobrecarga y crecimiento de ${fm(p.fc,2)}. Se asigna el valor normalizado siguiente (serie R10; 1250 A es el mínimo práctico en alta tensión).`,
    [`${Sb(I("I"),"línea")} = ${F(fm(p.fc,2)+"·"+fm(o.Inom,1),pr.nLin)} = ${R(fm(o.Ilin,1)+" A")} → ${fm(o.rLin,0)} A ; ${Sb(I("I"),"trafo")} = ${F(fm(p.fc,2)+"·"+fm(o.Inom,1),pr.nTr)} = ${R(fm(o.Itr,1)+" A")} → ${fm(o.rTr,0)} A`,
     `${Sb(I("I"),"BP")} = ${fm(p.fc,2)}·${fm(o.Inom,1)} = ${R(fm(o.IBP,1)+" A")} → ${fm(o.rBP,0)} A`],"IEC 62271-1");
  add("Cortocircuito","Corriente de corta duración y pico",`Se especifica el valor normalizado inmediatamente superior a la falla. El pico calculado usa el factor κ de IEC 60909 con X/R = ${fm(p.XR,0)}.`,
    [`${Sb(I("I"),"k")} = ${R(fm(o.Ik,1)+" kA")} (1 s) ; ${Sb(I("i"),"p")} = 2,6·${fm(o.Ik,1)} = ${R(fm(o.ipA,0)+" kA")}`,
     `κ = 1,02 + 0,98·${I("e")}<sup>−3/(X/R)</sup> = ${fm(o.kappa,3)} ; ${Sb(I("i"),"p")} = κ·√2·${fm(p.Isc,1)} = ${R(fm(o.ip3,1)+" kA")} ${o.uip<=1?AD(fm(100*o.uip,0)+" % de "+fm(o.ipA,0)+" kA"):BD("supera el pico asignado")}`],"IEC 60909 · IEC 62271-1");
  add("Nivel de aislamiento","Asignación por distancia al pararrayos",`Para cada equipo vale el pararrayos más cercano. La distancia solo depende del BIL del equipo protegido y del nivel de protección del pararrayos; la envolvente del pararrayos no la cambia.`,
    [`MP = ${F("BIL",`NPR' + 2·${I("S")}·${I("l")}/${I("c")}`)} − 1 ≥ ${fm(100*(RA.kmin-1),0)} % ; NPR' = ${fm(RA.NPRc,1)} kV`,
     `BIL ${RA.BIL} kV si ${I("l")} ≤ ${fm(RA.lmax1,1)} m${RA.BIL2?` ; BIL ${RA.BIL2} kV si ${I("l")} ≤ ${fm(RA.lmax2,1)} m`:""} → ${R(`${o.n1} + ${o.n2} equipos`)} ${o.nNo?BD(o.nNo+" sin protección"):AD("todos protegidos")}`],"IEC 60071-2");
  add("Seccionador","Separación entre polos y altura de la base",`Al abrir, los brazos de un seccionador de apertura central giran 90° y quedan atravesados hacia las fases vecinas. La posición abierta es de operación normal, así que no se admite reducir la distancia.`,
    [`${I("S")} ≥ ${I("F")} + ${Sb(I("d"),"f-f")} = ${fm(p.Feq,2)} + ${fm(RD.dffA,2)} = ${R(fm(o.sReq,2)+" m")} ${o.okS?AD("plano "+fm(p.sEq,2)+" m"):BD("plano "+fm(p.sEq,2)+" m")}`,
     `${I("h")} ≥ ${Sb(I("h"),"s")} − ${I("D")} = ${fm(RD.heqA,2)} − ${fm(p.Dais,3)} = ${R(fm(o.baseReq,2)+" m")} ${o.okBase?AD("plano "+fm(p.base,2)+" m"):BD("plano "+fm(p.base,2)+" m")}`],"IEC 61936-1 · catálogo del seccionador");
  return st;
}

/* ============================================================
   Formularios: malla y apantallamiento
   ============================================================ */
Object.assign(FORMS,{
  fMalFal:[chk("mal","linkI","Usar la falla a tierra y la X/R del módulo de equipos",{wide:true}),
    sel("mal","IfTipo","El dato de falla es",[["sim","Simétrico (3I₀)"],["asim","Asimétrico (IF = Df·3I₀)"]],{wide:true,show:()=>!S.mal.linkI}),
    num("mal","If",()=>S.mal.IfTipo==="asim"&&!S.mal.linkI?"Falla a tierra asimétrica IF":"Falla a tierra 3I₀","kA",{lock:()=>!!S.mal.linkI,hint:()=>S.mal.IfTipo==="asim"&&!S.mal.linkI?"Se pasa a simétrica dividiendo por Df.":"Simétrica, en la barra."}),num("mal","XR","Relación X/R","",{lock:()=>!!S.mal.linkI}),
    num("mal","Cp","Factor de crecimiento Cp","",{step:0.01,hint:"Corriente futura / actual. Si los equipos son de 31,5 kA y la falla es de 30 kA: 1,05."}),
    num("mal","tf","Tiempo de despeje tf","s",{step:0.05}),num("mal","tc","Tiempo para el conductor tc","s",{hint:"Igual al tiempo asignado de los equipos (p. ej., 31,5 kA / 1 s)."})],
  fMalSf:[sel("mal","sfMode","Cómo se obtiene",[["man","Valor asumido"],["calc","Calculado con los cables de guarda"]],{wide:true}),
    num("mal","Sf","Factor de reparto Sf","",{step:0.05,hint:"Parte de la falla que entra al suelo por la malla.",show:()=>S.mal.sfMode!=="calc"}),
    num("mal","sfN","Cables de guarda que llegan","",{step:1}),num("mal","sfRt","Resistencia de pie de torre","Ω"),num("mal","sfSpan","Vano medio de las líneas","m"),
    num("mal","sfR","Resistencia del cable de guarda","Ω/km",{hint:"Acero 3/8″: 3,5 a 4. OPGW: 0,3 a 1,5."}),num("mal","sfGmr","Radio medio geométrico","mm")],
  fMalSue:[num("mal","rho","Resistividad del suelo natural ρ","Ω·m",{hint:"Medida con el método de Wenner, en época seca."}),
    sel("mal","mej","Mejoramiento del terreno",Object.entries(MEJ).map(([k,v])=>[k,v.n]),{wide:true,hint:()=>{const x=MEJ[S.mal.mej];return x&&x.fuente?x.fuente+".":S.mal.mej==="no"?"Si la malla no cumple con el suelo natural, bajar la resistividad alrededor de ella suele ser lo más eficaz.":"Use el dato del fabricante o de una medición."}}),
    num("mal","red1","Reducción en la capa tratada","%",{step:5,lock:()=>MEJ[S.mal.mej]&&MEJ[S.mal.mej].red!=null,show:()=>S.mal.mej!=="no",hint:()=>`ρ1 = ${fm(S.mal.rho*(1-(MEJ[S.mal.mej]&&MEJ[S.mal.mej].red!=null?MEJ[S.mal.mej].red:+S.mal.red1)/100),0)} Ω·m`}),
    num("mal","Ht","Espesor de la capa tratada H","m",{step:0.5,show:()=>S.mal.mej!=="no",hint:"Zanjas y perforaciones de las varillas rellenas con suelo tratado."}),
    num("mal","red2","Reducción del suelo bajo la capa","%",{step:2.5,show:()=>S.mal.mej!=="no",hint:()=>`ρ2 = ${fm(S.mal.rho*(1-(+S.mal.red2||0)/100),0)} Ω·m. 0 % = el suelo de abajo sigue natural (lado seguro). Es el supuesto que más pesa.`}),
    num("mal","Rmax","Resistencia máxima admisible","Ω",{step:0.5,hint:"RETIE: 1 Ω en subestaciones de alta y extra alta tensión. 0 = no verificar."})],
  fMalGeo:[num("mal","Lx","Largo Lx","m"),num("mal","Ly","Ancho Ly","m"),num("mal","nCx","Conductores paralelos a Lx","",{step:1}),num("mal","nCy","Conductores paralelos a Ly","",{step:1}),num("mal","h","Profundidad h","m",{step:0.05}),
    sel("mal","Dsel","Espaciamiento D en Km y Ks",[["prom","Promedio de los dos sentidos"],["min","El menor de la retícula base"],["max","El mayor (más conservador)"]],{wide:true,hint:"IEEE 80 da un solo D: con espaciamientos distintos hay que elegir cuál usar."}),
    chk("mal","zon","Zona de equipos con retícula más densa",{wide:true}),
    num("mal","zLx","Zona: largo","m",{show:()=>!!S.mal.zon}),num("mal","zLy","Zona: ancho","m",{show:()=>!!S.mal.zon}),num("mal","zX0","Zona: inicio en x","m",{show:()=>!!S.mal.zon}),num("mal","zY0","Zona: inicio en y","m",{show:()=>!!S.mal.zon}),
    num("mal","zNx","Zona: conductores paralelos al largo","",{step:1,show:()=>!!S.mal.zon}),num("mal","zNy","Zona: conductores paralelos al ancho","",{step:1,show:()=>!!S.mal.zon}),
    chk("mal","esqOn","Refuerzo en las cuatro esquinas",{wide:true,hint:"Las esquinas descargan más corriente por metro y tienen el toque más alto."}),
    num("mal","eL","Lado del refuerzo","m",{show:()=>!!S.mal.esqOn}),num("mal","eN","Conductores por sentido","",{step:1,show:()=>!!S.mal.esqOn}),num("mal","eOff","Distancia al borde","m",{step:0.5,show:()=>!!S.mal.esqOn}),
    sel("mal","size","Conductor",Object.entries(SIZES).map(([k,v])=>[k,`${v[0]} · ${fm(v[1],1)} mm²`])),sel("mal","mat","Material",Object.entries(MAT).map(([k,v])=>[k,v.n])),sel("mal","conn","Uniones",Object.entries(CONN).map(([k,v])=>[k,v.n])),
    num("mal","nR","Varillas del perímetro o esquinas","",{step:1}),num("mal","LR","Longitud de cada una","m"),sel("mal","rodPos","Ubicación de esas varillas",[["esq","En el perímetro y las esquinas"],["no","Repartidas en el interior"]],{wide:true}),
    num("mal","nR2","Varillas interiores (neutros, DPS)","",{step:1}),num("mal","LR2","Longitud de cada una","m",{step:0.25})],
  fApaCg:[num("apa","hG","Altura de las puntas (amarre)","m",{step:0.5}),num("apa","vanoG","Vano del cable de guarda","m",{step:0.5}),num("apa","alfa","Flecha / vano","",{step:0.005,hint:"0,02 = 2 % del vano (Mejía, ec. 5.12)."}),
    num("apa","s2d","Separación entre cables 2d","m",{step:0.5,hint:"Distancia horizontal entre cables de guarda vecinos."}),sel("apa","k","Elemento de protección",[["1","Cable de guarda (k = 1,0)"],["1.2","Punta o mástil (k = 1,2)"]],{num:true,wide:true})],
  fApaExp:[num("apa","ddt","Densidad de descargas a tierra","rayos/km²·año",{wide:true,hint:"NTC 4552-1 Tabla A.6 (Manizales: 2)."}),num("apa","area","Área del lote","m²"),num("apa","Lcg","Longitud total de cable de guarda","m")],
  fApaMas:[num("apa","hM","Altura de las puntas","m",{step:0.1}),num("apa","deM","Altura de la cubierta","m",{step:0.1}),num("apa","L1","Lado corto","m"),num("apa","L2","Lado largo","m"),
    sel("apa","rN","Nivel de protección (NTC 4552-3)",[["20","I · esfera de 20 m"],["30","II · 30 m"],["45","III · 45 m"],["60","IV · 60 m"]],{num:true,wide:true,hint:"Se verifica además con la esfera más pequeña del patio."})]
});
ET.etSm={box:"etSm",get:()=>S.apa.sm,cols:[{k:"n",t:"Conductor",type:"txt",w:170,relabel:true},{k:"hmax",t:"h máx (m)",type:"num",step:0.05},{k:"hmin",t:"h mín (m)",type:"num",step:0.05},{k:"dmm",t:"Ø (mm)",type:"num",step:0.1},
  {k:"base",t:"Aislamiento",type:"sel",w:96,options:[["BIL","BIL del equipo"],["CFO","CFO de la cadena"]]},{k:"bil",t:"BIL (kV)",type:"num",step:50,show:r=>r.base!=="CFO"},{k:"w",t:"Cadena w (m)",type:"num",step:0.01,show:r=>r.base==="CFO"}],
  res:["hpr (m)","Rc (m)","Z₀ (Ω)","Ic (kA)","Sm (m)","he (m)","2d máx (m)"],add:()=>({n:"Conductor nuevo",hmax:8,hmin:7.5,dmm:30,base:"BIL",bil:550,w:2.19}),reset:()=>{S.apa.sm=clone(SUBE.SM_BASE);S.apa.ver=clone(SUBE.VER_BASE)},
  onDel:i=>S.apa.ver.forEach(v=>{if(+v.sm===i)v.sm=0;else if(+v.sm>i)v.sm=+v.sm-1})};
ET.etVer={box:"etVer",get:()=>S.apa.ver,cols:[{k:"n",t:"Elemento",type:"txt",w:170},{k:"sm",t:"Esfera de",type:"sel",num:true,w:130,options:()=>S.apa.sm.map((s,i)=>[i,s.n])},
  {k:"apo",t:"Apoyo de la esfera",type:"sel",w:130,options:[["2c","Dos cables iguales"],["2d","Dos cables desiguales"],["cs","Cable y suelo"]]},
  {k:"h1",t:"h cable 1 (m)",type:"num",step:0.01},{k:"h2",t:"h cable 2 (m)",type:"num",step:0.01,show:r=>r.apo==="2d"},{k:"s",t:"Separación (m)",type:"num",step:0.5,show:r=>r.apo!=="cs"},
  {k:"x",t:"x (m)",type:"num",step:0.05},{k:"de",t:"Altura elemento (m)",type:"num",step:0.01},{k:"beta",t:"β 60°",type:"chk",show:r=>r.apo==="2c"}],
  res:["Sm (m)","Arco (m)","Margen (m)","θ requerido","Estado"],add:()=>({n:"Elemento nuevo",sm:0,apo:"2c",h1:14.5,h2:14.5,s:11,x:5.5,de:6,beta:true}),reset:()=>{S.apa.ver=clone(SUBE.VER_BASE)}};

/* ============================================================
   Malla de puesta a tierra
   ============================================================ */
function renderMal(){
  const p=S.mal;if(p.linkI){p.If=S.eq.I1;p.XR=S.eq.XR;p.IfTipo="sim"}if(MEJ[p.mej]&&MEJ[p.mej].red!=null)p.red1=MEJ[p.mej].red;const o=RM=calcMal(p);
  const conds=`toque ${fm(o.Em,0)} V ≤ ${fm(o.Etouch,0)} V, paso ${fm(o.Es,0)} V ≤ ${fm(o.Estep,0)} V${o.Rmax?` y Rg ${fm(o.Rg,3)} Ω ≤ ${fm(o.Rmax,2)} Ω`:""}`;
  let v;
  if(o.ok)v=verdict("ok",`La malla cumple ${o.Rmax?"las tres condiciones":"las tensiones de toque y de paso"}`,(o.safeGPR?`La elevación de potencial (${fm(o.GPR,0)} V) es menor que el toque tolerable.`:`IEEE 80: ${conds}.`)+(o.trat?` Terreno mejorado: ${esc(o.mejN)}.`:""));
  else{const c=[];if(!o.okCond)c.push(`el conductor es delgado (mínimo ${fm(o.Amin,1)} mm²)`);if(!o.okMalla){if(!o.okEm)c.push(`la tensión de malla (${fm(o.Em,0)} V) supera la de toque tolerable (${fm(o.Etouch,0)} V)`);if(!o.okEs)c.push("la tensión de paso supera la tolerable")}
    if(!o.okR)c.push(`la resistencia (${fm(o.Rg,2)} Ω) supera ${fm(o.Rmax,2)} Ω`);
    v=verdict("no","La malla no cumple con los datos actuales",c.join("; ")+". Abajo se ve qué supuesto conviene cambiar primero.")}
  $("vMal").innerHTML=v;
  $("kMal").innerHTML=kpi("Corriente a tierra IG",fm(o.IG/1000,2),"kA",`Sf ${fm(o.SfUse,2)} × Cp ${fm(o.Cp,2)} × Df ${fm(o.Df,3)} × ${fm(o.I3,2)} kA`,"hl")+kpi("Resistencia Rg",fm(o.Rg,3),"Ω",o.Rmax?`máximo ${fm(o.Rmax,2)} Ω${o.trat?` · sin tratar ${fm(o.RgNat,2)} Ω`:""}`:"Sverak",o.okR?"":"bad")+kpi("Elevación de potencial",fm(o.GPR/1000,2),"kV","GPR = IG·Rg")+
    kpi("Tensión de malla Em",fm(o.Em,0),"V",`tolerable ${fm(o.Etouch,0)} V`,o.okEm?"hl":"bad")+kpi("Tensión de paso Es",fm(o.Es,0),"V",`tolerable ${fm(o.Estep,0)} V`,o.okEs?"hl":"bad")+kpi("Conductor",SIZES[p.size][0],"",`mínimo ${fm(o.Amin,1)} mm²`,o.okCond?"":"bad")+
    kpi("Conductor enterrado",fm(o.LC,0),"m",`${fm(o.Dx,2)} × ${fm(o.Dy,2)} m${o.zon?` · zona ${fm(o.zDx,2)} × ${fm(o.zDy,2)} m`:""} · ${o.nRt} varillas (${fm(o.LRt,0)} m)`);
  const w=[];
  if(p.h<0.25||p.h>2.5)w.push("La profundidad está fuera de 0,25 a 2,5 m, donde valen las ecuaciones de Ks.");
  if(o.capa&&p.rhos<o.rhoCs)w.push("La grava es menos resistiva que el suelo: Cs sale mayor que 1 y la fórmula pierde validez.");
  if(o.n>25||o.Deff<2.5)w.push(`La malla queda fuera del rango en que las ecuaciones simplificadas de IEEE 80 son más precisas (n ≤ 25 y D ≥ 2,5 m; aquí n = ${fm(o.n,1)}${o.zon||o.esqOn?" y la retícula no es uniforme":""}). Los resultados son una buena estimación; en la ingeniería de detalle conviene confirmarlos con un programa de elementos finitos.`);
  if(!o.okMalla)w.push(`Para cumplir con el toque haría falta una longitud efectiva de ${fm(o.LMreq,0)} m (hay ${fm(o.LM,0)} m). Lo más eficaz suele ser bajar la resistividad (tratamiento del terreno), aumentar la grava, usar varillas más largas o reducir el tiempo de despeje.`);
  if(!o.okR)w.push(`La resistencia (${fm(o.Rg,2)} Ω) supera ${fm(o.Rmax,2)} Ω. Con ${fm(p.rho,0)} Ω·m el término del área ya vale ${fm(o.Rarea,2)} Ω: agregar conductor casi no la baja; hay que bajar la resistividad alrededor de la malla.`);
  if(o.trat)w.push(`<b>Supuesto clave:</b> el terreno mejorado (${fm(o.rho1,0)} Ω·m en ${fm(p.Ht,1)} m sobre ${fm(o.rho2,0)} Ω·m). Debe confirmarse midiendo la resistividad (Wenner) y la resistencia de la malla (IEEE 81) antes de energizar, y repetirse cada año en época seca; si la resistencia sube, se vuelve a aplicar el tratamiento.`);
  $("wMal").innerHTML=w.map(t=>`<div class="note wa">${t}</div>`).join("");
  $("svgMal").innerHTML=svgMal(o,p);
  $("chMal").innerHTML=chartMal(p,o);
  $("tMal").innerHTML=`<tr><th class="l">Criterio</th><th>Calculado</th><th>Límite</th><th class="l">Estado</th></tr>
   <tr><td class="l">Sección del conductor</td><td>${fm(o.Asec,1)} mm²</td><td>≥ ${fm(o.Amin,1)} mm²</td><td class="l">${okp(o.okCond)}</td></tr>
   <tr><td class="l">Tensión de toque</td><td>${fm(o.Em,0)} V</td><td>≤ ${fm(o.Etouch,1)} V</td><td class="l">${okp(o.okEm)}</td></tr>
   <tr><td class="l">Tensión de paso</td><td>${fm(o.Es,0)} V</td><td>≤ ${fm(o.Estep,1)} V</td><td class="l">${okp(o.okEs)}</td></tr>
   <tr><td class="l">Resistencia de la malla</td><td>${fm(o.Rg,3)} Ω</td><td>${o.Rmax?"≤ "+fm(o.Rmax,2)+" Ω":"—"}</td><td class="l">${o.Rmax?okp(o.okR):'<span class="mut">No se verifica</span>'}</td></tr>
   <tr><td class="l">Rango de las ecuaciones (n ≤ 25, D ≥ 2,5 m)</td><td>n = ${fm(o.n,1)} · D = ${fm(o.Deff,2)} m</td><td></td><td class="l">${!o.fuera?okp(true,"Dentro"):pill("wa","Fuera: resultado aproximado")}</td></tr>`;
  $("mejMal").innerHTML=mejMal(o,p);
  renderMalExtra(o,p);
  memo("memoMal",memoMal(o,p));
  setSt("st-mal",o.ok?"ok":"no");
}
function svgMal(o,p){
  const W=520,H=Math.round(W*Math.min(1,Math.max(.35,p.Ly/p.Lx)))+30,pad=30,sc=Math.min((W-2*pad)/p.Lx,(H-2*pad-10)/p.Ly),X=x=>pad+x*sc,Y=y=>pad+(p.Ly-y)*sc;let s="";
  const grid=(x0,y0,Lx,Ly,nx,ny,c,w)=>{let g="";for(let i=0;i<ny;i++){const x=x0+Lx*i/(ny-1);g+=`<line x1="${X(x)}" y1="${Y(y0)}" x2="${X(x)}" y2="${Y(y0+Ly)}" stroke="${c}" stroke-width="${w}"/>`}
    for(let j=0;j<nx;j++){const y=y0+Ly*j/(nx-1);g+=`<line x1="${X(x0)}" y1="${Y(y)}" x2="${X(x0+Lx)}" y2="${Y(y)}" stroke="${c}" stroke-width="${w}"/>`}return g};
  s+=`<rect x="${X(0)}" y="${Y(p.Ly)}" width="${p.Lx*sc}" height="${p.Ly*sc}" fill="var(--surface2)"/>`;
  s+=grid(0,0,p.Lx,p.Ly,o.nX,o.nY,"var(--link)",1);
  if(o.zon)s+=`<rect x="${X(p.zX0)}" y="${Y(p.zY0+p.zLy)}" width="${p.zLx*sc}" height="${p.zLy*sc}" fill="var(--safe)" opacity=".6"/>`+grid(p.zX0,p.zY0,p.zLx,p.zLy,Math.round(p.zNx),Math.round(p.zNy),"var(--link)",.6);
  const e=+p.eOff||0,L=+p.eL||0,corners=[[e,e],[p.Lx-e-L,e],[e,p.Ly-e-L],[p.Lx-e-L,p.Ly-e-L]];
  if(o.esqOn)corners.forEach(([x,y])=>s+=grid(x,y,L,L,Math.round(p.eN),Math.round(p.eN),"var(--link)",.8));
  s+=`<rect x="${X(0)}" y="${Y(p.Ly)}" width="${p.Lx*sc}" height="${p.Ly*sc}" fill="none" stroke="var(--link)" stroke-width="2.5"/>`;
  /* varillas del perímetro o las esquinas */
  const n=Math.max(0,Math.round(p.nR)),dot=(x,y,c="var(--accent)",r=3)=>`<circle cx="${X(x)}" cy="${Y(y)}" r="${r}" fill="${c}"/>`;
  if(n&&p.rodPos==="esq"&&o.esqOn){const per=Math.round(n/4),ds=[3,6,12,18,24,30,36,42];
    [[0,0,1,1],[p.Lx,0,-1,1],[0,p.Ly,1,-1],[p.Lx,p.Ly,-1,-1]].forEach(([cx,cy,sx,sy])=>{let c=0,j=0;const add=(x,y)=>{if(c<per){s+=dot(x,y);c++}};add(cx,cy);
      while(c<per){if(per-c>=2&&j<ds.length){add(cx+sx*ds[j],cy);add(cx,cy+sy*ds[j]);j++}else{add(cx+sx*(e+L/2),cy+sy*(e+L/2));break}}})}
  else if(n){const per=2*(p.Lx+p.Ly);for(let k=0;k<n;k++){let d=per*k/n,x,y;if(d<p.Lx){x=d;y=0}else if(d<p.Lx+p.Ly){x=p.Lx;y=d-p.Lx}else if(d<2*p.Lx+p.Ly){x=p.Lx-(d-p.Lx-p.Ly);y=p.Ly}else{x=0;y=p.Ly-(d-2*p.Lx-p.Ly)}s+=dot(x,y)}}
  /* varillas interiores: en la zona de equipos (neutros y DPS) o en el centro */
  const n2=Math.max(0,Math.round(p.nR2||0));
  if(n2){const zx=o.zon?p.zX0:p.Lx*0.25,zy=o.zon?p.zY0:p.Ly*0.2,zw=o.zon?p.zLx:p.Lx*0.5,zh=o.zon?p.zLy:p.Ly*0.6,a=Math.ceil(n2*0.4),b=n2-a;
    for(let k=0;k<a;k++)s+=dot(zx+zw*0.12,zy+zh*(0.25+0.6*k/Math.max(1,a-1)),"var(--ok)",2.6);
    for(let k=0;k<b;k++)s+=dot(zx+zw*0.86,zy+zh*(0.05+0.9*k/Math.max(1,b-1)),"var(--ok)",2.6)}
  s+=`<text x="${X(p.Lx/2)}" y="${Y(p.Ly)-10}" font-size="12" text-anchor="middle" fill="var(--muted)">${fm(p.Lx,2)} m</text><text x="${X(p.Lx)+10}" y="${Y(p.Ly/2)}" font-size="12" fill="var(--muted)" transform="rotate(90 ${X(p.Lx)+10} ${Y(p.Ly/2)})" text-anchor="middle">${fm(p.Ly,2)} m</text>`;
  if(o.zon)s+=`<text x="${X(p.zX0+p.zLx/2)}" y="${Y(p.zY0+p.zLy)-4}" font-size="11" text-anchor="middle" fill="var(--link)" font-weight="600">zona de equipos ${fm(o.zDx,2)} × ${fm(o.zDy,2)} m</text>`;
  s+=`<text x="${X(0)}" y="${Y(0)+20}" font-size="12" fill="var(--muted)">Base ${fm(o.Dx,2)} × ${fm(o.Dy,2)} m · ${n} varillas de ${fm(p.LR,2)} m (rojo)${n2?` y ${n2} de ${fm(p.LR2,2)} m (verde, interiores)`:""}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Planta de la malla">${s}</svg>`+svgMalCorte(o,p);
}
/* Corte esquemático: grava, malla enterrada y una persona tocando una estructura (tensión de toque) */
function svgMalCorte(o,p){
  const W=520,k=58,y0=24+1.95*k,hsP=Math.max(9,p.hs*k),yg=y0+Math.max(p.h*k,hsP+14),H=Math.round(yg+(o.trat?44:30)),Et=o.Em,ok=Et<=o.Etouch;
  const T=(x,y,t,a="start",c="var(--muted)",w="400")=>`<text x="${x}" y="${y}" font-size="11.5" text-anchor="${a}" fill="${c}" font-weight="${w}">${t}</text>`;
  let s=`<rect x="10" y="${y0}" width="${W-20}" height="${H-y0-4}" fill="var(--surface2)"/>`;
  s+=`<defs><pattern id="grava" width="8" height="6" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="var(--muted)" opacity=".55"/><circle cx="6" cy="4.5" r="1" fill="var(--muted)" opacity=".4"/></pattern></defs>`;
  s+=`<rect x="10" y="${y0}" width="${W-20}" height="${hsP}" fill="url(#grava)" stroke="var(--muted)" stroke-width=".6"/>`;
  s+=`<line x1="10" y1="${y0}" x2="${W-10}" y2="${y0}" stroke="var(--ink)" stroke-width="2"/>`;
  for(let x=40;x<W-20;x+=56)s+=`<circle cx="${x}" cy="${yg}" r="3.4" fill="var(--link)"/>`;
  s+=`<line x1="22" y1="${yg}" x2="${W-22}" y2="${yg}" stroke="var(--link)" stroke-width=".8" stroke-dasharray="3 3"/>`;
  /* estructura aterrizada */
  const sx=330;s+=`<rect x="${sx}" y="${y0-1.85*k}" width="10" height="${1.85*k}" fill="var(--steel)"/><rect x="${sx-14}" y="${y0-1.85*k-6}" width="38" height="7" rx="2" fill="var(--steel)"/>`;
  s+=`<path d="M${sx+5} ${y0} V${yg} H${sx+33}" fill="none" stroke="var(--accent)" stroke-width="1.6"/>`;
  /* la persona (con la camiseta azul del profe) */
  const px=sx-46,F=y0,hip=F-0.92*k,sh=F-1.42*k,hd=F-1.6*k;
  s+=`<g aria-label="Persona tocando la estructura"><title>El profe, con su camiseta azul y su violín, revisando la tensión de toque</title><g stroke="var(--ink)" stroke-width="2" stroke-linecap="round" fill="none">`+
    `<line x1="${px}" y1="${hip}" x2="${px-9}" y2="${F}"/><line x1="${px}" y1="${hip}" x2="${px+9}" y2="${F}"/>`+
    `<line x1="${px}" y1="${sh+3}" x2="${sx-1}" y2="${F-1.1*k}"/><line x1="${px}" y1="${sh+3}" x2="${px-15}" y2="${hip+4}"/>`+
    `<circle cx="${px}" cy="${hd}" r="7"/></g>`+
    `<path d="M${px-9} ${sh}L${px-4} ${sh-2}Q${px} ${sh+3} ${px+4} ${sh-2}L${px+9} ${sh}L${px+7} ${hip+2}L${px-7} ${hip+2}Z" fill="#1d4fa3" stroke="var(--ink)" stroke-width="1"/>`+
    `<path d="M${px-4} ${sh-1.5}L${px} ${sh+4}L${px+4} ${sh-1.5}" fill="none" stroke="#fff" stroke-width="1.6"/><rect x="${px-7}" y="${hip-6}" width="14" height="2.4" fill="#fff"/>`+
    /* el violín, colgando de la mano libre */
    `<g transform="translate(${px-15} ${hip+4}) rotate(14) scale(${k/100}) translate(0 -4)"><path d="M0 18 C-11 18 -11 34 -10 40 C-9 47 -6 49 -9 55 C-12 62 -11 72 0 72 C11 72 12 62 9 55 C6 49 9 47 10 40 C11 34 11 18 0 18Z" fill="#a0612e" stroke="#4a2a12" stroke-width="${1.4*100/k}"/>`+
    `<rect x="-1.4" y="-6" width="2.8" height="26" fill="#2b1a0c"/><circle cx="0" cy="-8" r="2.6" fill="#4a2a12"/><path d="M-4 46 q-1.5 5 0 10 M4 46 q1.5 5 0 10" fill="none" stroke="#2b1a0c" stroke-width="${100/k}"/><rect x="-4" y="62" width="8" height="2.2" fill="#2b1a0c"/></g></g>`;
  /* cotas y textos */
  s+=T(20,y0-8,`grava hs = ${fm(p.hs,2)} m · ρs = ${fm(p.rhos,0)} Ω·m`);
  if(o.trat)s+=`<rect x="10" y="${y0+hsP}" width="${W-20}" height="${H-y0-hsP-4}" fill="var(--safe)" opacity=".55"/>`+T(W-20,H-10,`terreno mejorado: ρ1 = ${fm(o.rho1,0)} Ω·m (${fm(p.Ht,1)} m) sobre ρ2 = ${fm(o.rho2,0)} Ω·m`,"end","var(--link)","600");
  s+=T(20,yg-8,`malla a h = ${fm(p.h,2)} m${o.trat?"":` · ρ = ${fm(p.rho,0)} Ω·m`}`,"start","var(--link)","600");
  s+=T(sx+30,y0-1.25*k,`Tensión de toque`,"start","var(--ink)","600")+T(sx+30,y0-1.25*k+16,`Em = ${fm(Et,0)} V`,"start",ok?"var(--ok)":"var(--no)","700")+T(sx+30,y0-1.25*k+32,`tolerable ${fm(o.Etouch,0)} V · ${ok?"cumple":"no cumple"}`,"start",ok?"var(--ok)":"var(--no)","600");
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Corte esquemático de la malla con una persona tocando una estructura" style="margin-top:10px">${s}</svg><p class="norma" style="margin:2px 0 0">Corte sin escala: la mano toca la estructura aterrizada y los pies quedan sobre la grava (IEEE 80, tensión de toque).</p>`;
}
function chartMal(p,o0){
  const Ds=[10,8,7,6,5,4,3.5,3,2.5],pts=Ds.map(D=>{const o=calcMal({...p,nCx:Math.round(p.Ly/D)+1,nCy:Math.round(p.Lx/D)+1});return{D,t:100*o.Em/o.Etouch,s:100*o.Es/o.Estep,fuera:o.fuera}});
  const W=520,H=260,pl=46,pr=14,pt=12,pb=36,maxY=Math.max(120,...pts.map(q=>Math.max(q.t,q.s)))*1.05,minD=2.5,maxD=10;
  const X=d=>pl+(W-pl-pr)*(maxD-d)/(maxD-minD),Y=v=>pt+(H-pt-pb)*(1-v/maxY);let s="";
  const step=maxY>400?100:maxY>200?50:25;
  for(let v=0;v<=maxY;v+=step)s+=`<line x1="${pl}" y1="${Y(v)}" x2="${W-pr}" y2="${Y(v)}" stroke="var(--line)"/><text x="${pl-6}" y="${Y(v)+4}" font-size="11" text-anchor="end" fill="var(--muted)">${v} %</text>`;
  Ds.forEach(d=>s+=`<text x="${X(d)}" y="${H-pb+16}" font-size="11" text-anchor="middle" fill="var(--muted)">${fm(d,1)}</text>`);
  s+=`<text x="${(pl+W-pr)/2}" y="${H-4}" font-size="11" text-anchor="middle" fill="var(--muted)">Espaciamiento de la cuadrícula (m)</text>`;
  s+=`<line x1="${pl}" y1="${Y(100)}" x2="${W-pr}" y2="${Y(100)}" stroke="var(--no)" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${W-pr}" y="${Y(100)-5}" font-size="11" text-anchor="end" fill="var(--no)" font-weight="600">límite tolerable</text>`;
  const line=(k,c)=>`<polyline points="${pts.map(q=>`${X(q.D)},${Y(q[k])}`).join(" ")}" fill="none" stroke="${c}" stroke-width="2.2"/>`+pts.map(q=>`<circle cx="${X(q.D)}" cy="${Y(q[k])}" r="3" fill="${c}"/>`).join("");
  s+=line("t","var(--chart1)")+line("s","var(--chart2)");
  if(o0.Deff>=minD&&o0.Deff<=maxD)s+=`<line x1="${X(o0.Deff)}" y1="${pt}" x2="${X(o0.Deff)}" y2="${H-pb}" stroke="var(--ink)" stroke-opacity=".45" stroke-dasharray="2 3"/><text x="${X(o0.Deff)+4}" y="${pt+12}" font-size="11" fill="var(--ink)">diseño</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Tensiones de malla y de paso según el espaciamiento">${s}</svg>`;
}
/* Antes y después del mejoramiento del terreno */
function mejMal(o,p){
  const nat=o.trat?calcMal({...p,mej:"no"}):o,con=o.trat?o:calcMal({...p,mej:"favigel",red1:90,Ht:3,red2:87.5});
  const ok=(b)=>b?pill("ok","Cumple"):pill("no","No cumple");
  const row=(lab,a,b,lim)=>`<tr><td class="l">${lab}</td><td>${a}</td><td><b>${b}</b></td><td class="mut">${lim}</td></tr>`;
  return `<h3>Mejoramiento del terreno <small>${o.trat?esc(o.mejN):"sugerencia: así quedaría con FAVIGEL"}</small></h3>
   <div class="mejbar"><div><span>Suelo natural</span><b>${fm(p.rho,0)} Ω·m</b></div><i aria-hidden="true">→</i><div class="on"><span>Capa tratada (${fm(con===o?p.Ht:3,1)} m)</span><b>${fm(con.rho1,0)} Ω·m</b></div><div class="on"><span>Suelo de abajo</span><b>${fm(con.rho2,0)} Ω·m</b></div></div>
   <div class="scroll"><table><tr><th class="l"></th><th>Sin mejoramiento</th><th>${o.trat?"Con mejoramiento":"Con FAVIGEL"}</th><th>Límite</th></tr>
   ${row("Resistencia Rg",fm(nat.Rg,3)+" Ω",fm(con.Rg,3)+" Ω",o.Rmax?"≤ "+fm(o.Rmax,2)+" Ω":"—")}
   ${row("Elevación de potencial",fm(nat.GPR/1000,1)+" kV",fm(con.GPR/1000,1)+" kV","—")}
   ${row("Tensión de toque",fm(nat.Em,0)+" V",fm(con.Em,0)+" V","≤ "+fm(con.Etouch,0)+" V")}
   ${row("Tensión de paso",fm(nat.Es,0)+" V",fm(con.Es,0)+" V","≤ "+fm(con.Estep,0)+" V")}
   <tr class="grp"><td>Resultado</td><td>${ok(nat.ok)}</td><td>${ok(con.ok)}</td><td></td></tr></table></div>
   <p class="norma" style="margin:8px 0 0">${o.trat?`Con el suelo natural la resistencia no baja del término del área (${fm(o.Rarea,2)} Ω), por más conductor que se agregue: lo que la baja es reducir la resistividad alrededor de la malla. `:nat.ok?"La malla ya cumple con el suelo natural; el mejoramiento no es necesario. ":`Con el suelo natural no se cumple. Active el mejoramiento en «Suelo y persona» para usarlo en el diseño. `}Mantenimiento: medir la resistencia antes de energizar y cada año en época seca (IEEE 81) y volver a aplicar si sube más de un 20 % o pasa del límite.</p>`;
}
function renderMalExtra(o,p){
  const sfc=o.sf,calc=p.sfMode==="calc",row=(lab,ov)=>{const r=calcMal({...p,...ov});return `<tr><td class="l">${lab}</td><td>${fm(r.Em,0)} V <span class="mut">de ${fm(r.Etouch,0)}</span></td><td>${fm(r.Es,0)} V <span class="mut">de ${fm(r.Estep,0)}</span></td><td>${fm(r.Rg,3)} Ω</td><td class="l">${okp(r.okCond&&r.okMalla&&r.okR)}</td></tr>`};
  const grp=(t,why)=>`<tr class="grp"><td colspan="5">${t}<div style="font-family:var(--f-body);font-weight:400;font-size:13px;color:var(--muted);white-space:normal">${why}</div></td></tr>`;
  let h=`<p class="tip">Cambia un supuesto a la vez, deja lo demás igual y muestra si la malla cumpliría. Así se ve qué dato hay que confirmar primero.</p><div class="scroll"><table><tr><th class="l">Si el dato fuera…</th><th>Tensión de malla</th><th>Tensión de paso</th><th>Rg</th><th class="l">IEEE 80</th></tr>`;
  h+=row(`<b>Diseño actual</b>`,{});
  h+=grp(`Factor de reparto Sf = ${fm(o.SfUse,2)}${calc?" (calculado)":" (asumido)"}`,`Solo esa parte de la falla entra al suelo por la malla; el resto regresa por los cables de guarda. ${sfc.N?`Con ${sfc.N} cables de guarda, vanos de ${fm(p.sfSpan,0)} m y ${fm(p.sfRt,0)} Ω de pie de torre, el cálculo da Sf = ${fm(sfc.Sf,2)}.`:""}`);
  if(!calc&&sfc.N)h+=row(`Sf calculado: ${fm(sfc.Sf,2)}`,{Sf:sfc.Sf});
  [0.5,0.2].forEach(v=>{if(Math.abs(v-o.SfUse)>0.01)h+=row(`Sf = ${fm(v,2)}`,{sfMode:"man",Sf:v})});
  h+=grp(`Tiempo de despeje = ${fm(p.tf,2)} s`,"Mientras más rápido despejan las protecciones, más tensión aguanta una persona.");
  [0.5,0.3].forEach(t=>{if(Math.abs(p.tf-t)>1e-6)h+=row(`Despeje en ${fm(t,2)} s`,{tf:t})});
  h+=grp(`Capa de grava: ${fm(p.rhos,0)} Ω·m, ${fm(p.hs*100,0)} cm`,"La grava seca aumenta la resistencia de contacto de los pies y sube las tensiones tolerables.");
  if(p.hs<0.3)h+=row("Capa de 30 cm",{hs:0.3});if(p.rhos<10000)h+=row("Grava de 10 000 Ω·m",{rhos:10000});
  h+=grp(`Electrodos: ${fm(p.nR,0)} varillas de ${fm(p.LR,1)} m${p.nR2?` y ${fm(p.nR2,0)} de ${fm(p.LR2,2)} m`:""}`,"Las varillas largas alcanzan capas más profundas y reparten la corriente.");
  [6,12].forEach(L=>{if(L>p.LR)h+=row(`Las mismas ${fm(p.nR,0)} varillas, de ${L} m`,{LR:L})});
  if(o.trat){h+=grp(`Terreno mejorado: ${fm(o.rho1,0)} Ω·m sobre ${fm(o.rho2,0)} Ω·m`,"Es el supuesto que más pesa: si el tratamiento no llega al suelo de abajo, la resistencia sube.");
    h+=row(`Sin mejoramiento (${fm(p.rho,0)} Ω·m)`,{mej:"no"});[[0,"el suelo de abajo sigue natural"],[Math.max(0,o.red2-12.5),"el suelo de abajo baja menos"]].forEach(([r,t])=>{if(Math.abs(r-o.red2)>0.1)h+=row(`Reducción abajo de ${fm(r,1)} % (${t})`,{red2:r})});}
  else{h+=grp(`Resistividad del suelo = ${fm(p.rho,0)} Ω·m`,"Debe salir de una medición de campo (método de Wenner) en época seca.");
    h+=row(`ρ = ${fm(p.rho*1.25,0)} Ω·m (25 % más)`,{rho:p.rho*1.25})+row(`ρ = ${fm(p.rho*0.75,0)} Ω·m (25 % menos)`,{rho:p.rho*0.75})+row(`Con FAVIGEL (−90 % en 3 m, −87,5 % abajo)`,{mej:"favigel",red1:90,Ht:3,red2:87.5});}
  $("sensMal").innerHTML=h+"</table></div>";
}
function memoMal(o,p){
  const {st,add}=memoList(),rC=fm(o.rhoC,0);
  if(o.trat)add("Suelo","Mejoramiento del terreno",`${esc(o.mejN)}. El suelo natural tiene ${fm(p.rho,0)} Ω·m. El material se aplica en las zanjas de la malla y en las perforaciones de las varillas, de modo que queda una capa tratada de ${fm(p.Ht,1)} m sobre el suelo de abajo. Bajo la grava está la capa tratada; para las ecuaciones de IEEE 80, que suponen suelo uniforme, se toma la mayor de las dos (lado seguro).${MEJ[p.mej]&&MEJ[p.mej].fuente?" Fuente de la reducción: "+MEJ[p.mej].fuente+".":""}`,
    [`ρ1 = ${fm(p.rho,0)}·(1 − ${fm(o.red1,1)} %) = ${R(fm(o.rho1,0)+" Ω·m")} ; ρ2 = ${fm(p.rho,0)}·(1 − ${fm(o.red2,1)} %) = ${R(fm(o.rho2,0)+" Ω·m")}`,`ρ para Cs = ${R(fm(o.rhoCs,0)+" Ω·m")} ; ρ para Rg, Em y Es = máx(${fm(o.rho1,0)}; ${fm(o.rho2,0)}) = ${R(rC+" Ω·m")}`],"IEEE 80 secc. 13");
  add("Lo que aguanta una persona","Efecto de la capa de grava",`La grava del patio es muy resistiva y aísla los pies de la persona. Cs dice cuánto ayuda.`,[`${Sb(I("C"),"s")} = 1 − ${F("0,09·(1 − ρ/"+Sb("ρ","s")+")","2"+Sb(I("h"),"s")+" + 0,09")} = 1 − ${F("0,09·(1 − "+fm(o.rhoCs,0)+"/"+fm(p.rhos,1)+")","2·"+fm(p.hs,2)+" + 0,09")} = ${R(fm(o.Cs,3))}`],"IEEE 80 ec. 27");
  add("Lo que aguanta una persona","Tensiones tolerables",`Tensión máxima que soporta una persona de ${p.peso} kg durante ${fm(o.ts,2)} s.`,
    [`${Sb(I("E"),"toque")} = (1000 + 1,5·${fm(o.Cs,3)}·${fm(p.rhos,1)})·${F(fm(o.kb,3),Q(fm(o.ts,2)))} = ${R(fm(o.Etouch,1)+" V")}`,`${Sb(I("E"),"paso")} = (1000 + 6·${fm(o.Cs,3)}·${fm(p.rhos,1)})·${F(fm(o.kb,3),Q(fm(o.ts,2)))} = ${R(fm(o.Estep,1)+" V")}`],"IEEE 80 ec. 29 y 32");
  if(p.sfMode==="calc"&&o.sf.N)add("Corriente de falla","Factor de reparto Sf",`Los ${o.sf.N} cables de guarda, aterrizados en cada torre, forman una escalera por la que regresa parte de la falla.`,
    [`${Sb(I("Z"),"eq")} = ${R(fm(o.sf.Zr,3)+" + j"+fm(o.sf.Zx,3)+" Ω")} ; ${Sb(I("S"),"f")} = |${F(Sb(I("Z"),"eq"),Sb(I("Z"),"eq")+" + "+Sb(I("R"),"g"))}| = ${R(fm(o.sf.Sf,3))}`],"IEEE 80 Anexo C");
  add("Corriente de falla","Corriente que drena la malla",`${o.asim?`El dato es la corriente asimétrica (${fm(p.If,2)} kA): se pasa a simétrica con Df.`:`Se parte de la falla a tierra simétrica (${fm(p.If,2)} kA).`} Df agrega la componente continua, Cp el crecimiento futuro de la red y Sf la parte que entra al suelo${o.SfUse>=1?" (Sf = 1: toda la corriente drena por la malla, caso más desfavorable)":""}.`,
    [`${Sb(I("T"),"a")} = ${F(fm(p.XR,1),"2π·60")} = ${fm(o.Tdc*1000,1)} ms ; ${Sb(I("D"),"f")} = ${R(fm(o.Df,3))}`+(o.asim?` ; 3${Sb(I("I"),"0")} = ${F(fm(p.If,2),fm(o.Df,3))} = ${R(fm(o.I3,2)+" kA")}`:""),
     `${Sb(I("I"),"G")} = ${Sb(I("S"),"f")}·${Sb(I("C"),"p")}·${Sb(I("D"),"f")}·3${Sb(I("I"),"0")} = ${fm(o.SfUse,2)}·${fm(o.Cp,2)}·${fm(o.Df,3)}·${fm(o.I3,2)} = ${R(fm(o.IG,0)+" A")}`],"IEEE 80 ec. 79, 86 y numeral 15.9");
  add("Conductor","Sección mínima del cobre",`Debe aguantar toda la falla (${fm(o.IFc,2)} kA con su asimetría y crecimiento) durante ${fm(o.tc,2)} s, desde ${fm(p.Ta,0)} °C. ${MAT[p.mat].n}; uniones: ${CONN[p.conn].n.toLowerCase()}.`,
    [`${I("A")} = ${R(fm(o.Amin,1)+" mm²")} ${o.okCond?AD(`${SIZES[p.size][0]} (${fm(o.Asec,1)} mm²) cumple`):BD(`${SIZES[p.size][0]} no cumple`)}`],"IEEE 80 ec. 37");
  add("Malla","Conductor y varillas",`Retícula base de ${o.nX} × ${o.nY} conductores (${fm(o.LCb,0)} m)${o.zon?`, zona de equipos de ${fm(p.zLx,1)} × ${fm(p.zLy,1)} m con ${Math.round(p.zNy)} × ${Math.round(p.zNx)} conductores (${fm(o.LCz,0)} m)`:""}${o.esqOn?`, cuatro refuerzos de esquina de ${fm(p.eL,1)} × ${fm(p.eL,1)} m (${fm(o.LCe,0)} m)`:""}. ${o.nRt} varillas: ${fm(o.LRt,1)} m.`,
    [`${Sb(I("L"),"C")} = ${R(fm(o.LC,1)+" m")} ; ${Sb(I("L"),"R")} = ${R(fm(o.LRt,1)+" m")} ; ${Sb(I("L"),"T")} = ${R(fm(o.LT,1)+" m")} ; A = ${fm(o.A,1)} m²`],"IEEE 80 secc. 14 y 16");
  add("Malla","Resistencia y elevación de potencial",`Ecuación de Sverak con ρ = ${rC} Ω·m.${o.trat?` Sin mejoramiento (${fm(p.rho,0)} Ω·m) daría ${fm(o.RgNat,3)} Ω: el término del área ya vale ${fm(o.Rarea,2)} Ω y agregar cobre casi no lo baja.`:""}`,
    [`${Sb(I("R"),"g")} = ${R(fm(o.Rg,3)+" Ω")}${o.Rmax?(o.okR?AD("≤ "+fm(o.Rmax,2)+" Ω"):BD("> "+fm(o.Rmax,2)+" Ω")):""} ; GPR = ${fm(o.IG,0)}·${fm(o.Rg,3)} = ${R(fm(o.GPR,0)+" V")}`+(o.safeGPR?AD("Menor que el toque tolerable"):MU("mayor que el toque tolerable: se calculan Em y Es"))],"IEEE 80 ec. 52 y 57");
  add("Malla","Factores geométricos",`Cuadrícula base de ${fm(o.Dx,2)} × ${fm(o.Dy,2)} m; se usa D = ${fm(o.Deff,2)} m (${{prom:"promedio",min:"el menor",max:"el mayor"}[p.Dsel]||"promedio"}). ${o.esq?"Hay varillas en el perímetro: Kii = 1.":""}`,
    [`${I("n")} = ${fm(o.na,2)}·${fm(o.nb,3)} = ${R(fm(o.n,2))} ; ${Sb(I("K"),"i")} = 0,644 + 0,148·${I("n")} = ${R(fm(o.Ki,3))} ; ${Sb(I("K"),"m")} = ${R(fm(o.Km,3))} ; ${Sb(I("K"),"s")} = ${R(fm(o.Ks,3))}`,
     `${Sb(I("L"),"M")} = ${o.esq?`${Sb(I("L"),"C")} + [1,55 + 1,22·${F(fm(o.Lr,2),Q("Lx² + Ly²"))}]·${Sb(I("L"),"R")}`:`${Sb(I("L"),"C")} + ${Sb(I("L"),"R")}`} = ${R(fm(o.LM,1)+" m")} ; ${Sb(I("L"),"S")} = 0,75·${Sb(I("L"),"C")} + 0,85·${Sb(I("L"),"R")} = ${R(fm(o.LS,1)+" m")}`],"IEEE 80 ec. 81 a 94");
  add("Malla","Tensión de malla y de paso",`Son las tensiones que aparecerían en el patio durante la falla.`,
    [`${Sb(I("E"),"m")} = ${F(rC+"·"+fm(o.Km,3)+"·"+fm(o.Ki,3)+"·"+fm(o.IG,0),fm(o.LM,0))} = ${R(fm(o.Em,0)+" V")} ${o.okEm?AD("≤ "+fm(o.Etouch,1)+" V"):BD("> "+fm(o.Etouch,1)+" V")}`,
     `${Sb(I("E"),"s")} = ${F(rC+"·"+fm(o.Ks,3)+"·"+fm(o.Ki,3)+"·"+fm(o.IG,0),fm(o.LS,0))} = ${R(fm(o.Es,0)+" V")} ${o.okEs?AD("≤ "+fm(o.Estep,1)+" V"):BD("> "+fm(o.Estep,1)+" V")}`],"IEEE 80 ec. 85 y 92");
  if(o.fuera)add("Verificación","Rango de las ecuaciones",`Las ecuaciones simplificadas de IEEE 80 se ajustaron para n ≤ 25 y D ≥ 2,5 m. Aquí n = ${fm(o.n,1)}: los valores son una estimación razonable y en la ingeniería de detalle conviene confirmarlos con un programa de elementos finitos.`,[`${I("n")} = ${R(fm(o.n,1))} ; D = ${R(fm(o.Deff,2)+" m")}`],"IEEE 80 secc. 16.5");
  return st;
}

/* ============================================================
   Apantallamiento
   ============================================================ */
function renderApa(){
  const g=S.g,p=S.apa,o=RP=calcApa(g,p);
  const gov=o.gov,crit=o.crit,c45=o.ver.filter(v=>!v.ok45);
  const fails=o.ver.filter(v=>!v.ok);
  const metT={ambos:"por los dos métodos: esfera rodante y ángulos fijos",esfera:"por el método de la esfera rodante",angulos:"por el método de ángulos fijos"}[o.metodo]||"";
  $("vApa").innerHTML=o.ok?verdict("ok",`El patio queda protegido ${metT}`,
      `Basta con que cumpla uno de los dos métodos. Esfera rodante: ${o.okMetEsf?"cumple":"no cumple"} (Sm = ${fm(o.SmMin,2)} m, ${esc(gov?gov.n:"—")}; margen mínimo ${fm(o.margMin,2)} m en «${esc(crit?crit.n:"—")}»). Ángulos fijos: ${o.okMetAng?(o.ok45?"cumple, todo dentro de 45°":`cumple con 45° hacia afuera y 60° entre dos cables (β); ${c45.map(v=>`«${esc(v.n)}» pide ${fm(v.th,1)}°`).join(", ")}: más de 45°, pero queda entre dos cables y dentro de 60°`):`no cumple (${c45.map(v=>`«${esc(v.n)}» pide ${fm(v.th,1)}°`).join(", ")})`}.`)
    :verdict("no",!o.okPatio?"Hay elementos expuestos a descargas directas":"El edificio con puntas captadoras no queda protegido",!o.okPatio?`Ninguno de los dos métodos cubre todo el patio. Esfera rodante: ${fails.length?`toca ${fails.map(v=>`«${esc(v.n)}» (${fm(v.marg,2)} m)`).join(", ")}`:`la separación entre cables (${fm(p.s2d,1)} m) supera 1,5·Sm = ${fm(1.5*o.SmMin,1)} m`}. Ángulos fijos: ${c45.map(v=>`«${esc(v.n)}» pide ${fm(v.th,1)}°`).join(", ")}. Suba los cables de guarda o acérquelos.`:"Revise la altura de las puntas o su separación (tabla del edificio).");
  $("kApa").innerHTML=kpi("Esfera más pequeña Sm",fm(o.SmMin,2),"m",esc(gov?gov.n:""),"hl")+kpi("Corriente crítica",fm(gov?gov.Ic:NaN,2),"kA",gov?`Z₀ ${fm(gov.Z0,0)} Ω`:"")+kpi("Altura efectiva he",fm(gov?gov.he:NaN,2),"m",`con d = ${fm(o.d,2)} m`)+
    kpi("Margen mínimo (esfera)",fm(o.margMin,2),"m",esc(crit?crit.n:""),o.okEsf?"hl":o.okPatio?"":"bad")+kpi("Mayor ángulo pedido",fm(o.thMax,1),"°",o.ok45?"todo dentro de 45°":o.ok60?"cubierto con β = 60°":o.okMetEsf?"más de 45°: manda la esfera":"más de 45°",o.okMetAng?"hl":o.okPatio?"":"bad")+
    kpi("Flecha del cable de guarda",fm(o.f,2),"m",`punto bajo ${fm(o.hLow,2)} m`)+kpi("Separación máxima 2d",fm(1.5*o.SmMin,1),"m",`hay ${fm(p.s2d,1)} m`,o.okSep?"":"bad")+kpi("Rayos sobre el lote",fm(o.Nd,3),"por año",Number.isFinite(o.anios)?`uno cada ${fm(o.anios,0)} años`:"");
  o.sm.forEach((s,i)=>etRes("etSm",i,[fm(s.hpr,2),fm(s.Rc,3),fm(s.Z0,0),fm(s.Ic,2),`<b>${fm(s.Sm,2)}</b>`,fm(s.he,2),fm(s.dmax2,1)]));
  o.ver.forEach((v,i)=>etRes("etVer",i,[fm(v.Sm,2),fm(v.y,2),`<b style="color:${v.ok?"var(--ok)":"var(--no)"}">${fm(v.marg,2)}</b>`,`${fm(v.th,1)}° ${v.ok45?"":v.ok60?"(β 60°)":"&gt; 45°"}`,v.ok&&(v.ok45||v.ok60)?pill("ok","Cumple (ambos)"):v.ok?pill("ok","Cumple (esfera)"):v.ok45||v.ok60?pill("ok",v.ok45?"Cumple (45°)":"Cumple (β 60°)"):pill("no","Expuesto")]));
  $("svgApa").innerHTML=svgApa(o,p);
  $("tMas").innerHTML=`<tr><th class="l">Punto crítico de la cubierta</th>${o.mast.map(m=>`<th>Esfera de ${fm(m.R,2)} m</th>`).join("")}</tr>`+
    o.mast[0].pts.map((q,j)=>`<tr><td class="l">${q.t}</td>${o.mast.map(m=>{const z=m.pts[j];return `<td>${fm(z.y,2)} m <span class="pill ${z.m>=0?"ok":m===o.mast[0]?"no":"wa"}">${z.m>=0?"+":""}${fm(z.m,2)} m</span></td>`}).join("")}</tr>`).join("")+
    `<tr><td class="l">Diagonal máxima entre puntas 2J</td>${o.mast.map(m=>`<td>${fm(m.Kmax,2)} m ${m.Kmax>=o.Kdiag?"≥":"<"} ${fm(o.Kdiag,2)} m ${m.Kmax>=o.Kdiag?okp(true):m===o.mast[0]?okp(false):pill("wa","Solo informativa")}</td>`).join("")}</tr>
     <tr><td class="l mut" colspan="${o.mast.length+1}" style="white-space:normal">Edificio de ${fm(p.L1,2)} × ${fm(p.L2,2)} m con cubierta a ${fm(p.deM,2)} m y cuatro puntas en las esquinas a ${fm(p.hM,2)} m. Se muestra la altura del arco de la esfera y el margen sobre la cubierta (Mejía Villegas 5.5.4.2, ec. 5.21 a 5.24). Rige la esfera de ${fm(p.rN,0)} m del nivel de protección (NTC 4552-3); la esfera del patio es una verificación adicional.</td></tr>`;
  memo("memoApa",memoApa(o,p));
  setSt("st-apa",o.ok?"ok":"no");
}
function svgApa(o,p){
  const r2=o.ver.find(v=>v.apo==="2c"),s=r2?+r2.s:p.s2d,h=r2?+r2.h1:o.hLow,Sm=o.SmMin;if(!Number.isFinite(Sm))return"";
  const nW=4,xs0=0,xs=[...Array(nW)].map((_,i)=>i*s),xc=h<Sm?Math.sqrt(Sm*Sm-(Sm-h)*(Sm-h)):Sm,ext=Math.min(xc,s*1.6),x0=-ext-1,x1=xs[nW-1]+ext+1,ytop=h+2.5;
  const W=780,pl=10,pt=10,pb=28,sc=Math.min((W-2*pl)/(x1-x0),26),Hh=pt+ytop*sc+pb,PX=x=>(pl+(x-x0)*sc).toFixed(1),PY=y=>(pt+(ytop-y)*sc).toFixed(1);
  const T=(x,y,t,a="middle",c="var(--muted)",w="400")=>`<text x="${x}" y="${y}" font-size="11.5" text-anchor="${a}" fill="${c}" font-weight="${w}">${t}</text>`;
  let g=`<line x1="${PX(x0)}" y1="${PY(0)}" x2="${PX(x1)}" y2="${PY(0)}" stroke="var(--ink)" stroke-width="2"/>`;
  /* zona protegida por la esfera */
  const pts=[];const N=40;
  for(let i=0;i<=N;i++){const x=xs[0]-ext+ext*i/N,u=xs[0]-ext+xc,yy=Sm-Math.sqrt(Math.max(0,Sm*Sm-(x-(xs[0]-xc))**2));pts.push([x,Math.max(0,Math.min(h,yy))])}
  const yc=h+Math.sqrt(Math.max(0,Sm*Sm-s*s/4));
  for(let k=0;k<nW-1;k++)for(let i=1;i<N;i++){const x=xs[k]+s*i/N,m=xs[k]+s/2;pts.push([x,yc-Math.sqrt(Math.max(0,Sm*Sm-(x-m)**2))])}
  for(let i=0;i<=N;i++){const x=xs[nW-1]+ext*i/N,yy=Sm-Math.sqrt(Math.max(0,Sm*Sm-(x-(xs[nW-1]+xc))**2));pts.push([x,Math.max(0,Math.min(h,yy))])}
  g+=`<polygon points="${PX(xs[0]-ext)},${PY(0)} ${pts.map(q=>PX(q[0])+","+PY(q[1])).join(" ")} ${PX(xs[nW-1]+ext)},${PY(0)}" fill="var(--safe)" stroke="var(--link)" stroke-width="1.4" stroke-dasharray="6 4"/>`;
  /* rectas de 45° */
  xs.forEach(x=>{g+=`<line x1="${PX(x)}" y1="${PY(h)}" x2="${PX(x-h)}" y2="${PY(0)}" stroke="var(--wa)" stroke-width="1" stroke-dasharray="3 3" opacity=".8"/><line x1="${PX(x)}" y1="${PY(h)}" x2="${PX(x+h)}" y2="${PY(0)}" stroke="var(--wa)" stroke-width="1" stroke-dasharray="3 3" opacity=".8"/>`});
  /* elementos de las filas de dos cables iguales */
  const lev=o.ver.filter(v=>v.apo==="2c"&&Math.abs(+v.s-s)<0.01);
  const seen=new Set();lev.forEach(v=>{const c=v.ok?"var(--live)":"var(--no)";for(let k=0;k<nW-1;k++){[+v.x,s-+v.x].forEach(dx=>{g+=`<circle cx="${PX(xs[k]+dx)}" cy="${PY(+v.de)}" r="4" fill="${c}"/>`})}
    const key=fm(+v.de,2);if(!seen.has(key)){seen.add(key);g+=`<line x1="${PX(x0)}" y1="${PY(+v.de)}" x2="${PX(x1)}" y2="${PY(+v.de)}" stroke="var(--live)" stroke-width=".8" stroke-dasharray="2 4" opacity=".5"/>`+T(PX(x1)-2,+PY(+v.de)-4,`${esc(v.n.replace(/^Patio: /,""))} · ${key} m`,"end","var(--live)","600")}});
  xs.forEach(x=>{g+=`<line x1="${PX(x)}" y1="${PY(0)}" x2="${PX(x)}" y2="${PY(h)}" stroke="var(--steel)" stroke-width="1.5" opacity=".35"/><circle cx="${PX(x)}" cy="${PY(h)}" r="5" fill="var(--ok)"/>`});
  g+=T(PX(xs[1]+s/2),+PY(h-Sm+Math.sqrt(Math.max(0,Sm*Sm-s*s/4)))+15,`he = ${fm(Sm-Math.sqrt(Math.max(0,Sm*Sm-s*s/4)),2)} m`,"middle","var(--link)","600");
  g+=T(+PX(xs[0])-8,+PY(h)-6,`cable de guarda · ${fm(h,2)} m`,"end","var(--ok)","600");
  /* guiño al profe: pajarito azul y blanco cantando sobre el último cable */
  {const bx=+PX(xs[nW-1]),by=+PY(h)-5;
   g+=`<g aria-label="Pajarito azul sobre el cable de guarda"><title>Un saludo al profe desde el cable de guarda ♪</title>`+
     `<line x1="${bx-3}" y1="${by+1}" x2="${bx-4}" y2="${by+5}" stroke="#4a2a12" stroke-width="1.2"/><line x1="${bx+2}" y1="${by+1}" x2="${bx+2}" y2="${by+5}" stroke="#4a2a12" stroke-width="1.2"/>`+
     `<path d="M${bx-9} ${by-5} L${bx-15} ${by-9} L${bx-13} ${by-3}Z" fill="#1d4fa3"/>`+
     `<ellipse cx="${bx-1}" cy="${by-6}" rx="9" ry="6.5" fill="#1d4fa3"/><ellipse cx="${bx}" cy="${by-4}" rx="5.5" ry="3.6" fill="#fff"/>`+
     `<circle cx="${bx+6}" cy="${by-12}" r="4.8" fill="#1d4fa3"/><circle cx="${bx+7.5}" cy="${by-13}" r="1.1" fill="#fff"/><path d="M${bx+10.5} ${by-13} L${bx+15} ${by-11.5} L${bx+10.5} ${by-10.5}Z" fill="#e0a526"/>`+
     `<text x="${bx+16}" y="${by-9}" font-size="13" fill="#1d4fa3">♪</text><text x="${bx+25}" y="${by-17}" font-size="11" fill="#1d4fa3">♫</text></g>`}
  g+=T(PX(xs[0]+s/2),+PY(0)+17,`${fm(s,2)} m entre cables · esfera Sm = ${fm(Sm,2)} m`,"middle","var(--link)","600");
  return `<svg viewBox="0 0 ${W} ${Hh.toFixed(0)}" width="100%" style="min-width:560px" role="img" aria-label="Corte del patio con la esfera rodante">${g}</svg><p class="norma" style="margin:4px 0 0">Corte perpendicular a los cables de guarda con la esfera más pequeña. Los puntos son los elementos de las filas «dos cables iguales»; en azul, la zona que la esfera no alcanza.</p>`;
}
function memoApa(o,p){
  const {st,add}=memoList(),G=o.gov;
  add("Cables de guarda","Flecha y altura del cable",`Acero galvanizado tendido entre puntas a ${fm(p.hG,2)} m en vanos de ${fm(p.vanoG,2)} m.`,
    [`${I("f")} = α·${I("L")} = ${fm(p.alfa,3)}·${fm(p.vanoG,2)} = ${R(fm(o.f,2)+" m")} → punto bajo ${R(fm(o.hLow,2)+" m")}`],"Mejía Villegas ec. 5.12");
  if(G){add("Distancia de descarga",`Caso que gobierna: ${esc(G.n)}`,`Altura promedio del conductor, radio de corona, impedancia característica y corriente crítica. ${G.base==="CFO"?`Sostenido por una cadena de ${fm(G.w,2)} m: se usa su CFO.`:`Sostenido por equipos: se usa el BIL de ${fm(G.bil,0)} kV.`}`,
    [`${Sb(I("h"),"pr")} = ${F(fm(G.hmax,2),"3")} + ${F("2·"+fm(G.hmin,2),"3")} = ${R(fm(G.hpr,2)+" m")}`+(G.base==="CFO"?` ; CFO = 0,94·585·${fm(G.w,2)} = ${R(fm(G.cfo,0)+" kV")}`:""),
     `${Sb(I("R"),"c")}·ln${F("2"+Sb(I("h"),"pr"),Sb(I("R"),"c"))} = ${F(fm(G.Vc,0),"1500")} → ${Sb(I("R"),"c")} = ${R(fm(G.Rc,4)+" m")}`,
     `${Sb(I("Z"),"0")} = 60·${Q("ln"+F(fm(2*G.hpr,2),fm(G.Rc,4))+"·ln"+F(fm(2*G.hpr,2),fm(G.r,5)))} = ${R(fm(G.Z0,1)+" Ω")} ; ${Sb(I("I"),"c")} = ${F((G.base==="CFO"?"2,068·":"2,2·")+fm(G.Vc,0),fm(G.Z0,1))} = ${R(fm(G.Ic,2)+" kA")}`,
     `${Sb(I("S"),"m")} = 8·${fm(p.k,1)}·${fm(G.Ic,2)}<sup>0,65</sup> = ${R(fm(G.Sm,2)+" m")} ; ${Sb(I("h"),"e")} = ${fm(G.Sm,2)} − ${Q(fm(G.Sm,2)+"² − "+fm(o.d,2)+"²")} = ${R(fm(G.he,2)+" m")} ; 2${Sb(I("d"),"máx")} = 1,5·${Sb(I("S"),"m")} = ${fm(G.dmax2,1)} m`],"Mejía Villegas ec. 5.6 a 5.19 · IEEE 998")}
  add("Verificación","Esfera rodante",`La esfera de radio Sm se apoya en los cables de guarda (o en un cable y el suelo). Ningún elemento energizado puede quedar por encima de su arco.`,
    o.ver.map(v=>`${esc(v.n)}: arco ${fm(v.y,2)} m − elemento ${fm(+v.de,2)} m = ${R(fm(v.marg,2)+" m")} ${v.ok?AD("protegido"):BD("expuesto")}`),"Modelo electrogeométrico");
  add("Verificación","Ángulos fijos",`Segundo método: un elemento a x metros del cable queda cubierto si θ = arctan[x/(h − de)] no supera 45° (o 60° entre dos cables). El patio queda protegido si cumple este método o el de la esfera rodante.`,
    o.ver.map(v=>`${esc(v.n)}: θ = ${R(fm(v.th,1)+"°")} ${v.ok45?AD("≤ 45°"):v.ok60?AD("≤ 60° entre cables"):BD("> 45°")}`),"Mejía Villegas 5.4.1");
  add("Exposición","Descargas esperadas",`Con la densidad de descargas del sitio y el área del lote.`,
    [`${Sb(I("N"),"d")} = ${fm(p.ddt,1)}·${F(fm(p.area,0),"10⁶")} = ${R(fm(o.Nd,3)+" rayos/año")} ${MU(Number.isFinite(o.anios)?"uno cada "+fm(o.anios,0)+" años":"")}`,
     ...(o.f45?[`Tasa de falla con 45° (Tabla 5.1, cables a 15 m): 0,4483·${F(fm(p.Lcg,0),"1000·100")} = ${R(fm(o.f45,4)+" fallas/año")} ${MU("una cada "+fm(o.aF45,0)+" años")}`]:[])],"NTC 4552-1 · Mejía Villegas Tabla 5.1");
  o.mast.forEach(m=>add("Edificio con puntas captadoras",`Esfera de ${fm(m.R,2)} m`,`Cuatro puntas a ${fm(p.hM,2)} m sobre una cubierta de ${fm(p.deM,2)} m.`,
    [`${I("y")} = ${fm(p.hM,2)} − ${fm(p.deM,2)} = ${fm(m.y,2)} m ; ${I("E")} = ${fm(m.R,2)} − ${fm(m.y,2)} = ${fm(m.E,2)} m ; ${I("J")} = ${Q(fm(m.R,2)+"² − "+fm(m.E,2)+"²")} = ${fm(m.J,2)} m`,
     `${Sb(I("K"),"máx")} = 2${I("J")} = ${R(fm(m.Kmax,2)+" m")} ${m.Kmax>=o.Kdiag?AD("≥ diagonal "+fm(o.Kdiag,2)+" m"):BD("< diagonal "+fm(o.Kdiag,2)+" m")}`],"Mejía Villegas ec. 5.21 a 5.24 · NTC 4552-3"));
  return st;
}

/* ============================================================
   Configuraciones
   ============================================================ */
const CFGX={
  bs:{c:1,f:1,k:1,barra:"Sale toda la subestación.",intr:"Sale el circuito de ese interruptor.",uso:"Subestaciones pequeñas o de poca importancia. Es la más barata y la más simple de operar."},
  bpt:{c:2,f:2,k:2,barra:"Sale toda la subestación: solo hay una barra principal.",intr:"El circuito sigue en servicio por la barra de transferencia.",uso:"Distribución y 115 kV. Permite mantener cualquier interruptor sin cortar el circuito."},
  db:{c:3,f:3,k:3,barra:"Los circuitos de esa barra se pasan a la otra.",intr:"Sale el circuito de ese interruptor.",uso:"115 y 230 kV con varias fuentes. Permite repartir los circuitos entre dos barras."},
  dbt:{c:4,f:4,k:4,barra:"Los circuitos de esa barra se pasan a la otra.",intr:"El circuito sigue en servicio por la barra de transferencia.",uso:"Subestaciones importantes de 115 y 230 kV: une las ventajas de la doble barra y de la transferencia."},
  an:{c:4,f:3,k:2,barra:"No tiene barras: una falla solo saca un tramo del anillo.",intr:"Ningún circuito sale; el anillo queda abierto.",uso:"Hasta unos seis circuitos. Económica y confiable, pero difícil de ampliar."},
  iym:{c:5,f:5,k:4,barra:"Ningún circuito sale.",intr:"Ningún circuito sale.",uso:"230 y 500 kV del sistema de transmisión. Tres interruptores por cada dos circuitos."},
  di:{c:5,f:5,k:5,barra:"Ningún circuito sale.",intr:"Ningún circuito sale.",uso:"Nodos críticos y grandes centrales. Es la más confiable y la más costosa."}
};
const dots=n=>`<span class="dots" aria-label="${n} de 5">${"●".repeat(n)}${"○".repeat(5-n)}</span>`;
function cfgSVG(k,o={}){
  const INK="var(--ink)",NV="var(--navy)";let g="";const tr=CFG[k].sb?Math.max(1,+o.tramos||1):1,conInt=o.seccTipo==="int";
  const ln=(x1,y1,x2,y2,w=1.6,c=INK)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  const bus=(y,x0,x1,t)=>ln(x0,y,x1,y,4.5,NV)+`<text x="${x0-4}" y="${y+4}" font-size="10.5" text-anchor="end" fill="var(--muted)" font-weight="600">${t}</text>`;
  const dot=(x,y)=>`<circle cx="${x}" cy="${y}" r="2.6" fill="${INK}"/>`;
  const cb=(x,y)=>`<rect x="${x-5}" y="${y-5}" width="10" height="10" fill="var(--surface)" stroke="${INK}" stroke-width="1.6"/>`;
  const sv=(x,y)=>`<rect x="${x-3}" y="${y-5}" width="6" height="10" fill="var(--surface)"/>`+ln(x,y+5,x+5,y-4);       /* seccionador en tramo vertical */
  const sh=(x,y)=>`<rect x="${x-5}" y="${y-3}" width="10" height="6" fill="var(--surface)"/>`+ln(x-5,y,x+4,y-5);       /* seccionador en tramo horizontal */
  const arr=(x,y,d)=>d==="d"?`<path d="M${x-4} ${y-6}L${x} ${y}L${x+4} ${y-6}" fill="none" stroke="${INK}" stroke-width="1.6"/>`:d==="u"?`<path d="M${x-4} ${y+6}L${x} ${y}L${x+4} ${y+6}" fill="none" stroke="${INK}" stroke-width="1.6"/>`:`<path d="M${x-6} ${y-4}L${x} ${y}L${x-6} ${y+4}" fill="none" stroke="${INK}" stroke-width="1.6"/>`;
  const run=(x,y0,y1,it)=>ln(x,y0,x,y1)+it.map(([t,y])=>t==="i"?cb(x,y):sv(x,y)).join("");
  const xs=[52,108,164,220];
  if(k==="bs"){g+=bus(34,30,270,"B");xs.forEach(x=>g+=run(x,34,160,[["s",62],["i",92],["s",122]])+dot(x,34)+arr(x,166,"d"))}
  else if(k==="bpt"){const X=[46,96,146,196];g+=bus(26,30,278,"BP")+bus(146,30,278,"BT");
    X.forEach(x=>g+=run(x,26,180,[["s",48],["i",72],["s",96]])+dot(x,26)+dot(x,114)+ln(x,114,x+16,114)+run(x+16,114,146,[["s",130]])+dot(x+16,146)+arr(x,186,"d"));
    g+=run(254,26,146,[["s",54],["i",86],["s",118]])+dot(254,26)+dot(254,146)}
  else if(k==="db"){const X=[48,100,152,204];g+=bus(24,30,278,"B1")+bus(44,30,278,"B2");
    X.forEach(x=>g+=run(x-9,24,74,[["s",60]])+run(x+9,44,74,[["s",60]])+dot(x-9,24)+dot(x+9,44)+ln(x-9,74,x+9,74)+run(x,74,160,[["i",98],["s",128]])+arr(x,166,"d"));
    g+=run(247,24,82,[["s",62]])+run(267,44,82,[["s",62]])+dot(247,24)+dot(267,44)+ln(247,82,267,82)+cb(257,82)}
  else if(k==="dbt"){const X=[44,92,140,188];g+=bus(20,30,278,"B1")+bus(38,30,278,"B2")+bus(152,30,278,"BT");
    X.forEach(x=>g+=run(x-8,20,64,[["s",52]])+run(x+8,38,64,[["s",52]])+dot(x-8,20)+dot(x+8,38)+ln(x-8,64,x+8,64)+run(x,64,182,[["i",82],["s",104]])+dot(x,120)+ln(x,120,x+15,120)+run(x+15,120,152,[["s",136]])+dot(x+15,152)+arr(x,188,"d"));
    g+=run(226,20,72,[["s",54]])+run(242,38,72,[["s",54]])+dot(226,20)+dot(242,38)+ln(226,72,242,72)+cb(234,72);
    g+=run(266,20,152,[["s",60],["i",92],["s",124]])+dot(266,20)+dot(266,152)}
  else if(k==="an"){const x0=80,x1=220,y0=48,y1=142,xm=150,ym=95;
    g+=ln(x0,y0,x1,y0)+ln(x1,y0,x1,y1)+ln(x1,y1,x0,y1)+ln(x0,y1,x0,y0);
    g+=sh(xm-30,y0)+cb(xm,y0)+sh(xm+30,y0)+sh(xm-30,y1)+cb(xm,y1)+sh(xm+30,y1)+sv(x0,ym-24)+cb(x0,ym)+sv(x0,ym+24)+sv(x1,ym-24)+cb(x1,ym)+sv(x1,ym+24);
    [[x0,y0,-1],[x1,y0,-1],[x0,y1,1],[x1,y1,1]].forEach(([x,y,d])=>g+=dot(x,y)+run(x,y,y+d*34,[["s",y+d*17]])+arr(x,y+d*40,d>0?"d":"u"))}
  else if(k==="iym"){g+=bus(18,40,270,"B1")+bus(182,40,270,"B2");
    [96,196].forEach(x=>{g+=run(x,18,182,[["s",34],["i",48],["s",62],["s",88],["i",102],["s",116],["s",142],["i",156],["s",170]])+dot(x,18)+dot(x,182);
      [75,129].forEach(y=>g+=dot(x,y)+ln(x,y,x+42,y)+sh(x+20,y)+arr(x+48,y,"r"))})}
  else if(k==="di"){const X=[48,104,160,216];g+=bus(20,30,278,"B1")+bus(180,30,278,"B2");
    X.forEach(x=>g+=run(x,20,180,[["s",40],["i",58],["s",76],["s",124],["i",142],["s",160]])+dot(x,20)+dot(x,180)+dot(x,100)+ln(x,100,x+30,100)+sh(x+14,100)+arr(x+36,100,"r"))}
  /* by-pass: seccionador en paralelo con el interruptor de cada circuito */
  const BYP={bs:{X:xs,y0:50,y1:134,yi:92},db:{X:[48,100,152,204],y0:84,y1:142,yi:98}}[k];
  if(o.bp&&BYP)BYP.X.forEach(x=>g+=dot(x,BYP.y0)+dot(x,BYP.y1)+`<path d="M${x} ${BYP.y0}H${x+15}V${BYP.y1}H${x}" fill="none" stroke="var(--accent,#c2410c)" stroke-width="1.4" stroke-dasharray="0"/>`+sv(x+15,BYP.yi));
  /* seccionamiento longitudinal: corta la barra entre circuitos */
  const SB={bs:{y:[[34,0]],m:[80,136,192]},bpt:{y:[[26,0]],m:[71,121,171]},db:{y:[[24,-9],[44,0]],m:[74,126,178]},dbt:{y:[[20,-8],[38,0]],m:[68,116,164]}}[k];
  if(SB&&tr>1){const M=tr===2?[SB.m[1]]:tr===3?[SB.m[0],SB.m[2]]:SB.m,w=conInt?14:8;
    SB.y.forEach(([y,d])=>M.forEach(x0=>{const x=x0+d;g+=`<rect x="${x-w}" y="${y-6}" width="${2*w}" height="12" fill="var(--surface)"/>`+ln(x-w-1,y,x-w+2,y,4.5,NV)+ln(x+w-2,y,x+w+1,y,4.5,NV);
      g+=conInt?ln(x-w+2,y,x-13,y)+ln(x-13,y,x-8,y-5)+ln(x-7,y,x-5,y)+cb(x,y)+ln(x+5,y,x+7,y)+ln(x+7,y,x+12,y-5)+ln(x+13,y,x+w-2,y)
               :ln(x-w+2,y,x-4,y)+ln(x-4,y,x+3,y-6)+ln(x+4,y,x+w-2,y)}));}
  return `<svg viewBox="0 0 300 200" width="100%" role="img" aria-label="Esquema unifilar de ${cfgNombre(k,o.bp)}${tr>1?`, barra partida en ${tr} tramos`:""}">${g}</svg>`;
}
function renderCfg(){
  const p=S.proy,n=nCirc(),cur=CFG[p.cfg]?p.cfg:"bpt",ce=SUBE.cuentaEquipos(p),c=CFG[cur],curSel=cur+(ce.bypass?"+bp":"");
  const sbTxt=ce.juntas?` Barra partida en ${ce.tramos} tramos con ${ce.conInt?`${ce.juntas} interruptor${ce.juntas>1?"es":""} de acople longitudinal`:`${ce.juntas} seccionador${ce.juntas>1?"es":""} de barras`}.`:"";
  $("cfgN").textContent=`para ${n} circuitos equipados (${+p.nLin||0} de línea y ${+p.nTr||0} de transformación)${nRes()?`, más ${nRes()} de reserva sin equipar`:""}${p.tramos>1?`, con la barra partida en ${p.tramos} tramos donde aplica`:""}`;
  const det=x=>Object.entries(x.sec).map(([k,v])=>`${v} ${minus(SUBE.SEC_T[k])}`).join(" · ");
  $("vCfg").innerHTML=`<div class="note"><b>Configuración del proyecto: ${cfgNombre(cur,ce.bypass)}.</b> ${ce.int} interruptores y ${ce.secT} seccionadores: ${det(ce)}.${sbTxt} ${CFGX[cur].uso}${!c.bp?` <span class="mut">By-pass: no aplica. ${c.bpNota}</span>`:""}${!c.sb?` <span class="mut">Seccionamiento de barras: no aplica en esta configuración.</span>`:""}</div>`;
  $("tCfg").innerHTML=`<tr><th class="l">Configuración</th><th>Interruptores</th><th>Seccionadores</th><th class="l">Detalle de seccionadores</th><th>By-pass</th><th>Seccionamiento de barras</th><th>Confiabilidad</th><th>Flexibilidad</th><th>Costo</th><th class="l">Si falla una barra</th><th class="l">Si se saca un interruptor</th></tr>`+
    CFG_OPTS().map(([key,lab])=>{const [k,b]=key.split("+"),cc=CFG[k],x=SUBE.cuentaEquipos(p,key),on=key===curSel;
      return `<tr class="${on?"sel":""}"><td class="l"><b>${lab}</b>${on?" "+pill("ok","Proyecto"):""}</td><td>${x.int}</td><td><b>${x.secT}</b></td><td class="l mut" style="min-width:220px;white-space:normal;font-size:12.5px">${det(x)}</td><td>${cc.bp?(b?pill("ok","Sí"):"No"):'<span class="mut">No aplica</span>'}</td><td>${cc.sb?(x.juntas?`${x.tramos} tramos`:"Barra continua"):'<span class="mut">No aplica</span>'}</td><td>${dots(CFGX[k].c)}</td><td>${dots(CFGX[k].f)}</td><td>${dots(CFGX[k].k)}</td><td class="l" style="min-width:180px">${CFGX[k].barra}${x.juntas?" Con la barra partida solo sale el tramo fallado.":""}</td><td class="l" style="min-width:180px">${b&&cc.bpTxt?cc.bpTxt:CFGX[k].intr}</td></tr>`}).join("");
  $("cfgCards").innerHTML=Object.entries(CFG).map(([k,cc])=>{const isCur=k===cur,bp=isCur&&ce.bypass;
    const opt={bp,tramos:p.tramos,seccTipo:p.seccTipo},x=SUBE.cuentaEquipos(p,k+(bp?"+bp":""));
    const btn=(key,t)=>key===curSel?pill("ok","Configuración del proyecto"):`<button class="btn" type="button" data-cfg="${key}">${t}</button>`;
    const btns=cc.bp?btn(k,"Usar sin by-pass")+" "+btn(k+"+bp","Usar con by-pass"):btn(k,"Usar en el proyecto");
    return `<div class="card cfgc ${isCur?"on":""}"><h3>${isCur?cfgNombre(k,bp):cc.n}</h3>${cfgSVG(k,opt)}<p>${CFGX[k].uso}${cc.bp?` <span class="mut">Admite by-pass${bp?" (en el esquema, en color)":""}.</span>`:""}${cc.sb&&p.tramos>1?` <span class="mut">Barra partida en ${p.tramos} tramos.</span>`:""}</p><div class="cfgf"><span class="mut">${x.int} interruptores · ${x.secT} seccionadores</span><span style="display:flex;gap:6px;flex-wrap:wrap">${btns}</span></div></div>`}).join("");
}

/* ============================================================
   Resumen
   ============================================================ */
const RES=[
  ["Aislamiento","BIL requerido","kV",()=>RA.BILreq,1],["Aislamiento",()=>`Distancia máx. con BIL ${RA.BIL} kV`,"m",()=>RA.L1?RA.lmax1:null,1],["Aislamiento",()=>`Distancia máx. con BIL ${RA.BIL2} kV`,"m",()=>RA.L2?RA.lmax2:null,1],
  ["Aislamiento","NPR corregido por altitud","kV",()=>RA.NPRc,1],["Aislamiento","Fuga mínima","mm",()=>RA.Lreq,0],
  ["Aisladores","CFO de la cadena corregido","kV",()=>RI.cfoC,0],["Aisladores","Fuga de la cadena","mm",()=>RI.fuga,0],["Aisladores","Carga de diseño de la cadena","kN",()=>RI.Fd,1],
  ["Distancias","Fase–tierra","m",()=>RD.dftA,2],["Distancias","Fase–fase","m",()=>RD.dffA,2],["Distancias","Valor básico","m",()=>RD.VBa,2],["Distancias","Circulación de personal","m",()=>RD.DvA,2],
  ["Distancias","Circulación de vehículos","m",()=>RD.HvehA,2],["Distancias","Separación entre fases","m",()=>RD.SfA,2],["Distancias","Ancho mínimo de bahía","m",()=>RD.WbMin,2],["Distancias","Altura de equipos","m",()=>RD.heqA,2],["Distancias","Punto más bajo de barras","m",()=>RD.hbLow,2],
  ["Conductores","Capacidad de la fase de barras","A",()=>RC.Icap,0],["Conductores","Gradiente en la superficie","kV/cm",()=>RC.Emax,2],["Conductores","Cortocircuito admisible","kA",()=>RC.Ith,1],
  ["Equipos","Corriente de bahía de línea","A",()=>RE.Ilin,1],["Equipos","Corriente de bahía de transformador","A",()=>RE.Itr,1],["Equipos","Corriente de la barra principal","A",()=>RE.IBP,1],["Equipos","Pico de la falla trifásica","kA",()=>RE.ip3,1],
  ["Equipos","Interruptores","",()=>RE.cnt.int,0],["Equipos","Seccionadores","",()=>RE.cnt.secT,0],
  ["Malla de tierra","Tensión de malla (toque)","V",()=>RM.Em,0],["Malla de tierra","Toque tolerable","V",()=>RM.Etouch,0],["Malla de tierra","Resistencia de la malla","Ω",()=>RM.Rg,2],
  ["Apantallamiento","Distancia de descarga mínima Sm","m",()=>RP.SmMin,2],["Apantallamiento","Altura efectiva he","m",()=>RP.gov&&RP.gov.he,2],["Apantallamiento","Margen mínimo de la esfera","m",()=>RP.margMin,2],["Apantallamiento","Mayor ángulo pedido","°",()=>RP.thMax,1]];
function renderResumen(){
  const a=RA,i=RI,d=RD,c=RC,e=RE,m=RM,ap=RP,p=S.proy,cf=cfgOf(),n=nCirc(),dNo=d.checks.some(x=>!x.ok&&x.lvl==="no"),dWa=d.checks.some(x=>!x.ok&&x.lvl==="wa"),ce=e.cnt;
  const card=(tab,k,title,big,unit,t,stc,stt)=>`<button class="fstep" type="button" data-go="${tab}"><span class="top"><span class="k">${k}</span><span class="pill ${stc}">${stt}</span></span><h4>${title}</h4><span class="big">${big}<small> ${unit}</small></span><p>${t}</p><span class="go">Ver cálculo →</span></button>`;
  let nk=0;const K=t=>`${++nk} · ${t}`,st=b=>b?["ok","Cumple"]:["no","No cumple"];
  const estrT={mezcla:"dos niveles",general:"BIL general",dps:"solo la envolvente del DPS sube"}[a.estr];
  $("flow").innerHTML=
    card("aislamiento",K("Aislamiento"),"Nivel de aislamiento",a.BIL?`${a.BIL}${a.BIL2?" / "+a.BIL2:""}`:"—","kV BIL",`${estrT[0].toUpperCase()+estrT.slice(1)}. MP ${fm(S.ais.mp,0)} %: protege hasta ${fm(a.lmax1,1)} m${a.L2?` y ${fm(a.lmax2,1)} m`:""}. Pararrayos Ur ${fm(a.ur,0)} kV.`,...st(a.ok))+
    card("aisladores",K("Aisladores"),"Cadena de aisladores",fm(i.fuga,0),"mm de fuga",`${esc(i.A.tipo==="disco"?i.nd+" × "+insName(i.A):insName(i.A))} · BIL ${i.BIL} kV · CFO ${fm(i.cfoC,0)} kV a ${fm(S.g.alt,0)} m.`,...st(i.ok))+
    card("distancias",K("Distancias"),"Separación entre fases",fm(d.SfA),"m",`Fase–tierra ${fm(d.dftA)} m · equipos a ${fm(d.heqA)} m · barras amarradas a ${fm(d.amarreA)} m.`,dNo?"no":dWa?"wa":"ok",dNo?"No cumple":dWa?"Revisar":"Cumple")+
    card("conductores",K("Conductores"),"Capacidad de las barras",fm(c.Icap,0),"A",`${esc(c.nombre.split(" · ").slice(0,2).join(" "))}: ${fm(100*c.uso,0)} % de uso con ${fm(S.con.Idis,0)} A.`,...st(c.ok))+
    card("equipos",K("Equipos"),"Equipos protegidos",`${e.rows.length-e.nNo}/${e.rows.length}`,"",`${ce.int} interruptores y ${ce.secT} seccionadores. ${fm(e.rBP,0)} A en barra, ${fm(e.Ik,1)} kA / ${fm(e.ipA,0)} kA.`,...st(e.ok))+
    card("malla",K("Malla de tierra"),"Tensión de toque",fm(m.Em,0),"V",`Tolerable ${fm(m.Etouch,0)} V · Rg ${fm(m.Rg,2)} Ω.`,...st(m.ok))+
    card("apantallamiento",K("Apantallamiento"),"Esfera más pequeña",fm(ap.SmMin,2),"m",`${ap.metodo==="ambos"?"Cumple por esfera rodante y por ángulos fijos.":ap.metodo==="esfera"?`Cumple por esfera rodante (margen ${fm(ap.margMin,2)} m).`:ap.metodo==="angulos"?`Cumple por ángulos fijos (hasta ${fm(ap.thMax,1)}°).`:"Ningún método cubre todo el patio."}`,...st(ap.ok))+
    card("configuraciones",K("Configuración"),cf.n,ce.campos,"campos",`${ce.int} interruptores y ${ce.secT} seccionadores${ce.bypass?", con by-pass":""}${ce.juntas?`, barra partida en ${ce.tramos} tramos`:""}.`,"ok","Ver");
  {const todo=a.ok&&i.ok&&!dNo&&c.ok&&e.ok&&m.ok&&ap.ok,el=$("golazo");
   if(el)el.innerHTML=todo?`<div class="golazo" role="status"><span class="gz-b" aria-hidden="true">⚽</span><div><b>¡Golazo! Todo el diseño cumple.</b><span>Aislamiento, aisladores, distancias, conductores, equipos, malla y apantallamiento en verde. ♪</span></div></div>`:"";}
  $("cmpTitle").innerHTML="Resultados principales";
  const rows=RES.map(r=>({mod:r[0],lab:typeof r[1]==="function"?r[1]():r[1],u:r[2],v:r[3](),d:r[4]})).filter(r=>r.v!=null&&Number.isFinite(+r.v));
  $("tCmp").innerHTML=`<tr><th class="l">Valor</th><th>Resultado</th></tr>`+rows.map((r,k)=>(k===0||rows[k-1].mod!==r.mod?`<tr class="grp"><td colspan="2">${r.mod}</td></tr>`:"")+`<tr><td class="l">${r.lab}</td><td><b>${fm(+r.v,r.d)}</b> ${r.u}</td></tr>`).join("");
  $("cmpNote").textContent="Cada valor se explica paso a paso en la memoria de cálculo de su módulo.";
  const al=[];
  AUTO.forEach(([t,x])=>al.push(["au",`${t} · ${x}`]));
  al.push(a.ok?["ok",`Aislamiento: BIL ${a.BIL} kV hasta ${fm(a.lmax1,1)} m de un pararrayos${a.L2?` y ${a.BIL2} kV hasta ${fm(a.lmax2,1)} m`:""}, con ${esc(a.dpsN)}${a.H?` y envolvente ${esc(a.H.id)}`:""}.`]:["no","Aislamiento: la coordinación no cumple con los datos actuales."]);
  if(a.estr==="dps")al.push(["wa",`Aislamiento: con «solo la envolvente del DPS» los equipos siguen con BIL ${a.BIL} kV y quedan protegidos solo hasta ${fm(a.lmax1,1)} m; la envolvente de ${fm(a.hBIL,0)} kV no alarga esa distancia.`]);
  al.push(i.ok?["ok",`Aisladores: ${esc(insName(i.A))} cumple fuga (${fm(i.fuga,0)} ≥ ${fm(i.Lreq,0)} mm), arco y flameo a ${fm(S.g.alt,0)} m para BIL ${i.BIL} kV.`]:["no",`Aisladores: la cadena no cumple (${i.chk.filter(x=>!x.ok).map(x=>x.k).join(", ")}).`]);
  d.checks.filter(x=>!x.ok&&x.lvl!=="info").forEach(x=>al.push([x.lvl==="no"?"no":"wa",`Distancias: ${x.txt.toLowerCase()} (${x.cmp}).`]));
  if(!dNo&&!dWa)al.push(["ok",`Distancias: ${S.dis.Wb>0?`la disposición cumple (fases de barras a ${fm(d.sPlan)} m ≥ ${fm(d.Sf)} m, bahía de ${fm(S.dis.Wb)} m ≥ ${fm(d.WbMin)} m, punto bajo de barras a ${fm(d.hbLow)} m)`:`todas cumplen (fases a ${fm(d.SfA)} m, bahía mínima de ${fm(d.WbMin)} m, equipos a ${fm(d.heqA)} m y barras amarradas a ${fm(d.amarreA)} m)`}.`]);
  al.push(c.ok?["ok",`Conductores: ${fm(c.Icap,0)} A en barras (${fm(100*c.uso,0)} %), sin corona${c.cx.length?`; conexiones de bahía al ${c.cx.map(x=>fm(100*x.uso,0)+" %").join(" y ")}`:""}.`]:["no","Conductores: algún conductor no cumple (corriente, corona, cortocircuito o tendido)."]);
  al.push(e.nNo?["no",`Equipos: ${e.nNo} equipo(s) a más de ${fm(a.lmax2,1)} m del pararrayos más cercano. Mueva o agregue pararrayos${a.estr!=="general"?" o suba el BIL":""}.`]:["ok",`Equipos: ${e.rows.length?`todos quedan protegidos con MP ≥ ${fm(S.ais.mp,0)} % (${e.n1} con BIL ${a.BIL} kV${a.BIL2?`, ${e.n2} con ${a.BIL2} kV`:""})`:"agregue los equipos y su distancia al pararrayos para asignarles el BIL"}.`]);
  if(e.Ik40>e.Ik)al.push(["wa",`Cortocircuito: la falla a tierra (${fm(S.eq.I1,2)} kA) deja los equipos de ${fm(e.Ik,1)} kA al ${fm(100*e.u1,0)} %; conviene pedir ${fm(e.Ik40,0)} kA.`]);
  al.push(m.ok?["ok",`Malla de tierra: cumple toque (${fm(m.Em,0)} ≤ ${fm(m.Etouch,0)} V), paso (${fm(m.Es,0)} ≤ ${fm(m.Estep,0)} V)${m.Rmax?` y resistencia (${fm(m.Rg,3)} ≤ ${fm(m.Rmax,2)} Ω)`:""}${m.trat?`; terreno mejorado (${esc(m.mejN)}): confirmar midiendo antes de energizar`:""}.`]:["no",`Malla de tierra: no cumple (toque ${fm(m.Em,0)} V frente a ${fm(m.Etouch,0)} V${m.Rmax?`, Rg ${fm(m.Rg,2)} Ω frente a ${fm(m.Rmax,2)} Ω`:""}). En el módulo se ve qué supuesto conviene cambiar.`]);
  al.push(ap.ok?["ok",`Apantallamiento: ${ap.metodo==="ambos"?`cumple por esfera rodante (margen mínimo ${fm(ap.margMin,2)} m) y por ángulos fijos`:ap.metodo==="esfera"?`cumple por esfera rodante (margen mínimo ${fm(ap.margMin,2)} m); basta con un método, aunque por ángulos fijos pida hasta ${fm(ap.thMax,1)}°`:`cumple por ángulos fijos (hasta ${fm(ap.thMax,1)}°); basta con un método`}.`]:["no",ap.okPatio?"Apantallamiento: el edificio con puntas captadoras no queda protegido.":"Apantallamiento: ningún método (esfera rodante ni ángulos fijos) cubre todo el patio."]);
  const lab={ok:"OK",wa:"Revisar",no:"No cumple",au:"Ajuste automático"};
  $("alerts").innerHTML=al.map(([k,t])=>`<div class="note ${k==="ok"||k==="au"?"":"wa"}"><span class="pill ${k==="au"?"wa":k}">${lab[k]}</span> ${t}</div>`).join("");
}

/* ============================================================
   Validación y catálogos
   ============================================================ */
function renderVal(){
  const V=SUBE.validar(),all=V.flatMap(c=>c.items),bad=all.filter(i=>!i.ok).length;
  $("vVal").innerHTML=bad?verdict("no",`${bad} de ${all.length} comprobaciones no coinciden`,"Revise la tabla: algún cálculo cambió respecto al valor publicado.")
    :verdict("ok",`Las ${all.length} comprobaciones coinciden con los valores publicados`,`${V.length} casos resueltos con el mismo motor de cálculo. Mayor diferencia: ${fm(Math.max(...all.map(i=>Math.abs(i.err))),2)} %.`);
  $("tVal").innerHTML=`<tr><th class="l">Valor</th><th>Publicado</th><th>Calculado aquí</th><th>Diferencia</th><th class="l">Estado</th></tr>`+
    V.map(c=>`<tr class="grp"><td colspan="5" style="white-space:normal">${c.mod}<div style="font-family:var(--f-body);font-weight:400;font-size:13px;color:var(--muted)">${c.caso}</div></td></tr>`+
      c.items.map(i=>`<tr><td class="l">${i.n}</td><td>${fm(i.pub,i.d)} ${i.u}</td><td><b>${fm(i.calc,i.d)}</b> ${i.u}</td><td>${fm(i.err,2)} %</td><td class="l">${okp(i.ok,"Coincide","Difiere")}</td></tr>`).join("")).join("");
  setSt("st-val",bad?"no":"ok");
}
function renderCat(){
  const nR=CAT.DPS.reduce((s,d)=>s+d.rows.length,0),marcas=[...new Set(CAT.DPS.map(d=>d.marca))];
  $("catList").innerHTML=`<li><b>${CAT.DPS.length} series de pararrayos</b> (${nR} tensiones asignadas) de ${marcas.join(", ")}, con ${CAT.HOUS.length} envolventes 3EL2; <b>${CAT.AIS.length} aisladores</b> y <b>${CAT.COND.length} conductores</b> ACSR y AAC.</li>`+
    CAT.FUENTES.map(([t,d,u])=>`<li><b>${esc(t)}</b>: ${esc(d)}${u?` <a href="${esc(u)}" target="_blank" rel="noopener">Abrir fuente</a>`:""}</li>`).join("");
}

/* ============================================================
   Arranque
   ============================================================ */
$("cfgCards").addEventListener("click",e=>{const b=e.target.closest("[data-cfg]");if(!b)return;const [k,v]=b.dataset.cfg.split("+");S.proy.cfg=k;S.proy.bypass=v==="bp"?1:0;S.proy.cfgSel=b.dataset.cfg;if(!CFG[k].sb)S.proy.tramos=1;save();buildForms();renderAll();HOOK.auto&&HOOK.auto();toast(`Configuración del proyecto: ${cfgNombre(k,S.proy.bypass)}.`)});
$("btnCopyCons").addEventListener("click",()=>{copyText(["Distancia\tExpresión\tCalculado (m)\tTabla (m)\tAdoptado (m)",...consRows(RD).map(x=>x[0]==="g"?x[1]:[x[0],x[1],x[2]==null?"":fm(x[2],3),x[3]==null?"":fm(x[3]),fm(x[4])].join("\t"))].join("\n"))});
HOOK.render=()=>{renderAis();renderIns();renderDis();renderCon();renderEq();renderMal();renderApa();renderCfg();renderResumen();renderHdr()};
renderVal();renderCat();
initNucleo();
