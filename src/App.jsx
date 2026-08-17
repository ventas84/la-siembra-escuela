import { useState, useMemo, useCallback, useEffect } from "react";

/* ══════════════════════════════════════════════
   DATA & CONSTANTS
   ══════════════════════════════════════════════ */
const MONTHS=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_SHORT=["L","M","M","J","V","S","D"];
const DAYS=["Lunes","Martes","Miércoles","Jueves","Viernes"];
const DAY_COLORS={Lunes:"#E07A5F",Martes:"#4EADD5",Miércoles:"#5B8A72",Jueves:"#8B7FC7",Viernes:"#E8A838"};
const PALETTES=["#E07A5F","#4EADD5","#5B8A72","#8B7FC7","#E8A838","#D4845E"];
const PRIO={
  alta:{label:"Alta",bg:"#FDECEA",border:"#E07A5F",text:"#C0523A"},
  media:{label:"Media",bg:"#FFF7E6",border:"#E8A838",text:"#C08C20"},
  baja:{label:"Normal",bg:"#EDF6F0",border:"#5B8A72",text:"#48755D"},
};

const DEFAULT_SCHEDULE=[
  {id:"s1",time:"09:00 – 10:30",type:"common",label:"Juegos de mesa, libros, dibujo",stripe:false},
  {id:"s2",time:"10:30 – 11:00",type:"common",label:"Círculo de saludo y dinámica",stripe:true},
  {id:"s3",time:"11:00 – 11:30",type:"common",label:"Colación compartida",stripe:false},
  {id:"s4",time:"11:30 – 12:30",type:"talleres",stripe:true,
    days:{Lunes:"Taller de Aeroyoga con Nadia",Martes:"Taller de Yoga Infantil con Matías",Miércoles:"Taller de Bici con Gou",Jueves:"Taller de Cuentacuentos Bilingüe con Micaela",Viernes:"Trae y Muestra"}},
  {id:"s5",time:"12:30 – 13:00",type:"common",label:"Juego libre, patio, cocinería",stripe:false},
  {id:"s6",time:"13:00 – 15:00",type:"perday",stripe:true,
    days:{Lunes:"Almuerzos",Martes:"Almuerzos",Miércoles:"Almuerzos",Jueves:"Almuerzos",Viernes:"Salida a las 13 hrs"}},
];

const DEFAULT_EVENTS=[
  {id:1,title:"Reunión de apoderados",date:"2026-07-30",color:"#8B7FC7"},
  {id:2,title:"Inicio segundo semestre",date:"2026-08-03",color:"#5B8A72"},
  {id:3,title:"Día de la familia",date:"2026-08-15",color:"#E07A5F"},
  {id:4,title:"Paseo al parque",date:"2026-08-20",color:"#5B8A72"},
  {id:5,title:"Día sin uniforme",date:"2026-09-05",color:"#E8A838"},
  {id:6,title:"Feria de ciencias",date:"2026-09-12",color:"#4EADD5"},
  {id:7,title:"Aniversario escuela",date:"2026-10-08",color:"#8B7FC7"},
  {id:8,title:"Muestra de talleres",date:"2026-10-24",color:"#E8A838"},
  {id:9,title:"Fiesta de fin de año",date:"2026-12-18",color:"#E07A5F"},
  {id:10,title:"Último día de clases",date:"2026-12-22",color:"#5B8A72"},
];

const DEFAULT_INFO=[
  {id:1,title:"Inicio segundo semestre",body:"Las clases del segundo semestre comienzan el lunes 3 de agosto. Se solicita puntualidad.",date:"2026-07-28",priority:"alta"},
  {id:2,title:"Cambio de uniforme",body:"Durante julio y agosto el uso de uniforme de invierno es obligatorio.",date:"2026-07-25",priority:"media"},
  {id:3,title:"Inscripción talleres",body:"Las inscripciones para talleres extraprogramáticos están abiertas hasta el 8 de agosto.",date:"2026-07-22",priority:"baja"},
];

const DEFAULT_COLACIONES=[
  {id:1,item:"Uvas"},
  {id:2,item:"Plátano"},
  {id:3,item:"Plátano"},
  {id:4,item:"Manzana"},
  {id:5,item:"Naranja"},
  {id:6,item:"Bastones de zanahoria"},
  {id:7,item:"Brócoli / Huevos duros"},
  {id:8,item:"Bastones de apio"},
  {id:9,item:"Frutos secos"},
  {id:10,item:"Pan para rebanar + mantequilla, mantequilla de maní, pasta de dátil u otra opción"},
  {id:11,item:"Panqueque de avena"},
  {id:12,item:"Galletas de arroz o salvado integral + palta, hummus u otro"},
  {id:13,item:"Pera"},
];

const DEFAULT_KIDS=["Sol","Santi","Galeano","Damián","Newen","Alma","","","","","",""];
const DEFAULT_SORTEO=[];

const COLACION_EMOJIS={"Uvas":"🍇","Plátano":"🍌","Manzana":"🍎","Naranja":"🍊","Bastones de zanahoria":"🥕","Brócoli / Huevos duros":"🥦","Bastones de apio":"🥬","Frutos secos":"🥜","Pan para rebanar + mantequilla, mantequilla de maní, pasta de dátil u otra opción":"🍞","Panqueque de avena":"🥞","Galletas de arroz o salvado integral + palta, hummus u otro":"🍘","Pera":"🍐"};
function getEmoji(item){return COLACION_EMOJIS[item]||Object.entries(COLACION_EMOJIS).find(([k])=>item.toLowerCase().includes(k.toLowerCase().split(" ")[0]))?.[1]||"🍽️";}

/* ══════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════ */
function fmt(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function isToday(d){const t=new Date();return d.getDate()===t.getDate()&&d.getMonth()===t.getMonth()&&d.getFullYear()===t.getFullYear();}
function getMonthGrid(year,month){
  const first=new Date(year,month,1),last=new Date(year,month+1,0);
  const start=first.getDay()===0?6:first.getDay()-1;
  const cells=[];
  for(let i=start-1;i>=0;i--)cells.push({date:new Date(year,month,-i),out:true});
  for(let i=1;i<=last.getDate();i++)cells.push({date:new Date(year,month,i),out:false});
  const rem=7-cells.length%7;if(rem<7)for(let i=1;i<=rem;i++)cells.push({date:new Date(year,month+1,i),out:true});
  return cells;
}
function useIsMobile(bp=768){
  const [m,setM]=useState(typeof window!=="undefined"?window.innerWidth<bp:false);
  useEffect(()=>{const h=()=>setM(window.innerWidth<bp);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[bp]);
  return m;
}

/* ══════════════════════════════════════════════
   ICONS
   ══════════════════════════════════════════════ */
const IconLock=()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;
const IconCal=()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
const IconBell=()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>;
const IconClock=()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
const IconLogout=()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>;
const IconEdit=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>;
const IconPlus=()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>;
const IconEye=()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconMenu=()=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>;
const IconX=()=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>;
const IconApple=()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2c1 1 3 1 4 0M17.5 8C20 8 22 10.5 22 14c0 5-4 8-6 8s-2.5-1-4-1-2.5 1-4 1-6-3-6-8c0-3.5 2-6 4.5-6 1.5 0 2.5.5 3.5 1s2-.5 3.5-1z"/></svg>;
const IconChat=()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
const IconSend=()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>;

const DEFAULT_MESSAGES=[
  {id:1,from:"admin",name:"Profe",text:"¡Bienvenidos al chat de La Siembra! Aquí pueden dejar consultas, avisos o coordinar lo que necesiten. 🌱",time:"2026-07-28 09:00"},
  {id:2,from:"parent",name:"Mamá de Sol",text:"¡Hola profe! ¿A qué hora es la reunión de apoderados del jueves?",time:"2026-07-28 10:15"},
  {id:3,from:"admin",name:"Profe",text:"Hola! La reunión es a las 18:00 en la sala principal. Los esperamos 😊",time:"2026-07-28 10:22"},
  {id:4,from:"parent",name:"Papá de Galeano",text:"Perfecto, ahí estaremos. Galeano lleva la colación mañana, ¿verdad?",time:"2026-07-28 11:05"},
];
const Leaf=({style})=><svg viewBox="0 0 40 60" fill="none" style={{width:28,height:42,opacity:.12,...style}}><path d="M20 0C20 0 0 20 0 40c0 11 9 20 20 20s20-9 20-20C40 20 20 0 20 0z" fill="#5B8A72"/><path d="M20 12v40M20 24c-6 4-10 10-12 16M20 30c6 4 10 10 12 14" stroke="#3D6B54" strokeWidth="1.2"/></svg>;

/* ══════════════════════════════════════════════
   MAIN APP
   ══════════════════════════════════════════════ */
export default function App(){
  const [mode,setMode]=useState("public");
  const [pw,setPw]=useState("");
  const [pwError,setPwError]=useState(false);
  const [schedule,setSchedule]=useState(DEFAULT_SCHEDULE);
  const [events,setEvents]=useState(DEFAULT_EVENTS);
  const [info,setInfo]=useState(DEFAULT_INFO);
  const [colaciones,setColaciones]=useState(DEFAULT_COLACIONES);
  const [kids,setKids]=useState(DEFAULT_KIDS);
  const [sorteo,setSorteo]=useState(DEFAULT_SORTEO);
  const [messages,setMessages]=useState(DEFAULT_MESSAGES);
  const handleLogin=()=>{if(pw==="siembra2026"){setMode("admin");setPw("");setPwError(false);}else setPwError(true);};
  if(mode==="login")return <LoginScreen pw={pw} setPw={setPw} error={pwError} onLogin={handleLogin} onBack={()=>{setMode("public");setPwError(false);setPw("");}}/>;
  if(mode==="admin")return <AdminPanel schedule={schedule} setSchedule={setSchedule} events={events} setEvents={setEvents} info={info} setInfo={setInfo} colaciones={colaciones} setColaciones={setColaciones} kids={kids} setKids={setKids} sorteo={sorteo} setSorteo={setSorteo} messages={messages} setMessages={setMessages} onLogout={()=>setMode("public")}/>;
  return <PublicView schedule={schedule} events={events} info={info} colaciones={colaciones} sorteo={sorteo} messages={messages} setMessages={setMessages} onAdmin={()=>setMode("login")}/>;
}

/* ══════════════════════════════════════════════
   LOGIN
   ══════════════════════════════════════════════ */
function LoginScreen({pw,setPw,error,onLogin,onBack}){
  return(
    <div style={{minHeight:"100vh",background:"#F0EDE6",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',system-ui,sans-serif",padding:20}}>
      <div style={{width:"100%",maxWidth:380,background:"#fff",borderRadius:20,padding:"36px 28px",boxShadow:"0 8px 30px rgba(27,42,74,0.10)",textAlign:"center",position:"relative"}}>
        <div style={{width:56,height:56,borderRadius:16,background:"#EDF6F0",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",color:"#5B8A72"}}><IconLock/></div>
        <h2 style={{margin:"0 0 4px",fontSize:22,fontWeight:800,color:"#1B2A4A"}}>Panel Administrador</h2>
        <p style={{margin:"0 0 24px",fontSize:14,color:"#7A8194"}}>Ingresa la contraseña para acceder</p>
        <input type="password" placeholder="Contraseña" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onLogin()}
          style={{width:"100%",padding:"12px 16px",borderRadius:10,border:`1.5px solid ${error?"#E07A5F":"#E2E1DC"}`,fontSize:15,outline:"none",boxSizing:"border-box",background:error?"#FFF5F3":"#FAFAF8"}}/>
        {error&&<p style={{color:"#E07A5F",fontSize:13,margin:"8px 0 0",fontWeight:600}}>Contraseña incorrecta</p>}
        <button onClick={onLogin} style={{width:"100%",marginTop:16,padding:12,border:"none",borderRadius:10,background:"#1B2A4A",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer"}}>Ingresar</button>
        <button onClick={onBack} style={{marginTop:12,background:"none",border:"none",color:"#7A8194",fontSize:13,cursor:"pointer",fontWeight:600}}>← Volver al sitio</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PUBLIC VIEW
   ══════════════════════════════════════════════ */
function PublicView({schedule,events,info,colaciones,sorteo,messages,setMessages,onAdmin}){
  const [tab,setTab]=useState("horario");
  const [calYear,setCalYear]=useState(2026);
  const [expandedMonth,setExpandedMonth]=useState(null);
  const mobile=useIsMobile();
  const evByDate=useMemo(()=>{const m={};events.forEach(e=>{if(!m[e.date])m[e.date]=[];m[e.date].push(e);});return m;},[events]);
  const unread=messages.filter(m=>m.from==="admin"&&!m.read).length;

  return(
    <div style={{fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",background:"#F0EDE6",minHeight:"100vh",color:"#1B2A4A"}}>
      <header style={{position:"relative",overflow:"hidden",background:"linear-gradient(135deg,#F7F5F0,#EDE9DF)",borderBottom:"3px solid #5B8A72",padding:mobile?"16px 16px 0":"20px 24px 0"}}>
        <Leaf style={{position:"absolute",left:16,top:8,transform:"rotate(-20deg)"}}/>
        <Leaf style={{position:"absolute",right:20,bottom:10,transform:"rotate(15deg) scaleX(-1)"}}/>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{fontSize:mobile?11:13,fontWeight:600,color:"#5B8A72",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>Horario semanal</div>
            <h1 style={{margin:0,fontSize:mobile?24:32,fontWeight:800,color:"#1B2A4A",letterSpacing:"-0.02em",fontStyle:"italic",lineHeight:1.2}}>La Siembra Escuela</h1>
          </div>
          <button onClick={onAdmin} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:10,border:"1.5px solid #D8D5CE",background:"rgba(255,255,255,0.6)",color:"#7A8194",fontSize:12,fontWeight:600,cursor:"pointer"}}><IconLock/>{!mobile&&<span>Admin</span>}</button>
        </div>
        <nav style={{display:"flex",gap:2,marginTop:14,maxWidth:1100,margin:"14px auto 0",overflowX:"auto",WebkitOverflowScrolling:"touch",msOverflowStyle:"none",scrollbarWidth:"none"}}>
          {[["horario","Horario",<IconClock/>],["colaciones","Colaciones",<IconApple/>],["calendario","Calendario",<IconCal/>],["info","Información",<IconBell/>],["chat","Chat",<IconChat/>]].map(([k,l,ic])=>(
            <button key={k} onClick={()=>setTab(k)} style={{display:"flex",alignItems:"center",gap:5,padding:mobile?"9px 14px":"10px 20px",border:"none",background:tab===k?"#fff":"transparent",fontSize:mobile?12:13,fontWeight:600,cursor:"pointer",color:tab===k?"#1B2A4A":"#7A8194",borderBottom:tab===k?"3px solid #5B8A72":"3px solid transparent",marginBottom:-3,borderRadius:"8px 8px 0 0",whiteSpace:"nowrap",position:"relative"}}>{ic}<span>{l}</span></button>
          ))}
        </nav>
      </header>

      <main style={{maxWidth:1100,margin:"0 auto",padding:mobile?"16px 12px 60px":"24px 24px 60px"}}>
        {tab==="horario"&&<ScheduleView schedule={schedule} mobile={mobile}/>}
        {tab==="colaciones"&&<ColacionesBoard colaciones={colaciones} sorteo={sorteo} mobile={mobile} readOnly/>}
        {tab==="calendario"&&<YearCalendar year={calYear} setYear={setCalYear} events={events} evByDate={evByDate} expandedMonth={expandedMonth} setExpandedMonth={setExpandedMonth} readOnly mobile={mobile}/>}
        {tab==="info"&&<InfoBoard info={info} readOnly mobile={mobile}/>}
        {tab==="chat"&&<ChatView messages={messages} setMessages={setMessages} mobile={mobile} isAdmin={false}/>}
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════════
   SCHEDULE — Desktop table + Mobile cards
   ══════════════════════════════════════════════ */
function ScheduleView({schedule,mobile,isAdmin,editingCell,setEditingCell,editVal,setEditVal,saveCell}){
  const [activeDay,setActiveDay]=useState("Lunes");

  if(mobile){
    return(
      <div style={S.card}>
        {/* Day selector pills */}
        <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:4,WebkitOverflowScrolling:"touch"}}>
          {DAYS.map(d=>(
            <button key={d} onClick={()=>setActiveDay(d)} style={{padding:"8px 16px",borderRadius:20,border:"none",background:activeDay===d?DAY_COLORS[d]:"#F0EDE6",color:activeDay===d?"#fff":"#7A8194",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",transition:"all .15s",flexShrink:0}}>
              {d}
            </button>
          ))}
        </div>
        {/* Time blocks as cards */}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {schedule.map(row=>{
            const content = row.type==="common" ? row.label : (row.days?.[activeDay]||"—");
            const isTaller = row.type==="talleres";
            const isSpecial = row.type==="perday" && activeDay==="Viernes";
            return(
              <div key={row.id} style={{display:"flex",gap:12,padding:"14px 16px",borderRadius:12,background:row.stripe?"#FFFDF7":"#FAFAF8",border:"1px solid #ECEAE4",alignItems:"center"}}>
                <div style={{minWidth:80}}>
                  <div style={{fontSize:12,fontWeight:800,color:"#E8A838",lineHeight:1.3}}>{row.time.replace("–","\n–")}</div>
                </div>
                <div style={{flex:1}}>
                  {isAdmin && editingCell?.rowId===row.id && (editingCell?.day===activeDay || (row.type==="common"&&editingCell?.day===null)) ? (
                    <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
                      onBlur={()=>saveCell(row.id,row.type==="common"?null:activeDay)}
                      onKeyDown={e=>e.key==="Enter"&&saveCell(row.id,row.type==="common"?null:activeDay)}
                      style={{width:"100%",padding:"6px 10px",border:"1.5px solid #4EADD5",borderRadius:6,fontSize:14,outline:"none",background:"#F0F8FF"}}/>
                  ):(
                    <div onClick={()=>{
                      if(!isAdmin)return;
                      if(row.type==="common"){setEditingCell({rowId:row.id,day:null});setEditVal(row.label);}
                      else{setEditingCell({rowId:row.id,day:activeDay});setEditVal(row.days?.[activeDay]||"");}
                    }}
                      style={{fontSize:14,fontWeight:isTaller?700:600,color:isTaller?DAY_COLORS[activeDay]:(isSpecial?"#E8A838":"#3A3A3A"),lineHeight:1.4,cursor:isAdmin?"pointer":"default"}}>
                      {content}
                      {isAdmin&&<span style={{opacity:.3,marginLeft:6}}><IconEdit/></span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p style={{marginTop:14,fontSize:12,color:"#7A8194",fontStyle:"italic"}}><span style={{color:"#5B8A72",fontWeight:700}}>●</span> Los talleres cambian cada semestre.</p>
      </div>
    );
  }

  // Desktop table
  return(
    <div style={S.card}>
      <div style={{overflowX:"auto",borderRadius:10,border:"1.5px solid #E8E5DD"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:14,tableLayout:"fixed"}}>
          <thead>
            <tr>
              <th style={{...S.th,background:"#F7F5F0",minWidth:110}}>Horario</th>
              {DAYS.map(d=><th key={d} style={{...S.th,background:DAY_COLORS[d],color:"#fff",fontSize:12,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase"}}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {schedule.map(row=>(
              <tr key={row.id}>
                <td style={{...S.td,...S.timeCell}}>{row.time}</td>
                {row.type==="common"?(
                  <td colSpan={5} style={{...S.td,background:row.stripe?"#FFFDF7":"#fff",textAlign:"center",cursor:isAdmin?"pointer":"default"}}
                    onClick={()=>{if(!isAdmin)return;setEditingCell({rowId:row.id,day:null});setEditVal(row.label);}}>
                    {isAdmin&&editingCell?.rowId===row.id&&editingCell?.day===null?(
                      <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)} onBlur={()=>saveCell(row.id,null)} onKeyDown={e=>e.key==="Enter"&&saveCell(row.id,null)} style={S.cellInput}/>
                    ):(
                      <span style={{fontWeight:600,fontSize:14,color:"#3A3A3A"}}>{row.label}{isAdmin&&<span style={{opacity:.3,marginLeft:6}}><IconEdit/></span>}</span>
                    )}
                  </td>
                ):(
                  DAYS.map(d=>(
                    <td key={d} style={{...S.td,background:row.stripe?"#FFFDF7":"#fff",textAlign:"center",cursor:isAdmin?"pointer":"default"}}
                      onClick={()=>{if(!isAdmin)return;setEditingCell({rowId:row.id,day:d});setEditVal(row.days?.[d]||"");}}>
                      {isAdmin&&editingCell?.rowId===row.id&&editingCell?.day===d?(
                        <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)} onBlur={()=>saveCell(row.id,d)} onKeyDown={e=>e.key==="Enter"&&saveCell(row.id,d)} style={S.cellInput}/>
                      ):(
                        <span style={{fontWeight:700,fontSize:13,color:row.type==="talleres"?DAY_COLORS[d]:(d==="Viernes"&&row.days?.[d]?.includes("Salida")?"#E8A838":"#3A3A3A"),lineHeight:1.4}}>
                          {row.days?.[d]||"—"}{isAdmin&&<span style={{opacity:.3,marginLeft:4}}><IconEdit/></span>}
                        </span>
                      )}
                    </td>
                  ))
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{marginTop:16,fontSize:13,color:"#7A8194",fontStyle:"italic"}}><span style={{color:"#5B8A72",fontWeight:700}}>●</span> Los talleres cambian cada semestre según disponibilidad de talleristas.</p>
    </div>
  );
}

/* ══════════════════════════════════════════════
   YEAR CALENDAR
   ══════════════════════════════════════════════ */
const DAYS_FULL=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

function YearCalendar({year,setYear,events,evByDate,expandedMonth,setExpandedMonth,readOnly,onRemoveEvent,mobile}){
  const isExp=expandedMonth!==null;
  const expCells=isExp?getMonthGrid(year,expandedMonth):[];
  const expEvents=isExp?events.filter(e=>{const d=new Date(e.date+"T12:00:00");return d.getMonth()===expandedMonth&&d.getFullYear()===year;}).sort((a,b)=>a.date.localeCompare(b.date)):[];

  return(
    <div style={S.card}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <button style={S.yearBtn} onClick={()=>setYear(y=>y-1)}>‹</button>
        <h2 style={{margin:0,fontSize:mobile?18:22,fontWeight:800,minWidth:50,textAlign:"center"}}>{year}</h2>
        <button style={S.yearBtn} onClick={()=>setYear(y=>y+1)}>›</button>
      </div>

      {/* ── EXPANDED MONTH VIEW ── */}
      {isExp&&(
        <div style={{marginBottom:20}}>
          {/* Header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={()=>setExpandedMonth(expandedMonth>0?expandedMonth-1:11)} style={S.yearBtn}>‹</button>
              <h3 style={{margin:0,fontSize:mobile?18:22,fontWeight:800,color:"#1B2A4A"}}>{MONTHS[expandedMonth]}</h3>
              <button onClick={()=>setExpandedMonth(expandedMonth<11?expandedMonth+1:0)} style={S.yearBtn}>›</button>
            </div>
            <button onClick={()=>setExpandedMonth(null)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,border:"1.5px solid #E2E1DC",background:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",color:"#7A8194"}}>
              ← Todos los meses
            </button>
          </div>

          {/* Big calendar grid */}
          <div style={{borderRadius:12,border:"1.5px solid #E8E5DD",overflow:"hidden",background:"#fff"}}>
            {/* Day headers */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"#F7F5F0",borderBottom:"1.5px solid #E8E5DD"}}>
              {DAYS_FULL.map(d=><div key={d} style={{padding:mobile?"8px 4px":"10px 8px",textAlign:"center",fontSize:mobile?11:12,fontWeight:700,color:"#7A8194",textTransform:"uppercase",letterSpacing:"0.05em"}}>{d}</div>)}
            </div>
            {/* Day cells */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
              {expCells.map(({date:d,out},ci)=>{
                const ds=fmt(d);
                const dayEv=evByDate[ds]||[];
                const td=isToday(d);
                const isWeekend=ci%7>=5;
                return(
                  <div key={ci} style={{
                    minHeight:mobile?60:80,padding:mobile?"4px 3px":"6px 8px",
                    borderBottom:"1px solid #F0EDE6",borderRight:ci%7<6?"1px solid #F0EDE6":"none",
                    background:out?"#FAFAF8":(td?"#FFFDF7":(isWeekend?"#FCFBF9":"#fff")),
                    opacity:out?0.35:1,
                    transition:"background .15s"
                  }}>
                    <div style={{fontSize:mobile?11:13,fontWeight:td?800:500,color:td?"#E8A838":"#555",marginBottom:3}}>
                      {td?<span style={{background:"#E8A838",color:"#fff",borderRadius:"50%",width:mobile?20:24,height:mobile?20:24,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:mobile?10:12}}>{d.getDate()}</span>:d.getDate()}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:2}}>
                      {dayEv.slice(0,mobile?1:2).map(ev=>(
                        <div key={ev.id} style={{
                          padding:mobile?"2px 4px":"3px 6px",borderRadius:4,
                          background:ev.color+"18",borderLeft:`3px solid ${ev.color}`,
                          fontSize:mobile?9:11,fontWeight:600,color:"#1B2A4A",
                          lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"
                        }}>
                          {ev.title}
                        </div>
                      ))}
                      {dayEv.length>(mobile?1:2)&&(
                        <span style={{fontSize:9,color:"#999",fontWeight:600}}>+{dayEv.length-(mobile?1:2)} más</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Events list for month */}
          <div style={{marginTop:16,padding:mobile?14:20,background:"#FAFAF8",borderRadius:12,border:"1.5px solid #ECEAE4"}}>
            <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700,color:"#1B2A4A"}}>
              Eventos en {MONTHS[expandedMonth]} ({expEvents.length})
            </h4>
            {expEvents.length===0&&<p style={{fontSize:13,color:"#aaa",textAlign:"center",padding:"16px 0"}}>No hay eventos este mes</p>}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {expEvents.map(ev=>{
                const day=parseInt(ev.date.split("-")[2]);
                const weekday=new Date(ev.date+"T12:00:00").getDay();
                const dayName=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"][weekday];
                return(
                  <div key={ev.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:10,background:"#fff",border:"1px solid #ECEAE4"}}>
                    <div style={{width:44,height:44,borderRadius:10,background:ev.color+"14",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0,border:`1.5px solid ${ev.color}30`}}>
                      <span style={{fontSize:10,fontWeight:700,color:ev.color,textTransform:"uppercase",lineHeight:1}}>{dayName}</span>
                      <span style={{fontSize:18,fontWeight:800,color:ev.color,lineHeight:1.1}}>{day}</span>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#1B2A4A"}}>{ev.title}</div>
                      <div style={{fontSize:12,color:"#999",marginTop:1}}>{dayName} {day} de {MONTHS[expandedMonth]}</div>
                    </div>
                    <div style={{width:10,height:10,borderRadius:"50%",background:ev.color,flexShrink:0}}/>
                    {!readOnly&&<button style={{...S.iconBtn,color:"#E07A5F"}} onClick={()=>onRemoveEvent?.(ev.id)}><IconTrash/></button>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── MINI MONTHS OVERVIEW ── */}
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":"repeat(auto-fill,minmax(230px,1fr))",gap:mobile?10:14,...(isExp?{opacity:0.5,pointerEvents:"none",maxHeight:0,overflow:"hidden",margin:0,gap:0}:{}),transition:"all .3s"}}>
        {MONTHS.map((mName,mi)=>{
          const cells=getMonthGrid(year,mi);
          const monthEvents=events.filter(e=>{const d=new Date(e.date+"T12:00:00");return d.getMonth()===mi&&d.getFullYear()===year;});
          const hasEvents=monthEvents.length>0;
          return(
            <div key={mi} onClick={()=>setExpandedMonth(mi)} style={{background:"#FAFAF8",borderRadius:12,padding:mobile?10:14,border:"1.5px solid #ECEAE4",cursor:"pointer",transition:"all .15s",position:"relative"}}>
              {hasEvents&&<div style={{position:"absolute",top:10,right:12,width:20,height:20,borderRadius:"50%",background:"#E8A838",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800}}>{monthEvents.length}</div>}
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:mobile?13:14,fontWeight:800,color:"#1B2A4A"}}>{mName}</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,marginBottom:4}}>
                {DAYS_SHORT.map((d,i)=><div key={i} style={{fontSize:9,fontWeight:700,textAlign:"center",color:"#BCBAB3"}}>{d}</div>)}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1}}>
                {cells.map(({date:d,out},ci)=>{
                  const ds=fmt(d);const dayEv=evByDate[ds]||[];const td=isToday(d);
                  return(
                    <div key={ci} style={{textAlign:"center",padding:"2px 0",minHeight:mobile?24:28,opacity:out?.2:1}}>
                      <span style={{fontSize:mobile?10:12,fontWeight:td?700:500,color:td?"#fff":"#555",...(td?{background:"#E8A838",borderRadius:"50%",width:mobile?18:22,height:mobile?18:22,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:mobile?9:11}:{})}}>{d.getDate()}</span>
                      {dayEv.length>0&&<div style={{display:"flex",gap:1,justifyContent:"center",marginTop:1}}>{dayEv.slice(0,3).map((ev,i)=><div key={i} style={{width:4,height:4,borderRadius:"50%",background:ev.color}}/>)}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   INFO BOARD
   ══════════════════════════════════════════════ */
function InfoBoard({info,readOnly,onRemove,mobile}){
  return(
    <div style={S.card}>
      <h2 style={{margin:"0 0 20px",fontSize:mobile?16:18,fontWeight:700}}>Información Relevante</h2>
      {info.length===0&&<p style={{textAlign:"center",color:"#aaa",padding:40}}>No hay información publicada.</p>}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {info.map(a=>{
          const p=PRIO[a.priority]||PRIO.media;
          return(
            <div key={a.id} style={{padding:mobile?14:18,borderRadius:12,background:"#FAFAF8",borderLeft:`4px solid ${p.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                    <span style={{fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20,background:p.bg,color:p.text,textTransform:"uppercase",letterSpacing:"0.04em"}}>{p.label}</span>
                    <span style={{fontSize:12,color:"#999"}}>{a.date}</span>
                  </div>
                  <h3 style={{margin:0,fontSize:mobile?14:15,fontWeight:700,color:"#1B2A4A"}}>{a.title}</h3>
                </div>
                {!readOnly&&<button style={S.iconBtn} onClick={()=>onRemove?.(a.id)}><IconTrash/></button>}
              </div>
              <p style={{margin:"8px 0 0",fontSize:13,lineHeight:1.7,color:"#555"}}>{a.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   COLACIONES BOARD (public + admin shared)
   ══════════════════════════════════════════════ */
function ColacionesBoard({colaciones,sorteo,mobile,readOnly,onEditItem,onRemoveItem,onAddItem}){
  const [editId,setEditId]=useState(null);
  const [editVal,setEditVal]=useState("");
  const startEdit=(c)=>{setEditId(c.id);setEditVal(c.item);};
  const saveEdit=()=>{if(onEditItem&&editId!=null)onEditItem(editId,editVal);setEditId(null);};

  const hasSorteo=sorteo&&sorteo.length>0;

  return(
    <div style={S.card}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
        <span style={{fontSize:28}}>🍎</span>
        <div>
          <h2 style={{margin:0,fontSize:mobile?16:18,fontWeight:700}}>Colaciones Compartidas</h2>
          <p style={{margin:0,fontSize:12,color:"#7A8194"}}>{hasSorteo?"Asignación del semestre — cada semana rota al siguiente número":"Esperando sorteo del semestre"}</p>
        </div>
      </div>

      {!hasSorteo&&readOnly&&(
        <div style={{textAlign:"center",padding:"40px 20px",color:"#999"}}>
          <span style={{fontSize:48,display:"block",marginBottom:12}}>🎰</span>
          <p style={{fontSize:15,fontWeight:600,color:"#7A8194"}}>El sorteo del semestre aún no se ha realizado</p>
          <p style={{fontSize:13}}>El equipo docente realizará la tómbola próximamente</p>
        </div>
      )}

      {(hasSorteo||!readOnly)&&(
        <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:mobile?6:8}}>
          {colaciones.map((c,idx)=>{
            const emoji=getEmoji(c.item);
            const kid=hasSorteo?(sorteo[idx%sorteo.length]||"—"):"";
            const isEditing=editId===c.id;
            const rowColors=["#FAFAF8","#FFFDF7"];
            return(
              <div key={c.id} style={{display:"flex",alignItems:isEditing?"flex-start":"center",gap:mobile?8:12,padding:mobile?"10px 12px":"14px 18px",borderRadius:12,background:rowColors[idx%2],border:"1px solid #ECEAE4"}}>
                {/* Number */}
                <div style={{width:mobile?26:32,height:mobile?26:32,borderRadius:"50%",background:"#5B8A72",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:mobile?12:13,fontWeight:800,flexShrink:0}}>
                  {c.id}
                </div>
                {/* Emoji */}
                <div style={{width:mobile?30:36,height:mobile?30:36,borderRadius:10,background:"#F0EDE6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:mobile?16:20,flexShrink:0}}>
                  {emoji}
                </div>
                {/* Content */}
                {isEditing?(
                  <div style={{flex:1,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                    <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveEdit()} style={{...S.fi,padding:"6px 10px",fontSize:13,flex:1,minWidth:120}}/>
                    <button onClick={saveEdit} style={{...S.primaryBtn,padding:"5px 14px",fontSize:12}}>OK</button>
                    <button onClick={()=>setEditId(null)} style={{...S.ghostBtn,padding:"5px 10px",fontSize:12}}>✕</button>
                  </div>
                ):(
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:mobile?13:14,fontWeight:600,color:"#1B2A4A",lineHeight:1.4}}>{c.item}</div>
                    {hasSorteo&&kid&&(
                      <div style={{fontSize:12,fontWeight:700,color:"#E07A5F",marginTop:2}}>👤 {kid}</div>
                    )}
                  </div>
                )}
                {/* Admin actions */}
                {!readOnly&&!isEditing&&(
                  <div style={{display:"flex",gap:2,flexShrink:0}}>
                    <button style={S.iconBtn} onClick={()=>startEdit(c)} title="Editar"><IconEdit/></button>
                    <button style={{...S.iconBtn,color:"#E07A5F"}} onClick={()=>onRemoveItem?.(c.id)} title="Eliminar"><IconTrash/></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {hasSorteo&&(
        <p style={{marginTop:14,fontSize:12,color:"#7A8194",fontStyle:"italic"}}>
          <span style={{color:"#5B8A72",fontWeight:700}}>●</span> Cada semana se avanza al siguiente número. Al llegar al 13 se vuelve al 1. Los nombres fueron asignados por sorteo al inicio del semestre.
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   TOMBOLA COMPONENT (admin only)
   ══════════════════════════════════════════════ */
function TombolaPanel({kids,setKids,sorteo,setSorteo,colaciones,mobile}){
  const [inputName,setInputName]=useState("");
  const [spinning,setSpinning]=useState(false);
  const [spinDisplay,setSpinDisplay]=useState([]);
  const [spinStep,setSpinStep]=useState(0);

  const validKids=kids.filter(k=>k.trim()!=="");
  const addKid=()=>{const n=inputName.trim();if(!n)return;setKids(k=>[...k,n]);setInputName("");};
  const removeKid=(idx)=>setKids(k=>k.filter((_,i)=>i!==idx));
  const updateKid=(idx,val)=>setKids(k=>k.map((v,i)=>i===idx?val:v));

  const runTombola=()=>{
    if(validKids.length<2)return;
    setSpinning(true);
    setSpinDisplay([]);
    setSpinStep(0);

    const shuffled=[...validKids];
    for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}

    let step=0;
    const interval=setInterval(()=>{
      if(step<shuffled.length){
        setSpinDisplay(prev=>[...prev,shuffled[step]]);
        setSpinStep(step+1);
        step++;
      } else {
        clearInterval(interval);
        setTimeout(()=>{
          setSorteo(shuffled);
          setSpinning(false);
        },600);
      }
    },400);
  };

  const hasSorteo=sorteo&&sorteo.length>0;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* KIDS INPUT */}
      <div style={S.adminCard}>
        <h3 style={{margin:"0 0 4px",fontSize:16,fontWeight:700}}>👧🧒 Niños del curso</h3>
        <p style={{margin:"0 0 14px",fontSize:13,color:"#7A8194"}}>Agrega los nombres de los 12–15 niños. Luego sortea para asignar colaciones.</p>
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          <input style={{...S.fi,flex:1,minWidth:160}} placeholder="Nombre del niño/a" value={inputName} onChange={e=>setInputName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addKid()}/>
          <button style={S.primaryBtn} onClick={addKid}><IconPlus/> Agregar</button>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {kids.map((k,i)=>(
            k.trim()!==""&&(
              <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:20,background:"#EDF6F0",border:"1px solid #C8E0D4"}}>
                {/* Editable name */}
                <input value={k} onChange={e=>updateKid(i,e.target.value)} style={{border:"none",background:"transparent",fontSize:13,fontWeight:600,color:"#1B2A4A",width:Math.max(40,k.length*9),outline:"none"}}/>
                <button onClick={()=>removeKid(i)} style={{background:"none",border:"none",color:"#E07A5F",cursor:"pointer",fontSize:16,padding:0,lineHeight:1}}>×</button>
              </div>
            )
          ))}
        </div>
        <div style={{marginTop:12,fontSize:13,color:"#5B8A72",fontWeight:600}}>{validKids.length} niño{validKids.length!==1?"s":""} registrado{validKids.length!==1?"s":""}</div>
      </div>

      {/* TOMBOLA */}
      <div style={{...S.adminCard,textAlign:"center",background:spinning?"#FFFDF7":"#fff",border:spinning?"2px solid #E8A838":"none",transition:"all .3s"}}>
        <div style={{fontSize:48,marginBottom:8}}>{spinning?"🎰":"🎲"}</div>
        <h3 style={{margin:"0 0 4px",fontSize:18,fontWeight:800}}>Tómbola del Semestre</h3>
        <p style={{margin:"0 0 16px",fontSize:13,color:"#7A8194"}}>
          {hasSorteo&&!spinning?"✅ Sorteo realizado — los nombres están asignados":"Sortea el orden de los niños para asignarlos a las colaciones"}
        </p>

        {spinning&&(
          <div style={{margin:"20px auto",maxWidth:400}}>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {spinDisplay.map((name,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",borderRadius:10,background:"#EDF6F0",animation:"fadeIn 0.3s ease"}}>
                  <div style={{width:26,height:26,borderRadius:"50%",background:"#5B8A72",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800}}>{i+1}</div>
                  <span style={{fontSize:14,fontWeight:700,color:"#1B2A4A"}}>{name}</span>
                  <span style={{marginLeft:"auto",fontSize:13,color:"#7A8194"}}>{colaciones[i%colaciones.length]?.item?.split(" ").slice(0,3).join(" ")}</span>
                </div>
              ))}
            </div>
            {spinStep<validKids.length&&(
              <div style={{marginTop:10,fontSize:24,animation:"pulse 0.4s infinite alternate"}}>🎰</div>
            )}
          </div>
        )}

        {hasSorteo&&!spinning&&(
          <div style={{margin:"16px auto",maxWidth:500,textAlign:"left"}}>
            <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:6}}>
              {sorteo.map((name,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,background:i%2===0?"#FAFAF8":"#FFFDF7",border:"1px solid #ECEAE4"}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:"#5B8A72",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800}}>{i+1}</div>
                  <span style={{fontSize:13,fontWeight:700,color:"#1B2A4A",flex:1}}>{name}</span>
                  <span style={{fontSize:18}}>{getEmoji(colaciones[i%colaciones.length]?.item||"")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={runTombola} disabled={validKids.length<2||spinning}
          style={{...S.primaryBtn,margin:"0 auto",padding:"12px 32px",fontSize:15,borderRadius:14,background:validKids.length<2?"#ccc":(spinning?"#E8A838":"#1B2A4A"),cursor:validKids.length<2?"not-allowed":"pointer",transition:"all .2s"}}>
          {spinning?"Sorteando...":hasSorteo?"🔄 Volver a sortear":"🎲 Sortear"}
        </button>
        {validKids.length<2&&<p style={{marginTop:8,fontSize:12,color:"#E07A5F"}}>Agrega al menos 2 niños para sortear</p>}
        {hasSorteo&&!spinning&&<p style={{marginTop:8,fontSize:12,color:"#7A8194"}}>El sorteo queda fijo para todo el semestre. Puedes volver a sortear si es necesario.</p>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   CHAT VIEW
   ══════════════════════════════════════════════ */
function ChatView({messages,setMessages,mobile,isAdmin}){
  const [text,setText]=useState("");
  const [senderName,setSenderName]=useState("");
  const [showNameInput,setShowNameInput]=useState(!isAdmin);
  const chatEndRef=useCallback(node=>{if(node)node.scrollIntoView({behavior:"smooth"});},[messages]);

  const sendMessage=()=>{
    const t=text.trim();
    if(!t)return;
    const name=isAdmin?"Profe":(senderName.trim()||"Apoderado/a");
    const now=new Date();
    const timeStr=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    setMessages(msgs=>[...msgs,{id:Date.now(),from:isAdmin?"admin":"parent",name,text:t,time:timeStr}]);
    setText("");
    if(!isAdmin&&senderName.trim())setShowNameInput(false);
  };

  const deleteMsg=(id)=>setMessages(msgs=>msgs.filter(m=>m.id!==id));

  // Group messages by date
  const grouped=useMemo(()=>{
    const g={};
    messages.forEach(m=>{
      const day=m.time.split(" ")[0];
      if(!g[day])g[day]=[];
      g[day].push(m);
    });
    return g;
  },[messages]);

  const formatDate=(dateStr)=>{
    const d=new Date(dateStr+"T12:00:00");
    const today=new Date();
    if(d.toDateString()===today.toDateString())return "Hoy";
    const yesterday=new Date(today);yesterday.setDate(today.getDate()-1);
    if(d.toDateString()===yesterday.toDateString())return "Ayer";
    return `${d.getDate()} de ${MONTHS[d.getMonth()]}`;
  };

  return(
    <div style={{...S.card,padding:0,display:"flex",flexDirection:"column",height:mobile?"calc(100vh - 160px)":"600px",overflow:"hidden"}}>
      {/* Chat header */}
      <div style={{padding:mobile?"12px 16px":"16px 24px",background:"#1B2A4A",borderRadius:"14px 14px 0 0",display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:40,height:40,borderRadius:"50%",background:"#5B8A72",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🌱</div>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:"#fff"}}>{isAdmin?"Mensajes de apoderados":"Chat con la Profe"}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>{isAdmin?"Responde consultas aquí":"Consultas, avisos y coordinación"}</div>
        </div>
        <div style={{marginLeft:"auto",fontSize:12,color:"rgba(255,255,255,0.4)"}}>{messages.length} mensajes</div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:mobile?"12px":"16px 24px",display:"flex",flexDirection:"column",gap:4,background:"#F7F5F0"}}>
        {Object.entries(grouped).map(([day,msgs])=>(
          <div key={day}>
            <div style={{textAlign:"center",margin:"12px 0 8px"}}>
              <span style={{fontSize:11,fontWeight:700,color:"#999",background:"#ECEAE4",padding:"3px 12px",borderRadius:10}}>{formatDate(day)}</span>
            </div>
            {msgs.map(m=>{
              const isMine=isAdmin?(m.from==="admin"):(m.from==="parent");
              return(
                <div key={m.id} style={{display:"flex",justifyContent:isMine?"flex-end":"flex-start",marginBottom:6,position:"relative",group:"msg"}}>
                  <div style={{maxWidth:mobile?"85%":"70%",position:"relative"}}>
                    {/* Name */}
                    {!isMine&&(
                      <div style={{fontSize:11,fontWeight:700,color:m.from==="admin"?"#5B8A72":"#8B7FC7",marginBottom:2,marginLeft:4}}>
                        {m.from==="admin"?"🌱 ":""}{m.name}
                      </div>
                    )}
                    <div style={{
                      padding:mobile?"10px 14px":"12px 16px",
                      borderRadius:isMine?"16px 16px 4px 16px":"16px 16px 16px 4px",
                      background:isMine?(m.from==="admin"?"#5B8A72":"#8B7FC7"):"#fff",
                      color:isMine?"#fff":"#1B2A4A",
                      fontSize:14,lineHeight:1.5,
                      boxShadow:isMine?"none":"0 1px 3px rgba(0,0,0,0.06)",
                      border:isMine?"none":"1px solid #ECEAE4",
                    }}>
                      {m.text}
                    </div>
                    <div style={{display:"flex",justifyContent:isMine?"flex-end":"flex-start",alignItems:"center",gap:6,marginTop:3,padding:"0 4px"}}>
                      <span style={{fontSize:10,color:"#BCBAB3"}}>{m.time.split(" ")[1]}</span>
                      {isAdmin&&<button onClick={()=>deleteMsg(m.id)} style={{background:"none",border:"none",fontSize:10,color:"#ddd",cursor:"pointer",padding:0}}>eliminar</button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={chatEndRef}/>
      </div>

      {/* Input area */}
      <div style={{padding:mobile?"10px 12px":"12px 24px",background:"#fff",borderTop:"1.5px solid #ECEAE4",borderRadius:"0 0 14px 14px"}}>
        {/* Name input for parents on first message */}
        {!isAdmin&&showNameInput&&!senderName&&(
          <div style={{marginBottom:8}}>
            <input
              placeholder="Tu nombre (ej: Mamá de Sol)"
              value={senderName}
              onChange={e=>setSenderName(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&senderName.trim()&&setShowNameInput(false)}
              style={{...S.fi,padding:"8px 14px",fontSize:13,width:"100%"}}
            />
          </div>
        )}
        {!isAdmin&&senderName&&(
          <div style={{marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:12,color:"#8B7FC7",fontWeight:600}}>Enviando como: {senderName}</span>
            <button onClick={()=>{setShowNameInput(true);setSenderName("");}} style={{background:"none",border:"none",fontSize:11,color:"#ccc",cursor:"pointer",textDecoration:"underline"}}>cambiar</button>
          </div>
        )}
        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          <textarea
            value={text}
            onChange={e=>setText(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}}
            placeholder={isAdmin?"Responder como Profe...":"Escribe tu mensaje..."}
            rows={1}
            style={{
              flex:1,padding:"10px 14px",borderRadius:12,border:"1.5px solid #E2E1DC",
              fontSize:14,outline:"none",background:"#FAFAF8",color:"#1B2A4A",
              resize:"none",fontFamily:"inherit",lineHeight:1.4,
              minHeight:42,maxHeight:120,
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim()}
            style={{
              width:42,height:42,borderRadius:12,border:"none",
              background:text.trim()?"#5B8A72":"#E2E1DC",
              color:"#fff",cursor:text.trim()?"pointer":"default",
              display:"flex",alignItems:"center",justifyContent:"center",
              flexShrink:0,transition:"background .15s",
            }}
          >
            <IconSend/>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   ADMIN PANEL
   ══════════════════════════════════════════════ */
function AdminPanel({schedule,setSchedule,events,setEvents,info,setInfo,colaciones,setColaciones,kids,setKids,sorteo,setSorteo,messages,setMessages,onLogout}){
  const [section,setSection]=useState("horario");
  const [calYear,setCalYear]=useState(2026);
  const [expandedMonth,setExpandedMonth]=useState(null);
  const [menuOpen,setMenuOpen]=useState(false);
  const mobile=useIsMobile();
  const evByDate=useMemo(()=>{const m={};events.forEach(e=>{if(!m[e.date])m[e.date]=[];m[e.date].push(e);});return m;},[events]);

  const [showEvForm,setShowEvForm]=useState(false);
  const [newEv,setNewEv]=useState({title:"",date:"",color:"#5B8A72"});
  const [showInfoForm,setShowInfoForm]=useState(false);
  const [newInfo,setNewInfo]=useState({title:"",body:"",priority:"media"});
  const [editingCell,setEditingCell]=useState(null);
  const [editVal,setEditVal]=useState("");

  const [showColForm,setShowColForm]=useState(false);
  const [newColItem,setNewColItem]=useState("");

  const addEvent=()=>{if(!newEv.title||!newEv.date)return;setEvents(ev=>[...ev,{...newEv,id:Date.now()}]);setNewEv({title:"",date:"",color:"#5B8A72"});setShowEvForm(false);};
  const removeEvent=(id)=>setEvents(ev=>ev.filter(e=>e.id!==id));
  const addInfo=()=>{if(!newInfo.title||!newInfo.body)return;setInfo(inf=>[{...newInfo,id:Date.now(),date:fmt(new Date())},...inf]);setNewInfo({title:"",body:"",priority:"media"});setShowInfoForm(false);};
  const removeInfo=(id)=>setInfo(inf=>inf.filter(i=>i.id!==id));
  const addColacion=()=>{if(!newColItem.trim())return;const maxId=colaciones.reduce((m,c)=>Math.max(m,c.id),0);setColaciones(col=>[...col,{id:maxId+1,item:newColItem.trim()}]);setNewColItem("");setShowColForm(false);};
  const removeColacion=(id)=>setColaciones(col=>{const filtered=col.filter(c=>c.id!==id);return filtered.map((c,i)=>({...c,id:i+1}));});
  const editColacionItem=(id,item)=>setColaciones(col=>col.map(c=>c.id===id?{...c,item}:c));
  const saveCell=useCallback((rowId,day)=>{
    setSchedule(sch=>sch.map(r=>{if(r.id!==rowId)return r;if(r.type==="common")return{...r,label:editVal};return{...r,days:{...r.days,[day]:editVal}};}));
    setEditingCell(null);
  },[editVal,setSchedule]);

  const unreadCount=messages.filter(m=>m.from==="parent").length;
  const sideItems=[
    {key:"horario",label:"Horario",icon:<IconClock/>},
    {key:"colaciones",label:"Colaciones",icon:<IconApple/>},
    {key:"eventos",label:"Eventos",icon:<IconCal/>},
    {key:"info",label:"Información",icon:<IconBell/>},
    {key:"chat",label:"Chat",icon:<IconChat/>,badge:unreadCount},
  ];

  const navContent=(
    <>
      {sideItems.map(s=>(
        <button key={s.key} onClick={()=>{setSection(s.key);setMenuOpen(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,border:"none",background:section===s.key?"rgba(255,255,255,0.1)":"transparent",color:section===s.key?"#fff":"rgba(255,255,255,0.55)",fontSize:14,fontWeight:600,cursor:"pointer",textAlign:"left",width:"100%"}}>{s.icon}<span>{s.label}</span></button>
      ))}
    </>
  );

  return(
    <div style={{display:"flex",flexDirection:mobile?"column":"row",minHeight:"100vh",fontFamily:"'Inter',system-ui,sans-serif",background:"#F0EDE6"}}>
      {/* SIDEBAR / MOBILE TOP BAR */}
      {mobile?(
        <>
          <div style={{background:"#1B2A4A",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontSize:15,fontWeight:800,color:"#fff"}}>Admin</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.45)"}}>La Siembra</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={onLogout} style={{background:"none",border:"none",color:"rgba(255,255,255,0.6)",cursor:"pointer",padding:4}}><IconEye/></button>
              <button onClick={()=>setMenuOpen(!menuOpen)} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",padding:4}}>{menuOpen?<IconX/>:<IconMenu/>}</button>
            </div>
          </div>
          {menuOpen&&(
            <div style={{background:"#1B2A4A",padding:"4px 12px 12px",display:"flex",flexDirection:"column",gap:4}}>
              {navContent}
              <button onClick={onLogout} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,border:"none",background:"transparent",color:"#E07A5F",fontSize:13,fontWeight:600,cursor:"pointer",width:"100%",textAlign:"left",marginTop:8}}><IconLogout/><span>Cerrar sesión</span></button>
            </div>
          )}
        </>
      ):(
        <aside style={{width:240,background:"#1B2A4A",display:"flex",flexDirection:"column",minHeight:"100vh",position:"sticky",top:0,alignSelf:"flex-start"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"20px 18px 16px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
            <div style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center"}}><Leaf style={{opacity:.4,width:18,height:26}}/></div>
            <div><div style={{fontSize:14,fontWeight:800,color:"#fff"}}>Admin Panel</div><div style={{fontSize:10,color:"rgba(255,255,255,0.45)"}}>La Siembra Escuela</div></div>
          </div>
          <nav style={{flex:1,padding:"12px 10px",display:"flex",flexDirection:"column",gap:4}}>{navContent}</nav>
          <div style={{padding:"12px 10px 20px",borderTop:"1px solid rgba(255,255,255,0.08)",display:"flex",flexDirection:"column",gap:4}}>
            <button onClick={onLogout} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,border:"none",background:"transparent",color:"rgba(255,255,255,0.55)",fontSize:13,fontWeight:600,cursor:"pointer",width:"100%",textAlign:"left"}}><IconEye/><span>Ver sitio</span></button>
            <button onClick={onLogout} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,border:"none",background:"transparent",color:"#E07A5F",fontSize:13,fontWeight:600,cursor:"pointer",width:"100%",textAlign:"left"}}><IconLogout/><span>Cerrar sesión</span></button>
          </div>
        </aside>
      )}

      {/* CONTENT */}
      <div style={{flex:1,padding:mobile?"16px 12px 60px":"24px 32px 60px",maxWidth:mobile?"100%":960}}>
        <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:8}}>
          <h1 style={{margin:0,fontSize:mobile?18:22,fontWeight:800,color:"#1B2A4A"}}>{sideItems.find(s=>s.key===section)?.label}</h1>
        </header>

        {/* ADMIN HORARIO */}
        {section==="horario"&&(
          <div>
            <p style={{margin:"0 0 14px",fontSize:13,color:"#7A8194"}}>{mobile?"Selecciona un día y toca cualquier actividad para editarla.":"Haz clic en cualquier celda para editarla."}</p>
            <ScheduleView schedule={schedule} mobile={mobile} isAdmin editingCell={editingCell} setEditingCell={setEditingCell} editVal={editVal} setEditVal={setEditVal} saveCell={saveCell}/>
          </div>
        )}

        {/* ADMIN COLACIONES */}
        {section==="colaciones"&&(
          <>
            {/* Tombola panel */}
            <TombolaPanel kids={kids} setKids={setKids} sorteo={sorteo} setSorteo={setSorteo} colaciones={colaciones} mobile={mobile}/>

            {/* Manage colaciones list */}
            <div style={{...S.adminCard,marginTop:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
                <h3 style={{margin:0,fontSize:16,fontWeight:700}}>🍽️ Lista de colaciones</h3>
                {!showColForm&&<button style={S.primaryBtn} onClick={()=>setShowColForm(true)}><IconPlus/><span>Agregar</span></button>}
              </div>
              {showColForm&&(
                <div style={{padding:mobile?14:20,background:"#FAFAF8",borderRadius:12,border:"1.5px solid #E8E5DD",marginBottom:16}}>
                  <div style={S.fg}>
                    <label style={S.fl}>Nueva colación</label>
                    <input style={S.fi} placeholder="Ej: Manzana" value={newColItem} onChange={e=>setNewColItem(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addColacion()}/>
                  </div>
                  <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:14}}>
                    <button style={S.ghostBtn} onClick={()=>setShowColForm(false)}>Cancelar</button>
                    <button style={S.primaryBtn} onClick={addColacion}>Agregar</button>
                  </div>
                </div>
              )}
            </div>

            {/* Colaciones board with edit/delete */}
            <div style={{marginTop:16}}>
              <ColacionesBoard colaciones={colaciones} sorteo={sorteo} mobile={mobile} onEditItem={editColacionItem} onRemoveItem={removeColacion}/>
            </div>
          </>
        )}

        {/* ADMIN EVENTOS */}
        {section==="eventos"&&(
          <>
            <div style={S.adminCard}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
                <h3 style={{margin:0,fontSize:16,fontWeight:700}}>Agregar evento</h3>
                {!showEvForm&&<button style={S.primaryBtn} onClick={()=>setShowEvForm(true)}><IconPlus/><span>Nuevo</span></button>}
              </div>
              {showEvForm&&(
                <div style={{padding:mobile?14:20,background:"#FAFAF8",borderRadius:12,border:"1.5px solid #E8E5DD"}}>
                  <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr 1fr",gap:12}}>
                    <div style={S.fg}><label style={S.fl}>Título</label><input style={S.fi} placeholder="Ej: Feria de ciencias" value={newEv.title} onChange={e=>setNewEv({...newEv,title:e.target.value})}/></div>
                    <div style={S.fg}><label style={S.fl}>Fecha</label><input style={S.fi} type="date" value={newEv.date} onChange={e=>setNewEv({...newEv,date:e.target.value})}/></div>
                    <div style={S.fg}><label style={S.fl}>Color</label><div style={{display:"flex",gap:6,paddingTop:6}}>{PALETTES.map(c=><button key={c} onClick={()=>setNewEv({...newEv,color:c})} style={{width:28,height:28,borderRadius:"50%",background:c,border:"none",cursor:"pointer",outline:newEv.color===c?`2.5px solid ${c}`:"2.5px solid transparent",outlineOffset:2}}/>)}</div></div>
                  </div>
                  <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:14}}>
                    <button style={S.ghostBtn} onClick={()=>setShowEvForm(false)}>Cancelar</button>
                    <button style={S.primaryBtn} onClick={addEvent}>Guardar</button>
                  </div>
                </div>
              )}
            </div>
            <div style={{marginTop:16}}>
              <YearCalendar year={calYear} setYear={setCalYear} events={events} evByDate={evByDate} expandedMonth={expandedMonth} setExpandedMonth={setExpandedMonth} onRemoveEvent={removeEvent} mobile={mobile}/>
            </div>
            <div style={{...S.adminCard,marginTop:16}}>
              <h3 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>Todos los eventos ({events.length})</h3>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {events.sort((a,b)=>a.date.localeCompare(b.date)).map(ev=>(
                  <div key={ev.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:"#FAFAF8",border:"1px solid #F0EDE6"}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:ev.color,flexShrink:0}}/>
                    <span style={{fontSize:12,fontWeight:600,color:"#888",minWidth:70}}>{ev.date.split("-").reverse().join("/")}</span>
                    <span style={{fontSize:13,fontWeight:600,color:"#1B2A4A",flex:1}}>{ev.title}</span>
                    <button style={{...S.iconBtn,color:"#E07A5F"}} onClick={()=>removeEvent(ev.id)}><IconTrash/></button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ADMIN INFO */}
        {section==="info"&&(
          <>
            <div style={S.adminCard}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
                <h3 style={{margin:0,fontSize:16,fontWeight:700}}>Nueva información</h3>
                {!showInfoForm&&<button style={S.primaryBtn} onClick={()=>setShowInfoForm(true)}><IconPlus/><span>Agregar</span></button>}
              </div>
              {showInfoForm&&(
                <div style={{padding:mobile?14:20,background:"#FAFAF8",borderRadius:12,border:"1.5px solid #E8E5DD"}}>
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    <div style={S.fg}><label style={S.fl}>Título</label><input style={S.fi} placeholder="Ej: Cambio de horario" value={newInfo.title} onChange={e=>setNewInfo({...newInfo,title:e.target.value})}/></div>
                    <div style={S.fg}><label style={S.fl}>Detalle</label><textarea style={{...S.fi,minHeight:80,resize:"vertical",fontFamily:"inherit"}} placeholder="Descripción..." value={newInfo.body} onChange={e=>setNewInfo({...newInfo,body:e.target.value})}/></div>
                    <div style={S.fg}>
                      <label style={S.fl}>Prioridad</label>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {Object.entries(PRIO).map(([k,v])=>(
                          <button key={k} onClick={()=>setNewInfo({...newInfo,priority:k})}
                            style={{padding:"7px 16px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",background:newInfo.priority===k?v.bg:"#fff",border:`1.5px solid ${newInfo.priority===k?v.border:"#ddd"}`,color:newInfo.priority===k?v.text:"#999"}}>{v.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:14}}>
                    <button style={S.ghostBtn} onClick={()=>setShowInfoForm(false)}>Cancelar</button>
                    <button style={S.primaryBtn} onClick={addInfo}>Publicar</button>
                  </div>
                </div>
              )}
            </div>
            <div style={{marginTop:16}}>
              <InfoBoard info={info} onRemove={removeInfo} mobile={mobile}/>
            </div>
          </>
        )}

        {/* ADMIN CHAT */}
        {section==="chat"&&(
          <ChatView messages={messages} setMessages={setMessages} mobile={mobile} isAdmin/>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   STYLES
   ══════════════════════════════════════════════ */
const S={
  card:{background:"#fff",borderRadius:14,padding:"20px",boxShadow:"0 2px 8px rgba(27,42,74,0.06)"},
  th:{padding:"12px 10px",textAlign:"center",borderBottom:"2px solid #E8E5DD",fontSize:12},
  td:{padding:"14px 10px",borderBottom:"1px solid #F0EDE6",verticalAlign:"middle",lineHeight:1.4},
  timeCell:{fontWeight:800,fontSize:13,color:"#E8A838",textAlign:"center",whiteSpace:"nowrap",background:"#FFFDF7",minWidth:110},
  cellInput:{width:"90%",padding:"6px 10px",border:"1.5px solid #4EADD5",borderRadius:6,fontSize:13,textAlign:"center",outline:"none",background:"#F0F8FF"},
  yearBtn:{width:36,height:36,borderRadius:10,border:"1.5px solid #E2E1DC",background:"#fff",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#1B2A4A",fontWeight:700},
  iconBtn:{width:30,height:30,borderRadius:8,border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#ccc",flexShrink:0},
  adminCard:{background:"#fff",borderRadius:14,padding:"20px",boxShadow:"0 2px 8px rgba(27,42,74,0.06)"},
  primaryBtn:{display:"flex",alignItems:"center",gap:6,padding:"9px 18px",border:"none",borderRadius:10,background:"#1B2A4A",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"},
  ghostBtn:{padding:"9px 18px",border:"1.5px solid #E2E1DC",borderRadius:10,background:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",color:"#7A8194"},
  fg:{display:"flex",flexDirection:"column",gap:4},
  fl:{fontSize:11,fontWeight:700,color:"#7A8194",textTransform:"uppercase",letterSpacing:"0.05em"},
  fi:{padding:"9px 14px",borderRadius:8,border:"1.5px solid #E2E1DC",fontSize:14,outline:"none",background:"#fff",color:"#1B2A4A",width:"100%",boxSizing:"border-box"},
};
