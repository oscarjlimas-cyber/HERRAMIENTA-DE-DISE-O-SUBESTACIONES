/* =====================================================================
   SUBE · Motor de cálculo de la herramienta de diseño de subestaciones
   Coordinación de aislamiento (IEC 60071), aisladores (IEC TS 60815), distancias
   (IEC 60071, RETIE, Mejía Villegas), conductores (IEEE 738, IEC 60865-1), equipos
   (IEC 62271-1, IEC 60909), malla (IEEE 80) y apantallamiento (Mejía Villegas cap. 5).
   Funciones puras: reciben los datos y devuelven los resultados.
   ===================================================================== */
(function(){
"use strict";
const CAT=window.SUBE_CAT||{DPS:[],AIS:[],COND:[],HOUS:[],FUENTES:[],I_SW:[0.5,1,2]};

/* ============================================================
   Datos del caso base: S/E Termales 115 kV
   ============================================================ */
/* Distancias DPS–equipo (recorrido de conductor, fase más lejana) del plano P-02 rev. 4 del 25-nov-2026 */
const EQ_BASE=[
  ["PT de línea","B3, B4, B5","Entrada de línea",1.5],
  ["Bornes X1 del autotransformador","B2, B6","Frente a X1",5.5],
  ["PT del autotransformador (fase extrema)","B2, B6","Frente a X1",7.9],
  ["89-1 y 89-T (el más cercano)","B4 a B7","Barra (eje 7)",15],
  ["PT de barra (BP y BT)","B7","Barra (eje 7)",16],
  ["Interruptor 52","B6, B7","Barra (eje 7)",22],
  ["Nodo y 89-L","B6","Barra (eje 7)",24],
  ["Nodo","B3, B4, B5","Entrada de línea",25],
  ["89-L","B3, B4, B5","Entrada de línea",26],
  ["Interruptor 52 y 89-T","B3, B4, B5","Entrada de línea",32],
  ["89-1 y 89-T (el más lejano)","B4 a B7","Barra (eje 7)",38],
  ["Nodo","B2","Frente a X1 de AT1",40.2],
  ["89-1","B3","Entrada de línea",41],
  ["89-L","B2","Frente a X1 de AT1",41.5]
].map(r=>({n:r[0],b:r[1],dps:r[2],l:r[3]}));
/* Apantallamiento del caso base: conductores para la distancia de descarga y elementos que se verifican */
const SM_BASE=[
  {n:"Conexiones de nivel 1",hmax:4.5,hmin:4.4,dmm:34.16,base:"BIL",bil:550,w:2.19},
  {n:"Conexión X1–DPS–PT de bancos",hmax:7.05,hmin:5.30,dmm:34.16,base:"BIL",bil:550,w:2.19},
  {n:"Barras BP y BT",hmax:7.50,hmin:7.17,dmm:46.3,base:"CFO",bil:550,w:2.19},
  {n:"Nivel 3: retorno y salidas",hmax:11.0,hmin:10.17,dmm:28.14,base:"BIL",bil:550,w:2.19}
];
const VER_BASE=[
  {n:"Patio: fase central de nivel 3",sm:3,apo:"2c",h1:14.85,h2:14.85,s:11,x:5.5,de:10.99,beta:true},
  {n:"Patio: fases extremas de nivel 3",sm:3,apo:"2c",h1:14.85,h2:14.85,s:11,x:2.75,de:10.99,beta:true},
  {n:"Patio: barras BP y BT",sm:2,apo:"2c",h1:14.58,h2:14.58,s:11,x:5.5,de:7.50,beta:true},
  {n:"Patio: equipos de nivel 1",sm:0,apo:"2c",h1:14.37,h2:14.37,s:11,x:5.5,de:5.66,beta:true},
  {n:"Bancos: fase de 230 kV en el remate",sm:1,apo:"2d",h1:14.88,h2:14.78,s:17,x:0,de:11.0,beta:false},
  {n:"Bancos: borne H1",sm:1,apo:"2d",h1:14.88,h2:14.78,s:17,x:4.0,de:7.05,beta:false},
  {n:"Bancos: borne X1",sm:1,apo:"2d",h1:14.88,h2:14.78,s:17,x:7.5,de:7.05,beta:false},
  {n:"Bancos: DPS frente a X1",sm:1,apo:"2d",h1:14.88,h2:14.78,s:17,x:11.5,de:5.66,beta:false},
  {n:"Oriente: PT de línea",sm:0,apo:"cs",h1:14.78,h2:0,s:0,x:2.5,de:4.95,beta:false},
  {n:"Oriente: DPS de línea",sm:0,apo:"cs",h1:14.78,h2:0,s:0,x:4.0,de:5.66,beta:false}
];
const DEF={
  proy:{nombre:"S/E Termales",lugar:"Santa Rosa de Cabal",unSel:"115",un:115,cfg:"bpt",cfgSel:"bpt",tramos:1,seccTipo:"sec",nLin:3,nTr:2,nRes:1,bypass:0,
        trTipo:"auto1",v1Sel:"230",v1:230,v3Sel:"13.8",v3:13.8,sSel:"45",S1:45,refr:"ONAN/ONAF/OFAF",reserva:true,base:true},
  g:{um:123,alt:1800,t:18,tmax:26},
  ais:{estr:"mezcla",bilG:0,distAuto:true,ke:1.4,ko:0.8,kt:1.15,mp:40,S:1000,dpsCat:"sie-3EL2-3",dpsUr:96,npmI:0,ur:96,uc:77,npr:226,npm:180,
       bil1:550,bil2:750,dist:21.5,pol:"d",kd:1.1,hous:"Q",hBIL:0,hAC:0,sllReq:400,cH:"Envolvente personalizada",cHli:936,cHpf:436,cHfuga:6160,cHsll:1580,Ufo:650,Zl:400},
  ins:{bilSrc:"2",BIL:750,ins:"disco-52-3",nD:17,extra:0,sig:3,T:8.3,FS:1.5,n:87,cN:"Aislador personalizado",cTipo:"pol",cFuga:4597,cArco:1547,cCfo:1010,cLiwv:880,cPf:585,cSml:111,cPaso:146},
  dis:{link:true,BSL:0,BIL:550,dMode:"none",dMan:0.893,fff:1.15,galibo:4,rnd:true,Es:550,kS:1.04,nExp:0.9,kVB:1.1,barra:"flex",cond:"ACSR",K:10,vano:22,fMode:"pct",pct:1.5,fVal:0.33,w:3.527,Fh:650,
       Wb:11,sPlan:2.10,dFc:2.00,amPlan:7.50,hremPlan:11.0,dHplan:3.25,Fsec:1.45},
  con:{cond:"Lupine",nsub:1,sep:40,d:46.3,w:3.527,rts:19005,r20:0.0229,aAl:1267.1,kac:1.03,Idis:1626.6,Ta:26,Tc:75,vv:0.61,eps:0.5,abs:0.5,Qs:1000,m:0.85,link:true,linkI:true,a:2.10,
       Ik:31.5,kip:2.6,tk:1,te:200,mMode:"flecha",f:0.33,T:650,L:22,tubD:100,tubT:5,tubRp:160,tubB:0.73,tubL:9,cL:"Drake",cT:"Bittern",nCL:1,nCT:1},
  eq:{fc:1.2,Isc:30,XR:15,I1:31.18,Feq:1.45,Dais:1.372,base:2.50,sEq:2.75,rows:EQ_BASE},
  mal:{If:30,IfTipo:"asim",XR:30,Cp:1.05,Sf:1,tf:1,tc:1,rho:800,mej:"favigel",red1:90,Ht:3,red2:87.5,rhos:8534.4,hs:0.35,peso:50,Ta:26,
       Lx:108.3,Ly:116,nCx:19,nCy:20,Dsel:"min",h:0.75,size:"250",mat:"blando",conn:"exo",
       zon:true,zX0:28,zY0:20,zLx:66,zLy:77,zNx:23,zNy:26,esqOn:true,eL:9,eN:4,eOff:1.5,
       nR:40,LR:3,rodPos:"esq",nR2:15,LR2:2.75,Rmax:1,
       sfMode:"man",sfN:5,sfR:1.5,sfGmr:0.6,sfSpan:300,sfRt:20,linkI:false},
  apa:{hG:15,vanoG:31.6,alfa:0.02,s2d:11,k:1,ddt:2,area:12563,Lcg:477,sm:SM_BASE,ver:VER_BASE,hM:8.3,deM:4.3,L1:10,L2:18,rN:20}
};
const SUBE_KEY="sube-diseno-v7";
function SUBE_load(){const S=JSON.parse(JSON.stringify(DEF));
  try{const s=JSON.parse(localStorage.getItem(SUBE_KEY)||"null");if(s&&s.v===7)for(const m of Object.keys(DEF))Object.assign(S[m],s[m]||{})}catch(e){}
  return S;}
function SUBE_save(S){try{localStorage.setItem(SUBE_KEY,JSON.stringify({v:7,...S}))}catch(e){}}
const roundUp=(x,s)=>Math.ceil(x/s-1e-9)*s;
const mx=(a,b)=>b==null?a:Math.max(a,b);

/* ============================================================
   Tablas normativas
   ============================================================ */
/* IEC 60071-1 Tablas 2 y 3: BIL normalizados por tensión más elevada Um */
const BIL_IEC={3.6:[20,40],7.2:[40,60],12:[60,75,95],17.5:[75,95],24:[95,125,145],36:[145,170],52:[250],72.5:[325],100:[380,450],123:[450,550],145:[450,550,650],170:[550,650,750],245:[650,750,850,950,1050],300:[850,950,1050],362:[950,1050,1175],420:[1050,1175,1300,1425],550:[1175,1300,1425,1550],800:[1675,1800,1950,2100]};
const BIL_SERIE=[20,40,60,75,95,125,145,170,250,325,380,450,550,650,750,850,950,1050,1175,1300,1425,1550,1675,1800,1950,2100];
/* Tensión soportada a 60 Hz, 1 min (IEC 60071-1 Tabla 2) asociada a cada BIL */
const ACW={95:38,125:50,145:70,170:70,250:95,325:140,380:150,450:185,550:230,650:275,750:325,850:360,950:395,1050:460};
/* IEC 62271-1: valores a través de la distancia de seccionamiento [BIL, 60 Hz] */
const ISO={325:[375,160],450:[520,210],550:[630,265],650:[750,315],750:[860,375],850:[950,415],950:[1050,460],1050:[1200,530]};
/* Serie normalizada de impulso de maniobra (IEC 60071-1) */
const SIWV_SERIE=[250,325,380,450,550,650,750,850,950,1050,1175,1300,1425,1550,1675,1800];
const SIWV_II={300:[[750,[850,950]],[850,[950,1050]]],362:[[850,[950,1050]],[950,[1050,1175]]],420:[[850,[1050,1175]],[950,[1175,1300]],[1050,[1300,1425]]],550:[[950,[1175,1300]],[1050,[1300,1425]],[1175,[1425,1550]]],800:[[1300,[1675,1800]],[1425,[1800,1950]],[1550,[1950,2100]]]};
const CLR_SI={750:[1.6,1.9],850:[1.8,2.4],950:[2.2,2.9],1050:[2.6,3.4],1175:[3.1,4.1],1300:[3.6,4.8],1425:[4.2,5.6],1550:[4.9,6.4]};
/* Tensiones nominales normalizadas en Colombia (NTC 1340, Reglamento de distribución y STN) */
const UN_CO=[[11.4,"Nivel II"],[13.2,"Nivel II"],[13.8,"Nivel II"],[34.5,"Nivel III"],[44,"Nivel III"],[57.5,"Nivel IV · STR"],[66,"Nivel IV · STR"],[110,"Nivel IV · STR"],[115,"Nivel IV · STR"],[220,"STN"],[230,"STN"],[500,"STN"]];
/* Tensión más elevada para el equipo: la menor Um normalizada (IEC 60038 / 60071-1) que cubre la tensión de operación máxima */
const umDe=un=>{const us=Object.keys(BIL_IEC).map(Number).sort((a,b)=>a-b);return us.find(u=>u>=1.04*un-1e-9)||us[us.length-1]};
/* Potencias asignadas de transformadores (MVA): serie R10 de IEC 60076-1 y valores de uso frecuente en el STN y STR colombianos */
const S_R10=[10,12.5,16,20,25,31.5,40,50,63,80,100,125,160,200,250,315];
const S_CO=[15,30,45,60,75,90,150,180,300,450];
const TR_TIPO={auto1:["Autotransformadores monofásicos (banco de 3)",3,"autotransformadores 1φ"],mono:["Transformadores monofásicos (banco de 3)",3,"transformadores 1φ"],trif:["Transformador trifásico",1,"transformadores 3φ"],auto3:["Autotransformador trifásico",1,"autotransformadores 3φ"]};
const I_NORM=[1250,1600,2000,2500,3150,4000];           /* corrientes asignadas (serie R10, mínimo práctico 1250 A en AT) */
const IK_NORM=[16,20,25,31.5,40,50,63];                   /* IEC 62271-1 */
const BPN="El seccionador de transferencia (89-T) de cada bahía ya cumple la función de by-pass.";
const CFG={
  bs:{n:"Barra sencilla",int:n=>n,cnt:n=>({barra:n,salida:n}),extra:0,bp:true,sb:1,bpTxt:"El circuito sigue en servicio por el by-pass, pero sin interruptor propio que lo proteja."},
  bpt:{n:"Barraje doble principal y transferencia",int:n=>n+1,cnt:n=>({barra:n,salida:n,transf:n,acople:2}),extra:1,bp:false,bpNota:BPN,sb:1},
  db:{n:"Doble barra",int:n=>n+1,cnt:n=>({barra:2*n,salida:n,acople:2}),extra:1,bp:true,sb:2,bpTxt:"El circuito sigue por el by-pass y lo protege el interruptor de acople."},
  dbt:{n:"Doble barra + transferencia",int:n=>n+2,cnt:n=>({barra:2*n,salida:n,transf:n,acople:4}),extra:2,bp:false,bpNota:BPN,sb:2},
  an:{n:"Anillo",int:n=>n,cnt:n=>({interr:2*n,salida:n}),extra:0,bp:false,bpNota:"Cada circuito queda entre dos interruptores: al sacar uno, el anillo se abre pero ningún circuito sale."},
  iym:{n:"Interruptor y medio",int:n=>Math.ceil(1.5*n),cnt:n=>({interr:2*Math.ceil(1.5*n),salida:n}),extra:0,bp:false,bpNota:"Cada circuito tiene dos interruptores: el by-pass no hace falta."},
  di:{n:"Doble barra con doble interruptor",int:n=>2*n,cnt:n=>({interr:4*n,salida:n}),extra:0,bp:false,bpNota:"Cada circuito tiene dos interruptores: el by-pass no hace falta."}
};
Object.values(CFG).forEach(c=>c.sec=n=>Object.values(c.cnt(n)).reduce((a,b)=>a+b,0));
const SEC_T={barra:"De barra (89-1, 89-2)",salida:"De salida: línea o transformador (89-L)",transf:"De transferencia (89-T)",acople:"Del acople o transferencia",interr:"A cada lado de los interruptores",bypass:"De by-pass (89-BY)",seccB:"De barras para seccionamiento longitudinal"};
/* Equipos de maniobra del proyecto según la configuración, el by-pass y el seccionamiento de barras */
function cuentaEquipos(proy,k){
  /* k puede traer la variante: «bs» (sin by-pass) o «bs+bp» (con by-pass); sin k se usa la del proyecto */
  const [kk,kv]=k?String(k).split("+"):[proy.cfg,proy.bypass?"bp":""];
  const c=CFG[kk]||CFG.bpt,nL=Math.max(0,Math.round(+proy.nLin||0)),nT=Math.max(0,Math.round(+proy.nTr||0)),n=Math.max(1,nL+nT);
  const sec={...c.cnt(n)};if(c.bp&&kv==="bp")sec.bypass=n;
  /* seccionamiento longitudinal de barras: cada corte en cada barra seccionable lleva un seccionador,
     o un interruptor de acople longitudinal con un seccionador a cada lado */
  const sb=c.sb||0,cortes=sb?Math.max(0,Math.round(+proy.tramos||1)-1):0,juntas=cortes*sb,conInt=juntas>0&&proy.seccTipo==="int";
  if(juntas)sec.seccB=conInt?2*juntas:juntas;
  return{n,int:c.int(n)+(conInt?juntas:0),sec,secT:Object.values(sec).reduce((a,b)=>a+b,0),bypass:!!sec.bypass,tramos:cortes+1,juntas,conInt,campos:n+c.extra+(conInt?juntas:0)}
}
/* RETIE Tabla 3.22.1.c: BIL, d mín IEC, valor básico, circulación de personal, trabajo horizontal, trabajo vertical */
const RETIE_C=[[60,0.09,0.10,null,null,null],[75,0.12,0.13,null,null,null],[95,0.16,0.18,null,null,null],[125,0.22,0.24,null,null,null],[170,0.32,0.35,null,null,null],[200,0.38,0.42,null,null,null],[250,0.48,0.53,null,null,null],[325,0.63,0.70,null,null,null],[380,0.75,0.83,3.08,null,null],[450,0.90,1.00,3.25,null,null],[550,1.10,1.21,3.46,2.96,null],[650,1.30,1.43,3.68,3.18,null],[750,1.50,1.65,3.90,3.40,2.90],[850,1.70,1.87,4.12,3.62,3.12],[950,1.90,2.09,4.34,3.84,3.34],[1050,2.10,2.31,4.56,4.06,3.56],[1175,2.35,2.59,4.84,4.34,3.84],[1300,2.60,2.86,5.11,4.61,4.11],[1425,2.85,3.02,5.27,4.77,4.27],[1550,3.10,3.29,5.54,5.04,4.54]];
const RETIE_A=[[7.2,3.0,"hasta 7,2 kV"],[17.5,3.1,"13,8 kV"],[52,3.2,"34,5 kV"],[72.5,3.5,"66 kV"],[123,4.0,"115 kV"],[245,4.7,"230 kV"],[550,5.3,"500 kV"]];
/* IEC TS 60815: distancia de fuga específica fase–fase (mm/kV) por nivel de contaminación */
const POL={a:["a · Muy ligera",12.7],b:["b · Ligera",16],c:["c · Media",20],d:["d · Pesada (alta)",25],e:["e · Muy pesada",31]};
const AISL={};CAT.AIS.forEach(x=>AISL[x.id]=x);
const MAT={blando:{n:"Cobre recocido (blando) 100 %",ar:0.00393,K0:234,Tm:1083,rr:1.72,TC:3.42},duro:{n:"Cobre duro comercial 97 %",ar:0.00381,K0:242,Tm:1084,rr:1.78,TC:3.42},cw40:{n:"Acero recubierto de cobre 40 %",ar:0.00378,K0:245,Tm:1084,rr:4.40,TC:3.85}};
/* Mejoramiento del terreno: reducción de la resistividad alrededor de la malla */
const MEJ={no:{n:"Sin mejoramiento (suelo natural)"},favigel:{n:"Gel mejorador FAVIGEL",red:90,fuente:"Ramírez y Cano (2010): reducción del 90 % de la resistencia a los 30 días de aplicado"},otro:{n:"Otro material (reducción propia)"}};
const CONN={exo:{n:"Soldadura exotérmica",lim:Infinity},fuerte:{n:"Soldadura fuerte (≤ 450 °C)",lim:450},mec:{n:"Conectores mecánicos (≤ 250 °C)",lim:250}};
const SIZES={"2/0":["2/0 AWG",67.4,10.5],"4/0":["4/0 AWG",107.2,13.3],"250":["250 kcmil",126.7,14.6],"300":["300 kcmil",152.0,16.0],"350":["350 kcmil",177.3,17.3],"500":["500 kcmil",253.0,20.6]};
/* Mejía Villegas Tabla 5.1, fila de cables de guarda a 15 m: fallas de apantallamiento por 100 km·año según el ángulo */
const FALLA15={15:0,20:6.4e-5,25:0.0068,30:0.0351,35:0.0982,40:0.2182,45:0.4483};

function retieRow(BIL){
  const ex=RETIE_C.find(r=>r[0]===BIL);if(ex)return{row:ex,exact:true};
  if(BIL<RETIE_C[0][0]||BIL>RETIE_C[RETIE_C.length-1][0])return{row:null,exact:false};
  let i=0;while(RETIE_C[i+1][0]<BIL)i++;const a=RETIE_C[i],b=RETIE_C[i+1],f=(BIL-a[0])/(b[0]-a[0]),row=[BIL];
  for(let k=1;k<6;k++)row.push(a[k]==null||b[k]==null?null:a[k]+f*(b[k]-a[k]));return{row,exact:false};
}
function retieR(Um){const ex=RETIE_A.find(r=>r[0]===Um);if(ex)return{R:ex[1],lab:ex[2]};
  if(Um<RETIE_A[0][0])return{R:RETIE_A[0][1],lab:"bajo la tabla"};if(Um>RETIE_A[RETIE_A.length-1][0])return{R:RETIE_A[RETIE_A.length-1][1],lab:"sobre la tabla"};
  let i=0;while(RETIE_A[i+1][0]<Um)i++;const a=RETIE_A[i],b=RETIE_A[i+1];return{R:a[1]+(Um-a[0])/(b[0]-a[0])*(b[1]-a[1]),lab:"interpolado"}}
/* Clase de tensión del equipo para un BIL: la menor Um ≥ la del sistema que tiene ese BIL normalizado */
function umClase(um,BIL){const us=Object.keys(BIL_IEC).map(Number).sort((a,b)=>a-b);
  const u=us.find(x=>x>=um&&BIL_IEC[x].includes(BIL));return u||us.find(x=>BIL_IEC[x].includes(BIL))||null}
const dminBIL=BIL=>{const r=retieRow(BIL).row;return r?r[1]:BIL/500};
const kaH=H=>H>1000?Math.exp((H-1000)/8150):1;

/* ============================================================
   Motor 1: coordinación de aislamiento (método convencional, IEC 60071)
   ============================================================ */
function dpsRow(p,g,Rn){
  const cat=CAT.DPS.find(c=>c.id===p.dpsCat);if(!cat)return null;
  const lst=cat.rows.filter(r=>r[0]>=0.72*g.um&&r[0]<=1.27*g.um);if(!lst.length)return {cat,lst,row:null};
  let row=lst.find(r=>r[0]===+p.dpsUr);if(!row)row=lst.find(r=>r[0]>=Rn)||lst[lst.length-1];
  return {cat,lst,row};
}
function bslNorm(x){let v=null;for(const s of SIWV_SERIE)if(s<=x+1e-9)v=s;return v==null?Math.round(x*10)/10:v}
function calcAis(g,p){
  const o={},c=300,mp=p.mp/100;
  o.kmin=1+mp;o.c=c;
  o.COV=g.um/Math.sqrt(3);o.TOV=p.ke*o.COV;o.Ro=o.COV/p.ko;o.Re=o.TOV/p.kt;o.Rn=Math.max(o.Ro,o.Re);
  o.dps=p.dpsCat&&p.dpsCat!=="man"?dpsRow(p,g,o.Rn):null;
  if(o.dps&&o.dps.row){const r=o.dps.row,i=Math.min(2,Math.max(0,+p.npmI||0));o.ur=r[0];o.uc=Math.round(0.8*r[0]);o.npr=r[5];o.npm=r[1+i];o.iSw=CAT.I_SW[i];
    o.dpsN=`${o.dps.cat.marca} ${o.dps.cat.n.split(" · ")[0]} · Ur ${r[0]} kV`;o.sie3EL2=/3EL2/.test(o.dps.cat.n)}
  else{o.ur=+p.ur;o.uc=+p.uc;o.npr=+p.npr;o.npm=+p.npm;o.dpsN="Pararrayos personalizado";o.sie3EL2=false}
  o.okUr=o.ur>=o.Rn-1e-9;o.okUc=o.uc>=o.COV-1e-9;o.capTOV=p.kt*o.ur;o.okTOV=o.capTOV>=o.TOV-1e-9;
  o.Ka=kaH(g.alt);o.Ka0=Math.exp(g.alt/8150);
  o.NPRc=o.npr*o.Ka;o.NPMc=o.npm*o.Ka;o.BILreq=o.kmin*o.NPRc;
  o.rII=g.um>245;const tII=SIWV_II[g.um]||[];
  const base=BIL_IEC[g.um]||[],i0=BIL_SERIE.indexOf(base[0]);
  const lista=i0<0?base:BIL_SERIE.slice(i0,i0+6);
  const fila=BIL=>{const K1=BIL/o.NPRc,par=tII.find(t=>t[1].includes(BIL)),BSLa=par?par[0]:0.75*BIL,BSLo=par?par[0]:0.83*BIL,
      BSLaN=par?par[0]:bslNorm(BSLa),BSLoN=par?par[0]:bslNorm(BSLo),KMa=BSLaN/o.NPMc,KMo=BSLoN/o.NPMc,
      dmax=Math.floor((BIL/o.kmin-o.NPRc)*c/(2*p.S)*10+1e-9)/10,   /* distancia máxima: se redondea hacia abajo (lado seguro) */um=umClase(g.um,BIL),ac=ACW[BIL]||null;
    const Ucwe=BIL/(1.05*o.Ka0),Ucwi=BIL/1.15,le=(Ucwe-o.npr)*c/(2*p.S),li=(Ucwi-o.npr)*c/(2*p.S);
    return {BIL,um,ac,K1,BSLa,BSLo,BSLaN,BSLoN,KMa,KMo,dmax,rII:!!par,Ucwe,Ucwi,le,li,del:base.includes(BIL),
      c1:K1>=o.kmin-1e-9,c2:KMa>1.15&&KMo>1.15,ok:K1>=o.kmin-1e-9&&KMa>1.15&&KMo>1.15}};
  o.filas=lista.map(fila);
  /* nivel principal: el elegido o, en automático, el menor BIL de la Um del sistema que cumple y protege la distancia dada */
  o.estr=["general","dps","mezcla"].includes(p.estr)?p.estr:"mezcla";
  const cand=o.filas.filter(f=>f.del&&f.ok),find=B=>o.filas.find(f=>f.BIL===B)||fila(B);
  o.auto1=cand.find(f=>f.dmax>=p.dist-1e-9)||cand[cand.length-1]||null;
  if(o.estr==="general"){const all=o.filas.filter(f=>f.ok);o.autoG=all.find(f=>f.dmax>=p.dist-1e-9)||all[all.length-1]||null;
    o.L1=+p.bilG>0?find(+p.bilG):o.autoG;o.L2=null}
  else{o.L1=+p.bil1>0?find(+p.bil1):o.auto1;
    o.L2=o.estr==="mezcla"&&+p.bil2>0&&o.L1&&+p.bil2>o.L1.BIL?find(+p.bil2):null;
    if(o.estr==="mezcla"&&!(+p.bil2>0)&&o.L1&&o.L1.dmax<p.dist-1e-9){const us=Object.keys(BIL_IEC).map(Number).sort((x,y)=>x-y),i0=us.indexOf(g.um);
      o.L2=o.filas.find(f=>f.BIL>o.L1.BIL&&f.ok&&f.dmax>=p.dist-1e-9&&(i0<0||us.indexOf(f.um)-i0<=2))||null}}
  o.BIL=o.L1?o.L1.BIL:null;o.BIL2=o.L2?o.L2.BIL:null;
  o.lmax1=o.L1?o.L1.dmax:0;o.lmax2=o.L2?o.L2.dmax:o.lmax1;
  o.MPl=(BIL,l)=>BIL/(o.NPRc+2*p.S*l/c)-1;
  o.tabla=[0,5,10,15,o.lmax1,30,o.lmax2].filter((v,i,a)=>a.findIndex(w=>Math.abs(w-v)<0.05)===i).sort((a,b)=>a-b).map(l=>({l,U2:o.NPRc+2*p.S*l/c,mp1:o.L1?o.MPl(o.L1.BIL,l):null,mp2:o.L2?o.MPl(o.L2.BIL,l):null}));
  /* envolvente del pararrayos */
  const H=p.hous==="custom"?{id:"custom",n:p.cH||"Envolvente personalizada",li:+p.cHli,pf:+p.cHpf,fuga:+p.cHfuga,sll:+p.cHsll}:(CAT.HOUS.find(h=>h.id===p.hous)||null);
  o.H=p.hous==="custom"||o.sie3EL2?H:null;
  o.Lreq=Math.ceil(POL[p.pol][1]*g.um*p.kd-1e-9);o.Lcalc=POL[p.pol][1]*g.um*p.kd;o.kf=POL[p.pol][1];
  o.hBIL=+p.hBIL>0?+p.hBIL:o.estr==="dps"&&o.BIL?(BIL_SERIE.find(b=>b>o.BIL)||o.BIL):(o.BIL2||o.BIL||0);o.hAC=+p.hAC>0?+p.hAC:(ACW[o.hBIL]||0);
  if(o.H){o.hLi=o.hBIL*o.Ka;o.hPf=o.hAC*o.Ka;o.okHli=o.H.li>=o.hLi-1e-9;o.okHpf=o.H.pf>=o.hPf-1e-9;o.okHf=o.H.fuga>=o.Lreq-1e-9;o.okHs=o.H.sll>=p.sllReq-1e-9;o.okH=o.okHli&&o.okHpf&&o.okHf&&o.okHs}
  else o.okH=true;
  o.Imax=(2*p.Ufo-o.npr)/p.Zl;
  o.ok=!!o.L1&&o.L1.ok&&o.okUr&&o.okUc&&o.okTOV&&o.okH&&(!o.L2||o.L2.ok);
  return o;
}

/* ============================================================
   Motor 2: cadenas de aisladores
   ============================================================ */
function calcIns(g,p,A1){
  const o={},Ka=kaH(g.alt);o.Ka=Ka;
  o.BIL=p.bilSrc==="1"?A1.BIL:p.bilSrc==="2"?(A1.BIL2||A1.BIL):+p.BIL;
  o.Lreq=A1.Lreq;o.dReq=dminBIL(o.BIL);o.AC=ACW[o.BIL]||Math.round(0.42*o.BIL);
  o.fCfo=1-1.3*p.sig/100;o.cfoReq=o.BIL/o.fCfo;
  const A=p.ins==="custom"?{id:"custom",n:p.cN||"Aislador personalizado",tipo:p.cTipo==="disco"?"disco":"pol",fuga:+p.cFuga,arco:+p.cArco,cfo:+p.cCfo,liwv:+p.cLiwv||null,pf:+p.cPf||null,sml:+p.cSml,paso:+p.cPaso,lon:null}:(AISL[p.ins]||CAT.AIS[0]);
  o.A=A;
  if(A.tipo==="disco"){
    const w1=A.paso/1000,nF=Math.ceil(o.Lreq/A.fuga-1e-9),nA=Math.ceil(o.dReq/w1-1e-9),nC=Math.ceil(o.cfoReq*Ka/(0.94*585*w1)-1e-9);
    o.nF=nF;o.nA=nA;o.nC=nC;o.nAuto=Math.max(nF,nA,nC);o.nd=(+p.nD>0?Math.round(+p.nD):o.nAuto)+(+p.extra||0);
    o.w=o.nd*w1;o.fuga=o.nd*A.fuga;o.arco=o.w;o.cfo=0.94*585*o.w;o.liwv=null;o.pf=null;o.lon=o.nd*A.paso;o.liwvEst=o.cfo*o.fCfo;
  }else{o.nd=1;o.fuga=A.fuga;o.arco=A.arco/1000;o.cfoEst=!A.cfo&&!!A.liwv;o.cfo=A.cfo||(A.liwv?A.liwv/o.fCfo:NaN);o.liwv=A.liwv;o.pf=A.pf;o.lon=A.lon;o.w=(A.lon||A.arco)/1000}
  o.cfoC=o.cfo/Ka;o.liwvC=o.liwv?o.liwv/Ka:null;o.pfC=o.pf?o.pf/Ka:null;
  o.Fd=p.FS*p.T;
  o.chk=[
    {k:"fuga",t:"Distancia de fuga (IEC TS 60815)",v:o.fuga,lim:o.Lreq,u:"mm",ok:o.fuga>=o.Lreq-1e-9,d:0},
    {k:"arco",t:`Distancia de arco frente a la fase–tierra de BIL ${o.BIL} kV`,v:o.arco,lim:o.dReq,u:"m",ok:o.arco>=o.dReq-1e-9,d:2},
    {k:"cfo",t:`Flameo crítico corregido a ${Math.round(g.alt)} m (CFO/Ka) frente a BIL/(1 − 1,3σ)`,v:o.cfoC,lim:o.cfoReq,u:"kV",ok:o.cfoC>=o.cfoReq-1e-9,d:0},
    ...(o.liwvC!=null?[{k:"liwv",t:"Soportado al rayo corregido (LIWV/Ka) frente al BIL",v:o.liwvC,lim:o.BIL,u:"kV",ok:o.liwvC>=o.BIL-1e-9,d:0}]:[]),
    ...(o.pfC!=null?[{k:"pf",t:"60 Hz húmedo corregido frente a la soportada de 1 min",v:o.pfC,lim:o.AC,u:"kV",ok:o.pfC>=o.AC-1e-9,d:0}]:[]),
    {k:"sml",t:`Carga mecánica: SML frente a ${String(p.FS).replace(".",",")} × tiro máximo`,v:A.sml,lim:o.Fd,u:"kN",ok:A.sml>=o.Fd-1e-9,d:1}
  ];
  o.ok=o.chk.every(c=>c.ok);
  return o;
}

/* ============================================================
   Motor 3: distancias (IEC 60071, RETIE, Mejía Villegas)
   ============================================================ */
function densidad(mode,h,t,dMan){
  if(mode==="none")return{delta:1};if(mode==="man")return{delta:dMan};
  if(mode==="baro"){const b=Math.pow(10,Math.log10(76)-h/18336);return{delta:3.92*b/(273+t),b}}
  const pk=101.3*Math.exp(-h/8150);return{delta:(pk/101.3)*(293/(273+t)),pk};
}
function calcDis(g,p){
  const r={p,g},RU=x=>p.rnd?roundUp(x,0.05):x,RP=x=>p.rnd?roundUp(x,0.5):x;
  Object.assign(r,densidad(p.dMode,g.alt,g.t,p.dMan));
  const ret=retieRow(p.BIL),Rw=ret.row;r.retie=ret;r.R=Rw;
  r.dft=p.kS*Math.pow(r.delta,-p.nExp)*p.BIL/p.Es;
  r.dSI=p.BSL>0&&CLR_SI[p.BSL]?CLR_SI[p.BSL][1]*Math.pow(r.delta,-p.nExp):null;
  r.dftBase=mx(mx(r.dft,Rw&&Rw[1]),r.dSI);r.dftA=RU(r.dftBase);
  r.dff=p.fff*r.dftBase;r.dffA=RU(r.dff);
  r.VB=p.kVB*r.dftBase;r.VBa=mx(r.VB,Rw&&Rw[2]);
  r.Dv=2.25+r.VBa;r.DvA=RU(r.Dv);
  r.Dh=1.75+r.VBa;r.DhA=RU(r.Dh);
  r.Dtv=1.25+r.VBa;r.DtvA=RU(r.Dtv);
  r.Hveh=r.VBa+p.galibo+0.70;r.HvehA=RU(r.Hveh);
  r.Rcer=retieR(g.um);
  r.flex=p.barra==="flex";
  r.f_m=!r.flex?0:(p.fMode==="pct"?p.pct/100*p.vano:p.fMode==="val"?+p.fVal:p.vano*p.vano*p.w/(8*p.Fh));r.f_cm=r.f_m*100;
  r.Kuse=r.flex?p.K:0;r.sway=r.Kuse*Math.sqrt(r.f_cm);
  r.Sf=(r.dffA*100+r.sway)/100;r.SfA=RU(r.Sf);
  r.Dfe=(r.dftA*100+r.sway)/100;r.DfeA=RU(r.Dfe);
  r.sEq=p.Fsec>0?p.Fsec+r.dffA:0;r.sEqA=RU(r.sEq);
  r.WbMin=2*Math.max(r.SfA,r.sEqA)+2*r.DfeA;
  r.heqF=2.30+0.0105*g.um;r.heqA=RU(Math.max(r.heqF,r.Dv));
  r.hbF=5+0.0125*g.um;
  /* el punto bajo de las barras debe cumplir la altura mínima de barras y la de vehículos; el remate, 6 m y vehículos */
  r.hbReq=Math.max(r.hbF,r.Hveh);r.hbVeh=r.Hveh>r.hbF;
  r.amarre=r.hbReq+r.f_m;r.amarreA=p.amPlan>0?+p.amPlan:(r.flex?RP(r.amarre):RU(r.hbReq));r.hbLow=r.amarreA-r.f_m;
  r.hremF=5+0.006*g.um;r.hremVeh=r.Hveh>Math.max(6,r.hremF);r.hremA=RU(Math.max(6,r.hremF,r.Hveh));
  r.Wb=p.Wb>0?p.Wb:r.WbMin;r.sPlan=p.sPlan>0?+p.sPlan:r.SfA;
  const f2=x=>Number(x).toFixed(2).replace(".",","),ge=(a,b)=>`${f2(a)} m ${a>=b-1e-9?"≥":"<"} ${f2(b)} m`;
  r.checks=[
    ...(r.dSI?[{txt:"Fase–tierra: impulso de maniobra (rango II) frente a la fórmula de rayo",ok:r.dft>=r.dSI-1e-9,cmp:ge(r.dft,r.dSI),bad:`Rige el impulso de maniobra: ${f2(r.dftA)} m`,lvl:"info"}]:[]),
    {txt:"Fase–tierra: fórmula frente a la mínima de IEC / RETIE",ok:!Rw||r.dft>=Rw[1]-1e-9,cmp:Rw?ge(r.dft,Rw[1]):"BIL fuera de tabla",bad:`Rige la tabla: ${f2(r.dftA)} m`,lvl:"info"},
    {txt:"Altura de equipos frente a circulación de personal",ok:r.heqA>=r.Dv-1e-9,cmp:ge(r.heqA,r.Dv),bad:"Subir los equipos",lvl:"no"},
    {txt:"Punto más bajo de barras frente a la altura mínima de barras",ok:r.hbLow>=r.hbF-1e-9,cmp:ge(r.hbLow,r.hbF),bad:"Subir el amarre de las barras",lvl:"no"},
    {txt:"Punto más bajo de barras frente a circulación de vehículos",ok:r.hbLow>=r.Hveh-1e-9,cmp:ge(r.hbLow,r.Hveh),bad:"No apto para vías bajo barras",lvl:"no"},
    {txt:"Remate de líneas frente al mínimo de 6 m y a vehículos",ok:r.hremA>=Math.max(6,r.Hveh)-1e-9,cmp:ge(r.hremA,Math.max(6,r.Hveh)),bad:"Subir el remate",lvl:"no"},
    ...(p.hremPlan>0?[{txt:"Remate de líneas del plano frente al mínimo calculado",ok:p.hremPlan>=r.hremA-1e-9,cmp:ge(p.hremPlan,r.hremA),bad:"Subir el remate",lvl:"no"}]:[]),
    ...(r.flex?[{txt:"Separación entre fases de barras (plano) frente a la de flexibilidad",ok:r.sPlan>=r.Sf-1e-9,cmp:ge(r.sPlan,r.Sf),bad:"Separar más las fases",lvl:"no"}]:[]),
    ...(p.dFc>0?[{txt:"Distancia fase–columna (plano) frente a la fase–estructura flexible",ok:p.dFc>=r.Dfe-1e-9,cmp:ge(p.dFc,r.Dfe),bad:"Alejar la fase exterior de la columna",lvl:"no"}]:[]),
    {txt:"Ancho de bahía frente al mínimo por fases"+(r.sEq?" (con las fases del seccionador)":""),ok:!(p.Wb>0)||p.Wb>=r.WbMin-1e-9,cmp:p.Wb>0?ge(p.Wb,r.WbMin):"Sin ancho de diseño",bad:"Ampliar la bahía",lvl:"no"},
    ...(p.dHplan>0?[{txt:"Separación horizontal entre partes vivas (plano) frente a la zona de trabajo",ok:p.dHplan>=r.DhA-1e-9,cmp:ge(p.dHplan,r.DhA),bad:"Separar más las partes vivas",lvl:"no"}]:[])
  ];
  return r;
}

/* ============================================================
   Motor 4: conductores y barrajes (IEEE 738, Peek, IEC 60865-1, flecha)
   ============================================================ */
function amp738(c){
  const Tf=(c.Tc+c.Ta)/2,mu=1.458e-6*Math.pow(Tf+273,1.5)/(Tf+383.4),rho=(1.293-1.525e-4*c.He+6.379e-9*c.He*c.He)/(1+0.00367*Tf),kf=2.424e-2+7.477e-5*Tf-4.407e-9*Tf*Tf;
  const Re=c.D*rho*c.V/mu,ph=(c.phi??90)*Math.PI/180,Ka=1.194-Math.cos(ph)+0.194*Math.cos(2*ph)+0.368*Math.sin(2*ph),dT=c.Tc-c.Ta;
  const qc1=Ka*(1.01+1.35*Math.pow(Re,0.52))*kf*dT,qc2=Ka*0.754*Math.pow(Re,0.6)*kf*dT,qcn=3.645*Math.sqrt(rho)*Math.pow(c.D,0.75)*Math.pow(Math.max(0,dT),1.25);
  const qc=Math.max(qc1,qc2,qcn),qr=17.8*c.D*c.eps*(Math.pow((c.Tc+273)/100,4)-Math.pow((c.Ta+273)/100,4)),qs=c.alpha*c.Qs*c.D,I2=(qc+qr-qs)/c.R;
  return{Tf,rho,Re,qc1,qc2,qcn,qc,qr,qs,R:c.R,I:I2>0?Math.sqrt(I2):0};
}
const condCat=id=>CAT.COND.find(c=>c.id===id)||null;
function ampCond(C,g,p,Tc){return amp738({D:C.d/1000,R:C.r20*p.kac*(1+0.00403*(Tc-20))/1000,Ta:p.Ta,Tc,V:p.vv,phi:90,He:g.alt,eps:p.eps,alpha:p.abs,Qs:p.Qs})}
function calcCon(g,p,ctx){
  ctx=ctx||{};const o={},C=p.cond==="custom"?null:condCat(p.cond);o.cat=C;
  const d=C?C.d:p.d,w=C?C.w:p.w,rts=C?C.rts:p.rts,r20=C?C.r20:p.r20,aAl=C?C.aAl:p.aAl,n=Math.max(1,Math.round(p.nsub));
  Object.assign(o,{d,w,rts,r20,aAl,n,nombre:C?C.n:"Conductor personalizado",rig:!!ctx.rig});
  o.RTc=r20*p.kac*(1+0.00403*(p.Tc-20))/1000;
  o.amp=amp738({D:d/1000,R:o.RTc,Ta:p.Ta,Tc:p.Tc,V:p.vv,phi:90,He:g.alt,eps:p.eps,alpha:p.abs,Qs:p.Qs});
  o.Icap=n*o.amp.I;o.okAmp=o.Icap>=p.Idis;o.uso=p.Idis/o.Icap;
  const b=Math.pow(10,Math.log10(76)-g.alt/18336);o.b=b;o.delta=3.92*b/(273+g.t);
  const r=d/20,a=(p.link&&ctx.Sf>0?ctx.Sf:p.a)*100;o.a=a/100;o.r=r;
  o.Rb=n>1?p.sep/(2*Math.sin(Math.PI/n)):0;o.req=n>1?Math.pow(n*r*Math.pow(o.Rb,n-1),1/n):r;
  o.V=g.um/Math.sqrt(3);o.Emed=o.V/(n*r*Math.log(a/o.req));o.Emax=o.Emed*(n>1?1+(n-1)*r/o.Rb:1);
  o.E0=21.1*p.m*o.delta;o.Vc=o.E0*o.V/o.Emax;o.okCor=o.Emax<=o.E0;
  o.Sthr=Math.sqrt(2.1376e16*Math.log((1+0.004*(p.te-20))/(1+0.004*(p.Tc-20))))/1e6;
  o.Amin=p.Ik*1000*Math.sqrt(p.tk)/o.Sthr;
  o.Ith=n*aAl*o.Sthr/Math.sqrt(p.tk)/1000;o.okTh=o.Ith>=p.Ik;
  o.ip=p.kip*p.Ik;o.Fp=2e-7*(Math.sqrt(3)/2)*Math.pow(o.ip*1e3,2)/o.a;o.F3=2e-7*0.75*Math.pow(p.Ik*1e3,2)/o.a;
  o.rr=o.F3/(n*w*9.81);o.ang=Math.atan(o.rr)*180/Math.PI;o.Fvano=o.Fp*p.L/1000;
  /* tendido: flecha objetivo → tensión, o tensión → flecha */
  if(p.mMode==="flecha"){o.f=+p.f;o.T=w*p.L*p.L/(8*o.f)}else{o.T=+p.T;o.f=w*p.L*p.L/(8*o.T)}
  o.fPct=100*o.f/p.L;o.pctRts=100*o.T/rts;o.okT=o.pctRts<=25;
  const D=p.tubD,t=p.tubT,di=D-2*t;o.Z=Math.PI*(Math.pow(D,4)-Math.pow(di,4))/(32*D);
  o.Fm=o.Fp*p.tubL;o.sig=p.tubB*o.Fm*(p.tubL*1000)/(8*o.Z);const k=1-2*t/D;o.q=1.7*(1-Math.pow(k,3))/(1-Math.pow(k,4));o.sigAdm=o.q*p.tubRp;o.okTub=o.sig<=o.sigAdm;
  /* conexiones de bahía */
  o.cx=[["Conexión de bahía de línea",p.cL,ctx.Ilin,p.nCL],["Conexión de bahía de transformación",p.cT,ctx.Itr,p.nCT]].map(([t,id,I,nb])=>{const Cc=condCat(id);if(!Cc||!(I>0))return null;
    const n=Math.max(1,Math.round(+nb||1)),Ia=n*ampCond(Cc,g,p,p.Tc).I;return{t,C:Cc,n,I,Ia,ok:Ia>=I,uso:I/Ia}}).filter(Boolean);
  o.ok=o.okAmp&&o.okCor&&o.okTh&&(o.rig?o.okTub:o.okT)&&o.cx.every(x=>x.ok);
  return o;
}

/* ============================================================
   Motor 5: equipos: corrientes, cortocircuito y BIL por distancia al DPS
   ============================================================ */
function calcEq(g,proy,p,A1,D1){
  const o={},x=Math.max(1,+proy.nLin||1),y=Math.max(1,+proy.nTr||1),nU=(TR_TIPO[proy.trTipo]||TR_TIPO.trif)[1];
  o.nU=nU;o.Smax=y*nU*proy.S1;o.Inom=o.Smax*1e6/(Math.sqrt(3)*proy.un*1e3);
  o.Ilin=p.fc*o.Inom/x;o.Itr=p.fc*o.Inom/y;o.IBP=p.fc*o.Inom;o.IBT=Math.max(o.Ilin,o.Itr);
  const rat=I=>I_NORM.find(v=>v>=I-1e-9)||Math.ceil(I/1000)*1000;
  o.rLin=rat(o.Ilin);o.rTr=rat(o.Itr);o.rBP=rat(o.IBP);o.rBT=rat(o.IBT);
  o.Scc=Math.sqrt(3)*proy.un*p.Isc;
  /* corriente de corta duración: la normalizada que cubre la falla; con ikMargen, además deja al menos 5 % de reserva frente a la falla a tierra */
  o.Ik=p.ikMargen?(IK_NORM.find(v=>Math.max(p.Isc,p.I1||0)<=0.95*v+1e-9)||63):(IK_NORM.find(v=>v>=p.Isc-1e-9)||63);o.ipA=2.6*o.Ik;
  o.kappa=1.02+0.98*Math.exp(-3/p.XR);o.ip3=o.kappa*Math.SQRT2*p.Isc;o.ip1=o.kappa*Math.SQRT2*p.I1;
  o.u3=p.Isc/o.Ik;o.u1=p.I1/o.Ik;o.uip=o.ip3/o.ipA;o.uip1=o.ip1/o.ipA;
  o.Ik40=Math.max(o.u1,o.u3)>0.95?(IK_NORM.find(v=>v>o.Ik)||o.Ik):o.Ik;
  /* asignación de BIL por distancia al DPS más cercano */
  const B1=A1.BIL,B2=A1.BIL2,mp=A1.kmin-1;
  o.rows=(p.rows||[]).map(r=>{const l=+r.l||0,m1=B1?A1.MPl(B1,l):null,m2=B2?A1.MPl(B2,l):null;
    const asg=m1!=null&&m1>=mp-1e-9?B1:(m2!=null&&m2>=mp-1e-9?B2:null);return{...r,l,m1,m2,asg}});
  o.n1=o.rows.filter(r=>r.asg===B1).length;o.n2=o.rows.filter(r=>B2&&r.asg===B2).length;o.nNo=o.rows.filter(r=>r.asg==null).length;
  /* requisitos por nivel */
  o.niv=[B1,B2].filter(Boolean).map(B=>({BIL:B,um:umClase(g.um,B),ac:ACW[B]||null,iso:ISO[B]||null}));
  /* seccionador de apertura central */
  o.sReq=p.Feq+D1.dffA;o.okS=!(p.sEq>0)||p.sEq>=o.sReq-1e-9;o.baseReq=D1.heqA-p.Dais;o.okBase=!(p.base>0)||p.base>=o.baseReq-1e-9;
  o.cnt=cuentaEquipos(proy);
  o.ok=o.nNo===0&&o.okS&&o.okBase&&o.u3<=1&&o.u1<=1;
  return o;
}

/* ============================================================
   Motor 6: malla de puesta a tierra (IEEE Std 80-2013)
   ============================================================ */
function calcMal(p){
  const o={},capa=p.hs>0&&p.rhos>0,ts=p.ts>0?p.ts:p.tf,tc=p.tc>0?p.tc:p.tf;o.capa=capa;o.ts=ts;o.tc=tc;
  /* suelo: natural uniforme, o mejorado en dos capas: capa tratada de espesor H (ρ1) sobre el suelo de abajo (ρ2).
     Cs usa el suelo que queda bajo la grava; las ecuaciones de IEEE 80 usan la mayor resistividad (lado seguro) */
  const mj=MEJ[p.mej]||MEJ.no,trat=p.mej&&p.mej!=="no";o.trat=!!trat;o.mejN=mj.n;
  o.red1=trat?Math.min(99,Math.max(0,mj.red!=null?mj.red:+p.red1||0)):0;o.red2=trat?Math.min(o.red1,Math.max(0,+p.red2||0)):0;
  o.rho1=p.rho*(1-o.red1/100);o.rho2=p.rho*(1-o.red2/100);
  o.rhoCs=trat?o.rho1:p.rho;o.rhoC=trat?Math.max(o.rho1,o.rho2):p.rho;
  const rs=capa?p.rhos:o.rhoCs;
  o.Cs=capa?1-0.09*(1-o.rhoCs/p.rhos)/(2*p.hs+0.09):1;
  o.kb=+p.peso===50?0.116:0.157;
  o.Etouch=(1000+1.5*o.Cs*rs)*o.kb/Math.sqrt(ts);o.Estep=(1000+6*o.Cs*rs)*o.kb/Math.sqrt(ts);
  o.Tdc=p.XR/(2*Math.PI*60);
  const dfx=t=>o.Tdc>0?Math.sqrt(1+(o.Tdc/t)*(1-Math.exp(-2*t/o.Tdc))):1;
  o.Df=dfx(p.tf);o.Dfc=dfx(tc);
  /* corriente: el dato puede venir simétrico (3I0) o asimétrico (IF = Df·3I0); Cp proyecta el crecimiento de la red */
  o.asim=p.IfTipo==="asim";o.I3=o.asim?p.If/o.Df:p.If;o.Cp=p.Cp>0?p.Cp:1;
  const m=MAT[p.mat];o.Tm=Math.min(m.Tm,CONN[p.conn].lim);
  o.IFc=o.Cp*o.Dfc*o.I3;
  o.Amin=o.IFc/Math.sqrt((m.TC*1e-4/(tc*m.ar*m.rr))*Math.log((m.K0+o.Tm)/(m.K0+p.Ta)));
  const sz=SIZES[p.size];o.Asec=sz[1];o.dmm=p.dOver>0?p.dOver:sz[2];o.okCond=o.Asec>=o.Amin;
  const A=p.Lx*p.Ly;o.A=A;
  o.nX=Math.max(2,Math.round(p.nCx));o.nY=Math.max(2,Math.round(p.nCy));   /* nX: conductores paralelos a Lx; nY: paralelos a Ly */
  o.Dx=p.Lx/(o.nY-1);o.Dy=p.Ly/(o.nX-1);
  o.LCb=o.nX*p.Lx+o.nY*p.Ly;o.Lp=2*(p.Lx+p.Ly);
  /* refuerzos: zona de equipos con retícula más densa y cuadrículas en las esquinas */
  o.zon=!!p.zon&&p.zLx>0&&p.zLy>0&&p.zNx>=2&&p.zNy>=2;
  o.LCz=o.zon?Math.round(p.zNx)*p.zLx+Math.round(p.zNy)*p.zLy:0;
  if(o.zon){o.zDx=p.zLx/(Math.round(p.zNy)-1);o.zDy=p.zLy/(Math.round(p.zNx)-1)}
  o.esqOn=!!p.esqOn&&p.eL>0&&p.eN>=2;
  o.LCe=o.esqOn?4*2*Math.round(p.eN)*p.eL:0;if(o.esqOn)o.eD=p.eL/(Math.round(p.eN)-1);
  o.LC=o.LCb+o.LCz+o.LCe;
  o.Deff=p.Dsel==="min"?Math.min(o.Dx,o.Dy):p.Dsel==="max"?Math.max(o.Dx,o.Dy):(o.Dx+o.Dy)/2;
  const D=o.Deff,d=o.dmm/1000,h=p.h;
  const n1=Math.max(0,Math.round(p.nR||0)),n2=Math.max(0,Math.round(p.nR2||0));o.nRt=n1+n2;
  o.LR1=n1*(p.LR||0);o.LR2=n2*(p.LR2||0);o.LRt=o.LR1+o.LR2;o.Lr=o.nRt?o.LRt/o.nRt:0;o.LT=o.LC+o.LRt;
  const rg=r=>r*(1/o.LT+(1/Math.sqrt(20*A))*(1+1/(1+h*Math.sqrt(20/A))));
  o.Rg=rg(o.rhoC);o.RgNat=rg(p.rho);o.Rarea=p.rho/4*Math.sqrt(Math.PI/A);
  o.sf=sfLadder(p,o.Rg);o.SfUse=p.sfMode==="calc"?o.sf.Sf:p.Sf;o.Ig=o.SfUse*o.I3*1000;o.IG=o.Df*o.Cp*o.Ig;
  o.GPR=o.IG*o.Rg;
  o.na=2*o.LC/o.Lp;o.nb=Math.sqrt(o.Lp/(4*Math.sqrt(A)));o.n=o.na*o.nb;
  const esq=p.rodPos==="esq"&&n1>0;o.esq=esq;
  o.Kii=esq?1:1/Math.pow(2*o.n,2/o.n);o.Kh=Math.sqrt(1+h/1);
  o.Km=(1/(2*Math.PI))*(Math.log(D*D/(16*h*d)+Math.pow(D+2*h,2)/(8*D*d)-h/(4*d))+(o.Kii/o.Kh)*Math.log(8/(Math.PI*(2*o.n-1))));
  o.Ki=0.644+0.148*o.n;
  o.LM=esq?o.LC+(1.55+1.22*(o.Lr/Math.sqrt(p.Lx*p.Lx+p.Ly*p.Ly)))*o.LRt:o.LC+o.LRt;
  o.Em=o.rhoC*o.Km*o.Ki*o.IG/o.LM;
  o.Ks=(1/Math.PI)*(1/(2*h)+1/(D+h)+(1/D)*(1-Math.pow(0.5,o.n-2)));
  o.LS=0.75*o.LC+0.85*o.LRt;o.Es=o.rhoC*o.Ks*o.Ki*o.IG/o.LS;
  o.safeGPR=o.GPR<=o.Etouch;o.okEm=o.Em<=o.Etouch;o.okEs=o.Es<=o.Estep;o.okMalla=o.safeGPR||(o.okEm&&o.okEs);
  o.Rmax=p.Rmax>0?+p.Rmax:0;o.okR=!o.Rmax||o.Rg<=o.Rmax;
  o.fuera=o.n>25||o.Deff<2.5||h<0.25||h>2.5;
  /* fuera del rango de las ecuaciones simplificadas (n > 25, D < 2,5 m) el resultado se marca como menos preciso, no como incumplimiento */
  o.ok=o.okCond&&o.okMalla&&o.okR;
  o.LMreq=o.rhoC*o.Km*o.Ki*o.IG/o.Etouch;
  return o;
}
function sfLadder(p,Rg){
  const f=60,De=658.5*Math.sqrt(p.rho/f),gmr=Math.max(1e-4,p.sfGmr/1000),L=p.sfSpan/1000,N=Math.max(0,Math.round(p.sfN));
  const zr=(p.sfR+0.000988*f)*L,zx=0.0028938*f*Math.log10(De/gmr)*L;
  if(!N||!(L>0))return{Sf:1,Zr:Infinity,Zx:0,Zm:Infinity,zr,zx,N};
  const ar=zr*p.sfRt+(zr*zr-zx*zx)/4,ai=zx*p.sfRt+zr*zx/2,mod=Math.hypot(ar,ai),sr=Math.sqrt((mod+ar)/2),si=Math.sign(ai||1)*Math.sqrt(Math.max(0,(mod-ar)/2));
  const Zr=(zr/2+sr)/N,Zx=(zx/2+si)/N;
  return{Sf:Math.hypot(Zr,Zx)/Math.hypot(Zr+Rg,Zx),Zr,Zx,Zm:Math.hypot(Zr,Zx),zr,zx,N,De};
}

/* ============================================================
   Motor 7: apantallamiento (Mejía Villegas cap. 5 · IEEE Std 998)
   Ángulos fijos y modelo electrogeométrico (esfera rodante)
   ============================================================ */
function radioCorona(h,Vc){let Rc=Math.max(1e-3,1.2e-4*Vc);for(let i=0;i<60;i++){const f=Rc*Math.log(2*h/Rc)-Vc/1500,df=Math.log(2*h/Rc)-1;const n=Rc-f/df;Rc=n>0?n:Rc/2;if(Math.abs(f)<1e-10)break}return Rc}
function smCond(r,k,d){
  const o={...r};o.hpr=r.hmax/3+2*r.hmin/3;o.r=r.dmm/2000;
  o.cfo=r.base==="CFO"?0.94*585*r.w:null;o.Vc=r.base==="CFO"?o.cfo:+r.bil;
  o.Rc=radioCorona(o.hpr,o.Vc);
  o.Z0=60*Math.sqrt(Math.log(2*o.hpr/o.Rc)*Math.log(2*o.hpr/o.r));
  o.Ic=(r.base==="CFO"?2.068:2.2)*o.Vc/o.Z0;
  o.Sm=8*k*Math.pow(o.Ic,0.65);
  o.he=d<o.Sm?o.Sm-Math.sqrt(o.Sm*o.Sm-d*d):Infinity;o.dmax2=1.5*o.Sm;
  return o;
}
/* Altura del arco de la esfera sobre un punto, según cómo se apoya la esfera */
function arco(v,Sm){
  const h1=+v.h1,h2=+v.h2,s=+v.s,x=+v.x;
  if(v.apo==="cs"){ /* cable y suelo: el elemento está a x del cable, hacia afuera */
    if(h1>=Sm)return{y:Math.max(0,Sm-Math.sqrt(Math.max(0,Sm*Sm-x*x))),xc:0,nota:"cable más alto que la esfera"};
    const xc=Math.sqrt(Sm*Sm-(Sm-h1)*(Sm-h1));if(x>=xc)return{y:0,xc,nota:"la esfera toca el suelo"};
    return{y:Sm-Math.sqrt(Sm*Sm-(xc-x)*(xc-x)),xc}}
  /* dos cables: altura h1 en x = 0 y h2 en x = s */
  const H2=v.apo==="2c"?h1:h2,c=Math.hypot(s,H2-h1);
  if(c/2>=Sm){return arco({apo:"cs",h1:x<=s/2?h1:H2,x:x<=s/2?x:s-x},Sm)}
  const mx_=s/2,my=(h1+H2)/2,k=Math.sqrt(Sm*Sm-c*c/4),ux=-(H2-h1)/c,uy=s/c,xc=mx_+k*ux,yc=my+k*uy;
  const dx=x-xc;if(Math.abs(dx)>Sm)return{y:0,xc,yc};
  return{y:yc-Math.sqrt(Sm*Sm-dx*dx),xc,yc};
}
function calcApa(g,p){
  const o={},d=p.s2d/2;o.d=d;
  o.f=p.alfa*p.vanoG;o.hLow=p.hG-o.f;
  o.sm=(p.sm||[]).map(r=>smCond(r,p.k,d));
  const valid=o.sm.filter(s=>Number.isFinite(s.Sm));
  o.SmMin=valid.length?Math.min(...valid.map(s=>s.Sm)):NaN;o.gov=valid.find(s=>s.Sm===o.SmMin)||null;
  o.heMax=valid.length?Math.max(...valid.map(s=>s.he)):NaN;
  o.ver=(p.ver||[]).map(v=>{const S=o.sm[+v.sm];const Sm=S?S.Sm:NaN,a=arco(v,Sm),y=a.y,marg=y-v.de;
    const hc=v.apo==="2d"&&+v.x>+v.s/2?+v.h2:+v.h1,xn=v.apo==="2d"?Math.min(+v.x,+v.s-+v.x):(v.apo==="2c"?Math.min(+v.x,+v.s-+v.x):+v.x);
    const dh=hc-v.de,th=dh>0?Math.atan(xn/dh)*180/Math.PI:90;
    return{...v,Sm,Sname:S?S.n:"—",y,marg,ok:marg>=-1e-9,th,ok45:th<=45+1e-9,ok60:v.beta&&th<=60+1e-9,nota:a.nota}});
  o.okEsf=o.ver.every(v=>v.ok);o.ok45=o.ver.every(v=>v.ok45);o.ok60=o.ver.every(v=>v.ok45||v.ok60);
  o.margMin=o.ver.length?Math.min(...o.ver.map(v=>v.marg)):NaN;o.crit=o.ver.find(v=>v.marg===o.margMin)||null;
  o.thMax=o.ver.length?Math.max(...o.ver.map(v=>v.th)):NaN;
  o.okSep=p.s2d<=1.5*o.SmMin;
  /* exposición y tasa de fallas (ángulo de 45°, fila de 15 m) */
  o.Nd=p.ddt*p.area/1e6;o.anios=o.Nd>0?1/o.Nd:Infinity;
  o.f45=Math.abs(p.hG-15)<0.5?FALLA15[45]*p.Lcg/1000/100:null;o.aF45=o.f45?1/o.f45:null;
  /* edificio con 4 puntas captadoras */
  const K=Math.hypot(p.L1,p.L2);o.Kdiag=K;
  o.mast=[p.rN,o.SmMin].filter(Number.isFinite).map(R=>{const y=p.hM-p.deM,E=R-y,J=Math.sqrt(Math.max(0,R*R-E*E)),Kmax=2*J;
    const yC=p.hM+Math.sqrt(Math.max(0,R*R-K*K/4))-R;
    const edge=L=>{const rho2=R*R-(L/2)*(L/2)-(R-p.hM)*(R-p.hM);return rho2>0?R-Math.sqrt(R*R-rho2):0};
    const betw=L=>p.hM+Math.sqrt(Math.max(0,R*R-(L/2)*(L/2)))-R;
    const pts=[["Centro de la cubierta",yC],["Alero en la mitad del lado largo",edge(Math.max(p.L1,p.L2))],["Alero en la mitad del lado corto",edge(Math.min(p.L1,p.L2))],["Borde de la cubierta entre puntas del lado largo",betw(Math.max(p.L1,p.L2))]].map(([t,yy])=>({t,y:yy,m:yy-p.deM}));
    return{R,y,E,J,Kmax,ok:Kmax>=K&&pts.every(q=>q.m>=0),pts}});
  /* el patio queda protegido si cumple cualquiera de los dos métodos: esfera rodante (con 2d ≤ 1,5·Sm) o ángulos fijos (45°, o 60° entre cables) */
  o.okMetEsf=o.okEsf&&o.okSep;o.okMetAng=o.ver.length>0&&o.ok60;o.okPatio=o.okMetEsf||o.okMetAng;
  o.metodo=o.okMetEsf&&o.okMetAng?"ambos":o.okMetEsf?"esfera":o.okMetAng?"angulos":"";
  /* la casa de control se diseña con la esfera de su nivel de protección (NTC 4552-3); la del patio es una verificación adicional */
  o.okMast=!o.mast.length||o.mast[0].ok;o.okMastSm=o.mast.every(m=>m.ok);
  o.ok=o.okPatio&&o.okMast;
  return o;
}

/* ============================================================
   Validación: el motor reproduce ejemplos publicados (IEEE 80, IEEE 738)
   ============================================================ */
function validar(){
  const V=[],it=(n,pub,calc,u,d=1,tol=1)=>({n,pub,calc,u,d,tol});
  const b1=calcMal({If:3.18,XR:0,Sf:0.6,tf:0.5,tc:0.5,rho:400,rhos:2500,hs:0.102,peso:70,Ta:40,Lx:70,Ly:70,nCx:11,nCy:11,h:0.5,size:"2/0",dOver:10,mat:"duro",conn:"exo",nR:0,LR:0,rodPos:"no",sfMode:"man",sfN:0,sfR:1,sfGmr:1,sfSpan:300,sfRt:15});
  V.push({mod:"Malla de tierra",caso:"IEEE Std 80-2013, Anexo B, ejemplo 1: malla de 70 × 70 m sin varillas",items:[it("Toque tolerable (70 kg)",838.2,b1.Etouch,"V"),it("Paso tolerable (70 kg)",2686.6,b1.Estep,"V"),it("Resistencia Rg",2.78,b1.Rg,"Ω",2),it("Elevación de potencial",5304,b1.GPR,"V",0),it("Km",0.89,b1.Km,"",2),it("Ki",2.272,b1.Ki,"",3),it("Tensión de malla Em",1002.1,b1.Em,"V")]});
  const b2=calcMal({If:3.18,XR:0,Sf:0.6,tf:0.5,tc:0.5,rho:400,rhos:2500,hs:0.102,peso:70,Ta:40,Lx:70,Ly:70,nCx:11,nCy:11,h:0.5,size:"2/0",dOver:10,mat:"duro",conn:"exo",nR:20,LR:7.5,rodPos:"esq",sfMode:"man",sfN:0,sfR:1,sfGmr:1,sfSpan:300,sfRt:15});
  V.push({mod:"Malla de tierra",caso:"IEEE Std 80-2013, Anexo B, ejemplo 2: la misma malla con 20 varillas de 7,5 m",items:[it("Resistencia Rg",2.75,b2.Rg,"Ω",2),it("Km",0.77,b2.Km,"",2),it("Tensión de malla Em",747.4,b2.Em,"V"),it("Ks",0.406,b2.Ks,"",3),it("Tensión de paso Es",548.9,b2.Es,"V")]});
  const a12=amp738({D:0.02814,R:9.390e-5,Ta:40,Tc:100,V:0.61,phi:90,He:0,eps:0.8,alpha:0.8,Qs:996.9});
  V.push({mod:"Conductores",caso:"IEEE Std 738, ejemplo: ACSR Drake a 100 °C, ambiente 40 °C, viento 0,61 m/s",items:[it("Convección forzada qc",81.93,a12.qc,"W/m",2),it("Capacidad (ε = α = 0,8)",1025,a12.I,"A",0)]});
  V.forEach(c=>c.items.forEach(i=>{i.err=100*(i.calc-i.pub)/i.pub;i.ok=Math.abs(i.err)<=i.tol}));
  return V;
}
window.SUBE={UN_CO,umDe,S_R10,S_CO,TR_TIPO,SEC_T,cuentaEquipos,DEF,KEY:SUBE_KEY,load:SUBE_load,save:SUBE_save,CAT,CFG,BIL_IEC,BIL_SERIE,ACW,ISO,SIWV_II,CLR_SI,RETIE_C,RETIE_A,POL,AISL,MAT,CONN,MEJ,SIZES,FALLA15,I_NORM,IK_NORM,EQ_BASE,SM_BASE,VER_BASE,
  calcAis,calcIns,calcDis,calcCon,calcEq,calcMal,calcApa,sfLadder,amp738,ampCond,smCond,arco,radioCorona,umClase,dminBIL,retieRow,kaH,validar};
})();
