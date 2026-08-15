import React, {useState} from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import './styles.css';

const API='https://aaokqyskfiupvexqkdvz.supabase.co/functions/v1/pastlife-api';

type PersonInput={nickname:string;birthDate:string;birthTime:string;calendarType:'solar'|'lunar'};
const toApi=(v:PersonInput)=>({nickname:v.nickname,birth_date:v.birthDate,birth_time:v.birthTime||null,calendar_type:v.calendarType});
const Shell=({children}:{children:React.ReactNode})=><main className="shell"><header><Link to="/" className="brand">사주로 보는 전생의 인연</Link></header>{children}<footer>전통 명리 요소를 바탕으로 만든 엔터테인먼트 콘텐츠입니다.<br/>입력한 생년월일과 출생시간은 다른 이용자에게 공개되지 않습니다.</footer></main>;

const relationIcon=(code?:string,label?:string)=>{
 const byCode:Record<string,string>={KING_LOYALIST:'👑',KING_ADVISOR:'📜',COMRADES:'⚔️',TEACHER_STUDENT:'📖',RIVALS:'🔥',OLD_FRIENDS:'🤝',UNFINISHED_LOVERS:'💘',BENEFACTOR:'💎',MERCHANT_RIVALS:'💰',TROUBLE_FIXER:'💥',GUARD_ROYAL:'🛡️',FOES_TO_FRIENDS:'🪢',SIBLINGS:'🏠',WANDERERS:'🧭',HEALER_PATIENT:'🌿',PATRON_ARTIST:'🎨',FORBIDDEN_LOVE:'🌙',ONE_SIDED_LOVE:'💌',NEIGHBOR_RIVALS:'🏘️',CAPTAIN_NAVIGATOR:'⛵'};
 if(code&&byCode[code])return byCode[code];
 if(label?.includes('연인')||label?.includes('사랑'))return '💘';
 if(label?.includes('라이벌')||label?.includes('원수'))return '🔥';
 if(label?.includes('전우'))return '⚔️';
 return '🔮';
};

const scoreOf=(r:any,key:string)=>Number(r?.scores?.[key]||0);
const maxBy=(items:any[],get:(x:any)=>number)=>items.length?[...items].sort((a,b)=>get(b)-get(a))[0]:null;

function buildHighlights(items:any[]){
 const deepest=maxBy(items,r=>scoreOf(r,'인연의깊이'));
 const benefactor=maxBy(items,r=>scoreOf(r,'서로에게주는영향'));
 const rival=maxBy(items,r=>scoreOf(r,'충돌'));
 const sticky=maxBy(items,r=>scoreOf(r,'질긴인연'));
 return [
  {need:3,icon:'💫',title:'가장 깊은 인연',item:deepest,score:deepest?scoreOf(deepest,'인연의깊이'):0},
  {need:7,icon:'💎',title:'나의 귀인',item:benefactor,score:benefactor?scoreOf(benefactor,'서로에게주는영향'):0},
  {need:10,icon:'🔥',title:'숙명의 라이벌',item:rival,score:rival?scoreOf(rival,'충돌'):0},
  {need:15,icon:'🪢',title:'가장 질긴 인연',item:sticky,score:sticky?scoreOf(sticky,'질긴인연'):0},
 ];
}

function PersonForm({buttonText,onSubmit}:{buttonText:string,onSubmit:(v:PersonInput)=>Promise<void>|void}){
 const [nickname,setNickname]=useState(''); const [birthDate,setBirthDate]=useState(''); const [birthTime,setBirthTime]=useState(''); const [calendarType,setCalendarType]=useState<'solar'|'lunar'>('solar'); const [busy,setBusy]=useState(false);
 return <form onSubmit={async e=>{e.preventDefault();setBusy(true);try{await onSubmit({nickname,birthDate,birthTime,calendarType})}finally{setBusy(false)}}} className="card form">
   <label>닉네임<input required maxLength={20} value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="친구에게 표시될 이름"/></label>
   <label>생년월일<input required type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)}/></label>
   <div className="seg"><button type="button" className={calendarType==='solar'?'on':''} onClick={()=>setCalendarType('solar')}>양력</button><button type="button" className={calendarType==='lunar'?'on':''} onClick={()=>setCalendarType('lunar')}>음력</button></div>
   <label>태어난 시간 <span>선택 · 모르면 비워두세요</span><input type="time" value={birthTime} onChange={e=>setBirthTime(e.target.value)}/></label>
   <p className="privacy-note">🔒 입력한 생년월일과 출생시간은 친구에게 공개되지 않습니다.</p>
   <label className="consent"><input required type="checkbox"/> 개인정보 수집·이용에 동의합니다.</label>
   <button disabled={busy} className="primary">{busy?'인연을 살펴보고 있어요...':buttonText}</button>
 </form>
}

function Home(){return <Shell><section className="hero"><div className="orb">☯</div><p className="eyebrow">전생 인연지도</p><h1>우리, 전생에는<br/>무슨 사이였을까?</h1><p>내 사주로 페이지를 만들고 친구들을 초대해보세요.<br/>친구들이 참여할수록 전생 인연지도가 완성됩니다.</p><Link className="primary link" to="/create">내 전생 인연지도 만들기</Link></section></Shell>}

function Create(){const nav=useNavigate();const submit=async(v:PersonInput)=>{const r=await fetch(`${API}/pages`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(toApi(v))});const d=await r.json();if(!r.ok) return alert(d.error||'생성에 실패했습니다.');localStorage.setItem(`owner:${d.slug}`,d.owner_token);nav(`/n/${d.slug}`)};return <Shell><section><p className="eyebrow">STEP 1</p><h1>먼저 당신을 알려주세요</h1><p className="muted">한 번 만들면 친구에게 공유할 수 있는 나만의 주소가 생깁니다.</p><PersonForm buttonText="내 사주로 지도 만들기" onSubmit={submit}/></section></Shell>}

function HighlightGrid({items,count}:{items:any[];count:number}){const hs=buildHighlights(items);return <div className="highlight-wrap"><div className="highlight-head"><p className="eyebrow">인연 분석</p><h2>친구들이 채워주는<br/>나의 전생 기록</h2></div><div className="highlight-grid">{hs.map(h=>{const unlocked=count>=h.need&&h.item;const left=Math.max(0,h.need-count);return <div className={`highlight-card ${unlocked?'unlocked':'locked-highlight'}`} key={h.title}>{unlocked?<><span className="highlight-icon">{h.icon}</span><small>{h.title}</small><b>{h.item.nickname}</b><em>{h.item.relationship_type}</em><strong>{h.score}</strong></>:<><span className="highlight-icon">🔒</span><small>{h.title}</small><b>{left}명 더 필요</b><em>{count} / {h.need}</em><div className="mini-progress"><span style={{width:`${Math.min(100,(count/h.need)*100)}%`}}/></div></>}</div>})}</div></div>}

function RadialMap({owner,items}:{owner:string;items:any[]}){
 const maxVisible=16;
 const visible=items.slice(0,maxVisible);
 const nodes=visible.map((item:any,index:number)=>{
   const score=Math.max(0,Math.min(100,scoreOf(item,'인연의깊이')||60));
   const ring=score>=88?0:score>=75?1:2;
   const radii=[30,39,47];
   const sameRing=visible.filter((x:any)=>{const s=scoreOf(x,'인연의깊이')||60;return (s>=88?0:s>=75?1:2)===ring});
   const ringIndex=sameRing.findIndex((x:any)=>x.id===item.id);
   const angle=(ringIndex/Math.max(1,sameRing.length))*Math.PI*2-(Math.PI/2)+(ring*.22);
   const x=50+Math.cos(angle)*radii[ring];
   const y=50+Math.sin(angle)*radii[ring];
   return {...item,x,y,score,ring};
 });
 return <div className="radial-card card">
   <div className="radial-title"><p className="eyebrow">전생 인연지도</p><h2>누가 내 곁에<br/>가장 가까이 있을까?</h2><p>인연의 깊이가 높을수록 중심에 가깝게 표시됩니다.</p></div>
   <div className="radial-map">
     <div className="orbit orbit-1"/><div className="orbit orbit-2"/><div className="orbit orbit-3"/>
     <div className="center-person"><span>☯</span><b>{owner}</b></div>
     {nodes.map((n:any)=><Link to={`/result/${n.id}`} key={n.id} className={`radial-node ring-${n.ring}`} style={{left:`${n.x}%`,top:`${n.y}%`}} title={`${n.nickname} · ${n.relationship_type}`}>
       <i>{relationIcon(n.type_code,n.relationship_type)}</i><b>{n.nickname}</b><small>{n.score}</small>
     </Link>)}
   </div>
   {items.length>maxVisible&&<p className="radial-more">+ {items.length-maxVisible}명의 인연이 더 있습니다.</p>}
   <div className="map-legend"><span><i className="dot d1"/> 깊은 인연</span><span><i className="dot d2"/> 가까운 인연</span><span><i className="dot d3"/> 스쳐온 인연</span></div>
 </div>
}

function Page(){const {slug}=useParams();const [data,setData]=React.useState<any>(null);const [loading,setLoading]=React.useState(true);const [ownerMode,setOwnerMode]=React.useState(false);
 const load=React.useCallback(async()=>{setLoading(true);setOwnerMode(!!localStorage.getItem(`owner:${slug}`));try{const r=await fetch(`${API}/pages/${encodeURIComponent(slug||'')}`);const d=await r.json();setData(r.ok?d:null)}finally{setLoading(false)}},[slug]);React.useEffect(()=>{load()},[load]);
 if(loading)return <Shell><div className="card loading-card">인연지도를 불러오는 중...</div></Shell>;if(!data)return <Shell><div className="card">존재하지 않는 인연지도입니다.</div></Shell>;
 const submit=async(v:PersonInput)=>{const r=await fetch(`${API}/pages/${encodeURIComponent(slug||'')}/join`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(toApi(v))});const d=await r.json();if(!r.ok)return alert(d.error||'분석에 실패했습니다.');location.href=`/result/${d.relationship_id}`};
 const share=async()=>{const url=location.href;if(navigator.share){try{await navigator.share({title:`${data.owner_nickname}의 전생 인연지도`,text:`나랑 전생에 무슨 사이였는지 확인해봐!`,url});return}catch{}}await navigator.clipboard.writeText(url);alert('공유 링크를 복사했습니다.');};
 return <Shell><section><p className="eyebrow">🔮 전생 인연지도</p><h1>{data.owner_nickname}의<br/>전생 인연지도</h1><div className="count">발견된 인연 <strong>{data.count}명</strong></div>
 {ownerMode?<><>{data.relationships.length===0?<div className="map card"><p>아직 발견된 인연이 없습니다.<br/>친구에게 이 페이지 주소를 공유해보세요.</p></div>:<><RadialMap owner={data.owner_nickname} items={data.relationships}/><div className="relation-list card"><div className="section-title"><span>🗂️</span><div><small>발견된 인연</small><h3>전체 인연 보기</h3></div></div>{data.relationships.map((x:any)=><Link className="relation-row" to={`/result/${x.id}`} key={x.id}><i>{relationIcon(x.type_code,x.relationship_type)}</i><div><b>{x.nickname}</b><span>{x.relationship_type}</span></div><strong>{scoreOf(x,'인연의깊이')}</strong></Link>)}</div><HighlightGrid items={data.relationships} count={data.count}/></>}</><button className="primary" onClick={share}>친구에게 공유하기</button><p className="viral-copy">친구가 참여할수록 잠긴 전생 기록이 열립니다.</p></>:<><h2>{data.owner_nickname}과 나는<br/>전생에 무슨 사이였을까?</h2><p className="muted">내 정보만 입력하면 두 사람의 사주 관계를 전생 이야기로 풀어드립니다.</p><PersonForm buttonText="우리의 전생 찾기" onSubmit={submit}/></>}
 </section></Shell>}

function ScoreBars({scores}:{scores:Record<string,number>}){return <div className="scores card"><div className="section-title"><span>☯</span><div><small>현생에 남은 흔적</small><h3>두 사람의 인연 지표</h3></div></div>{Object.entries(scores||{}).map(([k,v])=>{const n=Math.max(0,Math.min(100,Number(v)||0));return <div className="score-row" key={k}><div className="score-head"><span>{k}</span><b>{n}</b></div><div className="score-track"><span style={{width:`${n}%`}}/></div></div>})}</div>}

function Result(){const {id}=useParams();const [d,setD]=React.useState<any>(null);const [error,setError]=React.useState(false);React.useEffect(()=>{fetch(`${API}/relationships/${encodeURIComponent(id||'')}`).then(async r=>{const j=await r.json();if(!r.ok)throw new Error();setD(j)}).catch(()=>setError(true))},[id]);if(error)return <Shell><div className="card">전생 기록을 찾을 수 없습니다.</div></Shell>;if(!d?.relationship)return <Shell><div className="card loading-card">두 사람의 전생 기록을 펼치는 중...</div></Shell>;
 const r=d.relationship;const icon=relationIcon(r.typeCode,r.label);const basis=r.analysisBasis;const factors=Array.isArray(basis?.key_factors)?basis.key_factors:[];
 const share=async()=>{const url=location.href;const text=`${r.ownerNickname} × ${r.participantNickname}\n${icon} ${r.label}\n“${r.oneLiner}”`;if(navigator.share){try{await navigator.share({title:'사주로 보는 전생의 인연',text,url});return}catch{}}await navigator.clipboard.writeText(`${text}\n${url}`);alert('결과와 링크를 복사했습니다.');};
 return <Shell><section className="result"><div className="result-hero"><p className="eyebrow">사주로 보는 전생의 인연</p><div className="result-icon">{icon}</div><p className="era">{r.era}</p><h1>{r.label}</h1><p className="pair">{r.ownerNickname} <span>×</span> {r.participantNickname}</p><p className="result-quote">“{r.oneLiner}”</p></div>
 <div className="card roles"><div><small>전생의 역할</small><strong>{r.ownerNickname}</strong><span>{r.ownerRole}</span></div><div><small>전생의 역할</small><strong>{r.participantNickname}</strong><span>{r.participantRole}</span></div></div>
 <div className="card story"><div className="section-title"><span>📜</span><div><small>전생 기록</small><h3>두 사람의 이야기</h3></div></div><p>{r.story}</p></div>
 <ScoreBars scores={r.scores||{}}/>
 {factors.length>0&&<div className="card basis"><div className="section-title"><span>🧭</span><div><small>사주 관계 해석</small><h3>왜 이런 결과가 나왔을까요?</h3></div></div><div className="factor-list">{factors.map((x:string)=><span key={x}>{x}</span>)}</div><p className="basis-copy">두 사람의 일간·일지와 오행의 상생·상극, 합·충 관계를 함께 계산해 가장 가까운 전생 관계 유형을 찾았습니다.</p>{basis?.notice&&<p className="basis-notice">{basis.notice}</p>}</div>}
 <button className="primary share-btn" onClick={share}>결과 공유하기</button>{r.pageSlug&&<Link className="secondary link" to={`/n/${r.pageSlug}`}>전생 인연지도 돌아가기</Link>}<Link className="ghost-link" to="/create">나도 내 전생 인연지도 만들기 →</Link></section></Shell>}

function App(){return <Routes><Route path="/" element={<Home/>}/><Route path="/create" element={<Create/>}/><Route path="/n/:slug" element={<Page/>}/><Route path="/result/:id" element={<Result/>}/></Routes>}
createRoot(document.getElementById('root')!).render(<BrowserRouter><App/></BrowserRouter>);
