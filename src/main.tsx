import React, {useState} from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import './styles.css';

const API='https://aaokqyskfiupvexqkdvz.supabase.co/functions/v1/pastlife-api';
const BUILD_VERSION='visitor-map-top-first-v4-20260815';
const DELETE_API='https://aaokqyskfiupvexqkdvz.supabase.co/functions/v1/pastlife-delete';
const ANALYTICS_API='https://aaokqyskfiupvexqkdvz.supabase.co/functions/v1/pastlife-analytics';
const ELEMENTS_API='https://aaokqyskfiupvexqkdvz.supabase.co/functions/v1/pastlife-elements';
const analyticsSession=()=>{try{let id=sessionStorage.getItem('pastlife:session');if(!id){id=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;sessionStorage.setItem('pastlife:session',id)}return id}catch{return `${Date.now()}-${Math.random().toString(36).slice(2)}`}};
const track=(event_name:string,data:any={})=>{fetch(ANALYTICS_API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event_name,session_id:analyticsSession(),page_slug:data.page_slug||null,relationship_id:data.relationship_id||null,metadata:data.metadata||{}})}).catch(()=>{})};

type PersonInput={nickname:string;birthDate:string;birthTime:string;calendarType:'solar'|'lunar'};
const toApi=(v:PersonInput)=>({nickname:v.nickname,birth_date:v.birthDate,birth_time:v.birthTime||null,calendar_type:v.calendarType});
const Shell=({children}:{children:React.ReactNode})=><main className="shell"><header className="site-header"><Link to="/" className="brand">사주로 보는 전생의 인연</Link><nav className="top-nav"><Link to="/about">서비스 소개</Link><Link to="/guide">인연 해석</Link><Link to="/methodology">해석 원리</Link><Link to="/faq">FAQ</Link></nav></header>{children}<footer><nav className="footer-links"><Link to="/about">서비스 소개</Link><Link to="/guide">인연 해석</Link><Link to="/methodology">해석 원리</Link><Link to="/faq">FAQ</Link><Link to="/privacy">개인정보처리방침</Link><Link to="/terms">이용약관</Link><Link to="/delete">참여정보 삭제</Link></nav><p>전통 명리 요소를 바탕으로 만든 엔터테인먼트 콘텐츠입니다.<br/>입력한 생년월일과 출생시간은 다른 이용자에게 공개되지 않습니다.</p></footer></main>;

const relationIcon=(code?:string,label?:string)=>{
 const byCode:Record<string,string>={KING_LOYALIST:'👑',KING_ADVISOR:'📜',COMRADES:'⚔️',TEACHER_STUDENT:'📖',RIVALS:'🔥',OLD_FRIENDS:'🤝',UNFINISHED_LOVERS:'💘',BENEFACTOR:'💎',MERCHANT_RIVALS:'💰',TROUBLE_FIXER:'💥',GUARD_ROYAL:'🛡️',FOES_TO_FRIENDS:'🪢',SIBLINGS:'🏠',WANDERERS:'🧭',HEALER_PATIENT:'🌿',PATRON_ARTIST:'🎨',FORBIDDEN_LOVE:'🌙',ONE_SIDED_LOVE:'💌',NEIGHBOR_RIVALS:'🏘️',CAPTAIN_NAVIGATOR:'⛵'};
 if(code&&byCode[code])return byCode[code];
 if(label?.includes('연인')||label?.includes('사랑'))return '💘';
 if(label?.includes('라이벌')||label?.includes('원수'))return '🔥';
 if(label?.includes('전우'))return '⚔️';
 return '🔮';
};

const scoreOf=(r:any,key:string)=>Number(r?.scores?.[key]||0);

const elementIcon=(element?:string|null)=>{
 const map:Record<string,string>={wood:'🌿',fire:'🔥',earth:'⛰️',metal:'⚪',water:'💧'};
 return map[String(element||'').toLowerCase()]||'○';
};
const elementLabel=(element?:string|null)=>{
 const map:Record<string,string>={wood:'목(木)',fire:'화(火)',earth:'토(土)',metal:'금(金)',water:'수(水)'};
 return map[String(element||'').toLowerCase()]||'오행';
};

const maxBy=(items:any[],get:(x:any)=>number)=>items.length?[...items].sort((a,b)=>get(b)-get(a))[0]:null;

function buildHighlights(items:any[]){
 const deepest=maxBy(items,r=>scoreOf(r,'인연의깊이'));
 const benefactor=maxBy(items,r=>scoreOf(r,'서로에게주는영향'));
 const rival=maxBy(items,r=>scoreOf(r,'충돌'));
 const sticky=maxBy(items,r=>scoreOf(r,'질긴인연'));
 return [
  {need:3,icon:'💫',title:'가장 깊은 인연',item:deepest,score:deepest?scoreOf(deepest,'인연의깊이'):0},
  {need:5,icon:'💎',title:'나의 귀인',item:benefactor,score:benefactor?scoreOf(benefactor,'서로에게주는영향'):0},
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
   <div className="privacy-note"><b>🔒 개인정보 수집·이용 안내</b><span>목적: 전생 관계 계산 및 인연지도 저장</span><span>항목: 닉네임, 생년월일, 양·음력 구분, 선택 입력한 출생시간</span><span>보유: 서비스 이용·인연지도 제공 기간 또는 삭제 요청 시까지</span><span>동의를 거부할 수 있으나, 거부 시 관계 분석 기능을 이용할 수 없습니다.</span></div><div className="interpretation-notice"><b>결과 해석 안내</b><span>입력한 사주 정보는 두 사람의 관계 성향을 계산하고 전생 이야기 형식으로 표현하는 데 사용됩니다.</span><span>결과는 재미와 대화를 위한 참고용이며 실제 전생이나 미래를 확정적으로 의미하지 않습니다.</span></div>
   <label className="consent"><input required type="checkbox"/> 위 개인정보 수집·이용에 동의합니다. <Link to="/privacy">자세히 보기</Link></label>
   <button disabled={busy} className="primary">{busy?'인연을 살펴보고 있어요...':buttonText}</button>
 </form>
}

function Home(){usePageMeta("사주로 보는 전생의 인연 | 인연지도와 관계 해석","두 사람의 사주 관계를 전생 역할과 인연지도로 풀어보는 엔터테인먼트 서비스입니다.",false);return <Shell><section className="hero"><div className="orb">☯</div><p className="eyebrow">전생 인연지도</p><h1>우리, 전생에는<br/>무슨 사이였을까?</h1><p>내 사주로 페이지를 만들고 친구들을 초대해보세요.<br/>친구들이 참여할수록 전생 인연지도가 완성됩니다.</p><div className="entertainment-notice"><b>엔터테인먼트 안내</b><span>본 서비스는 전통 명리 요소를 활용해 관계를 이야기 형식으로 재해석하는 콘텐츠입니다.</span><span>실제 전생, 운명 또는 인간관계를 과학적으로 판정하거나 사실로 증명하는 서비스가 아닙니다.</span></div><Link className="primary link" to="/create">내 전생 인연지도 만들기</Link>
<div className="home-info-grid">
  <section className="home-info-card"><span>01</span><h2>두 사람의 관계를 계산해요</h2><p>일간과 일지, 오행의 상생·상극, 합·충·형·파·해·원진 같은 요소를 조합해 관계 성향을 계산합니다.</p></section>
  <section className="home-info-card"><span>02</span><h2>전생 역할로 쉽게 풀어줘요</h2><p>계산된 관계를 왕과 신하, 스승과 제자, 평생의 벗처럼 이해하기 쉬운 전생 이야기 형식으로 바꿉니다.</p></section>
  <section className="home-info-card"><span>03</span><h2>친구가 늘수록 지도가 완성돼요</h2><p>친구들이 참여하면 인연의 깊이에 따라 지도에 배치되고, 관계 랭킹과 특별 인연 기록이 함께 쌓입니다.</p></section>
</div>
<div className="home-readmore"><Link to="/methodology">인연 해석 원리 자세히 보기 →</Link><Link to="/guide">27가지 전생 관계 유형 보기 →</Link></div>
</section></Shell>}

function usePageMeta(title:string,description?:string,noindex=false){
 React.useEffect(()=>{
   document.title=title;
   const desc=document.querySelector('meta[name="description"]') as HTMLMetaElement|null;
   if(desc&&description)desc.content=description;
   const robots=document.querySelector('meta[name="robots"]') as HTMLMetaElement|null;
   if(robots)robots.content=noindex?'noindex,follow':'index,follow';
   return()=>{if(robots)robots.content='index,follow'};
 },[title,description,noindex]);
}

function Create(){usePageMeta('내 전생 인연지도 만들기 | 사주로 보는 전생의 인연','내 사주 정보를 입력해 친구들과 공유할 전생 인연지도를 만듭니다.',true);const nav=useNavigate();const submit=async(v:PersonInput)=>{const r=await fetch(`${API}/pages`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(toApi(v))});const d=await r.json();if(!r.ok) return alert(d.error||'생성에 실패했습니다.');localStorage.setItem(`owner:${d.slug}`,d.owner_token);track('page_create',{page_slug:d.slug});nav(`/n/${d.slug}`)};return <Shell><section><p className="eyebrow">STEP 1</p><h1>먼저 당신을 알려주세요</h1><p className="muted">한 번 만들면 친구에게 공유할 수 있는 나만의 주소가 생깁니다. 결과는 전통 명리 요소를 바탕으로 만든 엔터테인먼트 해석입니다.</p><PersonForm buttonText="내 사주로 지도 만들기" onSubmit={submit}/></section></Shell>}

function HighlightGrid({items,count}:{items:any[];count:number}){
 const hs=buildHighlights(items);
 const next=hs.find(h=>count<h.need);
 return <section className="unlock-section">
   <div className="unlock-header">
     <div><p className="eyebrow">인연 해금</p><h2>친구가 늘어날수록<br/>새 기록이 열려요</h2></div>
     <div className="unlock-total"><strong>{count}</strong><span>명 참여</span></div>
   </div>
   {next&&<div className="next-unlock-banner">
     <span>🔓</span>
     <div><small>다음 해금까지</small><b>{next.need-count}명 남았어요</b><p>{next.title} 공개 예정</p></div>
     <strong>{count}/{next.need}</strong>
   </div>}
   {!next&&<div className="all-unlocked-banner"><span>✨</span><div><b>모든 전생 기록이 열렸어요</b><p>이제 네 가지 특별 인연을 모두 확인할 수 있습니다.</p></div></div>}
   <div className="unlock-grid">
     {hs.map(h=>{
       const unlocked=count>=h.need&&h.item;
       const left=Math.max(0,h.need-count);
       const pct=Math.min(100,(count/h.need)*100);
       return <article className={`unlock-card ${unlocked?'is-unlocked':'is-locked'}`} key={h.title}>
         <div className="unlock-card-top"><span className="unlock-icon">{unlocked?h.icon:'🔒'}</span><span className="unlock-need">{h.need}명</span></div>
         <small>{h.title}</small>
         {unlocked?<><b>{h.item.nickname}</b><em>{h.item.relationship_type}</em><div className="unlock-score"><span>점수</span><strong>{h.score}</strong></div><div className="unlocked-stamp">UNLOCKED</div></>:
         <><b>{left}명 더 필요</b><em>친구를 더 초대하면 공개돼요</em><div className="unlock-progress"><span style={{width:`${pct}%`}}/></div><div className="unlock-progress-label"><span>{count}</span><span>{h.need}</span></div></>}
       </article>
     })}
   </div>
 </section>
}


function RadialMap({owner,items,clickable=true,mineId,ownerElement}:{owner:string;items:any[];clickable?:boolean;mineId?:string|null;ownerElement?:string|null}){
 const safeItems=Array.isArray(items)?items:[];
 const ranked=[...safeItems].sort((a:any,b:any)=>scoreOf(b,'인연의깊이')-scoreOf(a,'인연의깊이'));
 const rankById=new Map(ranked.map((x:any,i:number)=>[x.id,i+1]));
 const maxVisible=16;
 const visible=safeItems.slice(0,maxVisible);

 // 점수를 중심으로부터의 거리로 직접 변환합니다.
 // 100점 = 중앙 인물 원 바로 바깥
 // 85점  = 첫 번째 기준 궤도
 // 70점  = 두 번째 기준 궤도
 // 55점  = 세 번째 기준 궤도
 // 중간 점수는 선형 보간되어 궤도 사이에 배치됩니다.
 const radiusForScore=(raw:number)=>{
   const score=Math.max(40,Math.min(100,Number(raw)||60));
   const centerEdge=11;  // 100점 위치
   const orbit85=22;     // 85점 라인
   const orbit70=34;     // 70점 라인
   const orbit55=46;     // 55점 라인
   if(score>=85) return centerEdge+(100-score)/(100-85)*(orbit85-centerEdge);
   if(score>=70) return orbit85+(85-score)/(85-70)*(orbit70-orbit85);
   if(score>=55) return orbit70+(70-score)/(70-55)*(orbit55-orbit70);
   return Math.min(48,orbit55+(55-score)/(55-40)*2);
 };

 const nodes=visible.map((item:any,index:number)=>{
   const score=Math.max(0,Math.min(100,scoreOf(item,'인연의깊이')||60));
   const radius=radiusForScore(score);
   // 같은/비슷한 점수끼리 겹치지 않도록 각도만 분산합니다.
   const angle=(index/Math.max(1,visible.length))*Math.PI*2-(Math.PI/2)+(score%7)*0.035;
   return {...item,x:50+Math.cos(angle)*radius,y:50+Math.sin(angle)*radius,score,rank:rankById.get(item.id)||null};
 });

 const renderNode=(n:any)=>{
   const isMine=n.id===mineId;
   const inner=<>
     <span className="map-role">{n.participant_role||n.relationship_type||'인연'}</span>
     <b>{isMine?'나':n.nickname}</b>
   </>;
   return clickable
     ? <Link to={`/result/${n.id}`} key={n.id} className={`radial-node ${isMine?'mine-node':''}`} style={{left:`${n.x}%`,top:`${n.y}%`}} title={`${n.nickname} · ${n.participant_role||n.relationship_type||'인연'}`}>{inner}</Link>
     : <div key={n.id} className={`radial-node visitor-node ${isMine?'mine-node':''}`} style={{left:`${n.x}%`,top:`${n.y}%`}} title={isMine?`나 · ${n.participant_role||n.relationship_type||'인연'}`:`${n.nickname} · ${n.participant_role||n.relationship_type||'인연'}`}>{inner}</div>;
 };

 return <div className="radial-card card">
   <div className="radial-title">
     <p className="eyebrow">전생 인연지도</p>
     <h2>{mineId?'내 자리도 지도에 추가됐어요':'누가 내 곁에 가장 가까이 있을까?'}</h2>
     <p>가까울수록 인연이 깊고, 각 사람의 원에는 나와의 전생 역할이 표시됩니다.</p>
   </div>
   <div className="radial-map">
     <div className="orbit score-orbit orbit-85"/>
     <div className="orbit score-orbit orbit-70"/>
     <div className="orbit score-orbit orbit-55"/>
     <svg className="connection-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
       <defs>
         <filter id="electricGlow" x="-50%" y="-50%" width="200%" height="200%">
           <feGaussianBlur stdDeviation="0.7" result="blur"/>
           <feMerge>
             <feMergeNode in="blur"/>
             <feMergeNode in="SourceGraphic"/>
           </feMerge>
         </filter>
       </defs>
       {nodes.map((n:any,index:number)=>(
         <g key={`line-${n.id}`} className="electric-connection">
           <line className="connection-base" x1="50" y1="50" x2={n.x} y2={n.y}/>
           <line
             className="connection-flow"
             x1="50" y1="50" x2={n.x} y2={n.y}
             style={{animationDelay:`-${(index%6)*0.28}s`}}
           />
         </g>
       ))}
     </svg>
     <div className="center-person"><b>{owner}</b><small>나</small></div>
     {nodes.map(renderNode)}
   </div>
   {safeItems.length>maxVisible&&<p className="radial-more">+ {safeItems.length-maxVisible}명의 인연이 더 있습니다.</p>}
 </div>
}

function RelationshipRanking({items,mineId,ownerMode=false}:{items:any[];mineId?:string|null;ownerMode?:boolean}){
 const ranked=[...(items||[])].sort((a:any,b:any)=>scoreOf(b,'인연의깊이')-scoreOf(a,'인연의깊이'));
 if(!ranked.length)return null;
 const medal=(rank:number)=>rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':String(rank);
 return <div className="ranking-card card ranking-list-card">
   <div className="section-title"><span>🏆</span><div><small>전생 인연 랭킹</small><h3>누가 가장 가까운 인연일까?</h3></div></div>
   <p className="ranking-copy">인연의 깊이가 높은 순서예요. 상세 관계는 본인만 확인할 수 있습니다.</p>
   <div className="clean-ranking-list">
     {ranked.map((x:any,index:number)=>{
       const rank=index+1;
       const isMine=x.id===mineId;
       const row=<>
         <span className={`clean-rank-number top-${Math.min(rank,4)}`}>{medal(rank)}</span>
         <div className="clean-rank-main">
           <div className="clean-rank-name"><b>{isMine?'나':x.nickname}</b>{isMine&&<em>MY</em>}</div>
           <span>{x.relationship_type}</span>
         </div>
         <strong>{scoreOf(x,'인연의깊이')}점</strong>
       </>;
       if(ownerMode){
         return <Link key={x.id} className={`clean-rank-row ${isMine?'mine-row':''}`} to={`/result/${x.id}`}>{row}</Link>;
       }
       return <div key={x.id} className={`clean-rank-row ${isMine?'mine-row':''}`}>{row}</div>;
     })}
   </div>
   {!ownerMode&&<p className="ranking-private-note">🔒 다른 사람의 상세 관계는 공개되지 않아요.</p>}
 </div>
}

function rankInfo(items:any[],mineId?:string|null){
 const ranked=[...(items||[])].sort((a:any,b:any)=>scoreOf(b,'인연의깊이')-scoreOf(a,'인연의깊이'));
 const index=ranked.findIndex((x:any)=>x.id===mineId);
 if(index<0)return null;
 const item=ranked[index];
 return {rank:index+1,total:ranked.length,item,score:scoreOf(item,'인연의깊이')};
}

function Page(){usePageMeta('전생 인연지도 | 사주로 보는 전생의 인연',undefined,true);const {slug}=useParams();const [data,setData]=React.useState<any>(null);const [loading,setLoading]=React.useState(true);const [ownerMode,setOwnerMode]=React.useState(false);
 const mineId=new URLSearchParams(location.search).get('mine');
 const load=React.useCallback(async()=>{setLoading(true);setOwnerMode(!!localStorage.getItem(`owner:${slug}`));try{
  const [pageRes,elRes]=await Promise.all([
    fetch(`${API}/pages/${encodeURIComponent(slug||'')}`),
    fetch(`${ELEMENTS_API}?slug=${encodeURIComponent(slug||'')}`).catch(()=>null)
  ]);
  const d=await pageRes.json();
  if(!pageRes.ok){setData(null);return}
  let ed:any=null;
  if(elRes&&elRes.ok){try{ed=await elRes.json()}catch{}}
  const byRel=new Map((ed?.relationships||[]).map((x:any)=>[x.relationship_id,x.day_element]));
  const relationships=(d.relationships||[]).map((x:any)=>({...x,day_element:byRel.get(x.id)||null}));
  setData({...d,owner_element:ed?.owner_element||null,relationships});
}finally{setLoading(false)}},[slug]);React.useEffect(()=>{load()},[load]);React.useEffect(()=>{if(slug)track('page_view',{page_slug:slug})},[slug]);
 if(loading)return <Shell><div className="card loading-card">인연지도를 불러오는 중...</div></Shell>;if(!data)return <Shell><div className="card">존재하지 않는 인연지도입니다.</div></Shell>;
 const mine=data.relationships?.find((x:any)=>x.id===mineId);
 const mineRank=rankInfo(data.relationships||[],mineId);
 const submit=async(v:PersonInput)=>{const r=await fetch(`${API}/pages/${encodeURIComponent(slug||'')}/join`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(toApi(v))});const d=await r.json();if(!r.ok)return alert(d.error||'분석에 실패했습니다.');track('join_submit',{page_slug:slug,relationship_id:d.relationship_id});location.href=`/n/${encodeURIComponent(slug||'')}?mine=${encodeURIComponent(d.relationship_id)}`};
 const share=async()=>{track('share_click',{page_slug:slug,metadata:{source:'map'}});const url=`${location.origin}/n/${slug}`;if(navigator.share){try{await navigator.share({title:`${data.owner_nickname}의 전생 인연지도`,text:`나랑 전생에 무슨 사이였는지 확인해봐!`,url});return}catch{}}await navigator.clipboard.writeText(url);alert('공유 링크를 복사했습니다.');};
 const publicMap=data.relationships?.length>0?<RadialMap owner={data.owner_nickname} ownerElement={data.owner_element} items={data.relationships} clickable={ownerMode} mineId={mineId}/>:<div className="empty-public-map card"><span>☯</span><b>아직 첫 인연을 기다리고 있어요</b><p>첫 번째로 참여해서 {data.owner_nickname}의 인연지도를 시작해보세요.</p></div>;
 return <Shell><section><p className="eyebrow">🔮 전생 인연지도</p><h1>{data.owner_nickname}의<br/>전생 인연지도</h1><div className="count">지금까지 참여한 인연 <strong>{data.count}명</strong></div>
 {ownerMode?<>{publicMap}<RelationshipRanking items={data.relationships} mineId={mineId} ownerMode={true}/>{data.relationships.length>0&&<><div className="relation-list card"><div className="section-title"><span>🗂️</span><div><small>발견된 인연</small><h3>전체 인연 보기</h3></div></div>{data.relationships.map((x:any)=><Link className="relation-row" to={`/result/${x.id}`} key={x.id}><i>{relationIcon(x.type_code,x.relationship_type)}</i><div><b>{x.nickname}</b><span>{x.relationship_type}</span></div><strong>{scoreOf(x,'인연의깊이')}</strong></Link>)}</div><HighlightGrid items={data.relationships} count={data.count}/></>}<button className="primary" onClick={share}>친구에게 공유하기</button><p className="viral-copy">친구가 참여할수록 잠긴 전생 기록이 열립니다.</p></>:
 mine?<><section className="join-reveal">
   <div className="join-reveal-hero card">
     <div className="join-check">✓</div>
     <p className="eyebrow">인연지도 참여 완료</p>
     <h2>{mine.nickname}님이<br/>{data.owner_nickname}의 인연에 추가됐어요</h2>
     <p>지도에서 빛나는 노드가 내 자리입니다.</p>
     {mineRank&&<div className="my-rank-summary">
       <div><small>현재 순위</small><strong>{mineRank.rank}<span>위</span></strong></div>
       <div><small>인연의 깊이</small><strong>{mineRank.score}<span>점</span></strong></div>
       <div><small>전체 참여</small><strong>{mineRank.total}<span>명</span></strong></div>
     </div>}
     {mineRank?.rank===1&&<div className="new-first-banner">👑 새로운 1위 인연이 되었어요!</div>}
   </div>
   {publicMap}
   <Link className="primary link detail-cta detail-under-map" to={`/result/${mine.id}`}>{data.owner_nickname}와 관계 자세히 보기</Link>
   <p className="detail-hint">이 상세 결과는 본인 관계만 열 수 있어요.</p>
   <RelationshipRanking items={data.relationships} mineId={mineId}/>
   <HighlightGrid items={data.relationships} count={data.count}/>
   <div className="mine-relation-preview card">
     <span className="mine-preview-icon">{relationIcon(mine.type_code,mine.relationship_type)}</span>
     <div><small>나와 {data.owner_nickname}의 전생 관계</small><h3>{mine.relationship_type}</h3><p>전생 역할과 관계 점수, 사주 근거를 더 자세히 확인해보세요.</p></div>
   </div>
   <button className="secondary visitor-share" onClick={share}>이 인연지도 친구에게 공유하기</button>
 </section></>:
 <><section className="visitor-map-top">
  {publicMap}
  <RelationshipRanking items={data.relationships}/>
</section>
<section className="visitor-input-section">
  <div className="join-intro">
    <p className="eyebrow">내 인연 추가하기</p>
    <h2>{data.owner_nickname}과 나는<br/>전생에 무슨 사이였을까?</h2>
    <p className="muted">아래에 내 정보를 입력하면 광고 시청 후 {data.owner_nickname}의 인연지도에 내 자리가 추가됩니다.</p>
  </div>
  <PersonForm buttonText="내 자리 인연지도에 추가하기" onSubmit={submit}/>
</section>
<section className="visitor-unlock-section">
  <HighlightGrid items={data.relationships} count={data.count}/>
</section>
<span className="build-version">{BUILD_VERSION}</span></>}
 </section></Shell>}
function ScoreBars({scores}:{scores:Record<string,number>}){return <div className="scores card"><div className="section-title"><span>☯</span><div><small>현생에 남은 흔적</small><h3>두 사람의 인연 지표</h3></div></div>{Object.entries(scores||{}).map(([k,v])=>{const n=Math.max(0,Math.min(100,Number(v)||0));return <div className="score-row" key={k}><div className="score-head"><span>{k}</span><b>{n}</b></div><div className="score-track"><span style={{width:`${n}%`}}/></div></div>})}</div>}

function drawRoundRect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string,stroke?:string){
 ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fillStyle=fill; ctx.fill(); if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
}
function fitText(ctx:CanvasRenderingContext2D,text:string,maxWidth:number,startSize:number,minSize=28,weight=800){
 let size=startSize; do{ctx.font=`${weight} ${size}px "Apple SD Gothic Neo","Noto Sans KR",sans-serif`;if(ctx.measureText(text).width<=maxWidth)break;size-=2;}while(size>minSize);return size;
}
function wrapCanvasText(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,lineHeight:number,maxLines=4){
 const words=text.replace(/\n/g,' \n ').split(/\s+/);let line='';let yy=y;let lines=0;
 for(let i=0;i<words.length;i++){if(words[i]==='\n'){ctx.fillText(line,x,yy);line='';yy+=lineHeight;lines++;continue}
   const test=line?`${line} ${words[i]}`:words[i];
   if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,yy);line=words[i];yy+=lineHeight;lines++;if(lines>=maxLines-1)break}else line=test;
 }
 if(line&&lines<maxLines)ctx.fillText(line,x,yy);
}

async function makeStoryCard(r:any){
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;const ctx=canvas.getContext('2d')!;
 const bg=ctx.createLinearGradient(0,0,1080,1920);bg.addColorStop(0,'#2d1d3a');bg.addColorStop(.42,'#17101f');bg.addColorStop(1,'#0d0912');ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1920);
 const glow=ctx.createRadialGradient(540,340,20,540,340,470);glow.addColorStop(0,'rgba(181,112,225,.24)');glow.addColorStop(1,'rgba(181,112,225,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,1080,850);
 ctx.textAlign='center';ctx.fillStyle='#c9abe8';ctx.font='800 30px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';ctx.fillText('사주로 보는 전생의 인연',540,110);
 ctx.font='110px sans-serif';ctx.fillText(relationIcon(r.typeCode,r.label),540,305);
 ctx.fillStyle='#c9ace4';ctx.font='700 27px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';ctx.fillText(r.era||'전생 기록',540,385);
 ctx.fillStyle='#ffffff';fitText(ctx,r.label,850,78,44,900);ctx.fillText(r.label,540,500);
 ctx.fillStyle='#efe4f7';ctx.font='800 38px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';ctx.fillText(`${r.ownerNickname}  ×  ${r.participantNickname}`,540,575);

 drawRoundRect(ctx,110,655,860,260,38,'rgba(27,19,35,.88)','#49375a');
 ctx.fillStyle='#8f8198';ctx.font='700 22px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';ctx.fillText('전생의 역할',540,710);
 ctx.fillStyle='#fff';ctx.font='800 33px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';ctx.fillText(r.ownerNickname,320,790);ctx.fillText(r.participantNickname,760,790);
 ctx.fillStyle='#d9bff0';ctx.font='700 28px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';ctx.fillText(r.ownerRole,320,845);ctx.fillText(r.participantRole,760,845);

 drawRoundRect(ctx,110,960,860,330,38,'rgba(27,19,35,.88)','#49375a');
 ctx.textAlign='left';ctx.fillStyle='#c9abe8';ctx.font='800 23px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';ctx.fillText('전생의 한마디',165,1025);
 ctx.fillStyle='#f3e8fb';ctx.font='700 36px Georgia,"Noto Serif KR",serif';wrapCanvasText(ctx,`“${r.oneLiner||''}”`,165,1100,750,55,4);

 const scores=Object.entries(r.scores||{}).slice(0,3) as [string,any][];
 let sy=1375;ctx.textAlign='left';
 for(const [k,v] of scores){const n=Math.max(0,Math.min(100,Number(v)||0));ctx.fillStyle='#bfb2c8';ctx.font='700 25px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';ctx.fillText(k,145,sy);ctx.textAlign='right';ctx.fillStyle='#fff';ctx.fillText(String(n),935,sy);ctx.textAlign='left';drawRoundRect(ctx,145,sy+22,790,13,7,'#1b1422');const g=ctx.createLinearGradient(145,0,935,0);g.addColorStop(0,'#794d9e');g.addColorStop(1,'#c88bf2');drawRoundRect(ctx,145,sy+22,790*(n/100),13,7,g as any);sy+=105;}

 ctx.textAlign='center';ctx.fillStyle='#eee3f4';ctx.font='900 31px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';ctx.fillText('우리도 전생에 만난 적이 있을까?',540,1760);
 ctx.fillStyle='#887a92';ctx.font='600 22px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';ctx.fillText('사주로 보는 전생의 인연',540,1810);
 ctx.fillStyle='#5f5368';ctx.font='500 18px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';ctx.fillText('엔터테인먼트용 사주 해석 콘텐츠',540,1850);
 return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('이미지 생성 실패')),'image/png',1));
}

async function shareStoryCard(r:any){
 try{
   const blob=await makeStoryCard(r);const file=new File([blob],`전생인연-${r.ownerNickname}-${r.participantNickname}.png`,{type:'image/png'});
   if(navigator.canShare?.({files:[file]})&&navigator.share){await navigator.share({files:[file],title:'사주로 보는 전생의 인연',text:`${r.ownerNickname} × ${r.participantNickname} · ${r.label}`});return;}
   const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);alert('스토리용 이미지가 저장되었습니다.');
 }catch(e){console.error(e);alert('이미지 생성 중 오류가 발생했습니다.');}
}


const elementKo=(e?:string)=>({wood:'목(木)',fire:'화(火)',earth:'토(土)',metal:'금(金)',water:'수(水)'} as Record<string,string>)[String(e||'')]||'미상';
const elementMeaning=(e?:string)=>{
 const m:Record<string,string>={
  wood:'성장과 확장, 새로운 가능성을 중시하는 기운입니다.',
  fire:'표현과 열정, 빠른 반응과 추진력이 강한 기운입니다.',
  earth:'안정과 현실성, 관계를 오래 유지하려는 힘이 강한 기운입니다.',
  metal:'원칙과 판단, 경계를 분명히 하고 결단하는 힘이 강한 기운입니다.',
  water:'유연함과 통찰, 상황을 읽고 흐름에 맞추는 힘이 강한 기운입니다.'
 };
 return m[String(e||'')]||'';
};
const vectorLabel=(key:string)=>({
 affinity:'친밀감',support:'상생·도움',trust:'신뢰',conflict:'충돌',
 attachment:'질긴 인연',romance:'감정적 끌림',growth:'성장 자극',rivalry:'경쟁성'
} as Record<string,string>)[key]||key;


const deepPastLifeStory=(r:any,b:any)=>{
 const owner=r?.ownerNickname||'두 사람 중 한 사람';
 const participant=r?.participantNickname||'다른 한 사람';
 const label=r?.label||'깊은 인연';
 const factors=Array.isArray(b?.key_factors)?b.key_factors:[];
 const vector=b?.vector||{};
 const affinity=Number(vector.affinity||0);
 const trust=Number(vector.trust||0);
 const conflict=Number(vector.conflict||0);
 const attachment=Number(vector.attachment||0);
 const romance=Number(vector.romance||0);
 const rivalry=Number(vector.rivalry||0);

 let opening=`전생에서 ${owner}와 ${participant}의 관계는 ‘${label}’이라는 한 단어만으로 끝나는 인연은 아니었던 것으로 해석할 수 있어요. `;
 if(affinity>=70||attachment>=70) opening+=`두 사람은 처음부터 스쳐 지나가는 사이보다는, 오랜 시간 같은 공간과 사건을 공유하며 서로의 삶에 깊숙이 관여했던 모습에 가깝습니다. `;
 else opening+=`처음에는 특별할 것 없는 만남이었지만, 함께 겪은 사건과 선택이 쌓이면서 서로에게 의미가 커진 관계로 볼 수 있습니다. `;

 let middle='';
 if(trust>=65) middle+=`${owner}에게 ${participant}는 중요한 순간에 등을 맡길 수 있는 사람이었고, ${participant} 역시 ${owner}의 판단이나 존재를 쉽게 외면하지 못했을 가능성이 큽니다. `;
 if(romance>=65) middle+=`그 과정에는 단순한 의무나 역할만으로 설명하기 어려운 강한 감정적 끌림도 섞여 있었던 것으로 읽힙니다. 서로를 의식하면서도 당시의 신분이나 책임 때문에 마음을 그대로 표현하지 못했을 수도 있어요. `;
 if(rivalry>=60) middle+=`동시에 두 사람은 서로를 자극하는 경쟁자이기도 했습니다. 상대의 능력을 인정하기 때문에 더 의식했고, 가까운 만큼 비교와 긴장도 쉽게 생겼던 관계였을 수 있습니다. `;
 if(conflict>=60) middle+=`특히 관계가 깊어질수록 의견과 선택이 충돌하는 순간도 적지 않았던 것으로 보입니다. 중요한 갈림길에서 서로 다른 선택을 하거나, 한쪽의 결정이 다른 한쪽에게 오래 남는 상처가 되었을 가능성도 있습니다. `;
 if(attachment>=65) middle+=`그럼에도 쉽게 관계를 끊지 못했다는 점이 이 인연의 특징입니다. 멀어졌다가도 다시 얽히고, 끝났다고 생각한 뒤에도 서로의 선택에 영향을 주는 질긴 인연에 가까웠습니다. `;

 let climax=`이 관계의 핵심은 누가 더 좋은 사람이었는지를 가리는 데 있지 않습니다. ${owner}와 ${participant}는 서로에게 하나의 ‘사건’처럼 남은 사람에 가깝습니다. `;
 if(factors.length) climax+=`사주 관계에서 ${factors.slice(0,3).join(', ')} 같은 요소가 함께 잡힌다는 점도, 편안함 하나만으로 이어진 관계라기보다 서로의 삶의 방향을 움직이게 했던 인연이라는 해석을 더해줍니다. `;
 climax+=`그래서 전생의 관계가 끝난 뒤에도 미처 다 하지 못한 말, 갚지 못한 마음, 확인하지 못한 감정 같은 여운이 남았다는 이야기로 풀어볼 수 있습니다. `;

 let present=`현생에서 두 사람이 다시 만났다는 설정으로 본다면, 처음부터 이상하게 편하거나 반대로 별 이유 없이 신경 쓰이는 느낌으로 나타날 수 있습니다. `;
 if(conflict>=60) present+=`가까워질수록 서로의 차이가 선명해질 수 있지만, 그 충돌 자체가 두 사람이 서로에게 배우는 지점이 될 수 있습니다. `;
 else present+=`서로에게 자연스럽게 마음을 열거나, 짧은 시간에도 오래 알고 지낸 듯한 친숙함을 느끼기 쉬운 조합으로 볼 수 있습니다. `;
 present+=`전생의 역할을 그대로 반복해야 한다는 뜻보다는, 과거의 관계에서 남았다고 상상할 수 있는 감정과 과제를 이번에는 조금 다른 방식으로 풀어가는 인연이라고 보면 가장 재미있습니다.`;

 return {opening,middle,climax,present};
};

function DetailedSaju(){usePageMeta('사주 관계 심층 해석 | 사주로 보는 전생의 인연',undefined,true);
 const {id}=useParams();
 const [d,setD]=React.useState<any>(null);
 const [error,setError]=React.useState(false);

 React.useEffect(()=>{
   fetch(`${API}/relationships/${encodeURIComponent(id||'')}`)
     .then(async r=>{const j=await r.json();if(!r.ok)throw new Error();setD(j)})
     .catch(()=>setError(true));
 },[id]);

 if(error)return <Shell><div className="state-card card"><div className="state-icon">⚠️</div><h2>사주 해석을 불러오지 못했어요</h2><Link className="primary link" to={`/result/${id}`}>결과로 돌아가기</Link></div></Shell>;
 if(!d?.relationship)return <Shell><div className="card loading-card">심층 사주 해석을 펼치는 중...</div></Shell>;

 const r=d.relationship;
 const b=r.analysisBasis||{};
 const aEl=b?.day_elements?.a;
 const bEl=b?.day_elements?.b;
 const vector=b?.vector||{};
 const pillars=b?.pillars||{};
 const factors=Array.isArray(b?.key_factors)?b.key_factors:[];
 const candidates=Array.isArray(b?.top_candidates)?b.top_candidates:[];

 const sortedVector=Object.entries(vector)
   .filter(([,v])=>typeof v==='number')
   .sort((a:any,b:any)=>Number(b[1])-Number(a[1]));

 return <Shell><section className="deep-saju-page">
   <div className="deep-saju-hero">
     <p className="eyebrow">DETAILED SAJU</p>
     <h1>{r.ownerNickname} × {r.participantNickname}<br/>사주 관계 심층 해석</h1>
     <p>두 사람의 일간·일지·오행 관계와 합·충 요소를 조금 더 자세하게 풀어봤어요. 아래 내용은 전통 명리 요소를 활용한 엔터테인먼트 해석입니다.</p>
   </div>

   <div className="deep-summary card">
     <span className="deep-symbol">☯</span>
     <div><small>핵심 전생 관계</small><h2>{r.label}</h2><p>“{r.oneLiner}”</p></div>
   </div>

   {(()=>{const story=deepPastLifeStory(r,b);return <div className="card deep-pastlife-story">
     <div className="section-title"><span>📖</span><div><small>전생 관계 이야기</small><h3>두 사람은 어떤 인연이었을까요?</h3></div></div>
     <div className="deep-story-body">
       <p>{story.opening}</p>
       {story.middle&&<p>{story.middle}</p>}
       <p>{story.climax}</p>
       <div className="deep-story-present"><b>그리고 현생에서는</b><p>{story.present}</p></div>
     </div>
     <p className="deep-story-note">전통 명리 요소를 바탕으로 구성한 엔터테인먼트용 전생 스토리 해석입니다.</p>
   </div>})()}

   <div className="element-pair-grid">
     <div className="element-detail card">
       <small>{r.ownerNickname}</small>
       <h3>{elementKo(aEl)}</h3>
       <p>{elementMeaning(aEl)}</p>
     </div>
     <div className="element-detail card">
       <small>{r.participantNickname}</small>
       <h3>{elementKo(bEl)}</h3>
       <p>{elementMeaning(bEl)}</p>
     </div>
   </div>

   <div className="card pillar-card">
     <div className="section-title"><span>📜</span><div><small>사주 원국</small><h3>두 사람의 주요 기둥</h3></div></div>
     <div className="pillar-grid">
       <div><b>{r.ownerNickname}</b><span>연주 {pillars?.a?.year||'-'}</span><span>월주 {pillars?.a?.month||'-'}</span><span>일주 {pillars?.a?.day||'-'}</span><span>시주 {pillars?.a?.hour||'미입력'}</span></div>
       <div><b>{r.participantNickname}</b><span>연주 {pillars?.b?.year||'-'}</span><span>월주 {pillars?.b?.month||'-'}</span><span>일주 {pillars?.b?.day||'-'}</span><span>시주 {pillars?.b?.hour||'미입력'}</span></div>
     </div>
   </div>

   <div className="card deep-factors">
     <div className="section-title"><span>🧭</span><div><small>관계 근거</small><h3>두 사람 사이에서 강하게 잡힌 요소</h3></div></div>
     {factors.length?<div className="deep-factor-list">{factors.map((x:string)=><span key={x}>{x}</span>)}</div>:<p className="muted">강하게 잡힌 특수 요소가 많지 않은 조합입니다.</p>}
     <p className="deep-explain">이 요소들은 전통 명리의 합·충·형·파·해·원진과 오행의 상생·상극을 관계 성향으로 바꿔 해석한 것입니다.</p>
   </div>

   <div className="card vector-card">
     <div className="section-title"><span>📊</span><div><small>관계 성향</small><h3>어떤 성향이 특히 강한가요?</h3></div></div>
     <div className="vector-detail-list">
       {sortedVector.map(([k,v]:any)=><div className="vector-detail-row" key={k}>
         <div><span>{vectorLabel(k)}</span><b>{Number(v)}</b></div>
         <div className="vector-detail-track"><span style={{width:`${Math.max(0,Math.min(100,Number(v)))}%`}}/></div>
       </div>)}
     </div>
   </div>

   {candidates.length>1&&<div className="card candidate-card">
     <div className="section-title"><span>🔮</span><div><small>관계 후보</small><h3>비슷하게 나타난 전생 관계</h3></div></div>
     <p className="muted">현재 결과와 비슷한 성향으로 계산된 다른 관계 유형입니다.</p>
     <div className="candidate-list">{candidates.map((x:any,i:number)=><div key={x.code||i}><span>{i+1}</span><div><b>{x.label}</b><small>{x.category}</small></div></div>)}</div>
   </div>}

   <div className="card deep-advice">
     <div className="section-title"><span>💡</span><div><small>현생 관계 포인트</small><h3>이 관계를 이렇게 보면 재미있어요</h3></div></div>
     <p>점수가 높은 요소는 두 사람이 자연스럽게 반복하기 쉬운 관계 패턴이고, 충돌이 높은 요소는 서로 다름을 강하게 느끼기 쉬운 부분입니다. 좋은 관계와 나쁜 관계를 판정하기보다, “왜 이 사람과 이런 분위기가 생기는지”를 보는 재미로 활용해보세요.</p>
   </div>

   <Link className="secondary link" to={`/result/${id}`}>← 기본 관계 결과로 돌아가기</Link>
 </section></Shell>
}

function Result(){usePageMeta('전생 관계 결과 | 사주로 보는 전생의 인연',undefined,true);const {id}=useParams();const [d,setD]=React.useState<any>(null);const [error,setError]=React.useState(false);const [making,setMaking]=React.useState(false);React.useEffect(()=>{fetch(`${API}/relationships/${encodeURIComponent(id||'')}`).then(async r=>{const j=await r.json();if(!r.ok)throw new Error();setD(j);track('result_view',{page_slug:j?.relationship?.pageSlug,relationship_id:id})}).catch(()=>setError(true))},[id]);if(error)return <Shell><div className="card">전생 기록을 찾을 수 없습니다.</div></Shell>;if(!d?.relationship)return <Shell><div className="card loading-card">두 사람의 전생 기록을 펼치는 중...</div></Shell>;
 const r=d.relationship;const icon=relationIcon(r.typeCode,r.label);const basis=r.analysisBasis;const factors=Array.isArray(basis?.key_factors)?basis.key_factors:[];
 const share=async()=>{track('share_click',{page_slug:r.pageSlug,relationship_id:id,metadata:{source:'result'}});const url=location.href;const text=`${r.ownerNickname} × ${r.participantNickname}\n${icon} ${r.label}\n“${r.oneLiner}”`;if(navigator.share){try{await navigator.share({title:'사주로 보는 전생의 인연',text,url});return}catch{}}await navigator.clipboard.writeText(`${text}\n${url}`);alert('결과와 링크를 복사했습니다.');};
 const storyShare=async()=>{track('story_share',{page_slug:r.pageSlug,relationship_id:id});setMaking(true);try{await shareStoryCard(r)}finally{setMaking(false)}};
 return <Shell><section className="result"><div className="result-hero"><p className="eyebrow">사주로 보는 전생의 인연</p><div className="result-icon">{icon}</div><p className="era">{r.era}</p><h1>{r.label}</h1><p className="pair">{r.ownerNickname} <span>×</span> {r.participantNickname}</p><p className="result-quote">“{r.oneLiner}”</p></div>
 <div className="card roles"><div><small>전생의 역할</small><strong>{r.ownerNickname}</strong><span>{r.ownerRole}</span></div><div><small>전생의 역할</small><strong>{r.participantNickname}</strong><span>{r.participantRole}</span></div></div>
 <div className="card story"><div className="section-title"><span>📜</span><div><small>전생 기록</small><h3>두 사람의 이야기</h3></div></div><p>{r.story}</p></div>
 <ScoreBars scores={r.scores||{}}/>
 {factors.length>0&&<div className="card basis"><div className="section-title"><span>🧭</span><div><small>사주 관계 해석</small><h3>왜 이런 결과가 나왔을까요?</h3></div></div><div className="factor-list">{factors.map((x:string)=><span key={x}>{x}</span>)}</div><p className="basis-copy">두 사람의 일간·일지와 오행의 상생·상극, 합·충 관계를 함께 계산해 가장 가까운 전생 관계 유형을 찾았습니다.</p>{basis?.notice&&<p className="basis-notice">{basis.notice}</p>}</div>}<div className="deep-unlock-card card"><span>🔐</span><div><small>PREMIUM INTERPRETATION</small><h3>사주 해석 자세히 보기</h3><p>두 사람의 오행, 사주 기둥, 합·충 요소와 관계 성향을 더 자세히 확인할 수 있어요.</p></div><Link className="primary link" to={`/saju/${id}`}>심층 사주 해석 보기</Link></div>
 <section className="viral-result-section"><div className="viral-result-head"><p className="eyebrow">SHARE YOUR FATE</p><h2>이 결과, 친구에게도<br/>보여주고 싶지 않나요?</h2><p>결과를 공유하거나 내 인연지도를 만들면 또 다른 친구들과 전생 관계를 비교할 수 있어요.</p></div><div className="share-card-box card"><div><span>📱</span><div><b>인스타 스토리용 결과 카드</b><p>관계 유형과 점수가 담긴 9:16 이미지를 만들어 공유하세요.</p></div></div><button disabled={making} className="story-share" onClick={storyShare}>{making?'이미지 만드는 중...':'스토리 이미지 만들기'}</button></div><button className="primary share-btn" onClick={share}>친구에게 이 결과 공유하기</button><div className="become-owner-card card"><span>🔮</span><div><small>이번에는 내가 중심이 되어볼 차례</small><h3>내 전생 인연지도 만들기</h3><p>내 링크를 만들고 친구들을 초대하면 누가 나와 가장 깊은 인연인지 랭킹으로 확인할 수 있어요.</p></div><Link className="primary link" to="/create">내 인연지도 만들기</Link></div>{r.pageSlug&&<Link className="secondary link return-map-btn" to={`/n/${r.pageSlug}`}>← {r.ownerNickname}의 인연지도 돌아가기</Link>}</section></section></Shell>}



const RELATION_GUIDE=[
['👑','임금과 충신','책임과 신뢰가 강하게 연결된 인연'],['📜','임금과 책사','결단과 조언이 맞물리는 인연'],['⚔️','목숨을 맡긴 전우','위기에서 서로를 믿는 인연'],['📖','스승과 제자','배움과 성장의 영향을 주고받는 인연'],['🔥','숙명의 라이벌','부딪치면서 서로를 성장시키는 인연'],['🤝','평생의 벗','편안함과 신뢰가 오래 이어지는 인연'],['💘','이루지 못한 연인','강한 끌림과 아쉬움이 함께 남는 인연'],['💎','목숨을 구한 은인','한 사람이 다른 사람에게 큰 힘이 되는 인연'],['💰','상단의 경쟁자','목표를 두고 실력을 겨루는 인연'],['💥','사고뭉치와 해결사','문제를 만들고 수습하며 맞물리는 인연'],['🛡️','호위무사와 왕족','보호와 책임이 강하게 드러나는 인연'],['🪢','원수에서 친구로','충돌해도 쉽게 끊어지지 않는 인연'],['🏠','한집의 형제자매','티격태격해도 익숙함이 남는 인연'],['🧭','길 위에서 만난 동행','같은 방향을 바라보며 함께하는 인연'],['🌿','치유자와 환자','회복과 안정에 영향을 주는 인연'],['🎨','후원자와 예술가','재능을 알아보고 밀어주는 인연'],['🌙','금지된 사랑','끌림과 제약이 동시에 강한 인연'],['💌','엇갈린 짝사랑','마음의 속도와 방향이 다른 인연'],['🏘️','이웃 마을 라이벌','가깝기에 더 자주 경쟁하는 인연'],['⛵','선장과 항해사','목표와 방향을 함께 맞추는 인연'],['⚔️','장군과 부관','결단과 실행이 맞물리는 인연'],['🩸','피보다 진한 의형제','선택한 신뢰가 가족처럼 깊어진 인연'],['🏃','도망친 혼례의 두 사람','강한 결속과 변화 욕구가 함께하는 인연'],['🍶','주막 주인과 단골','반복된 만남이 만든 편안한 인연'],['🧹','주인과 말 안 듣는 하인','부딪치면서 계속 엮이는 인연'],['🛟','위기에서 만난 구조자','필요한 순간 큰 영향을 남기는 인연'],['🍃','스쳐 지나간 오래된 인연','강렬하지 않아도 익숙하게 느껴지는 인연']];

function About(){usePageMeta("서비스 소개 | 사주로 보는 전생의 인연","전생 인연지도 서비스의 목적, 계산 방식, 개인정보 이용과 서비스 성격을 안내합니다.",false);return <Shell><article className="editorial">
<p className="eyebrow">ABOUT</p><h1>사주로 보는<br/>전생의 인연</h1>
<p className="lead">생년월일을 바탕으로 두 사람의 사주 관계를 계산하고, 그 결과를 전생의 역할과 이야기로 재해석하는 소셜 엔터테인먼트 서비스입니다.</p>
<section><h2>이 서비스가 하는 일</h2><p>한 사람의 운세를 단독으로 보는 서비스가 아니라 두 사람의 관계에 초점을 둡니다. 일간과 일지, 오행의 상생·상극, 천간합과 지지의 합·충·형·파·해·원진 등 여러 관계 요소를 함께 계산한 뒤 친밀감, 신뢰, 충돌, 성장 자극, 질긴 인연 같은 관계 지표로 바꿉니다. 그 지표를 기반으로 가장 가까운 전생 관계 유형과 역할을 선택합니다.</p></section>
<section><h2>왜 ‘전생’이라는 이야기 형식을 사용하나요?</h2><p>사주 관계는 숫자만 보여주면 어렵고 딱딱하게 느껴질 수 있습니다. 그래서 계산된 관계 특징을 왕과 신하, 스승과 제자, 평생의 벗, 숙명의 라이벌처럼 이해하기 쉬운 이야기 구조로 옮겼습니다. 실제 전생을 증명하거나 미래를 예언하기 위한 것이 아니라, 서로의 관계를 이야기해보는 재미를 위한 장치입니다.</p></section>
<section><h2>인연지도는 어떻게 구성되나요?</h2><p>페이지 주인을 중심으로 친구들이 하나씩 추가됩니다. 인연의 깊이 점수가 높은 사람일수록 지도 중심에 가깝게 배치되고, 각 사람에게는 페이지 주인 기준의 전생 역할이 표시됩니다. 참여자가 늘어나면 가장 깊은 인연, 귀인, 라이벌처럼 추가적인 관계 기록도 단계적으로 열립니다.</p></section>
<section><h2>결과는 어떻게 계산되나요?</h2><p>닉네임과 생년월일, 양력·음력 여부를 바탕으로 사주 기둥을 계산하고, 두 사람 사이에서 합·충과 오행 관계가 어떻게 나타나는지 비교합니다. 출생시간은 선택 정보이며 모르는 경우에도 이용할 수 있습니다. 결과는 여러 관계 지표를 조합하여 결정되며 단일 요소 하나만으로 관계를 판정하지 않습니다.</p></section>
<section><h2>결과를 어떻게 받아들여야 하나요?</h2><p>본 서비스는 전통 명리 요소에서 아이디어를 얻은 엔터테인먼트 콘텐츠입니다. 의료·법률·금융 판단이나 중요한 인간관계 결정을 대신하지 않습니다. 결과가 실제 관계를 규정한다고 보기보다, 서로의 차이와 공통점을 가볍게 이야기하는 소재로 이용해 주세요.</p></section>
<section><h2>운영 및 문의</h2><p>서비스 기능, 개인정보, 오류 신고 및 기타 문의는 <a href="mailto:kikine901@gmail.com">kikine901@gmail.com</a>으로 보내주세요.</p></section>
<Link className="primary link" to="/create">내 인연지도 만들어보기</Link>
</article></Shell>}

function Guide(){usePageMeta("전생 인연 관계 유형 | 사주로 보는 전생의 인연","사주 관계 분석에서 사용하는 전생 관계 유형과 의미를 확인해보세요.",false);return <Shell><article className="editorial"><p className="eyebrow">RELATION GUIDE</p><h1>27가지<br/>전생 인연</h1><p className="lead">두 사람의 사주 관계 특징에 따라 만날 수 있는 전생 관계들을 소개합니다.</p><div className="guide-grid">{RELATION_GUIDE.map(([i,t,d])=><section className="guide-item" key={t}><span>{i}</span><div><h2>{t}</h2><p>{d}</p></div></section>)}</div><section className="guide-note"><h2>점수가 높으면 무조건 좋은 관계인가요?</h2><p>아닙니다. 인연의 깊이, 서로에게 주는 영향, 충돌, 질긴 인연은 서로 다른 관계 특징을 표현합니다. 높고 낮음 자체가 관계의 좋고 나쁨을 뜻하지 않습니다.</p></section></article></Shell>}

function Methodology(){usePageMeta("인연 해석 원리 | 사주로 보는 전생의 인연","일간, 오행, 합과 충 등 두 사람의 사주 관계를 어떻게 분석하는지 설명합니다.",false);return <Shell><article className="editorial">
<p className="eyebrow">METHODOLOGY</p><h1>인연 해석은<br/>어떻게 만들어질까요?</h1>
<p className="lead">결과는 무작위로 정해지는 것이 아니라, 두 사람의 사주에서 관계를 설명할 수 있는 여러 요소를 계산해 조합합니다.</p>
<section><h2>1. 일간과 오행</h2><p>사주에서 일간은 자신을 나타내는 중요한 기준으로 사용됩니다. 두 사람의 일간 오행이 서로 생하는지, 극하는지, 같은 오행인지 살펴 관계에서 도움과 자극, 경쟁성이 어떻게 나타날 수 있는지 계산합니다.</p></section>
<section><h2>2. 일지의 합과 충</h2><p>일지는 관계 해석에서 중요한 축입니다. 육합이나 삼합 계열은 친밀감과 신뢰에 가중치를 주고, 충·형·파·해·원진 요소는 긴장과 충돌, 쉽게 끊기지 않는 관계에 가중치를 주는 방식으로 반영합니다.</p></section>
<section><h2>3. 관계 지표로 환산</h2><p>계산된 요소는 인연의 깊이, 신뢰, 서로에게 주는 영향, 충돌, 질긴 인연 등의 지표로 정리됩니다. 한 가지 지표만으로 결과를 정하지 않고 여러 지표의 조합을 사용합니다.</p></section>
<section><h2>4. 전생 관계 유형 선택</h2><p>각 관계 유형은 서로 다른 조건을 갖습니다. 신뢰와 상생이 강하면 전우나 보호 관계가 후보가 될 수 있고, 충돌과 경쟁성이 강하면 라이벌 계열이 후보가 될 수 있습니다. 여러 후보의 적합도를 비교해 가장 가까운 유형을 선택합니다.</p></section>
<section><h2>5. 역할 방향 결정</h2><p>스승과 제자, 왕과 신하처럼 역할 방향이 있는 관계는 두 사람 사이에서 누가 더 도움을 주는 방향인지, 사주의 상생 흐름이 어느 쪽으로 향하는지 등을 함께 보고 역할을 결정합니다.</p></section>
<section><h2>6. 전생 스토리로 재해석</h2><p>마지막으로 계산된 관계 유형과 관계 지표를 사용해 이해하기 쉬운 이야기로 표현합니다. 이 과정은 전통 명리를 과학적 사실로 주장하는 것이 아니라 관계 특징을 즐길 수 있도록 구성한 엔터테인먼트 해석입니다.</p></section>
<div className="contact-card"><span>✉️</span><div><b>계산 방식 관련 문의</b><a href="mailto:kikine901@gmail.com">kikine901@gmail.com</a></div></div>
</article></Shell>}

function FAQ(){usePageMeta("자주 묻는 질문 | 사주로 보는 전생의 인연","전생 인연지도와 사주 관계 해석 이용 방법에 관한 자주 묻는 질문입니다.",false);const q=[['출생시간을 몰라도 할 수 있나요?','네. 출생시간은 선택 입력이라 비워두고 진행할 수 있습니다.'],['친구가 제 생년월일을 볼 수 있나요?','아니요. 입력한 생년월일과 출생시간은 다른 이용자에게 공개하지 않습니다.'],['반대쪽 페이지에서도 같은 결과가 나오나요?','같은 두 사람은 방향이 바뀌어도 동일한 핵심 관계가 유지되도록 설계했습니다. 방향성이 있는 역할은 서로 대응됩니다.'],['실제 전생을 알려주는 건가요?','아닙니다. 전통 명리 관계 요소를 활용한 엔터테인먼트 콘텐츠입니다.'],['정보를 삭제할 수 있나요?','네. 하단의 참여정보 삭제 메뉴에서 해당 친구 페이지에 남긴 참여 기록을 삭제할 수 있습니다.'],['문의는 어디로 하나요?','서비스 및 개인정보 문의는 kikine901@gmail.com 으로 보내주세요.']];return <Shell><article className="editorial"><p className="eyebrow">FAQ</p><h1>자주 묻는 질문</h1><p className="lead">서비스 이용 전에 궁금할 만한 내용을 모았습니다.</p><div className="faq-list">{q.map(([a,b])=><details key={a}><summary>{a}</summary><p>{b}</p></details>)}</div><div className="contact-card"><span>✉️</span><div><b>더 궁금한 점이 있나요?</b><a href="mailto:kikine901@gmail.com">kikine901@gmail.com</a></div><details><summary>결과가 매번 같은가요?</summary><p>같은 두 사람이 같은 생년월일과 입력 조건으로 분석되면 기본 관계 결과는 일관되게 유지됩니다. 다만 서비스의 관계 계산식이 개선되는 경우 향후 결과 표현이나 세부 지표가 달라질 수 있습니다.</p></details><details><summary>출생시간을 모르면 결과를 볼 수 없나요?</summary><p>출생시간은 선택 입력입니다. 시간을 모르는 경우에도 연주·월주·일주와 관계 요소를 중심으로 분석하며, 시주가 있는 경우보다 사용할 수 있는 정보가 적다는 차이가 있습니다.</p></details></div></article></Shell>}

function LegalLayout({title,updated,children}:{title:string;updated:string;children:React.ReactNode}){return <Shell><article className="legal"><p className="eyebrow">SERVICE POLICY</p><h1>{title}</h1><p className="legal-updated">최종 수정: {updated}</p>{children}</article></Shell>}

function Privacy(){usePageMeta("개인정보처리방침 | 사주로 보는 전생의 인연","전생 인연지도 서비스의 개인정보 처리, 외부 서비스, 쿠키 및 Google 광고 관련 내용을 안내합니다.",false);return <LegalLayout title="개인정보처리방침" updated="2026.08.18">
 <section><h2>1. 처리하는 개인정보와 이용 목적</h2><p>서비스는 전생 관계 분석과 인연지도 제공을 위해 닉네임, 생년월일, 양력·음력 구분, 이용자가 선택적으로 입력한 출생시간을 처리합니다. 입력한 생년월일과 출생시간은 다른 이용자에게 공개하지 않습니다.</p></section>
 <section><h2>2. 개인정보의 보유 및 이용기간</h2><p>개인정보는 인연지도와 관계 결과를 계속 제공하기 위해 서비스 이용 기간 동안 보관될 수 있으며, 정보주체가 삭제를 요청하거나 서비스 제공 목적이 소멸하면 관련 법령상 보관 의무가 있는 경우를 제외하고 파기합니다.</p></section>
 <section><h2>3. 개인정보의 제3자 제공</h2><p>서비스는 이용자의 개인정보를 임의로 판매하지 않습니다. 다만 웹 호스팅, 데이터베이스, 광고 및 사이트 운영을 위해 아래 외부 서비스가 기술적으로 정보를 처리할 수 있습니다. 각 서비스의 처리 범위는 해당 사업자의 정책 및 서비스 설정에 따릅니다.</p></section>
 <section><h2>4. 외부 서비스 및 처리업무</h2>
   <p><b>Cloudflare</b> — 웹사이트 호스팅, 콘텐츠 전송, 보안 및 네트워크 처리를 위해 사용합니다.</p>
   <p><b>Supabase</b> — 이용자가 입력한 정보, 인연지도 및 관계 결과의 데이터베이스 저장과 서버 기능 제공을 위해 사용합니다.</p>
   <p><b>Google AdSense</b> — 사이트 검토 및 향후 광고 제공을 위해 Google 광고 서비스를 사용할 수 있습니다. Google 광고 서비스가 활성화된 경우 이용자의 브라우저에서 방문 중인 페이지의 URL, IP 주소, 브라우저·기기 관련 정보 및 쿠키 또는 유사한 식별자가 Google에 전송되거나 처리될 수 있습니다. 제3자 공급업체인 Google은 쿠키를 사용하여 이용자의 이전 방문 기록 등을 바탕으로 광고를 게재할 수 있으며, 이용자는 Google 광고 설정에서 개인 맞춤 광고 사용 여부를 관리할 수 있습니다. Google은 이러한 정보를 광고 제공, 광고 효과 측정, 사기 및 악용 방지, 서비스 개선 및 이용자 설정에 따른 광고 개인 최적화 등에 사용할 수 있습니다.</p>
 </section>
 <section><h2>5. 쿠키 및 유사 기술</h2><p>서비스 자체 또는 외부 서비스 제공자는 서비스 제공, 보안, 광고 제공 및 측정을 위해 쿠키나 기타 로컬 저장 기술을 사용할 수 있습니다. Google 광고 서비스가 사용되는 경우 Google이 브라우저에 쿠키를 설정하거나 기존 쿠키를 읽을 수 있습니다. 이용자는 브라우저 설정이나 Google 광고 설정 등을 통해 일부 쿠키 및 광고 개인 최적화 설정을 관리할 수 있습니다.</p></section>
 <section><h2>6. Google 서비스의 데이터 사용</h2><p>Google이 Google 서비스를 사용하는 사이트 또는 앱에서 수집한 정보를 어떻게 사용하는지는 Google의 안내에서 확인할 수 있습니다: <a href="https://policies.google.com/technologies/partner-sites?hl=ko" target="_blank" rel="noreferrer">Google이 Google 서비스를 사용하는 웹사이트 또는 앱의 정보를 사용하는 방법</a>.</p></section>
 <section><h2>7. 해외 이용자 및 동의 관리</h2><p>유럽경제지역(EEA), 영국, 스위스 등 관련 지역에서 Google 광고가 제공되는 경우, Google 정책 및 관련 법령에서 요구하는 범위에 따라 쿠키, 로컬 저장소 및 광고 목적의 개인정보 처리에 대한 고지와 동의 절차가 적용될 수 있습니다. 서비스는 광고가 실제로 활성화되는 경우 Google 인증 CMP 또는 Google의 Privacy &amp; messaging 기능 등 적절한 동의 관리 수단을 설정할 수 있습니다.</p></section>
 <section><h2>8. 정보주체의 권리</h2><p>이용자는 자신의 개인정보에 대한 열람, 정정, 삭제, 처리정지 등을 요청할 수 있습니다. 특정 친구 페이지에 남긴 참여 기록은 <Link to="/delete">참여정보 삭제</Link> 화면에서 본인 확인 후 직접 삭제할 수 있으며, 추가 문의는 <a href="mailto:kikine901@gmail.com">kikine901@gmail.com</a>으로 접수할 수 있습니다.</p></section>
 <section><h2>9. 개인정보의 파기</h2><p>삭제 요청 등으로 보유 목적이 없어지면 해당 참여 연결 기록을 삭제합니다. 관계 기록이 더 이상 어떤 페이지에서도 사용되지 않는 경우 관련 관계 결과도 함께 정리하도록 설계되어 있습니다.</p></section>
 <section><h2>10. 안전성 확보조치</h2><p>브라우저가 개인정보 테이블에 직접 접근하지 않도록 서버 API를 통해 처리하고, 데이터베이스 접근 권한을 제한합니다. 삭제용 비밀값은 원문 대신 해시값 형태로 서버에 저장합니다.</p></section>
 <section><h2>11. 아동의 개인정보</h2><p>서비스는 일반 이용자를 대상으로 하며, 만 14세 미만 이용자의 개인정보를 의도적으로 수집하는 것을 목적으로 하지 않습니다. 만 14세 미만 이용자의 개인정보 처리에 별도 법적 절차가 필요한 경우 법정대리인 동의 등 필요한 조치를 마련합니다.</p></section>
 <section><h2>12. 개인정보 관련 문의</h2><p>개인정보 관련 문의 및 삭제 요청: <a href="mailto:kikine901@gmail.com">kikine901@gmail.com</a></p></section>
 <section><h2>13. 처리방침 변경</h2><p>개인정보 처리 방식, 외부 서비스 또는 광고 기술의 사용 방식이 변경되는 경우 이 페이지의 내용을 갱신하고 중요한 변경사항은 서비스 내에서 알립니다.</p></section>
 </LegalLayout>}
function Terms(){usePageMeta("이용약관 | 사주로 보는 전생의 인연","전생 인연지도 서비스의 이용 조건과 엔터테인먼트 콘텐츠 성격을 안내합니다.",false);return <LegalLayout title="이용약관" updated="2026.08.15">
 <section><h2>1. 서비스의 성격</h2><p>‘사주로 보는 전생의 인연’은 전통 명리 요소를 바탕으로 관계 성향을 계산하여 전생 이야기 형식으로 재해석하는 엔터테인먼트 서비스입니다.</p></section>
 <section><h2>2. 결과에 대한 안내</h2><p>서비스 결과는 재미와 소셜 콘텐츠를 위한 해석이며 실제 전생, 운명, 인간관계의 사실 여부나 미래를 과학적으로 증명하거나 보장하지 않습니다. 중요한 의료·법률·금융·인간관계 의사결정의 근거로 사용해서는 안 됩니다.</p></section>
 <section><h2>3. 이용자의 책임</h2><p>이용자는 본인이 입력할 권한이 있는 정보를 사용해야 하며 타인의 개인정보를 동의 없이 수집하거나 악의적으로 입력해서는 안 됩니다. 모욕, 괴롭힘, 사칭 등 타인의 권리를 침해하는 방식으로 서비스를 이용해서는 안 됩니다.</p></section>
 <section><h2>4. 서비스 변경 및 중단</h2><p>서비스 품질 향상, 안정성 확보 또는 운영상 필요에 따라 기능, 관계 계산식, 화면 및 데이터 구조가 개선될 수 있으며, 필요한 경우 일부 기능이 변경되거나 일시적으로 중단될 수 있습니다.</p></section>
 <section><h2>5. 지식재산권</h2><p>서비스가 제공하는 UI, 문구, 관계 유형 및 자체 제작 콘텐츠에 관한 권리는 법령 또는 별도 약정에 따라 보호됩니다. 이용자가 생성한 공유 이미지는 개인적인 공유 목적으로 사용할 수 있습니다.</p></section>
 <section><h2>6. 면책</h2><p>서비스는 엔터테인먼트 결과의 정확성이나 특정 관계 개선 효과를 보장하지 않습니다. 이용자의 입력 오류, 네트워크 장애, 외부 플랫폼 장애 등 서비스가 합리적으로 통제하기 어려운 사유로 발생한 문제에 대해서는 관련 법령이 허용하는 범위에서 책임이 제한될 수 있습니다.</p></section>
 </LegalLayout>}

function DeleteData(){
 usePageMeta('참여정보 삭제 | 사주로 보는 전생의 인연','전생 인연지도 참여 기록을 직접 삭제할 수 있습니다.',true);
 const [relationship,setRelationship]=React.useState('');const [nickname,setNickname]=React.useState('');const [birthDate,setBirthDate]=React.useState('');const [birthTime,setBirthTime]=React.useState('');const [calendarType,setCalendarType]=React.useState<'solar'|'lunar'>('solar');const [busy,setBusy]=React.useState(false);const [done,setDone]=React.useState(false);
 const extractId=(v:string)=>{const t=v.trim();const m=t.match(/\/result\/([0-9a-f-]{20,})/i);return m?.[1]||t};
 const submit=async(e:React.FormEvent)=>{e.preventDefault();if(!confirm('이 페이지에 남긴 참여 기록을 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.'))return;setBusy(true);try{const id=extractId(relationship);const rr=await fetch(`${API}/relationships/${encodeURIComponent(id)}`);const rd=await rr.json();if(!rr.ok||!rd?.relationship?.pageSlug)throw new Error('결과 기록을 찾을 수 없습니다.');const slug=rd.relationship.pageSlug;
   const issue=await fetch(`${DELETE_API}/issue`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({relationship_id:id,page_slug:slug,nickname,birth_date:birthDate,birth_time:birthTime||null,calendar_type:calendarType})});const issued=await issue.json();if(!issue.ok)throw new Error(issued.error||'본인 확인에 실패했습니다.');
   const del=await fetch(`${DELETE_API}/delete`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({relationship_id:id,page_slug:slug,delete_token:issued.delete_token})});const dd=await del.json();if(!del.ok)throw new Error(dd.error||'삭제에 실패했습니다.');setDone(true);
 }catch(err:any){alert(err?.message||'삭제 중 오류가 발생했습니다.')}finally{setBusy(false)}};
 if(done)return <Shell><section className="delete-page"><div className="card delete-success"><span>✓</span><h1>삭제되었습니다</h1><p>해당 친구 페이지에 남아 있던 참여 연결 기록을 삭제했습니다.</p><Link className="primary link" to="/">홈으로 돌아가기</Link></div></section></Shell>;
 return <Shell><section className="delete-page"><p className="eyebrow">PRIVACY CONTROL</p><h1>참여정보 삭제</h1><p className="muted">친구의 전생 인연지도에 참여하면서 남긴 기록을 직접 삭제할 수 있습니다.</p><form className="card delete-form" onSubmit={submit}>
   <label>결과 링크 또는 결과 ID<input required value={relationship} onChange={e=>setRelationship(e.target.value)} placeholder="https://.../result/xxxx 또는 UUID"/></label>
   <label>참여할 때 입력한 닉네임<input required value={nickname} onChange={e=>setNickname(e.target.value)}/></label>
   <label>생년월일<input required type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)}/></label>
   <div className="seg"><button type="button" className={calendarType==='solar'?'on':''} onClick={()=>setCalendarType('solar')}>양력</button><button type="button" className={calendarType==='lunar'?'on':''} onClick={()=>setCalendarType('lunar')}>음력</button></div>
   <label>출생시간 <span>당시 입력하지 않았다면 비워두세요</span><input type="time" value={birthTime} onChange={e=>setBirthTime(e.target.value)}/></label>
   <div className="danger-note"><b>삭제 범위</b><p>현재 셀프 삭제는 ‘해당 친구 페이지에 참여한 기록’을 대상으로 합니다. 여러 페이지에 참여했다면 각 결과별로 삭제해야 합니다.</p></div>
   <button disabled={busy} className="danger-button">{busy?'본인 확인 및 삭제 중...':'내 참여 기록 삭제하기'}</button>
 </form></section></Shell>}


class ErrorBoundary extends React.Component<{children:React.ReactNode},{error:boolean}>{
 state={error:false};
 static getDerivedStateFromError(){return{error:true}}
 render(){if(this.state.error)return <Shell><div className="state-card card"><div className="state-icon">⚠️</div><h2>화면을 불러오지 못했어요</h2><p>잠시 후 다시 시도해주세요. 문제가 계속되면 처음 화면으로 돌아가 다시 이용해주세요.</p><button className="primary" onClick={()=>location.reload()}>다시 시도하기</button><Link className="secondary link" to="/">처음으로</Link></div></Shell>;return this.props.children}
}
function LegacyAdRedirect(){
 const {id}=useParams();
 const nav=useNavigate();
 React.useEffect(()=>{
   const params=new URLSearchParams(location.search);
   const target=params.get('target');
   const page=params.get('page');
   if(target==='saju') nav(`/saju/${encodeURIComponent(id||'')}`,{replace:true});
   else if(page) nav(`/n/${encodeURIComponent(page)}?mine=${encodeURIComponent(id||'')}`,{replace:true});
   else nav(`/result/${encodeURIComponent(id||'')}`,{replace:true});
 },[id,nav]);
 return <Shell><div className="state-card card"><div className="state-icon">↪</div><h2>결과 페이지로 이동하고 있어요</h2><p>잠시만 기다려주세요.</p></div></Shell>
}

function NotFound(){usePageMeta('페이지를 찾을 수 없습니다 | 사주로 보는 전생의 인연',undefined,true);return <Shell><div className="state-card card"><div className="state-icon">🧭</div><p className="eyebrow">404</p><h2>찾을 수 없는 페이지예요</h2><p>주소가 잘못되었거나 삭제된 인연지도일 수 있습니다. 아래 메뉴에서 서비스를 계속 이용할 수 있어요.</p><div className="state-actions"><Link className="primary link" to="/">홈으로 돌아가기</Link><Link className="secondary link" to="/guide">인연 해석 보기</Link></div></div></Shell>}

function App(){return <Routes><Route path="/" element={<Home/>}/><Route path="/create" element={<Create/>}/><Route path="/n/:slug" element={<Page/>}/><Route path="/result/:id" element={<Result/>}/><Route path="/saju/:id" element={<DetailedSaju/>}/><Route path="/about" element={<About/>}/><Route path="/guide" element={<Guide/>}/><Route path="/methodology" element={<Methodology/>}/><Route path="/faq" element={<FAQ/>}/><Route path="/privacy" element={<Privacy/>}/><Route path="/ad/:id" element={<LegacyAdRedirect/>}/><Route path="*" element={<NotFound/>}/><Route path="/terms" element={<Terms/>}/><Route path="/delete" element={<DeleteData/>}/></Routes>}
createRoot(document.getElementById('root')!).render(<BrowserRouter><ErrorBoundary><App/></ErrorBoundary></BrowserRouter>);
