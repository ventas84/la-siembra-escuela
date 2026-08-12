import { useState, useMemo, useCallback } from "react";

/* ══════════════════════════════════════════════
   DATA & CONSTANTS
   ══════════════════════════════════════════════ */
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_SHORT = ["L","M","M","J","V","S","D"];
const DAYS = ["Lunes","Martes","Miércoles","Jueves","Viernes"];
const DAY_COLORS = { Lunes:"#E07A5F", Martes:"#4EADD5", Miércoles:"#5B8A72", Jueves:"#8B7FC7", Viernes:"#E8A838" };
const PALETTES = ["#E07A5F","#4EADD5","#5B8A72","#8B7FC7","#E8A838","#D4845E"];
const PRIO = {
  alta:  { label:"Alta",   bg:"#FDECEA", border:"#E07A5F", text:"#C0523A" },
  media: { label:"Media",  bg:"#FFF7E6", border:"#E8A838", text:"#C08C20" },
  baja:  { label:"Normal", bg:"#EDF6F0", border:"#5B8A72", text:"#48755D" },
};

const DEFAULT_SCHEDULE = [
  { id:"s1", time:"09:00 – 10:30", type:"common", label:"Juegos de mesa, libros, dibujo", stripe:false },
  { id:"s2", time:"10:30 – 11:00", type:"common", label:"Círculo de saludo y dinámica", stripe:true },
  { id:"s3", time:"11:00 – 11:30", type:"common", label:"Colación compartida", stripe:false },
  { id:"s4", time:"11:30 – 12:30", type:"talleres", stripe:true,
    days:{ Lunes:"Taller de Aeroyoga con Nadia", Martes:"Taller de Yoga Infantil con Matías", Miércoles:"Taller de Bici con Gou", Jueves:"Taller de Cuentacuentos Bilingüe con Micaela", Viernes:"Trae y Muestra" }},
  { id:"s5", time:"12:30 – 13:00", type:"common", label:"Juego libre, patio, cocinería", stripe:false },
  { id:"s6", time:"13:00 – 15:00", type:"perday", stripe:true,
    days:{ Lunes:"Almuerzos", Martes:"Almuerzos", Miércoles:"Almuerzos", Jueves:"Almuerzos", Viernes:"Salida a las 13 hrs" }},
];

const DEFAULT_EVENTS = [
  { id:1, title:"Reunión de apoderados", date:"2026-07-30", color:"#8B7FC7" },
  { id:2, title:"Inicio segundo semestre", date:"2026-08-03", color:"#5B8A72" },
  { id:3, title:"Día de la familia", date:"2026-08-15", color:"#E07A5F" },
  { id:4, title:"Paseo al parque", date:"2026-08-20", color:"#5B8A72" },
  { id:5, title:"Día sin uniforme", date:"2026-09-05", color:"#E8A838" },
  { id:6, title:"Feria de ciencias", date:"2026-09-12", color:"#4EADD5" },
  { id:7, title:"Aniversario escuela", date:"2026-10-08", color:"#8B7FC7" },
  { id:8, title:"Muestra de talleres", date:"2026-10-24", color:"#E8A838" },
  { id:9, title:"Fiesta de fin de año", date:"2026-12-18", color:"#E07A5F" },
  { id:10, title:"Último día de clases", date:"2026-12-22", color:"#5B8A72" },
];

const DEFAULT_INFO = [
  { id:1, title:"Inicio segundo semestre", body:"Las clases del segundo semestre comienzan el lunes 3 de agosto. Se solicita puntualidad.", date:"2026-07-28", priority:"alta" },
  { id:2, title:"Cambio de uniforme", body:"Durante julio y agosto el uso de uniforme de invierno es obligatorio.", date:"2026-07-25", priority:"media" },
  { id:3, title:"Inscripción talleres", body:"Las inscripciones para talleres extraprogramáticos están abiertas hasta el 8 de agosto.", date:"2026-07-22", priority:"baja" },
];

/* ══════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════ */
function fmt(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function isToday(d){ const t=new Date(); return d.getDate()===t.getDate()&&d.getMonth()===t.getMonth()&&d.getFullYear()===t.getFullYear(); }
function getMonthGrid(year, month){
  const first=new Date(year,month,1), last=new Date(year,month+1,0);
  const start=first.getDay()===0?6:first.getDay()-1;
  const cells=[];
  for(let i=start-1;i>=0;i--) cells.push({date:new Date(year,month,-i),out:true});
  for(let i=1;i<=last.getDate();i++) cells.push({date:new Date(year,month,i),out:false});
  const rem=7-cells.length%7; if(rem<7) for(let i=1;i<=rem;i++) cells.push({date:new Date(year,month+1,i),out:true});
  return cells;
}

/* ══════════════════════════════════════════════
   ICONS
   ══════════════════════════════════════════════ */
const IconLock = ()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;
const IconGrid = ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
const IconCal = ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
const IconBell = ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>;
const IconClock = ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
const IconLogout = ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>;
const IconEdit = ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash = ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>;
const IconPlus = ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>;
const IconBack = ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>;
const IconEye = ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const Leaf = ({style})=><svg viewBox="0 0 40 60" fill="none" style={{width:28,height:42,opacity:.12,...style}}><path d="M20 0C20 0 0 20 0 40c0 11 9 20 20 20s20-9 20-20C40 20 20 0 20 0z" fill="#5B8A72"/><path d="M20 12v40M20 24c-6 4-10 10-12 16M20 30c6 4 10 10 12 14" stroke="#3D6B54" strokeWidth="1.2"/></svg>;

/* ══════════════════════════════════════════════
   MAIN APP
   ══════════════════════════════════════════════ */
export default function App(){
  const [mode, setMode] = useState("public"); // public | login | admin
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);

  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [info, setInfo] = useState(DEFAULT_INFO);

  const handleLogin = () => {
    if(pw === "siembra2026"){
      setMode("admin"); setPw(""); setPwError(false);
    } else { setPwError(true); }
  };

  if(mode === "login") return <LoginScreen pw={pw} setPw={setPw} error={pwError} onLogin={handleLogin} onBack={()=>{setMode("public");setPwError(false);setPw("");}}/>;
  if(mode === "admin") return <AdminPanel schedule={schedule} setSchedule={setSchedule} events={events} setEvents={setEvents} info={info} setInfo={setInfo} onLogout={()=>setMode("public")} onPreview={()=>setMode("public")}/>;
  return <PublicView schedule={schedule} events={events} info={info} onAdmin={()=>setMode("login")}/>;
}

/* ══════════════════════════════════════════════
   LOGIN SCREEN
   ══════════════════════════════════════════════ */
function LoginScreen({pw,setPw,error,onLogin,onBack}){
  return(
    <div style={{minHeight:"100vh",background:"#F0EDE6",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{width:380,background:"#fff",borderRadius:20,padding:40,boxShadow:"0 8px 30px rgba(27,42,74,0.10)",textAlign:"center",position:"relative"}}>
        <Leaf style={{position:"absolute",top:-10,right:20,transform:"rotate(15deg)",opacity:.08}}/>
        <div style={{width:56,height:56,borderRadius:16,background:"#EDF6F0",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",color:"#5B8A72"}}><IconLock/></div>
        <h2 style={{margin:"0 0 4px",fontSize:22,fontWeight:800,color:"#1B2A4A"}}>Panel Administrador</h2>
        <p style={{margin:"0 0 24px",fontSize:14,color:"#7A8194"}}>Ingresa la contraseña para acceder</p>
        <input
          type="password"
          placeholder="Contraseña"
          value={pw}
          onChange={e=>{setPw(e.target.value);}}
          onKeyDown={e=>e.key==="Enter"&&onLogin()}
          style={{width:"100%",padding:"12px 16px",borderRadius:10,border:`1.5px solid ${error?"#E07A5F":"#E2E1DC"}`,fontSize:15,outline:"none",boxSizing:"border-box",background:error?"#FFF5F3":"#FAFAF8"}}
        />
        {error && <p style={{color:"#E07A5F",fontSize:13,margin:"8px 0 0",fontWeight:600}}>Contraseña incorrecta</p>}
        <button onClick={onLogin} style={{width:"100%",marginTop:16,padding:"12px",border:"none",borderRadius:10,background:"#1B2A4A",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer"}}>
          Ingresar
        </button>
        <button onClick={onBack} style={{marginTop:12,background:"none",border:"none",color:"#7A8194",fontSize:13,cursor:"pointer",fontWeight:600}}>
          ← Volver al sitio
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PUBLIC VIEW
   ══════════════════════════════════════════════ */
function PublicView({schedule,events,info,onAdmin}){
  const [tab,setTab]=useState("horario");
  const [calYear,setCalYear]=useState(2026);
  const [expandedMonth,setExpandedMonth]=useState(null);
  const evByDate=useMemo(()=>{const m={};events.forEach(e=>{if(!m[e.date])m[e.date]=[];m[e.date].push(e);});return m;},[events]);

  return(
    <div style={S.root}>
      <header style={S.header}>
        <Leaf style={{position:"absolute",left:16,top:8,transform:"rotate(-20deg)"}}/>
        <Leaf style={{position:"absolute",right:20,bottom:10,transform:"rotate(15deg) scaleX(-1)"}}/>
        <div style={S.headerInner}>
          <div>
            <div style={S.headerSub}>Horario semanal</div>
            <h1 style={S.headerTitle}>La Siembra Escuela</h1>
          </div>
          <button onClick={onAdmin} style={S.adminBtn} title="Administrador">
            <IconLock/> <span>Admin</span>
          </button>
        </div>
        <nav style={S.tabBar}>
          {[["horario","Horario",<IconClock/>],["calendario","Calendario Anual",<IconCal/>],["info","Información",<IconBell/>]].map(([k,l,ic])=>(
            <button key={k} onClick={()=>setTab(k)} style={{...S.tab,...(tab===k?S.tabActive:{})}}>{ic}<span>{l}</span></button>
          ))}
        </nav>
      </header>

      <main style={S.main}>
        {tab==="horario"&&<ScheduleTable schedule={schedule}/>}
        {tab==="calendario"&&<YearCalendar year={calYear} setYear={setCalYear} events={events} evByDate={evByDate} expandedMonth={expandedMonth} setExpandedMonth={setExpandedMonth} readOnly/>}
        {tab==="info"&&<InfoBoard info={info} readOnly/>}
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════════
   SCHEDULE TABLE (shared)
   ══════════════════════════════════════════════ */
function ScheduleTable({schedule}){
  return(
    <div style={S.card}>
      <div style={S.scheduleWrap}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={{...S.th,background:"#F7F5F0",minWidth:110}}></th>
              {DAYS.map(d=><th key={d} style={{...S.th,background:DAY_COLORS[d],color:"#fff",fontSize:12,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase"}}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {schedule.map((row)=>(
              <tr key={row.id}>
                <td style={{...S.td,...S.timeCell}}>{row.time}</td>
                {row.type==="common"?(
                  <td colSpan={5} style={{...S.td,background:row.stripe?"#FFFDF7":"#fff",textAlign:"center",fontWeight:600,fontSize:14,color:"#3A3A3A"}}>{row.label}</td>
                ):(
                  DAYS.map(d=>(
                    <td key={d} style={{...S.td,background:row.stripe?"#FFFDF7":"#fff",textAlign:"center"}}>
                      <span style={{fontWeight:700,fontSize:13,color:row.type==="talleres"?DAY_COLORS[d]:(d==="Viernes"&&row.days?.[d]?.includes("Salida")?"#E8A838":"#3A3A3A"),lineHeight:1.4}}>
                        {row.days?.[d]||"—"}
                      </span>
                    </td>
                  ))
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={S.scheduleNote}><span style={{color:"#5B8A72",fontWeight:700}}>●</span> Los talleres cambian cada semestre según disponibilidad de talleristas.</p>
    </div>
  );
}

/* ══════════════════════════════════════════════
   YEAR CALENDAR (shared)
   ══════════════════════════════════════════════ */
function YearCalendar({year,setYear,events,evByDate,expandedMonth,setExpandedMonth,readOnly,onRemoveEvent}){
  return(
    <div style={S.card}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <button style={S.yearBtn} onClick={()=>setYear(y=>y-1)}>‹</button>
        <h2 style={{margin:0,fontSize:22,fontWeight:800,minWidth:60,textAlign:"center"}}>{year}</h2>
        <button style={S.yearBtn} onClick={()=>setYear(y=>y+1)}>›</button>
      </div>
      <div style={S.yearGrid}>
        {MONTHS.map((mName,mi)=>{
          const cells=getMonthGrid(year,mi);
          const isExp=expandedMonth===mi;
          const monthEvents=events.filter(e=>{const d=new Date(e.date+"T12:00:00");return d.getMonth()===mi&&d.getFullYear()===year;}).sort((a,b)=>a.date.localeCompare(b.date));
          return(
            <div key={mi} style={{...S.miniMonth,...(isExp?S.miniMonthExp:{})}}>
              <div style={S.miniHead} onClick={()=>setExpandedMonth(isExp?null:mi)}>
                <span style={S.miniName}>{mName}</span>
                <span style={{fontSize:11,color:"#bbb"}}>{monthEvents.length>0?`${monthEvents.length} evento${monthEvents.length>1?"s":""}`:""}</span>
                <span style={{fontSize:12,color:"#ccc",marginLeft:"auto"}}>{isExp?"▾":"▸"}</span>
              </div>
              <div style={S.miniDayRow}>{DAYS_SHORT.map((d,i)=><div key={i} style={S.miniDH}>{d}</div>)}</div>
              <div style={S.miniGrid}>
                {cells.map(({date:d,out},ci)=>{
                  const ds=fmt(d); const dayEv=evByDate[ds]||[]; const td=isToday(d);
                  return(
                    <div key={ci} style={{...S.miniCell,...(out?{opacity:.2}:{})}}>
                      <span style={{...S.miniNum,...(td?S.miniNumToday:{})}}>{d.getDate()}</span>
                      {dayEv.length>0&&<div style={{display:"flex",gap:2,justifyContent:"center",marginTop:1}}>{dayEv.slice(0,3).map((ev,i)=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:ev.color}}/>)}</div>}
                    </div>
                  );
                })}
              </div>
              {isExp&&(
                <div style={S.expEvents}>
                  {monthEvents.map(ev=>(
                    <div key={ev.id} style={S.expRow}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:ev.color,flexShrink:0,marginTop:5}}/>
                      <div style={{flex:1}}><span style={{fontSize:12,color:"#999",fontWeight:600,marginRight:6}}>{ev.date.split("-")[2]}/{String(mi+1).padStart(2,"0")}</span><span style={{fontSize:13,fontWeight:600,color:"#1B2A4A"}}>{ev.title}</span></div>
                      {!readOnly&&<button style={S.iconBtn} onClick={()=>onRemoveEvent?.(ev.id)}><IconTrash/></button>}
                    </div>
                  ))}
                  {monthEvents.length===0&&<p style={{fontSize:12,color:"#aaa",textAlign:"center",margin:"6px 0"}}>Sin eventos</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   INFO BOARD (shared)
   ══════════════════════════════════════════════ */
function InfoBoard({info,readOnly,onRemove}){
  return(
    <div style={S.card}>
      <h2 style={{margin:"0 0 20px",fontSize:18,fontWeight:700}}>Información Relevante</h2>
      {info.length===0&&<p style={{textAlign:"center",color:"#aaa",padding:40}}>No hay información publicada.</p>}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {info.map(a=>{
          const p=PRIO[a.priority]||PRIO.media;
          return(
            <div key={a.id} style={{...S.infoCard,borderLeft:`4px solid ${p.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                    <span style={{fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20,background:p.bg,color:p.text,textTransform:"uppercase",letterSpacing:"0.04em"}}>{p.label}</span>
                    <span style={{fontSize:12,color:"#999"}}>{a.date}</span>
                  </div>
                  <h3 style={{margin:0,fontSize:15,fontWeight:700,color:"#1B2A4A"}}>{a.title}</h3>
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
   ADMIN PANEL
   ══════════════════════════════════════════════ */
function AdminPanel({schedule,setSchedule,events,setEvents,info,setInfo,onLogout,onPreview}){
  const [section,setSection]=useState("horario");
  const [calYear,setCalYear]=useState(2026);
  const [expandedMonth,setExpandedMonth]=useState(null);
  const evByDate=useMemo(()=>{const m={};events.forEach(e=>{if(!m[e.date])m[e.date]=[];m[e.date].push(e);});return m;},[events]);

  // Forms
  const [showEvForm,setShowEvForm]=useState(false);
  const [newEv,setNewEv]=useState({title:"",date:"",color:"#5B8A72"});
  const [showInfoForm,setShowInfoForm]=useState(false);
  const [newInfo,setNewInfo]=useState({title:"",body:"",priority:"media"});
  const [editingCell,setEditingCell]=useState(null);
  const [editVal,setEditVal]=useState("");

  const addEvent=()=>{if(!newEv.title||!newEv.date)return;setEvents(ev=>[...ev,{...newEv,id:Date.now()}]);setNewEv({title:"",date:"",color:"#5B8A72"});setShowEvForm(false);};
  const removeEvent=(id)=>setEvents(ev=>ev.filter(e=>e.id!==id));
  const addInfo=()=>{if(!newInfo.title||!newInfo.body)return;setInfo(inf=>[{...newInfo,id:Date.now(),date:fmt(new Date())},...inf]);setNewInfo({title:"",body:"",priority:"media"});setShowInfoForm(false);};
  const removeInfo=(id)=>setInfo(inf=>inf.filter(i=>i.id!==id));

  const saveCell=useCallback((rowId,day)=>{
    setSchedule(sch=>sch.map(r=>{
      if(r.id!==rowId)return r;
      if(r.type==="common") return {...r,label:editVal};
      return {...r,days:{...r.days,[day]:editVal}};
    }));
    setEditingCell(null);
  },[editVal,setSchedule]);

  const sideItems = [
    {key:"horario",label:"Horario Semanal",icon:<IconClock/>},
    {key:"eventos",label:"Eventos Anuales",icon:<IconCal/>},
    {key:"info",label:"Información",icon:<IconBell/>},
  ];

  return(
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"'Inter',system-ui,sans-serif",background:"#F0EDE6"}}>
      {/* SIDEBAR */}
      <aside style={S.sidebar}>
        <div style={S.sideTop}>
          <div style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Leaf style={{opacity:.4,width:20,height:30}}/>
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>Admin Panel</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>La Siembra Escuela</div>
          </div>
        </div>
        <nav style={S.sideNav}>
          {sideItems.map(s=>(
            <button key={s.key} onClick={()=>setSection(s.key)} style={{...S.sideItem,...(section===s.key?S.sideItemActive:{})}}>
              {s.icon}<span>{s.label}</span>
            </button>
          ))}
        </nav>
        <div style={S.sideBottom}>
          <button style={S.sideAction} onClick={onLogout}><IconEye/><span>Ver sitio público</span></button>
          <button style={{...S.sideAction,color:"#E07A5F"}} onClick={onLogout}><IconLogout/><span>Cerrar sesión</span></button>
        </div>
      </aside>

      {/* CONTENT */}
      <div style={S.adminContent}>
        <header style={S.adminHeader}>
          <h1 style={{margin:0,fontSize:22,fontWeight:800,color:"#1B2A4A"}}>
            {sideItems.find(s=>s.key===section)?.label}
          </h1>
          <div style={{fontSize:13,color:"#7A8194"}}>
            {DAYS[new Date().getDay()===0?4:Math.min(new Date().getDay()-1,4)]}{" "}
            {new Date().getDate()} de {MONTHS[new Date().getMonth()]}, {new Date().getFullYear()}
          </div>
        </header>

        {/* ─── ADMIN: HORARIO ─── */}
        {section==="horario"&&(
          <div style={S.adminCard}>
            <p style={{margin:"0 0 16px",fontSize:13,color:"#7A8194"}}>Haz clic en cualquier celda para editarla directamente.</p>
            <div style={S.scheduleWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={{...S.th,background:"#F7F5F0",minWidth:110}}>Horario</th>
                    {DAYS.map(d=><th key={d} style={{...S.th,background:DAY_COLORS[d],color:"#fff",fontSize:12,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase"}}>{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row)=>(
                    <tr key={row.id}>
                      <td style={{...S.td,...S.timeCell}}>{row.time}</td>
                      {row.type==="common"?(
                        <td colSpan={5} style={{...S.td,background:row.stripe?"#FFFDF7":"#fff",textAlign:"center",cursor:"pointer",position:"relative"}}
                          onClick={()=>{setEditingCell({rowId:row.id,day:null});setEditVal(row.label);}}>
                          {editingCell?.rowId===row.id&&editingCell?.day===null?(
                            <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
                              onBlur={()=>saveCell(row.id,null)} onKeyDown={e=>e.key==="Enter"&&saveCell(row.id,null)}
                              style={S.cellInput}/>
                          ):(
                            <span style={{fontWeight:600,fontSize:14,color:"#3A3A3A"}}>{row.label} <span style={{opacity:.3}}><IconEdit/></span></span>
                          )}
                        </td>
                      ):(
                        DAYS.map(d=>(
                          <td key={d} style={{...S.td,background:row.stripe?"#FFFDF7":"#fff",textAlign:"center",cursor:"pointer"}}
                            onClick={()=>{setEditingCell({rowId:row.id,day:d});setEditVal(row.days?.[d]||"");}}>
                            {editingCell?.rowId===row.id&&editingCell?.day===d?(
                              <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
                                onBlur={()=>saveCell(row.id,d)} onKeyDown={e=>e.key==="Enter"&&saveCell(row.id,d)}
                                style={S.cellInput}/>
                            ):(
                              <span style={{fontWeight:700,fontSize:13,color:row.type==="talleres"?DAY_COLORS[d]:"#3A3A3A",lineHeight:1.4}}>
                                {row.days?.[d]||"—"} <span style={{opacity:.3}}><IconEdit/></span>
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
          </div>
        )}

        {/* ─── ADMIN: EVENTOS ─── */}
        {section==="eventos"&&(
          <>
            <div style={S.adminCard}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <h3 style={{margin:0,fontSize:16,fontWeight:700}}>Agregar evento</h3>
                {!showEvForm&&<button style={S.primaryBtn} onClick={()=>setShowEvForm(true)}><IconPlus/> Nuevo evento</button>}
              </div>
              {showEvForm&&(
                <div style={S.formInner}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
                    <div style={S.fg}><label style={S.fl}>Título</label><input style={S.fi} placeholder="Ej: Feria de ciencias" value={newEv.title} onChange={e=>setNewEv({...newEv,title:e.target.value})}/></div>
                    <div style={S.fg}><label style={S.fl}>Fecha</label><input style={S.fi} type="date" value={newEv.date} onChange={e=>setNewEv({...newEv,date:e.target.value})}/></div>
                    <div style={S.fg}>
                      <label style={S.fl}>Color</label>
                      <div style={{display:"flex",gap:6,paddingTop:6}}>
                        {PALETTES.map(c=><button key={c} onClick={()=>setNewEv({...newEv,color:c})} style={{width:28,height:28,borderRadius:"50%",background:c,border:"none",cursor:"pointer",outline:newEv.color===c?`2.5px solid ${c}`:"2.5px solid transparent",outlineOffset:2}}/>)}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
                    <button style={S.ghostBtn} onClick={()=>setShowEvForm(false)}>Cancelar</button>
                    <button style={S.primaryBtn} onClick={addEvent}>Guardar evento</button>
                  </div>
                </div>
              )}
            </div>

            <div style={{marginTop:20}}>
              <YearCalendar year={calYear} setYear={setCalYear} events={events} evByDate={evByDate} expandedMonth={expandedMonth} setExpandedMonth={setExpandedMonth} onRemoveEvent={removeEvent}/>
            </div>

            {/* Full event table */}
            <div style={{...S.adminCard,marginTop:20}}>
              <h3 style={{margin:"0 0 14px",fontSize:16,fontWeight:700}}>Todos los eventos ({events.length})</h3>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {events.sort((a,b)=>a.date.localeCompare(b.date)).map(ev=>(
                  <div key={ev.id} style={S.eventRow}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:ev.color,flexShrink:0}}/>
                    <span style={{fontSize:13,fontWeight:600,color:"#888",minWidth:80}}>{ev.date.split("-").reverse().join("/")}</span>
                    <span style={{fontSize:14,fontWeight:600,color:"#1B2A4A",flex:1}}>{ev.title}</span>
                    <button style={{...S.iconBtn,color:"#E07A5F"}} onClick={()=>removeEvent(ev.id)}><IconTrash/></button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── ADMIN: INFO ─── */}
        {section==="info"&&(
          <>
            <div style={S.adminCard}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <h3 style={{margin:0,fontSize:16,fontWeight:700}}>Nueva información</h3>
                {!showInfoForm&&<button style={S.primaryBtn} onClick={()=>setShowInfoForm(true)}><IconPlus/> Agregar</button>}
              </div>
              {showInfoForm&&(
                <div style={S.formInner}>
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    <div style={S.fg}><label style={S.fl}>Título</label><input style={S.fi} placeholder="Ej: Cambio de horario" value={newInfo.title} onChange={e=>setNewInfo({...newInfo,title:e.target.value})}/></div>
                    <div style={S.fg}><label style={S.fl}>Detalle</label><textarea style={{...S.fi,minHeight:80,resize:"vertical",fontFamily:"inherit"}} placeholder="Descripción..." value={newInfo.body} onChange={e=>setNewInfo({...newInfo,body:e.target.value})}/></div>
                    <div style={S.fg}>
                      <label style={S.fl}>Prioridad</label>
                      <div style={{display:"flex",gap:8}}>
                        {Object.entries(PRIO).map(([k,v])=>(
                          <button key={k} onClick={()=>setNewInfo({...newInfo,priority:k})}
                            style={{padding:"7px 18px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",
                              background:newInfo.priority===k?v.bg:"#fff",
                              border:`1.5px solid ${newInfo.priority===k?v.border:"#ddd"}`,
                              color:newInfo.priority===k?v.text:"#999"}}>{v.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
                    <button style={S.ghostBtn} onClick={()=>setShowInfoForm(false)}>Cancelar</button>
                    <button style={S.primaryBtn} onClick={addInfo}>Publicar</button>
                  </div>
                </div>
              )}
            </div>
            <div style={{marginTop:20}}>
              <InfoBoard info={info} onRemove={removeInfo}/>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   STYLES
   ══════════════════════════════════════════════ */
const S = {
  root:{fontFamily:"'Inter','Segoe UI',system-ui,-apple-system,sans-serif",background:"#F0EDE6",minHeight:"100vh",color:"#1B2A4A"},

  /* Header */
  header:{position:"relative",overflow:"hidden",background:"linear-gradient(135deg,#F7F5F0,#EDE9DF)",borderBottom:"3px solid #5B8A72",padding:"20px 24px 0"},
  headerInner:{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12},
  headerSub:{fontSize:13,fontWeight:600,color:"#5B8A72",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2},
  headerTitle:{margin:0,fontSize:32,fontWeight:800,color:"#1B2A4A",letterSpacing:"-0.02em",fontStyle:"italic",lineHeight:1.2},
  adminBtn:{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:10,border:"1.5px solid #D8D5CE",background:"rgba(255,255,255,0.6)",color:"#7A8194",fontSize:13,fontWeight:600,cursor:"pointer",backdropFilter:"blur(4px)"},
  tabBar:{display:"flex",gap:4,marginTop:18,maxWidth:1100,margin:"18px auto 0"},
  tab:{display:"flex",alignItems:"center",gap:6,padding:"10px 20px",border:"none",background:"transparent",fontSize:13,fontWeight:600,cursor:"pointer",color:"#7A8194",borderBottom:"3px solid transparent",marginBottom:-3,borderRadius:"8px 8px 0 0",transition:"all .15s"},
  tabActive:{color:"#1B2A4A",background:"#fff",borderBottom:"3px solid #5B8A72"},

  main:{maxWidth:1100,margin:"0 auto",padding:"24px 24px 60px"},
  card:{background:"#fff",borderRadius:14,padding:28,boxShadow:"0 2px 8px rgba(27,42,74,0.06)"},

  /* Schedule */
  scheduleWrap:{overflowX:"auto",borderRadius:10,border:"1.5px solid #E8E5DD"},
  table:{width:"100%",borderCollapse:"collapse",fontSize:14,tableLayout:"fixed"},
  th:{padding:"12px 10px",textAlign:"center",borderBottom:"2px solid #E8E5DD",fontSize:12},
  td:{padding:"14px 10px",borderBottom:"1px solid #F0EDE6",verticalAlign:"middle",lineHeight:1.4},
  timeCell:{fontWeight:800,fontSize:13,color:"#E8A838",textAlign:"center",whiteSpace:"nowrap",background:"#FFFDF7",minWidth:110},
  scheduleNote:{marginTop:16,fontSize:13,color:"#7A8194",fontStyle:"italic"},
  cellInput:{width:"90%",padding:"6px 10px",border:"1.5px solid #4EADD5",borderRadius:6,fontSize:13,textAlign:"center",outline:"none",background:"#F0F8FF"},

  /* Year cal */
  yearBtn:{width:36,height:36,borderRadius:10,border:"1.5px solid #E2E1DC",background:"#fff",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#1B2A4A",fontWeight:700},
  yearGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:14},
  miniMonth:{background:"#FAFAF8",borderRadius:12,padding:14,border:"1.5px solid #ECEAE4",transition:"all .2s"},
  miniMonthExp:{gridColumn:"span 2",background:"#FFFDF7",borderColor:"#E8A838"},
  miniHead:{display:"flex",alignItems:"center",gap:8,marginBottom:8,cursor:"pointer"},
  miniName:{fontSize:14,fontWeight:800,color:"#1B2A4A"},
  miniDayRow:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4},
  miniDH:{fontSize:10,fontWeight:700,textAlign:"center",color:"#BCBAB3"},
  miniGrid:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2},
  miniCell:{textAlign:"center",padding:"3px 0",minHeight:28},
  miniNum:{fontSize:12,fontWeight:500,color:"#555"},
  miniNumToday:{background:"#E8A838",color:"#fff",borderRadius:"50%",width:22,height:22,display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11},
  expEvents:{marginTop:10,borderTop:"1px solid #ECEAE4",paddingTop:10,display:"flex",flexDirection:"column",gap:6},
  expRow:{display:"flex",alignItems:"flex-start",gap:8},

  /* Info */
  infoCard:{padding:18,borderRadius:12,background:"#FAFAF8"},

  /* Sidebar */
  sidebar:{width:260,background:"#1B2A4A",display:"flex",flexDirection:"column",minHeight:"100vh",position:"sticky",top:0},
  sideTop:{display:"flex",alignItems:"center",gap:10,padding:"20px 20px 16px",borderBottom:"1px solid rgba(255,255,255,0.08)"},
  sideNav:{flex:1,padding:"12px 10px",display:"flex",flexDirection:"column",gap:4},
  sideItem:{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,border:"none",background:"transparent",color:"rgba(255,255,255,0.55)",fontSize:14,fontWeight:600,cursor:"pointer",textAlign:"left",width:"100%",transition:"all .12s"},
  sideItemActive:{background:"rgba(255,255,255,0.1)",color:"#fff"},
  sideBottom:{padding:"12px 10px 20px",borderTop:"1px solid rgba(255,255,255,0.08)",display:"flex",flexDirection:"column",gap:4},
  sideAction:{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,border:"none",background:"transparent",color:"rgba(255,255,255,0.55)",fontSize:13,fontWeight:600,cursor:"pointer",width:"100%",textAlign:"left"},

  /* Admin content */
  adminContent:{flex:1,padding:"24px 32px 60px",maxWidth:960},
  adminHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:8},
  adminCard:{background:"#fff",borderRadius:14,padding:24,boxShadow:"0 2px 8px rgba(27,42,74,0.06)"},

  /* Forms */
  formInner:{padding:20,background:"#FAFAF8",borderRadius:12,border:"1.5px solid #E8E5DD"},
  fg:{display:"flex",flexDirection:"column",gap:4},
  fl:{fontSize:11,fontWeight:700,color:"#7A8194",textTransform:"uppercase",letterSpacing:"0.05em"},
  fi:{padding:"9px 14px",borderRadius:8,border:"1.5px solid #E2E1DC",fontSize:14,outline:"none",background:"#fff",color:"#1B2A4A"},

  /* Buttons */
  primaryBtn:{display:"flex",alignItems:"center",gap:6,padding:"9px 20px",border:"none",borderRadius:10,background:"#1B2A4A",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"},
  ghostBtn:{padding:"9px 20px",border:"1.5px solid #E2E1DC",borderRadius:10,background:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",color:"#7A8194"},
  iconBtn:{width:30,height:30,borderRadius:8,border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#ccc",flexShrink:0},

  /* Event list */
  eventRow:{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:10,background:"#FAFAF8",border:"1px solid #F0EDE6"},
};
