import React, {useState} from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import './styles.css';

const API='https://aaokqyskfiupvexqkdvz.supabase.co/functions/v1/pastlife-api';
const DELETE_API='https://aaokqyskfiupvexqkdvz.supabase.co/functions/v1/pastlife-delete';
const ANALYTICS_API='https://aaokqyskfiupvexqkdvz.supabase.co/functions/v1/pastlife-analytics';
const ELEMENTS_API='https://aaokqyskfiupvexqkdvz.supabase.co/functions/v1/pastlife-elements';
const ADMIN_API='https://aaokqyskfiupvexqkdvz.supabase.co/functions/v1/pastlife-admin';
const OWNER_AUTH_API='https://aaokqyskfiupvexqkdvz.supabase.co/functions/v1/pastlife-owner-auth';
const analyticsSession=()=>{try{let id=sessionStorage.getItem('pastlife:session');if(!id){id=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;sessionStorage.setItem('pastlife:session',id)}return id}catch{return `${Date.now()}-${Math.random().toString(36).slice(2)}`}};
const track=(event_name:string,data:any={})=>{fetch(ANALYTICS_API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event_name,session_id:analyticsSession(),page_slug:data.page_slug||null,relationship_id:data.relationship_id||null,metadata:data.metadata||{}})}).catch(()=>{})};

type PersonInput={nickname:string;birthDate:string;birthTime:string;calendarType:'solar'|'lunar'};
const toApi=(v:PersonInput)=>({nickname:v.nickname,birth_date:v.birthDate,birth_time:v.birthTime||null,calendar_type:v.calendarType});
const ADFIT_SCRIPT='//t1.kakaocdn.net/kas/static/ba.min.js';
const ADFIT_UNITS={
 home:'DAN-Uaik8cdnOSddKS9L',
 content:'DAN-hOQrOps3VvaUNO4v',
 articleMiddle:'DAN-j7J6iXXDQIDKEsIN',
 articleBottom:'DAN-RpuT6xVz5EQYOZqw',
 map:'DAN-QzREY9njohhyglcM',
 resultMiddle:'DAN-YOIDPXsDLiI69AMk',
 resultBottom:'DAN-wIII61jQ1VaTcty',
 sajuMiddle:'DAN-GS9yy2yJRjkBtQCa',
 sajuBottom:'DAN-9qwM8f2yMGmTNZSr',
 info:'DAN-57fhPWx7vW1RfBbK'
} as const;
function AdFitBanner({unit,label='광고'}:{unit:string;label?:string}){
 React.useEffect(()=>{
   const existing=document.querySelector(`script[src="${ADFIT_SCRIPT}"]`);
   if(existing){ try{(window as any).adfit?.render?.()}catch{}; return; }
   const script=document.createElement('script'); script.src=ADFIT_SCRIPT; script.async=true; document.body.appendChild(script);
 },[unit]);
 return <aside className="adfit-wrap" aria-label={label}><span className="adfit-label">{label}</span><ins className="kakao_ad_area" style={{display:'none'}} data-ad-unit={unit} data-ad-width="320" data-ad-height="100"/></aside>;
}
const Shell=({children}:{children:React.ReactNode})=><main className="shell"><header className="site-header"><Link to="/" className="brand">사주로 보는 전생의 인연</Link></header>{children}<footer><nav className="footer-links"><Link to="/about">서비스 소개</Link><Link to="/guide">인연 해석</Link><Link to="/methodology">해석 원리</Link><Link to="/faq">FAQ</Link><a href="/contents/">읽을거리</a><Link to="/privacy">개인정보처리방침</Link><Link to="/terms">이용약관</Link><Link to="/delete">참여정보 삭제</Link></nav><p>전통 명리 요소를 바탕으로 만든 엔터테인먼트 콘텐츠입니다.<br/>입력한 생년월일과 출생시간은 다른 이용자에게 공개되지 않습니다.</p></footer></main>;

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
 if(!Array.isArray(items)||items.length<2)return [];
 const specs=[
  {title:'가장 깊은 인연',key:'인연의깊이',description:'인연의 깊이가 가장 높게 나타난 사람'},
  {title:'서로 힘이 되는 인연',key:'서로에게주는영향',description:'서로에게 주는 영향이 가장 크게 나타난 사람'},
  {title:'가장 많이 부딪히는 인연',key:'충돌',description:'서로를 강하게 자극하기 쉬운 사람'},
  {title:'가장 질긴 인연',key:'질긴인연',description:'쉽게 잊히지 않는 연결이 강한 사람'},
 ];
 return specs.map(x=>{const item=maxBy(items,r=>scoreOf(r,x.key));return {...x,item,score:item?scoreOf(item,x.key):0}}).filter(x=>x.item);
}

function PersonForm({buttonText,busyText='인연을 확인하고 있어요…',onSubmit,withOwnerPassword=false}:{buttonText:string;busyText?:string;onSubmit:(v:PersonInput&{password?:string})=>Promise<void>|void;withOwnerPassword?:boolean}){
 const [nickname,setNickname]=useState(''); const [birthDate,setBirthDate]=useState(''); const [birthTime,setBirthTime]=useState(''); const [calendarType,setCalendarType]=useState<'solar'|'lunar'>('solar'); const [password,setPassword]=useState(''); const [passwordConfirm,setPasswordConfirm]=useState(''); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
 const submit=async(e:React.FormEvent)=>{e.preventDefault();if(busy)return;setError('');if(!nickname.trim()){setError('닉네임을 입력해주세요.');return}if(!birthDate){setError('생년월일을 입력해주세요.');return}if(withOwnerPassword){if(password.length<4||password.length>20){setError('내 지도 비밀번호는 4~20자로 입력해주세요.');return}if(password!==passwordConfirm){setError('비밀번호 확인이 일치하지 않습니다.');return}}setBusy(true);try{await onSubmit({nickname:nickname.trim(),birthDate,birthTime,calendarType,...(withOwnerPassword?{password}:{})})}catch(err:any){setError(err?.message||'요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.')}finally{setBusy(false)}};
 return <form onSubmit={submit} className="card form">
   <label>닉네임<input required maxLength={20} value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="친구에게 표시될 이름"/></label>
   <label>생년월일<input required type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)}/></label>
   <div className="seg" aria-label="달력 종류"><button type="button" className={calendarType==='solar'?'on':''} onClick={()=>setCalendarType('solar')}>양력</button><button type="button" className={calendarType==='lunar'?'on':''} onClick={()=>setCalendarType('lunar')}>음력</button></div>
   <label>태어난 시간 <span>선택 · 모르면 비워두세요</span><input type="time" value={birthTime} onChange={e=>setBirthTime(e.target.value)}/></label>
   {withOwnerPassword&&<div className="owner-password-fields">
     <div className="owner-password-intro"><b>내 지도 비밀번호</b><span>다른 기기에서 내 인연지도를 다시 열 때 사용합니다.</span></div>
     <label>비밀번호 <span>4~20자</span><input required minLength={4} maxLength={20} type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="내 지도 비밀번호"/></label>
     <label>비밀번호 확인<input required minLength={4} maxLength={20} type="password" autoComplete="new-password" value={passwordConfirm} onChange={e=>setPasswordConfirm(e.target.value)} placeholder="비밀번호 다시 입력"/></label>
   </div>}
   <div className="privacy-note"><b>개인정보 안내</b><span>입력한 생년월일과 출생시간은 다른 이용자에게 공개되지 않습니다.</span><span>전통 명리 요소를 활용한 엔터테인먼트 서비스이며, 입력 정보는 관계 계산과 인연지도 제공에 사용됩니다.</span><Link to="/privacy">개인정보처리방침 보기</Link></div>
   <label className="consent"><input required type="checkbox"/> 개인정보 수집·이용에 동의합니다.</label>
   {error&&<p className="form-error" role="alert">{error}</p>}
   <button disabled={busy} className="primary">{busy?busyText:buttonText}</button>
 </form>
}

function Home(){usePageMeta("사주로 보는 전생의 인연 | 인연지도와 관계 해석","친구와 나는 전생에 어떤 사이였을까요? 내 사주로 인연지도를 만들고 친구들을 초대해 관계를 확인해보세요.",false);return <Shell><section className="hero home-hero"><div className="orb" aria-hidden="true">☯</div><p className="eyebrow">전생 인연지도</p><h1>우리, 전생에는<br/>무슨 사이였을까?</h1><p>내 사주로 인연지도를 만들고 친구들을 초대해<br/>전생의 관계를 확인해보세요.</p><Link className="primary link" to="/create">내 전생 인연지도 만들기</Link><p className="home-disclaimer">전통 명리 요소를 활용한 엔터테인먼트 콘텐츠입니다.</p>
<div className="home-info-grid compact-steps">
  <section className="home-info-card"><span>01</span><h2>내 지도 만들기</h2><p>내 생년월일을 입력해 인연지도를 만듭니다.</p></section>
  <section className="home-info-card"><span>02</span><h2>친구에게 공유하기</h2><p>만들어진 링크를 친구에게 보내 참여를 받습니다.</p></section>
  <section className="home-info-card"><span>03</span><h2>인연 확인하기</h2><p>친구가 참여할수록 나를 중심으로 지도가 채워집니다.</p></section>
</div>
<section className="home-demo" aria-label="결과 예시">
  <div className="home-demo-head"><p className="eyebrow">결과 예시</p><small>조선 후기</small></div>
  <h2>목숨을 맡긴 전우</h2>
  <div className="home-role-diagram" aria-label="선봉장과 호위병의 관계">
    <div><small>나의 역할</small><strong>선봉장</strong></div>
    <span className="home-role-line" aria-hidden="true"><i/><em>전우</em></span>
    <div><small>상대의 역할</small><strong>호위병</strong></div>
  </div>
  <p className="home-demo-quote">“위기의 순간마다 서로의 등을 맡겼던 사이”</p>
  <div className="home-demo-score"><span>인연의 깊이</span><strong>91</strong></div>
</section>
<AdFitBanner unit={ADFIT_UNITS.home}/>
<section className="home-article-section"><div className="section-title"><div><small>읽을거리</small><h2>결과를 더 재미있게 읽는 법</h2></div></div><div className="home-article-grid">
<a href="/contents/compatibility-vs-relationship.html"><b>사주 궁합과 인연 해석의 차이</b><span>점수보다 관계의 방향과 패턴을 보는 이유</span></a>
<a href="/contents/good-bad-relationship.html"><b>좋은 인연·나쁜 인연을 나눌 수 있을까</b><span>충돌이 높아도 의미 있는 관계가 될 수 있는 이유</span></a>
<a href="/contents/five-elements.html"><b>오행과 인간관계</b><span>상생과 상극을 도움과 자극의 언어로 읽는 법</span></a>
<a href="/contents/relationship-score.html"><b>관계 점수 읽는 법</b><span>높은 숫자가 곧 좋은 관계를 뜻하지 않는 이유</span></a>
</div></section><div className="home-readmore"><Link to="/methodology">인연 해석 원리 보기 →</Link><a href="/contents/">사주 관계 읽을거리 전체 보기 →</a></div></section></Shell>}

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

function Create(){usePageMeta('내 전생 인연지도 만들기 | 사주로 보는 전생의 인연','내 사주 정보를 입력해 친구들과 공유할 전생 인연지도를 만듭니다.',true);const nav=useNavigate();const submit=async(v:PersonInput&{password?:string})=>{const r=await fetch(`${API}/pages`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(toApi(v))});const d=await r.json();if(!r.ok){if(String(d.error||'').includes('PASSWORD_LOGIN_REQUIRED'))throw new Error('이미 비밀번호가 설정된 인연지도입니다. 기존 인연지도 주소에서 비밀번호로 열어주세요.');throw new Error(d.error||'지도를 만들지 못했습니다. 잠시 후 다시 시도해주세요.')}localStorage.setItem(`owner:${d.slug}`,d.owner_token);const ar=await fetch(`${OWNER_AUTH_API}/setup`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug:d.slug,owner_token:d.owner_token,password:v.password})});const ad=await ar.json();if(!ar.ok)throw new Error(ad.error||'지도는 생성했지만 비밀번호 설정에 실패했습니다. 다시 시도해주세요.');track('page_create',{page_slug:d.slug});nav(`/n/${d.slug}`)};return <Shell><section className="create-page"><p className="eyebrow">내 인연지도 만들기</p><h1>내 전생 인연지도 만들기</h1><p className="muted">먼저 나를 등록해주세요. 친구들이 참여하면 나를 중심으로 인연지도가 만들어집니다.</p><PersonForm withOwnerPassword buttonText="내 인연지도 만들기" busyText="인연지도를 만들고 있어요…" onSubmit={submit}/><AdFitBanner unit={ADFIT_UNITS.info}/></section></Shell>}

function HighlightGrid({items}:{items:any[];count?:number}){
 const hs=buildHighlights(items);
 if(hs.length===0)return null;
 return <section className="special-relations"><div className="special-head"><p className="eyebrow">특별한 인연</p><h2>지도에서 눈에 띄는 관계</h2><p>현재 참여한 인연들의 관계 지표를 비교한 결과입니다.</p></div><div className="special-list">{hs.map(h=><article className="special-row" key={h.title}><div><small>{h.title}</small><b>{h.item.nickname}<span> · {h.item.relationship_type}</span></b></div><strong>{h.score}</strong></article>)}</div></section>
}

function RadialMap({owner,items,clickable=true,mineId,ownerElement}:{owner:string;items:any[];clickable?:boolean;mineId?:string|null;ownerElement?:string|null}){
 const safeItems=Array.isArray(items)?items:[];
 const ranked=[...safeItems].sort((a:any,b:any)=>scoreOf(b,'인연의깊이')-scoreOf(a,'인연의깊이'));
 const rankById=new Map(ranked.map((x:any,i:number)=>[x.id,i+1]));
 const maxVisible=16;
 const visible=(()=>{const top=ranked.slice(0,maxVisible);if(!mineId||top.some((x:any)=>x.id===mineId))return top;const mine=ranked.find((x:any)=>x.id===mineId);return mine?[...ranked.slice(0,maxVisible-1),mine]:top})();

 // 점수 절대값 대신 순위층으로 분리합니다. 현재 점수 분포가 80점대에 몰려도 노드가 한곳에 겹치지 않습니다.
 const layerOf=(index:number)=>index<4?0:index<10?1:2;
 const layerStart=[0,4,10];
 const layerCount=[Math.min(4,visible.length),Math.min(6,Math.max(0,visible.length-4)),Math.min(6,Math.max(0,visible.length-10))];
 const layerRadius=[22,32,42];
 const nodes=visible.map((item:any,index:number)=>{
   const score=Math.max(0,Math.min(100,scoreOf(item,'인연의깊이')||60));
   const layer=layerOf(index);
   const within=index-layerStart[layer];
   const count=Math.max(1,layerCount[layer]);
   const angleOffset=[-Math.PI/2,-Math.PI/2+Math.PI/6,-Math.PI/2][layer];
   const angle=angleOffset+(within/count)*Math.PI*2;
   const scoreNudge=((score-85)/15)*1.2;
   const radius=Math.max(layerRadius[layer]-1.4,Math.min(layerRadius[layer]+1.4,layerRadius[layer]-scoreNudge));
   return {...item,x:50+Math.cos(angle)*radius,y:50+Math.sin(angle)*radius,score,rank:rankById.get(item.id)||null};
 });

 const renderNode=(n:any)=>{
   const isMine=n.id===mineId;
   const inner=<><span className="map-role">{n.participant_role||n.relationship_type||'인연'}</span><b>{isMine?'나':n.nickname}</b>{isMine&&<em className="map-mine-tag">나</em>}</>;
   return clickable
     ? <Link to={`/result/${n.id}`} key={n.id} className={`radial-node ${isMine?'mine-node':''}`} style={{left:`${n.x}%`,top:`${n.y}%`}} title={`${n.nickname} · ${n.participant_role||n.relationship_type||'인연'}`}>{inner}</Link>
     : <div key={n.id} className={`radial-node visitor-node ${isMine?'mine-node':''}`} style={{left:`${n.x}%`,top:`${n.y}%`}} title={isMine?`나 · ${n.participant_role||n.relationship_type||'인연'}`:`${n.nickname} · ${n.participant_role||n.relationship_type||'인연'}`}>{inner}</div>;
 };

 return <div className="radial-card card">
   <div className="radial-title">
     <p className="eyebrow">전생 인연지도</p>
     <h2>{mineId?'내 자리도 지도에 추가됐어요':'누가 내 곁에 가장 가까이 있을까?'}</h2>
     <p>중심에 가까운 층일수록 인연의 깊이 순위가 높습니다. 원 안에는 나와의 전생 역할이 표시됩니다.</p>
   </div>
   <div className="radial-map">
     <div className="orbit rank-orbit rank-orbit-inner"/>
     <div className="orbit rank-orbit rank-orbit-middle"/>
     <div className="orbit rank-orbit rank-orbit-outer"/>
     <svg className="connection-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
       {nodes.map((n:any,index:number)=><g key={`line-${n.id}`} className="map-connection"><line className="connection-base" x1="50" y1="50" x2={n.x} y2={n.y}/><line className="connection-flow" x1="50" y1="50" x2={n.x} y2={n.y} style={{animationDelay:`-${(index%6)*0.28}s`}}/></g>)}
     </svg>
     <div className="center-person"><b>{owner}</b><small>{clickable?'나':'지도 주인'}</small></div>
     {nodes.map(renderNode)}
   </div>
   {safeItems.length>maxVisible&&<p className="radial-more">상위 인연을 중심으로 표시 중 · {safeItems.length-maxVisible}명 더 있음</p>}
 </div>
}

function RelationshipRanking({items,mineId,ownerMode=false}:{items:any[];mineId?:string|null;ownerMode?:boolean}){
 const ranked=[...(items||[])].sort((a:any,b:any)=>scoreOf(b,'인연의깊이')-scoreOf(a,'인연의깊이'));
 if(!ranked.length)return null;
 return <section className="ranking-card ranking-list-card"><div className="ranking-heading"><p className="eyebrow">인연의 깊이 순</p><h3>전생 인연 랭킹</h3></div><div className="clean-ranking-list">{ranked.map((x:any,index:number)=>{const isMine=x.id===mineId;const row=<><span className={`clean-rank-number ${index<3?`rank-top-${index+1}`:''}`}>{index+1}</span><div className="clean-rank-main"><div className="clean-rank-name"><b>{isMine?'나':x.nickname}</b>{isMine&&<em>나</em>}</div><span>{x.relationship_type}</span></div><strong>{scoreOf(x,'인연의깊이')}<small>점</small></strong></>;return ownerMode?<Link key={x.id} className={`clean-rank-row ${isMine?'mine-row':''}`} to={`/result/${x.id}`}>{row}</Link>:<div key={x.id} className={`clean-rank-row ${isMine?'mine-row':''}`}>{row}</div>})}</div>{!ownerMode&&<p className="ranking-private-note">다른 참여자의 상세 관계 정보는 공개되지 않습니다.</p>}</section>
}

function rankInfo(items:any[],mineId?:string|null){
 const ranked=[...(items||[])].sort((a:any,b:any)=>scoreOf(b,'인연의깊이')-scoreOf(a,'인연의깊이'));
 const index=ranked.findIndex((x:any)=>x.id===mineId);
 if(index<0)return null;
 const item=ranked[index];
 return {rank:index+1,total:ranked.length,item,score:scoreOf(item,'인연의깊이')};
}

function Page(){usePageMeta('전생 인연지도 | 사주로 보는 전생의 인연',undefined,true);const {slug}=useParams();const [data,setData]=React.useState<any>(null);const [loading,setLoading]=React.useState(true);const [ownerMode,setOwnerMode]=React.useState(false);const [ownerPasswordEnabled,setOwnerPasswordEnabled]=React.useState(false);const [showOwnerLogin,setShowOwnerLogin]=React.useState(false);const [ownerPassword,setOwnerPassword]=React.useState('');const [ownerLoginBusy,setOwnerLoginBusy]=React.useState(false);const [ownerLoginError,setOwnerLoginError]=React.useState('');const [setupPassword,setSetupPassword]=React.useState('');const [setupPasswordConfirm,setSetupPasswordConfirm]=React.useState('');const [setupBusy,setSetupBusy]=React.useState(false);const [setupMessage,setSetupMessage]=React.useState('');
 const mineId=new URLSearchParams(location.search).get('mine');
 const verifyOwner=React.useCallback(async()=>{const ownerToken=localStorage.getItem(`owner:${slug}`)||'';try{const r=await fetch(`${OWNER_AUTH_API}/verify`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug,owner_token:ownerToken})});const d=await r.json();if(r.ok){setOwnerMode(!!d.owner_authenticated);setOwnerPasswordEnabled(!!d.owner_password_enabled);if(ownerToken&&!d.owner_authenticated)localStorage.removeItem(`owner:${slug}`)}else{setOwnerMode(false)}}catch{setOwnerMode(false)}},[slug]);
 const load=React.useCallback(async()=>{setLoading(true);try{const [pageRes,elRes]=await Promise.all([fetch(`${API}/pages/${encodeURIComponent(slug||'')}`),fetch(`${ELEMENTS_API}?slug=${encodeURIComponent(slug||'')}`).catch(()=>null),verifyOwner()]);const d=await pageRes.json();if(!pageRes.ok){setData(null);return}let ed:any=null;if(elRes&&elRes.ok){try{ed=await elRes.json()}catch{}}const byRel=new Map((ed?.relationships||[]).map((x:any)=>[x.relationship_id,x.day_element]));const relationships=(d.relationships||[]).map((x:any)=>({...x,day_element:byRel.get(x.id)||null}));setData({...d,owner_element:ed?.owner_element||null,relationships})}finally{setLoading(false)}},[slug,verifyOwner]);
 React.useEffect(()=>{load()},[load]);React.useEffect(()=>{if(slug)track('page_view',{page_slug:slug})},[slug]);
 if(loading)return <Shell><div className="card loading-card">인연지도를 불러오는 중...</div></Shell>;if(!data)return <Shell><div className="card">존재하지 않는 인연지도입니다.</div></Shell>;
 const mine=data.relationships?.find((x:any)=>x.id===mineId);const mineRank=rankInfo(data.relationships||[],mineId);
 const submit=async(v:PersonInput)=>{const r=await fetch(`${API}/pages/${encodeURIComponent(slug||'')}/join`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(toApi(v))});const d=await r.json();if(!r.ok)throw new Error(d.error||'인연을 확인하지 못했습니다. 잠시 후 다시 시도해주세요.');track('join_submit',{page_slug:slug,relationship_id:d.relationship_id});location.href=`/n/${encodeURIComponent(slug||'')}?mine=${encodeURIComponent(d.relationship_id)}`};
 const share=async()=>{track('share_click',{page_slug:slug,metadata:{source:'map'}});const url=`${location.origin}/n/${slug}`;if(navigator.share){try{await navigator.share({title:`${data.owner_nickname}의 전생 인연지도`,text:`나랑 전생에 무슨 사이였는지 확인해봐!`,url});return}catch{}}await navigator.clipboard.writeText(url);alert('공유 링크를 복사했습니다.');};
 const loginOwner=async(e:React.FormEvent)=>{e.preventDefault();if(ownerLoginBusy)return;setOwnerLoginError('');if(ownerPassword.length<4){setOwnerLoginError('비밀번호를 입력해주세요.');return}setOwnerLoginBusy(true);try{const r=await fetch(`${OWNER_AUTH_API}/login`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug,password:ownerPassword})});const d=await r.json();if(!r.ok)throw new Error(d.code==='PASSWORD_NOT_SET'?'이 지도에는 아직 비밀번호가 설정되어 있지 않습니다. 처음 만들었던 기기에서 먼저 비밀번호를 설정해주세요.':d.error||'비밀번호를 확인하지 못했습니다.');localStorage.setItem(`owner:${slug}`,d.owner_token);setOwnerPassword('');setShowOwnerLogin(false);await verifyOwner()}catch(err:any){setOwnerLoginError(err?.message||'비밀번호를 확인하지 못했습니다.')}finally{setOwnerLoginBusy(false)}};
 const setLegacyPassword=async(e:React.FormEvent)=>{e.preventDefault();setSetupMessage('');if(setupPassword.length<4||setupPassword.length>20){setSetupMessage('비밀번호는 4~20자로 입력해주세요.');return}if(setupPassword!==setupPasswordConfirm){setSetupMessage('비밀번호 확인이 일치하지 않습니다.');return}const ownerToken=localStorage.getItem(`owner:${slug}`)||'';setSetupBusy(true);try{const r=await fetch(`${OWNER_AUTH_API}/setup`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug,owner_token:ownerToken,password:setupPassword})});const d=await r.json();if(!r.ok)throw new Error(d.error||'비밀번호를 설정하지 못했습니다.');setOwnerPasswordEnabled(true);setSetupPassword('');setSetupPasswordConfirm('');setSetupMessage('비밀번호가 설정되었습니다. 이제 다른 기기에서도 이 주소와 비밀번호로 내 지도를 열 수 있습니다.')}catch(err:any){setSetupMessage(err?.message||'비밀번호를 설정하지 못했습니다.')}finally{setSetupBusy(false)}};
 const publicMap=data.relationships?.length>0?<RadialMap owner={data.owner_nickname} ownerElement={data.owner_element} items={data.relationships} clickable={ownerMode} mineId={mineId}/>:<div className="empty-public-map"><b>아직 등록된 인연이 없어요</b><p>{ownerMode?'친구에게 이 지도를 보내 첫 번째 전생 인연을 찾아보세요.':`첫 번째로 참여해서 ${data.owner_nickname}의 인연지도를 시작해보세요.`}</p>{ownerMode&&<button className="primary" onClick={share}>친구에게 지도 공유하기</button>}</div>;
 return <Shell><section><p className="eyebrow">전생 인연지도</p><h1>{data.owner_nickname}의<br/>전생 인연지도</h1><div className="count"><span>지금까지 참여한 인연</span><strong>{data.count}명</strong></div>
 {!ownerMode&&<div className="owner-entry"><button type="button" className="owner-entry-button" onClick={()=>{setShowOwnerLogin(v=>!v);setOwnerLoginError('')}}>이 지도의 주인인가요? <b>내 지도 열기</b></button>{showOwnerLogin&&<form className="owner-login-card" onSubmit={loginOwner}><div><strong>{data.owner_nickname}님의 인연지도</strong><span>만들 때 설정한 비밀번호만 입력하면 됩니다.</span></div><label>비밀번호<input autoFocus type="password" autoComplete="current-password" minLength={4} maxLength={20} value={ownerPassword} onChange={e=>setOwnerPassword(e.target.value)} placeholder="내 지도 비밀번호"/></label>{ownerLoginError&&<p className="form-error" role="alert">{ownerLoginError}</p>}<button disabled={ownerLoginBusy} className="primary">{ownerLoginBusy?'확인 중…':'내 지도 열기'}</button></form>}</div>}
 {ownerMode?<>{!ownerPasswordEnabled&&<section className="owner-password-setup card"><p className="eyebrow">기존 지도 보안 설정</p><h2>다른 기기에서도 내 지도를 열어보세요</h2><p>이 지도에는 아직 비밀번호가 없습니다. 지금 한 번 설정해두면 새 휴대폰이나 다른 브라우저에서도 지도 주소와 비밀번호만으로 다시 열 수 있습니다.</p><form onSubmit={setLegacyPassword}><label>새 비밀번호 <span>4~20자</span><input type="password" autoComplete="new-password" minLength={4} maxLength={20} required value={setupPassword} onChange={e=>setSetupPassword(e.target.value)}/></label><label>비밀번호 확인<input type="password" autoComplete="new-password" minLength={4} maxLength={20} required value={setupPasswordConfirm} onChange={e=>setSetupPasswordConfirm(e.target.value)}/></label>{setupMessage&&<p className="owner-setup-message">{setupMessage}</p>}<button className="secondary" disabled={setupBusy}>{setupBusy?'설정 중…':'내 지도 비밀번호 설정'}</button></form></section>}{publicMap}<RelationshipRanking items={data.relationships} mineId={mineId} ownerMode={true}/>{data.relationships.length>0&&<HighlightGrid items={data.relationships} count={data.count}/>} {data.relationships.length>0&&<><button className="primary map-share-button" onClick={share}>친구에게 공유하기</button><p className="viral-copy">친구가 참여할수록 인연지도가 더 풍성해집니다.</p></>}</>:
 mine?<><section className="join-reveal"><div className="join-reveal-hero card"><div className="join-check">✓</div><p className="eyebrow">인연지도 참여 완료</p><h2>{mine.nickname}님이<br/>{data.owner_nickname}의 인연에 추가됐어요</h2><p>지도에서 강조된 노드가 내 자리입니다.</p>{mineRank&&<div className="my-rank-summary"><div><small>현재 순위</small><strong>{mineRank.rank}<span>위</span></strong></div><div><small>인연의 깊이</small><strong>{mineRank.score}<span>점</span></strong></div><div><small>전체 참여</small><strong>{mineRank.total}<span>명</span></strong></div></div>}</div>{publicMap}<Link className="primary link detail-cta detail-under-map" to={`/result/${mine.id}`}>{data.owner_nickname}와 관계 자세히 보기</Link><p className="detail-hint">이 상세 결과는 본인 관계만 열 수 있어요.</p><RelationshipRanking items={data.relationships} mineId={mineId}/><HighlightGrid items={data.relationships} count={data.count}/><div className="mine-relation-preview card"><span className="mine-preview-icon">{relationIcon(mine.type_code,mine.relationship_type)}</span><div><small>나와 {data.owner_nickname}의 전생 관계</small><h3>{mine.relationship_type}</h3><p>전생 역할과 관계 점수, 사주 근거를 더 자세히 확인해보세요.</p></div></div><button className="secondary visitor-share" onClick={share}>이 인연지도 친구에게 공유하기</button></section></>:
 <><section className="visitor-map-top">{publicMap}<RelationshipRanking items={data.relationships}/></section><section className="visitor-input-section"><div className="join-intro"><p className="eyebrow">내 인연 추가하기</p><h2>{data.owner_nickname}과 나는<br/>전생에 무슨 사이였을까?</h2><p className="muted">아래에 내 정보를 입력하면 {data.owner_nickname}의 인연지도에 내 자리가 추가됩니다.</p></div><PersonForm buttonText="내 자리 인연지도에 추가하기" onSubmit={submit}/></section><section className="visitor-unlock-section"><HighlightGrid items={data.relationships} count={data.count}/></section></>}
 <AdFitBanner unit={ADFIT_UNITS.map}/></section></Shell>}

function ScoreBars({scores}:{scores:Record<string,number>}){const help=(k:string)=>k==='충돌'?'높을수록 서로 부딪히거나 강하게 자극하기 쉬워요.':k==='질긴인연'?'높을수록 쉽게 잊히지 않는 연결이 강해요.':k==='서로에게주는영향'?'높을수록 서로에게 미치는 영향이 커요.':k==='신뢰'?'높을수록 믿고 의지하는 흐름이 강해요.':'높을수록 두 사람 사이의 연결이 깊게 나타나요.';return <section className="scores"><div className="score-title"><p className="eyebrow">관계 지표</p><h3>두 사람 사이에 남은 흔적</h3></div>{Object.entries(scores||{}).map(([k,v])=>{const n=Math.max(0,Math.min(100,Number(v)||0));return <div className="score-row" key={k}><div className="score-head"><span>{k}</span><b>{n}</b></div><div className="score-track"><span style={{width:`${n}%`}}/></div><small>{help(k)}</small></div>})}</section>}

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
 const bg=ctx.createLinearGradient(0,0,1080,1920);bg.addColorStop(0,'#f6eadb');bg.addColorStop(.42,'#efe0cf');bg.addColorStop(1,'#e6d2bd');ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1920);
 const glow=ctx.createRadialGradient(540,340,20,540,340,470);glow.addColorStop(0,'rgba(118,83,56,.12)');glow.addColorStop(1,'rgba(118,83,56,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,1080,850);
 ctx.textAlign='center';ctx.fillStyle='#765338';ctx.font='800 30px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';ctx.fillText('사주로 보는 전생의 인연',540,110);
 ctx.font='110px sans-serif';ctx.fillText(relationIcon(r.typeCode,r.label),540,305);
 ctx.fillStyle='#765338';ctx.font='700 27px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';ctx.fillText(r.era||'전생 기록',540,385);
 ctx.fillStyle='#302820';fitText(ctx,r.label,850,78,44,900);ctx.fillText(r.label,540,500);
 ctx.fillStyle='#4e4035';ctx.font='800 38px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';ctx.fillText(`${r.ownerNickname}  ×  ${r.participantNickname}`,540,575);

 drawRoundRect(ctx,110,655,860,260,38,'rgba(255,253,248,.92)','#d8c2aa');
 ctx.fillStyle='#877769';ctx.font='700 22px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';ctx.fillText('전생의 역할',540,710);
 ctx.fillStyle='#302820';ctx.font='800 33px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';ctx.fillText(r.ownerNickname,320,790);ctx.fillText(r.participantNickname,760,790);
 ctx.fillStyle='#765338';ctx.font='700 28px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';ctx.fillText(r.ownerRole,320,845);ctx.fillText(r.participantRole,760,845);

 drawRoundRect(ctx,110,960,860,330,38,'rgba(255,253,248,.92)','#d8c2aa');
 ctx.textAlign='left';ctx.fillStyle='#765338';ctx.font='800 23px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';ctx.fillText('전생의 한마디',165,1025);
 ctx.fillStyle='#4e4035';ctx.font='700 36px Georgia,"Noto Serif KR",serif';wrapCanvasText(ctx,`“${r.oneLiner||''}”`,165,1100,750,55,4);

 const scores=Object.entries(r.scores||{}).slice(0,3) as [string,any][];
 let sy=1375;ctx.textAlign='left';
 for(const [k,v] of scores){const n=Math.max(0,Math.min(100,Number(v)||0));ctx.fillStyle='#76695f';ctx.font='700 25px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';ctx.fillText(k,145,sy);ctx.textAlign='right';ctx.fillStyle='#302820';ctx.fillText(String(n),935,sy);ctx.textAlign='left';drawRoundRect(ctx,145,sy+22,790,13,7,'#e4d7c8');const g=ctx.createLinearGradient(145,0,935,0);g.addColorStop(0,'#9a7454');g.addColorStop(1,'#c29a73');drawRoundRect(ctx,145,sy+22,790*(n/100),13,7,g as any);sy+=105;}

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


const storyParagraphs=(story?:string|null)=>{
 const clean=String(story||'').replace(/\s+/g,' ').trim();
 if(!clean)return [];
 const sentences=clean.match(/[^.!?！？。]+[.!?！？。]?/g)?.map(x=>x.trim()).filter(Boolean)||[clean];
 const paragraphs:string[]=[];
 for(let i=0;i<sentences.length;i+=2) paragraphs.push(sentences.slice(i,i+2).join(' '));
 return paragraphs;
};

type EditorialLink={href:string;title:string;description:string};
const EDITORIAL_LINKS:Record<string,EditorialLink>={
 wonjin:{href:'/contents/wonjin.html',title:'원진 관계란?',description:'쉽게 끊기지 않는 긴장과 감정의 꼬임을 읽는 법'},
 samhap:{href:'/contents/samhap.html',title:'삼합이 만드는 연결감',description:'여러 관계 신호가 한 방향으로 모일 때의 의미'},
 harmony:{href:'/contents/harmony-conflict.html',title:'합·충·형·파·해는 어떻게 다를까',description:'끌림과 충돌을 한쪽의 좋고 나쁨으로 보지 않는 이유'},
 elements:{href:'/contents/five-elements.html',title:'오행과 인간관계',description:'상생과 상극을 도움과 자극의 흐름으로 읽는 법'},
 stems:{href:'/contents/heavenly-stems.html',title:'천간으로 보는 관계의 방향',description:'일간과 천간 관계가 어떤 흐름을 만드는지 알아보기'},
 branches:{href:'/contents/earthly-branches.html',title:'지지와 일지로 보는 관계',description:'관계 해석에서 일지와 지지 신호를 읽는 방법'},
 score:{href:'/contents/relationship-score.html',title:'관계 점수는 어떻게 읽어야 할까',description:'높은 숫자가 곧 좋은 관계를 뜻하지 않는 이유'},
 goodbad:{href:'/contents/good-bad-relationship.html',title:'좋은 인연과 나쁜 인연을 나눌 수 있을까',description:'충돌이 높아도 의미 있는 관계가 될 수 있는 이유'},
 repeating:{href:'/contents/repeating-relationships.html',title:'왜 비슷한 관계가 반복된다고 느낄까',description:'질긴 인연과 반복되는 관계 패턴을 바라보는 방법'},
 types:{href:'/contents/pastlife-types.html',title:'전생 관계 유형은 어떻게 만들어질까',description:'여러 관계 신호가 하나의 이야기 유형이 되는 과정'},
};
function editorialRecommendations(r:any):EditorialLink[]{
 const b=r?.analysisBasis||{};
 const factors=(Array.isArray(b?.key_factors)?b.key_factors:[]).map((x:any)=>String(x).toLowerCase());
 const text=[...factors,String(r?.label||''),String(r?.typeCode||'')].join(' ');
 const vector=b?.vector||{};
 const score=(...keys:string[])=>Math.max(0,...keys.map(k=>Number(r?.scores?.[k]??vector?.[k]??0)));
 const picks:string[]=[];
 const add=(k:string)=>{if(EDITORIAL_LINKS[k]&&!picks.includes(k))picks.push(k)};
 if(/원진|wonjin/.test(text))add('wonjin');
 if(/삼합|samhap|three.?harmony/.test(text))add('samhap');
 if(/충|형|파|해|합|clash|harm|break|punish|combine|六合|육합/.test(text))add('harmony');
 if(/상생|상극|오행|wood|fire|earth|metal|water|생|극/.test(text))add('elements');
 if(/일간|천간|stem/.test(text))add('stems');
 if(/일지|지지|branch/.test(text))add('branches');
 if(score('충돌','conflict','rivalry')>=65)add('goodbad');
 if(score('질긴인연','attachment')>=65)add('repeating');
 add('score'); add('types');
 return picks.slice(0,3).map(k=>EDITORIAL_LINKS[k]);
}
function RelatedReading({relationship}:{relationship:any}){
 const links=editorialRecommendations(relationship);
 return <section className="related-reading" aria-labelledby="related-reading-title"><div className="section-kicker">결과 해설</div><h2 id="related-reading-title">이 결과에 나온 개념 더 읽어보기</h2><p>지금 결과에서 눈에 띄는 관계 신호와 가까운 해설을 골랐습니다.</p><div className="related-reading-links">{links.map(x=><a key={x.href} href={x.href}><b>{x.title}</b><span>{x.description}</span></a>)}</div></section>;
}

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
     <p className="eyebrow">심층 관계 해석</p>
     <h1>{r.ownerNickname} × {r.participantNickname}<br/>사주 관계 심층 해석</h1>
     <p>두 사람의 일간·일지·오행 관계와 합·충 요소를 조금 더 자세하게 풀어봤어요. 아래 내용은 전통 명리 요소를 활용한 엔터테인먼트 해석입니다.</p>
   </div>

   <div className="deep-summary card">
     <span className="deep-symbol">☯</span>
     <div><small>핵심 전생 관계</small><h2>{r.label}</h2><p>“{r.oneLiner}”</p></div>
   </div>

   <div className="card deep-pastlife-story">
     <div className="section-title"><div><small>전생 관계 이야기</small><h3>두 사람은 어떤 인연이었을까요?</h3></div></div>
     <div className="deep-story-body">{storyParagraphs(r.story||r.oneLiner).map((paragraph:string,index:number)=><p key={index}>{paragraph}</p>)}</div>
     <p className="deep-story-note">전통 명리 요소를 바탕으로 구성한 엔터테인먼트용 전생 스토리 해석입니다.</p>
   </div>

   <AdFitBanner unit={ADFIT_UNITS.sajuMiddle}/>

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
     <div className="section-title"><div><small>사주 원국</small><h3>두 사람의 주요 기둥</h3></div></div>
     <div className="pillar-grid">
       <div><b>{r.ownerNickname}</b><span>연주 {pillars?.a?.year||'-'}</span><span>월주 {pillars?.a?.month||'-'}</span><span>일주 {pillars?.a?.day||'-'}</span><span>시주 {pillars?.a?.hour||'미입력'}</span></div>
       <div><b>{r.participantNickname}</b><span>연주 {pillars?.b?.year||'-'}</span><span>월주 {pillars?.b?.month||'-'}</span><span>일주 {pillars?.b?.day||'-'}</span><span>시주 {pillars?.b?.hour||'미입력'}</span></div>
     </div>
   </div>

   <div className="card deep-factors">
     <div className="section-title"><div><small>관계 근거</small><h3>두 사람 사이에서 강하게 잡힌 요소</h3></div></div>
     {factors.length?<div className="deep-factor-list">{factors.map((x:string)=><span key={x}>{x}</span>)}</div>:<p className="muted">강하게 잡힌 특수 요소가 많지 않은 조합입니다.</p>}
     <p className="deep-explain">이 요소들은 전통 명리의 합·충·형·파·해·원진과 오행의 상생·상극을 관계 성향으로 바꿔 해석한 것입니다.</p>
   </div>

   <div className="card vector-card">
     <div className="section-title"><div><small>관계 성향</small><h3>어떤 성향이 특히 강한가요?</h3></div></div>
     <div className="vector-detail-list">
       {sortedVector.map(([k,v]:any)=><div className="vector-detail-row" key={k}>
         <div><span>{vectorLabel(k)}</span><b>{Number(v)}</b></div>
         <div className="vector-detail-track"><span style={{width:`${Math.max(0,Math.min(100,Number(v)))}%`}}/></div>
       </div>)}
     </div>
   </div>

   {candidates.length>1&&<div className="card candidate-card">
     <div className="section-title"><div><small>관계 후보</small><h3>비슷하게 나타난 전생 관계</h3></div></div>
     <p className="muted">현재 결과와 비슷한 성향으로 계산된 다른 관계 유형입니다.</p>
     <div className="candidate-list">{candidates.map((x:any,i:number)=><div key={x.code||i}><span>{i+1}</span><div><b>{x.label}</b><small>{x.category}</small></div></div>)}</div>
   </div>}

   <div className="card deep-advice">
     <div className="section-title"><div><small>현생 관계 포인트</small><h3>이 관계를 이렇게 보면 재미있어요</h3></div></div>
     <p>점수가 높은 요소는 두 사람이 자연스럽게 반복하기 쉬운 관계 패턴이고, 충돌이 높은 요소는 서로 다름을 강하게 느끼기 쉬운 부분입니다. 좋은 관계와 나쁜 관계를 판정하기보다, “왜 이 사람과 이런 분위기가 생기는지”를 보는 재미로 활용해보세요.</p>
   </div>

   <AdFitBanner unit={ADFIT_UNITS.sajuBottom}/>
   <RelatedReading relationship={r}/>
   <Link className="secondary link" to={`/result/${id}`}>← 기본 관계 결과로 돌아가기</Link>
 </section></Shell>
}

function Result(){usePageMeta('전생 관계 결과 | 사주로 보는 전생의 인연',undefined,true);const {id}=useParams();const [d,setD]=React.useState<any>(null);const [error,setError]=React.useState(false);const [making,setMaking]=React.useState(false);React.useEffect(()=>{fetch(`${API}/relationships/${encodeURIComponent(id||'')}`).then(async r=>{const j=await r.json();if(!r.ok)throw new Error();setD(j);track('result_view',{page_slug:j?.relationship?.pageSlug,relationship_id:id})}).catch(()=>setError(true))},[id]);if(error)return <Shell><div className="card">전생 기록을 찾을 수 없습니다.</div></Shell>;if(!d?.relationship)return <Shell><div className="card loading-card">두 사람의 전생 기록을 펼치는 중...</div></Shell>;
 const r=d.relationship;const icon=relationIcon(r.typeCode,r.label);const basis=r.analysisBasis;const factors=Array.isArray(basis?.key_factors)?basis.key_factors:[];
 const share=async()=>{track('share_click',{page_slug:r.pageSlug,relationship_id:id,metadata:{source:'result'}});const url=location.href;const text=`${r.ownerNickname} × ${r.participantNickname}\n${icon} ${r.label}\n“${r.oneLiner}”`;if(navigator.share){try{await navigator.share({title:'사주로 보는 전생의 인연',text,url});return}catch{}}await navigator.clipboard.writeText(`${text}\n${url}`);alert('결과와 링크를 복사했습니다.');};
 const storyShare=async()=>{track('story_share',{page_slug:r.pageSlug,relationship_id:id});setMaking(true);try{await shareStoryCard(r)}finally{setMaking(false)}};
 return <Shell><section className="result"><header className="result-hero"><p className="eyebrow">{r.era||'전생 기록'}</p><div className="result-icon" aria-hidden="true">{icon}</div><h1>{r.label}</h1><p className="pair">{r.ownerNickname} <span>×</span> {r.participantNickname}</p><p className="result-quote">“{r.oneLiner}”</p><div className="hero-roles"><div><small>{r.ownerNickname}</small><strong>{r.ownerRole}</strong></div><div><small>{r.participantNickname}</small><strong>{r.participantRole}</strong></div></div></header>
 <section className="story result-section"><p className="eyebrow">전생 기록</p><h2>두 사람의 이야기</h2><div className="result-long-story">{storyParagraphs(r.story||r.oneLiner).map((paragraph:string,index:number)=><p key={index}>{paragraph}</p>)}</div></section>
 <AdFitBanner unit={ADFIT_UNITS.resultMiddle}/>
 <ScoreBars scores={r.scores||{}}/>
 {factors.length>0&&<section className="basis result-section"><p className="eyebrow">관계 근거</p><h2>이 결과에 영향을 준 요소</h2><div className="factor-list">{factors.map((x:string)=><span key={x}>{x}</span>)}</div><p className="basis-copy">두 사람의 일간·일지와 오행의 상생·상극, 합·충 관계를 함께 계산해 가장 가까운 전생 관계 유형을 찾았습니다.</p>{basis?.notice&&<p className="basis-notice">{basis.notice}</p>}</section>}
 <section className="deep-unlock-card"><div><small>심층 관계 해석</small><h3>사주 관계를 더 자세히 보고 싶다면</h3><p>두 사람의 오행, 사주 기둥, 합·충 요소와 관계 성향을 더 자세히 확인할 수 있어요.</p></div><Link className="primary link" to={`/saju/${id}`}>심층 사주 해석 보기</Link></section>
 <RelatedReading relationship={r}/>
 <AdFitBanner unit={ADFIT_UNITS.resultBottom}/>
 <section className="viral-result-section"><div className="viral-result-head"><p className="eyebrow">공유</p><h2>이 결과 공유하기</h2><p>친구에게 결과를 보내거나, 이번에는 내가 중심이 되는 인연지도를 만들어보세요.</p></div><button className="primary share-btn" onClick={share}>친구에게 결과 공유하기</button><button disabled={making} className="story-share" onClick={storyShare}>{making?'이미지 만드는 중…':'스토리 이미지 만들기'}</button><div className="become-owner-card"><div><small>이번에는 내가 중심이 되어볼까요?</small><h3>내 전생 인연지도 만들기</h3></div><Link className="secondary link" to="/create">내 인연지도 만들기</Link></div>{r.pageSlug&&<Link className="return-map-btn" to={`/n/${r.pageSlug}`}>← {r.ownerNickname}의 인연지도 돌아가기</Link>}</section></section></Shell>}


const RELATION_GUIDE=[
['👑','임금과 충신','책임과 신뢰가 강하게 연결된 인연'],['📜','임금과 책사','결단과 조언이 맞물리는 인연'],['⚔️','목숨을 맡긴 전우','위기에서 서로를 믿는 인연'],['📖','스승과 제자','배움과 성장의 영향을 주고받는 인연'],['🔥','숙명의 라이벌','부딪치면서 서로를 성장시키는 인연'],['🤝','평생의 벗','편안함과 신뢰가 오래 이어지는 인연'],['💘','이루지 못한 연인','강한 끌림과 아쉬움이 함께 남는 인연'],['💎','목숨을 구한 은인','한 사람이 다른 사람에게 큰 힘이 되는 인연'],['💰','상단의 경쟁자','목표를 두고 실력을 겨루는 인연'],['💥','사고뭉치와 해결사','문제를 만들고 수습하며 맞물리는 인연'],['🛡️','호위무사와 왕족','보호와 책임이 강하게 드러나는 인연'],['🪢','원수에서 친구로','충돌해도 쉽게 끊어지지 않는 인연'],['🏠','한집의 형제자매','티격태격해도 익숙함이 남는 인연'],['🧭','길 위에서 만난 동행','같은 방향을 바라보며 함께하는 인연'],['🌿','치유자와 환자','회복과 안정에 영향을 주는 인연'],['🎨','후원자와 예술가','재능을 알아보고 밀어주는 인연'],['🌙','금지된 사랑','끌림과 제약이 동시에 강한 인연'],['💌','엇갈린 짝사랑','마음의 속도와 방향이 다른 인연'],['🏘️','이웃 마을 라이벌','가깝기에 더 자주 경쟁하는 인연'],['⛵','선장과 항해사','목표와 방향을 함께 맞추는 인연'],['⚔️','장군과 부관','결단과 실행이 맞물리는 인연'],['🩸','피보다 진한 의형제','선택한 신뢰가 가족처럼 깊어진 인연'],['🏃','도망친 혼례의 두 사람','강한 결속과 변화 욕구가 함께하는 인연'],['🍶','주막 주인과 단골','반복된 만남이 만든 편안한 인연'],['🧹','주인과 말 안 듣는 하인','부딪치면서 계속 엮이는 인연'],['🛟','위기에서 만난 구조자','필요한 순간 큰 영향을 남기는 인연'],['🍃','스쳐 지나간 오래된 인연','강렬하지 않아도 익숙하게 느껴지는 인연']];

function About(){usePageMeta("서비스 소개 | 사주로 보는 전생의 인연","전생 인연지도 서비스의 목적, 계산 방식, 개인정보 이용과 서비스 성격을 안내합니다.",false);return <Shell><article className="editorial">
<p className="eyebrow">ABOUT</p><h1>사주로 보는<br/>전생의 인연</h1>
<p className="lead">생년월일을 바탕으로 두 사람의 사주 관계를 계산하고, 그 결과를 전생의 역할과 이야기로 재해석하는 소셜 엔터테인먼트 서비스입니다.</p>
<section><h2>이 서비스가 하는 일</h2><p>한 사람의 운세를 단독으로 보는 서비스가 아니라 두 사람의 관계에 초점을 둡니다. 일간과 일지, 오행의 상생·상극, 천간합과 지지의 합·충·형·파·해·원진 등 여러 관계 요소를 함께 계산한 뒤 친밀감, 신뢰, 충돌, 성장 자극, 질긴 인연 같은 관계 지표로 바꿉니다. 그 지표를 기반으로 가장 가까운 전생 관계 유형과 역할을 선택합니다.</p></section>
<section><h2>왜 ‘전생’이라는 이야기 형식을 사용하나요?</h2><p>사주 관계는 숫자만 보여주면 어렵고 딱딱하게 느껴질 수 있습니다. 그래서 계산된 관계 특징을 왕과 신하, 스승과 제자, 평생의 벗, 숙명의 라이벌처럼 이해하기 쉬운 이야기 구조로 옮겼습니다. 실제 전생을 증명하거나 미래를 예언하기 위한 것이 아니라, 서로의 관계를 이야기해보는 재미를 위한 장치입니다.</p></section>
<AdFitBanner unit={ADFIT_UNITS.info}/><section><h2>인연지도는 어떻게 구성되나요?</h2><p>페이지 주인을 중심으로 친구들이 하나씩 추가됩니다. 인연의 깊이 점수가 높은 사람일수록 지도 중심에 가깝게 배치되고, 각 사람에게는 페이지 주인 기준의 전생 역할이 표시됩니다. 참여자가 늘어나면 가장 깊은 인연, 서로 힘이 되는 인연, 많이 부딪히는 인연처럼 눈에 띄는 관계도 함께 비교할 수 있습니다.</p></section>
<section><h2>결과는 어떻게 계산되나요?</h2><p>닉네임과 생년월일, 양력·음력 여부를 바탕으로 사주 기둥을 계산하고, 두 사람 사이에서 합·충과 오행 관계가 어떻게 나타나는지 비교합니다. 출생시간은 선택 정보이며 모르는 경우에도 이용할 수 있습니다. 결과는 여러 관계 지표를 조합하여 결정되며 단일 요소 하나만으로 관계를 판정하지 않습니다.</p></section>
<section><h2>결과를 어떻게 받아들여야 하나요?</h2><p>본 서비스는 전통 명리 요소에서 아이디어를 얻은 엔터테인먼트 콘텐츠입니다. 의료·법률·금융 판단이나 중요한 인간관계 결정을 대신하지 않습니다. 결과가 실제 관계를 규정한다고 보기보다, 서로의 차이와 공통점을 가볍게 이야기하는 소재로 이용해 주세요.</p></section>
<section><h2>운영 및 문의</h2><p>서비스 기능, 개인정보, 오류 신고 및 기타 문의는 <a href="mailto:kikine901@gmail.com">kikine901@gmail.com</a>으로 보내주세요.</p></section>
<Link className="primary link" to="/create">내 인연지도 만들어보기</Link>
</article></Shell>}

function Guide(){usePageMeta("전생 인연 관계 유형 | 사주로 보는 전생의 인연","사주 관계 분석에서 사용하는 전생 관계 유형과 의미를 확인해보세요.",false);return <Shell><article className="editorial"><p className="eyebrow">RELATION GUIDE</p><h1>27가지<br/>전생 인연</h1><p className="lead">두 사람의 사주 관계 특징에 따라 만날 수 있는 전생 관계들을 소개합니다.</p><div className="guide-grid">{RELATION_GUIDE.map(([i,t,d])=><section className="guide-item" key={t}><span>{i}</span><div><h2>{t}</h2><p>{d}</p></div></section>)}</div><AdFitBanner unit={ADFIT_UNITS.info}/><section className="guide-note"><h2>점수가 높으면 무조건 좋은 관계인가요?</h2><p>아닙니다. 인연의 깊이, 서로에게 주는 영향, 충돌, 질긴 인연은 서로 다른 관계 특징을 표현합니다. 높고 낮음 자체가 관계의 좋고 나쁨을 뜻하지 않습니다.</p></section></article></Shell>}

function Methodology(){usePageMeta("인연 해석 원리 | 사주로 보는 전생의 인연","일간, 오행, 합과 충 등 두 사람의 사주 관계를 어떻게 분석하는지 설명합니다.",false);return <Shell><article className="editorial">
<p className="eyebrow">METHODOLOGY</p><h1>인연 해석은<br/>어떻게 만들어질까요?</h1>
<p className="lead">결과는 무작위로 정해지는 것이 아니라, 두 사람의 사주에서 관계를 설명할 수 있는 여러 요소를 계산해 조합합니다.</p>
<section><h2>1. 일간과 오행</h2><p>사주에서 일간은 자신을 나타내는 중요한 기준으로 사용됩니다. 두 사람의 일간 오행이 서로 생하는지, 극하는지, 같은 오행인지 살펴 관계에서 도움과 자극, 경쟁성이 어떻게 나타날 수 있는지 계산합니다.</p></section>
<section><h2>2. 일지의 합과 충</h2><p>일지는 관계 해석에서 중요한 축입니다. 육합이나 삼합 계열은 친밀감과 신뢰에 가중치를 주고, 충·형·파·해·원진 요소는 긴장과 충돌, 쉽게 끊기지 않는 관계에 가중치를 주는 방식으로 반영합니다.</p></section>
<section><h2>3. 관계 지표로 환산</h2><p>계산된 요소는 인연의 깊이, 신뢰, 서로에게 주는 영향, 충돌, 질긴 인연 등의 지표로 정리됩니다. 한 가지 지표만으로 결과를 정하지 않고 여러 지표의 조합을 사용합니다.</p></section>
<AdFitBanner unit={ADFIT_UNITS.info}/><section><h2>4. 전생 관계 유형 선택</h2><p>각 관계 유형은 서로 다른 조건을 갖습니다. 신뢰와 상생이 강하면 전우나 보호 관계가 후보가 될 수 있고, 충돌과 경쟁성이 강하면 라이벌 계열이 후보가 될 수 있습니다. 여러 후보의 적합도를 비교해 가장 가까운 유형을 선택합니다.</p></section>
<section><h2>5. 역할 방향 결정</h2><p>스승과 제자, 왕과 신하처럼 역할 방향이 있는 관계는 두 사람 사이에서 누가 더 도움을 주는 방향인지, 사주의 상생 흐름이 어느 쪽으로 향하는지 등을 함께 보고 역할을 결정합니다.</p></section>
<section><h2>6. 전생 스토리로 재해석</h2><p>마지막으로 계산된 관계 유형과 관계 지표를 사용해 이해하기 쉬운 이야기로 표현합니다. 이 과정은 전통 명리를 과학적 사실로 주장하는 것이 아니라 관계 특징을 즐길 수 있도록 구성한 엔터테인먼트 해석입니다.</p></section>
<div className="contact-card"><span>✉️</span><div><b>계산 방식 관련 문의</b><a href="mailto:kikine901@gmail.com">kikine901@gmail.com</a></div></div>
</article></Shell>}

function FAQ(){usePageMeta("자주 묻는 질문 | 사주로 보는 전생의 인연","전생 인연지도와 사주 관계 해석 이용 방법에 관한 자주 묻는 질문입니다.",false);const q=[['출생시간을 몰라도 할 수 있나요?','네. 출생시간은 선택 입력이라 비워두고 진행할 수 있습니다.'],['친구가 제 생년월일을 볼 수 있나요?','아니요. 입력한 생년월일과 출생시간은 다른 이용자에게 공개하지 않습니다.'],['반대쪽 페이지에서도 같은 결과가 나오나요?','같은 두 사람은 방향이 바뀌어도 동일한 핵심 관계가 유지되도록 설계했습니다. 방향성이 있는 역할은 서로 대응됩니다.'],['실제 전생을 알려주는 건가요?','아닙니다. 전통 명리 관계 요소를 활용한 엔터테인먼트 콘텐츠입니다.'],['정보를 삭제할 수 있나요?','네. 하단의 참여정보 삭제 메뉴에서 해당 친구 페이지에 남긴 참여 기록을 삭제할 수 있습니다.'],['문의는 어디로 하나요?','서비스 및 개인정보 문의는 kikine901@gmail.com 으로 보내주세요.']];return <Shell><article className="editorial"><p className="eyebrow">FAQ</p><h1>자주 묻는 질문</h1><p className="lead">서비스 이용 전에 궁금할 만한 내용을 모았습니다.</p><div className="faq-list">{q.map(([a,b])=><details key={a}><summary>{a}</summary><p>{b}</p></details>)}</div><AdFitBanner unit={ADFIT_UNITS.info}/><div className="contact-card"><span>✉️</span><div><b>더 궁금한 점이 있나요?</b><a href="mailto:kikine901@gmail.com">kikine901@gmail.com</a></div><details><summary>결과가 매번 같은가요?</summary><p>같은 두 사람이 같은 생년월일과 입력 조건으로 분석되면 기본 관계 결과는 일관되게 유지됩니다. 다만 서비스의 관계 계산식이 개선되는 경우 향후 결과 표현이나 세부 지표가 달라질 수 있습니다.</p></details><details><summary>출생시간을 모르면 결과를 볼 수 없나요?</summary><p>출생시간은 선택 입력입니다. 시간을 모르는 경우에도 연주·월주·일주와 관계 요소를 중심으로 분석하며, 시주가 있는 경우보다 사용할 수 있는 정보가 적다는 차이가 있습니다.</p></details></div></article></Shell>}

function LegalLayout({title,updated,children}:{title:string;updated:string;children:React.ReactNode}){return <Shell><article className="legal"><p className="eyebrow">SERVICE POLICY</p><h1>{title}</h1><p className="legal-updated">최종 수정: {updated}</p>{children}</article></Shell>}

function Privacy(){usePageMeta("개인정보처리방침 | 사주로 보는 전생의 인연","전생 인연지도 서비스의 개인정보 처리, 외부 서비스, 쿠키 및 광고 서비스 이용 내용을 안내합니다.",false);return <LegalLayout title="개인정보처리방침" updated="2026.09.27">
 <section><h2>1. 처리하는 개인정보와 이용 목적</h2><p>서비스는 전생 관계 분석과 인연지도 제공을 위해 닉네임, 생년월일, 양력·음력 구분, 이용자가 선택적으로 입력한 출생시간을 처리합니다. 입력한 생년월일과 출생시간은 다른 이용자에게 공개하지 않습니다.</p></section>
 <section><h2>2. 개인정보의 보유 및 이용기간</h2><p>개인정보는 인연지도와 관계 결과를 계속 제공하기 위해 서비스 이용 기간 동안 보관될 수 있으며, 정보주체가 삭제를 요청하거나 서비스 제공 목적이 소멸하면 관련 법령상 보관 의무가 있는 경우를 제외하고 파기합니다.</p></section>
 <section><h2>3. 개인정보의 제3자 제공</h2><p>서비스는 이용자의 개인정보를 임의로 판매하지 않습니다. 다만 웹 호스팅, 데이터베이스, 광고 및 사이트 운영 과정에서 외부 서비스 제공자가 각자의 정책과 서비스 설정에 따라 필요한 정보를 처리할 수 있습니다.</p></section>
 <section><h2>4. 외부 서비스 및 처리업무</h2><p><b>Cloudflare</b> — 웹사이트 호스팅, 콘텐츠 전송, 보안 및 네트워크 처리를 위해 사용합니다.</p><p><b>Supabase</b> — 이용자가 입력한 정보, 인연지도 및 관계 결과의 데이터베이스 저장과 서버 기능 제공을 위해 사용합니다.</p><p><b>카카오 AdFit</b> — 서비스 운영을 위한 온라인 광고를 제공하기 위해 사용할 수 있습니다. 광고 제공 과정에서 쿠키, IP 주소, 브라우저·기기 정보, 방문·이용 기록 등 광고 요청과 관련된 정보가 자동으로 생성되거나 처리될 수 있으며, 광고 제공·성과 측정·서비스 운영 등에 활용될 수 있습니다. 사주 관계 분석을 위해 입력한 닉네임, 생년월일, 출생시간, 양·음력 구분 및 생성된 관계 결과를 광고 맞춤화를 위한 정보로 별도 제공하지 않습니다.</p></section>
 <section><h2>5. 쿠키 및 유사 기술</h2><p>서비스 또는 외부 서비스 제공자는 서비스 제공, 보안, 광고 제공 및 측정을 위해 쿠키나 유사한 기술을 사용할 수 있습니다. 이용자는 사용하는 웹브라우저의 개인정보 및 쿠키 설정에서 쿠키 저장을 허용하거나 제한할 수 있습니다. 쿠키를 제한하더라도 본 서비스의 기본적인 사주 관계 분석 기능은 이용할 수 있습니다.</p></section>
 <AdFitBanner unit={ADFIT_UNITS.info}/><section><h2>6. 정보주체의 권리</h2><p>이용자는 자신의 개인정보에 대한 열람, 정정, 삭제, 처리정지 등을 요청할 수 있습니다. 특정 친구 페이지에 남긴 참여 기록은 <Link to="/delete">참여정보 삭제</Link> 화면에서 본인 확인 후 직접 삭제할 수 있으며, 추가 문의는 <a href="mailto:kikine901@gmail.com">kikine901@gmail.com</a>으로 접수할 수 있습니다.</p></section>
 <section><h2>7. 개인정보의 파기</h2><p>삭제 요청 등으로 보유 목적이 없어지면 해당 참여 연결 기록을 삭제합니다. 관계 기록이 더 이상 어떤 페이지에서도 사용되지 않는 경우 관련 관계 결과도 함께 정리하도록 설계되어 있습니다.</p></section>
 <section><h2>8. 안전성 확보조치</h2><p>브라우저가 개인정보 테이블에 직접 접근하지 않도록 서버 API를 통해 처리하고, 데이터베이스 접근 권한을 제한합니다. 삭제용 비밀값은 원문 대신 해시값 형태로 서버에 저장합니다.</p></section>
 <section><h2>9. 아동의 개인정보</h2><p>서비스는 일반 이용자를 대상으로 하며, 만 14세 미만 이용자의 개인정보를 의도적으로 수집하는 것을 목적으로 하지 않습니다. 만 14세 미만 이용자의 개인정보 처리에 별도 법적 절차가 필요한 경우 법정대리인 동의 등 필요한 조치를 마련합니다.</p></section>
 <section><h2>10. 개인정보 관련 문의</h2><p>개인정보 관련 문의 및 삭제 요청: <a href="mailto:kikine901@gmail.com">kikine901@gmail.com</a></p></section>
 <section><h2>11. 처리방침 변경</h2><p>개인정보 처리 방식, 외부 서비스 또는 광고 기술의 사용 방식이 변경되는 경우 이 페이지의 내용을 갱신하고 중요한 변경사항은 서비스 내에서 알립니다.</p></section>
 </LegalLayout>}
function Terms(){usePageMeta("이용약관 | 사주로 보는 전생의 인연","전생 인연지도 서비스의 이용 조건과 엔터테인먼트 콘텐츠 성격을 안내합니다.",false);return <LegalLayout title="이용약관" updated="2026.09.27">
 <section><h2>1. 서비스의 성격</h2><p>‘사주로 보는 전생의 인연’은 전통 명리 요소를 바탕으로 관계 성향을 계산하여 전생 이야기 형식으로 재해석하는 엔터테인먼트 서비스입니다.</p></section>
 <section><h2>2. 결과에 대한 안내</h2><p>서비스 결과는 재미와 소셜 콘텐츠를 위한 해석이며 실제 전생, 운명, 인간관계의 사실 여부나 미래를 과학적으로 증명하거나 보장하지 않습니다. 중요한 의료·법률·금융·인간관계 의사결정의 근거로 사용해서는 안 됩니다.</p></section>
 <section><h2>3. 이용자의 책임</h2><p>이용자는 본인이 입력할 권한이 있는 정보를 사용해야 하며 타인의 개인정보를 동의 없이 수집하거나 악의적으로 입력해서는 안 됩니다. 모욕, 괴롭힘, 사칭 등 타인의 권리를 침해하는 방식으로 서비스를 이용해서는 안 됩니다.</p></section>
 <section><h2>4. 서비스 변경 및 중단</h2><p>서비스 품질 향상, 안정성 확보 또는 운영상 필요에 따라 기능, 관계 계산식, 화면 및 데이터 구조가 개선될 수 있으며, 필요한 경우 일부 기능이 변경되거나 일시적으로 중단될 수 있습니다.</p></section>
 <section><h2>5. 지식재산권</h2><p>서비스가 제공하는 UI, 문구, 관계 유형 및 자체 제작 콘텐츠에 관한 권리는 법령 또는 별도 약정에 따라 보호됩니다. 이용자가 생성한 공유 이미지는 개인적인 공유 목적으로 사용할 수 있습니다.</p></section>
 <AdFitBanner unit={ADFIT_UNITS.info}/><section><h2>6. 광고 및 외부 서비스</h2><p>서비스 운영을 위해 광고 또는 외부 서비스가 표시될 수 있습니다. 광고의 내용과 광고를 통해 연결되는 외부 서비스는 해당 제공자의 책임과 정책에 따라 운영되며, 광고가 서비스의 사주 관계 분석 결과에 영향을 주지는 않습니다.</p></section>
 <section><h2>7. 면책</h2><p>서비스는 엔터테인먼트 결과의 정확성이나 특정 관계 개선 효과를 보장하지 않습니다. 이용자의 입력 오류, 네트워크 장애, 외부 플랫폼 장애 등 서비스가 합리적으로 통제하기 어려운 사유로 발생한 문제에 대해서는 관련 법령이 허용하는 범위에서 책임이 제한될 수 있습니다.</p></section>
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
 return <Shell><section className="delete-page"><p className="eyebrow">개인정보 관리</p><h1>참여정보 삭제</h1><p className="muted">친구의 전생 인연지도에 참여하면서 남긴 기록을 직접 삭제할 수 있습니다.</p><form className="card delete-form" onSubmit={submit}>
   <label>결과 링크 또는 결과 ID<input required value={relationship} onChange={e=>setRelationship(e.target.value)} placeholder="https://.../result/xxxx 또는 UUID"/></label>
   <label>참여할 때 입력한 닉네임<input required value={nickname} onChange={e=>setNickname(e.target.value)}/></label>
   <label>생년월일<input required type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)}/></label>
   <div className="seg"><button type="button" className={calendarType==='solar'?'on':''} onClick={()=>setCalendarType('solar')}>양력</button><button type="button" className={calendarType==='lunar'?'on':''} onClick={()=>setCalendarType('lunar')}>음력</button></div>
   <label>출생시간 <span>당시 입력하지 않았다면 비워두세요</span><input type="time" value={birthTime} onChange={e=>setBirthTime(e.target.value)}/></label>
   <div className="danger-note"><b>삭제 범위</b><p>현재 셀프 삭제는 ‘해당 친구 페이지에 참여한 기록’을 대상으로 합니다. 여러 페이지에 참여했다면 각 결과별로 삭제해야 합니다.</p></div>
   <button disabled={busy} className="danger-button">{busy?'본인 확인 및 삭제 중...':'내 참여 기록 삭제하기'}</button>
 </form><AdFitBanner unit={ADFIT_UNITS.info}/></section></Shell>}


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


function Admin(){
 usePageMeta('관리자 | 사주로 보는 전생의 인연','운영 데이터 관리 화면',true);
 const [code,setCode]=React.useState(()=>sessionStorage.getItem('pastlife:admin-code')||''); const [input,setInput]=React.useState(''); const [data,setData]=React.useState<any>(null); const [busy,setBusy]=React.useState(false); const [error,setError]=React.useState(''); const [query,setQuery]=React.useState(''); const [sort,setSort]=React.useState<'recent'|'participants'>('recent');
 const load=React.useCallback(async(adminCode:string)=>{if(!adminCode)return;setBusy(true);setError('');try{const r=await fetch(ADMIN_API,{headers:{'x-admin-code':adminCode}});const d=await r.json();if(!r.ok)throw new Error(d.error||'관리자 데이터를 불러오지 못했습니다.');setData(d)}catch(e:any){setData(null);setError(e?.message||'관리자 데이터를 불러오지 못했습니다.')}finally{setBusy(false)}},[]);
 React.useEffect(()=>{if(code)load(code)},[code,load]);
 const login=(e:React.FormEvent)=>{e.preventDefault();const v=input.trim();if(!v)return;sessionStorage.setItem('pastlife:admin-code',v);setCode(v);setInput('')}; const logout=()=>{sessionStorage.removeItem('pastlife:admin-code');setCode('');setData(null);setError('')};
 const action=async(body:any,confirmText?:string)=>{if(confirmText&&!confirm(confirmText))return;setBusy(true);setError('');try{const r=await fetch(ADMIN_API,{method:'POST',headers:{'content-type':'application/json','x-admin-code':code},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error||'관리 작업에 실패했습니다.');await load(code)}catch(e:any){setError(e?.message||'관리 작업에 실패했습니다.')}finally{setBusy(false)}};
 if(!code)return <Shell><section className="admin-page admin-login"><p className="eyebrow">관리자</p><h1>관리자 페이지</h1><p className="muted">관리자 코드를 입력하면 생성된 인연지도와 참여 현황을 확인할 수 있습니다.</p><form className="card admin-login-form" onSubmit={login}><label>관리자 코드<input autoFocus type="password" autoComplete="current-password" value={input} onChange={e=>setInput(e.target.value)} placeholder="관리자 코드"/></label><button className="primary">관리자 입장</button></form></section></Shell>;
 const pages=[...(data?.pages||[])].filter((p:any)=>{const q=query.trim().toLowerCase();return !q||String(p.owner?.nickname||'').toLowerCase().includes(q)||String(p.slug||'').toLowerCase().includes(q)}).sort((a:any,b:any)=>sort==='participants'?Number(b.participant_count||0)-Number(a.participant_count||0):new Date(b.created_at).getTime()-new Date(a.created_at).getTime());
 return <Shell><section className="admin-page"><div className="admin-head"><div><p className="eyebrow">관리자</p><h1>서비스 현황</h1></div><div className="admin-actions"><button className="secondary" onClick={()=>load(code)} disabled={busy}>{busy?'처리 중…':'새로고침'}</button><button className="admin-logout" onClick={logout}>로그아웃</button></div></div>{error&&<div className="admin-error" role="alert">{error}</div>}{data&&<><div className="admin-summary"><div><span>생성된 지도</span><strong>{data.summary?.pages||0}</strong></div><div><span>전체 참여</span><strong>{data.summary?.participations||0}</strong></div><div><span>관계 결과</span><strong>{data.summary?.relationships||0}</strong></div><div><span>등록 인물</span><strong>{data.summary?.people||0}</strong></div></div><div className="admin-toolbar"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="닉네임 또는 지도 주소 검색" aria-label="지도 검색"/><select value={sort} onChange={e=>setSort(e.target.value as any)} aria-label="정렬"><option value="recent">최근 생성순</option><option value="participants">참여자 많은 순</option></select></div><div className="admin-list">{pages.map((p:any)=><article className="admin-map-row" key={p.id}><div className="admin-map-main"><div><b>{p.owner?.nickname||'이름 없음'}</b><span>{p.slug}</span></div><a href={`/n/${p.slug}`} target="_blank" rel="noreferrer">실제 지도 열기</a></div><div className="admin-map-meta"><span className={p.is_active?'active':'inactive'}>{p.is_active?'활성':'비활성'}</span><span><strong>{p.participant_count}</strong>명 참여</span><span>{new Date(p.created_at).toLocaleString('ko-KR')}</span></div><div className="admin-row-actions"><button disabled={busy} onClick={()=>action({action:'set_active',page_id:p.id,active:!p.is_active},`${p.owner?.nickname||'이 지도'} 지도를 ${p.is_active?'비활성화':'다시 활성화'}할까요?`)}>{p.is_active?'지도 비활성화':'지도 다시 활성화'}</button></div>{p.participants?.length>0&&<details><summary>참여자 {p.participant_count}명 보기</summary><div className="admin-participants">{p.participants.map((x:any)=><div key={x.relationship_id} className="admin-participant"><div><b>{x.nickname}</b><span>{x.relationship_type} · {x.era}</span></div><strong>{Number(x.scores?.['인연의깊이']||0)}점</strong><div><a href={`/result/${x.relationship_id}`} target="_blank" rel="noreferrer">결과 보기</a><button disabled={busy} onClick={()=>action({action:'remove_participant',page_id:p.id,relationship_id:x.relationship_id},`${x.nickname}님의 참여 기록을 이 지도에서 제거할까요?\n이 작업은 되돌릴 수 없습니다.`)}>참여 제거</button></div></div>)}</div></details>}<div className="admin-danger"><button disabled={busy} onClick={()=>action({action:'delete_page',page_id:p.id},`${p.owner?.nickname||'이 지도'}의 인연지도를 영구 삭제할까요?\n참여 ${p.participant_count}명 연결 기록도 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`)}>지도 영구 삭제</button></div></article>)}</div></>}</section></Shell>
}

function App(){return <Routes><Route path="/" element={<Home/>}/><Route path="/create" element={<Create/>}/><Route path="/n/:slug" element={<Page/>}/><Route path="/result/:id" element={<Result/>}/><Route path="/saju/:id" element={<DetailedSaju/>}/><Route path="/about" element={<About/>}/><Route path="/guide" element={<Guide/>}/><Route path="/methodology" element={<Methodology/>}/><Route path="/faq" element={<FAQ/>}/><Route path="/privacy" element={<Privacy/>}/><Route path="/ad/:id" element={<LegacyAdRedirect/>}/><Route path="*" element={<NotFound/>}/><Route path="/terms" element={<Terms/>}/><Route path="/delete" element={<DeleteData/>}/><Route path="/admin" element={<Admin/>}/></Routes>}
createRoot(document.getElementById('root')!).render(<BrowserRouter><ErrorBoundary><App/></ErrorBoundary></BrowserRouter>);
