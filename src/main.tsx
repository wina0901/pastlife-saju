import React, {useState} from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import './styles.css';

const API='https://aaokqyskfiupvexqkdvz.supabase.co/functions/v1/pastlife-api';

type PersonInput={nickname:string;birthDate:string;birthTime:string;calendarType:'solar'|'lunar'};
const toApi=(v:PersonInput)=>({nickname:v.nickname,birth_date:v.birthDate,birth_time:v.birthTime||null,calendar_type:v.calendarType});
const Shell=({children}:{children:React.ReactNode})=><main className="shell"><header><Link to="/" className="brand">사주로 보는 전생의 인연</Link></header>{children}<footer>오락·콘텐츠용 사주 해석 서비스 · 입력한 생년월일은 다른 이용자에게 공개되지 않습니다.</footer></main>;

function PersonForm({buttonText,onSubmit}:{buttonText:string,onSubmit:(v:PersonInput)=>Promise<void>|void}){
 const [nickname,setNickname]=useState(''); const [birthDate,setBirthDate]=useState(''); const [birthTime,setBirthTime]=useState(''); const [calendarType,setCalendarType]=useState<'solar'|'lunar'>('solar'); const [busy,setBusy]=useState(false);
 return <form onSubmit={async e=>{e.preventDefault();setBusy(true);try{await onSubmit({nickname,birthDate,birthTime,calendarType})}finally{setBusy(false)}}} className="card form">
   <label>닉네임<input required maxLength={20} value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="친구에게 표시될 이름"/></label>
   <label>생년월일<input required type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)}/></label>
   <div className="seg"><button type="button" className={calendarType==='solar'?'on':''} onClick={()=>setCalendarType('solar')}>양력</button><button type="button" className={calendarType==='lunar'?'on':''} onClick={()=>setCalendarType('lunar')}>음력</button></div>
   <label>태어난 시간 <span>선택 · 모르면 비워두세요</span><input type="time" value={birthTime} onChange={e=>setBirthTime(e.target.value)}/></label>
   <p className="privacy-note">🔒 입력한 생년월일과 출생시간은 친구에게 공개되지 않습니다.</p>
   <label className="consent"><input required type="checkbox"/> 개인정보 수집·이용에 동의합니다.</label>
   <button disabled={busy} className="primary">{busy?'확인하고 있어요...':buttonText}</button>
 </form>
}

function Home(){return <Shell><section className="hero"><div className="orb">☯</div><p className="eyebrow">전생 인연지도</p><h1>우리, 전생에는<br/>무슨 사이였을까?</h1><p>내 사주로 페이지를 만들고 친구들을 초대해보세요.<br/>친구들이 참여할수록 전생 인연지도가 완성됩니다.</p><Link className="primary link" to="/create">내 전생 인연지도 만들기</Link></section></Shell>}

function Create(){const nav=useNavigate();const submit=async(v:PersonInput)=>{const r=await fetch(`${API}/pages`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(toApi(v))});const d=await r.json();if(!r.ok) return alert(d.error||'생성에 실패했습니다.');localStorage.setItem(`owner:${d.slug}`,d.owner_token);nav(`/n/${d.slug}`)};return <Shell><section><p className="eyebrow">STEP 1</p><h1>먼저 당신을 알려주세요</h1><p className="muted">한 번 만들면 친구에게 공유할 수 있는 나만의 주소가 생깁니다.</p><PersonForm buttonText="내 사주로 지도 만들기" onSubmit={submit}/></section></Shell>}

function Page(){const {slug}=useParams();const [data,setData]=React.useState<any>(null);const [loading,setLoading]=React.useState(true);const [ownerMode,setOwnerMode]=React.useState(false);
 const load=React.useCallback(async()=>{setLoading(true);setOwnerMode(!!localStorage.getItem(`owner:${slug}`));try{const r=await fetch(`${API}/pages/${encodeURIComponent(slug||'')}`);const d=await r.json();setData(r.ok?d:null)}finally{setLoading(false)}},[slug]);React.useEffect(()=>{load()},[load]);
 if(loading)return <Shell><div className="card">인연지도를 불러오는 중...</div></Shell>;if(!data)return <Shell><div className="card">존재하지 않는 인연지도입니다.</div></Shell>;
 const submit=async(v:PersonInput)=>{const r=await fetch(`${API}/pages/${encodeURIComponent(slug||'')}/join`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(toApi(v))});const d=await r.json();if(!r.ok)return alert(d.error||'분석에 실패했습니다.');location.href=`/result/${d.relationship_id}`};
 const share=async()=>{const url=location.href;if(navigator.share){try{await navigator.share({title:`${data.owner_nickname}의 전생 인연지도`,text:`나랑 전생에 무슨 사이였는지 확인해봐!`,url});return}catch{}}await navigator.clipboard.writeText(url);alert('공유 링크를 복사했습니다.');};
 return <Shell><section><p className="eyebrow">🔮 전생 인연지도</p><h1>{data.owner_nickname}의<br/>전생 인연지도</h1><div className="count">발견된 인연 <strong>{data.count}명</strong></div>
 {ownerMode?<><div className="map card">{data.relationships.length===0?<p>아직 발견된 인연이 없습니다.<br/>친구에게 이 페이지 주소를 공유해보세요.</p>:data.relationships.map((x:any)=><Link className="relation" to={`/result/${x.id}`} key={x.id}><b>{x.nickname}</b><span>{x.relationship_type}</span></Link>)}</div><button className="primary" onClick={share}>친구에게 공유하기</button><div className="locked card"><b>🔒 친구가 더 참여하면</b><p>가장 깊은 인연 · 귀인 · 숙명의 라이벌 같은 추가 분석을 열 수 있어요.</p></div></>:<><h2>{data.owner_nickname}과 나는<br/>전생에 무슨 사이였을까?</h2><p className="muted">내 정보만 입력하면 두 사람의 전생 관계를 찾아드립니다.</p><PersonForm buttonText="우리의 전생 찾기" onSubmit={submit}/></>}
 </section></Shell>}

function Result(){const {id}=useParams();const [d,setD]=React.useState<any>(null);const [error,setError]=React.useState(false);React.useEffect(()=>{fetch(`${API}/relationships/${encodeURIComponent(id||'')}`).then(async r=>{const j=await r.json();if(!r.ok)throw new Error();setD(j)}).catch(()=>setError(true))},[id]);if(error)return <Shell><div className="card">전생 기록을 찾을 수 없습니다.</div></Shell>;if(!d?.relationship)return <Shell><div className="card">전생 기록을 불러오는 중...</div></Shell>;const r=d.relationship;return <Shell><section className="result"><p className="eyebrow">🔮 전생 기록</p><p className="era">{r.era}</p><h1>{r.label}</h1><h2>{r.ownerNickname} × {r.participantNickname}</h2><div className="card roles"><div><strong>{r.ownerNickname}</strong><span>{r.ownerRole}</span></div><div><strong>{r.participantNickname}</strong><span>{r.participantRole}</span></div></div><div className="card story"><h3>두 사람의 전생 이야기</h3><p>{r.story}</p><blockquote>“{r.oneLiner}”</blockquote></div><div className="scores card">{Object.entries(r.scores||{}).map(([k,v])=><div key={k}><span>{k}</span><b>{String(v)}</b></div>)}</div>{r.pageSlug&&<Link className="primary link" to={`/n/${r.pageSlug}`}>전생 인연지도 보기</Link>}</section></Shell>}

function App(){return <Routes><Route path="/" element={<Home/>}/><Route path="/create" element={<Create/>}/><Route path="/n/:slug" element={<Page/>}/><Route path="/result/:id" element={<Result/>}/></Routes>}
createRoot(document.getElementById('root')!).render(<BrowserRouter><App/></BrowserRouter>);
