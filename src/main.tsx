import React, {useState} from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import './styles.css';

const API='https://aaokqyskfiupvexqkdvz.supabase.co/functions/v1/pastlife-api';
const DELETE_API='https://aaokqyskfiupvexqkdvz.supabase.co/functions/v1/pastlife-delete';

type PersonInput={nickname:string;birthDate:string;birthTime:string;calendarType:'solar'|'lunar'};
const toApi=(v:PersonInput)=>({nickname:v.nickname,birth_date:v.birthDate,birth_time:v.birthTime||null,calendar_type:v.calendarType});
const Shell=({children}:{children:React.ReactNode})=><main className="shell"><header className="site-header"><Link to="/" className="brand">사주로 보는 전생의 인연</Link><nav className="top-nav"><Link to="/about">서비스 소개</Link><Link to="/guide">인연 해석</Link><Link to="/faq">FAQ</Link></nav></header>{children}<footer><nav className="footer-links"><Link to="/about">서비스 소개</Link><Link to="/guide">인연 해석</Link><Link to="/faq">FAQ</Link><Link to="/privacy">개인정보처리방침</Link><Link to="/terms">이용약관</Link><Link to="/delete">참여정보 삭제</Link></nav><p>전통 명리 요소를 바탕으로 만든 엔터테인먼트 콘텐츠입니다.<br/>입력한 생년월일과 출생시간은 다른 이용자에게 공개되지 않습니다.</p></footer></main>;

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


const ADS_PREVIEW=false;
function AdSlot({placement='content'}:{placement?:string}){
 if(!ADS_PREVIEW)return null;
 return <aside className={`ad-slot ad-${placement}`} aria-label="광고 영역">
   <div className="ad-label">ADVERTISEMENT</div>
   <div className="ad-placeholder">
     <span>AD</span>
     <div><b>배너 광고 영역</b><small>광고 승인 후 실제 광고가 표시됩니다.</small></div>
   </div>
 </aside>
}

function AdGate(){
 const {id}=useParams();const nav=useNavigate();const [stage,setStage]=React.useState<'analyzing'|'ad'>('analyzing');const [left,setLeft]=React.useState(5);
 const pageSlug=new URLSearchParams(location.search).get('page')||'';
 React.useEffect(()=>{const t=setTimeout(()=>setStage('ad'),1300);return()=>clearTimeout(t)},[]);
 React.useEffect(()=>{if(stage!=='ad')return;const t=setInterval(()=>setLeft(v=>{if(v<=1){clearInterval(t);return 0}return v-1}),1000);return()=>clearInterval(t)},[stage]);
 const go=()=>{if(left!==0)return;if(pageSlug)nav(`/n/${encodeURIComponent(pageSlug)}?mine=${encodeURIComponent(id||'')}`,{replace:true});else nav(`/result/${id}`,{replace:true})};
 return <Shell><section className="ad-gate-page">
   {stage==='analyzing'?<div className="analysis-screen">
     <div className="analysis-orb"><span>☯</span><i/><i/><i/></div>
     <p className="eyebrow">사주 분석 중</p><h1>두 사람의 인연을<br/>지도에 연결하고 있어요</h1>
     <div className="analysis-steps"><span>✓ 사주팔자 확인</span><span>✓ 오행 관계 분석</span><span className="working">● 인연지도에 기록 중</span></div>
   </div>:<div className="reward-ad card">
     <div className="reward-head"><span>🎁</span><div><p className="eyebrow">MAP UNLOCK</p><h2>광고를 보고<br/>완성된 인연지도를 확인하세요</h2></div></div>
     <div className="reward-ad-box"><div className="ad-label">ADVERTISEMENT</div><span className="big-ad">AD</span><b>결과 공개 전 광고 영역</b><p>실제 광고 연동 전 테스트 화면입니다.</p></div>
     <div className="reward-progress"><span style={{width:`${((5-left)/5)*100}%`}}/></div>
     <p className="reward-time">{left>0?`${left}초 후 인연지도를 확인할 수 있어요`:'광고 시청이 완료되었습니다.'}</p>
     <button disabled={left>0} onClick={go} className="primary">{left>0?'광고 시청 중...':'인연지도 확인하기'}</button>
   </div>}
 </section></Shell>
}
function PersonForm({buttonText,onSubmit}:{buttonText:string,onSubmit:(v:PersonInput)=>Promise<void>|void}){
 const [nickname,setNickname]=useState(''); const [birthDate,setBirthDate]=useState(''); const [birthTime,setBirthTime]=useState(''); const [calendarType,setCalendarType]=useState<'solar'|'lunar'>('solar'); const [busy,setBusy]=useState(false);
 return <form onSubmit={async e=>{e.preventDefault();setBusy(true);try{await onSubmit({nickname,birthDate,birthTime,calendarType})}finally{setBusy(false)}}} className="card form">
   <label>닉네임<input required maxLength={20} value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="친구에게 표시될 이름"/></label>
   <label>생년월일<input required type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)}/></label>
   <div className="seg"><button type="button" className={calendarType==='solar'?'on':''} onClick={()=>setCalendarType('solar')}>양력</button><button type="button" className={calendarType==='lunar'?'on':''} onClick={()=>setCalendarType('lunar')}>음력</button></div>
   <label>태어난 시간 <span>선택 · 모르면 비워두세요</span><input type="time" value={birthTime} onChange={e=>setBirthTime(e.target.value)}/></label>
   <div className="privacy-note"><b>🔒 개인정보 수집·이용 안내</b><span>목적: 전생 관계 계산 및 인연지도 저장</span><span>항목: 닉네임, 생년월일, 양·음력 구분, 선택 입력한 출생시간</span><span>보유: 서비스 이용·인연지도 제공 기간 또는 삭제 요청 시까지</span><span>동의를 거부할 수 있으나, 거부 시 관계 분석 기능을 이용할 수 없습니다.</span></div>
   <label className="consent"><input required type="checkbox"/> 위 개인정보 수집·이용에 동의합니다. <Link to="/privacy">자세히 보기</Link></label>
   <button disabled={busy} className="primary">{busy?'인연을 살펴보고 있어요...':buttonText}</button>
 </form>
}

function Home(){return <Shell><section className="hero"><div className="orb">☯</div><p className="eyebrow">전생 인연지도</p><h1>우리, 전생에는<br/>무슨 사이였을까?</h1><p>내 사주로 페이지를 만들고 친구들을 초대해보세요.<br/>친구들이 참여할수록 전생 인연지도가 완성됩니다.</p><Link className="primary link" to="/create">내 전생 인연지도 만들기</Link></section></Shell>}

function Create(){const nav=useNavigate();const submit=async(v:PersonInput)=>{const r=await fetch(`${API}/pages`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(toApi(v))});const d=await r.json();if(!r.ok) return alert(d.error||'생성에 실패했습니다.');localStorage.setItem(`owner:${d.slug}`,d.owner_token);nav(`/n/${d.slug}`)};return <Shell><section><p className="eyebrow">STEP 1</p><h1>먼저 당신을 알려주세요</h1><p className="muted">한 번 만들면 친구에게 공유할 수 있는 나만의 주소가 생깁니다.</p><PersonForm buttonText="내 사주로 지도 만들기" onSubmit={submit}/><AdSlot placement="create"/></section></Shell>}

function HighlightGrid({items,count}:{items:any[];count:number}){const hs=buildHighlights(items);return <div className="highlight-wrap"><div className="highlight-head"><p className="eyebrow">인연 분석</p><h2>친구들이 채워주는<br/>나의 전생 기록</h2></div><div className="highlight-grid">{hs.map(h=>{const unlocked=count>=h.need&&h.item;const left=Math.max(0,h.need-count);return <div className={`highlight-card ${unlocked?'unlocked':'locked-highlight'}`} key={h.title}>{unlocked?<><span className="highlight-icon">{h.icon}</span><small>{h.title}</small><b>{h.item.nickname}</b><em>{h.item.relationship_type}</em><strong>{h.score}</strong></>:<><span className="highlight-icon">🔒</span><small>{h.title}</small><b>{left}명 더 필요</b><em>{count} / {h.need}</em><div className="mini-progress"><span style={{width:`${Math.min(100,(count/h.need)*100)}%`}}/></div></>}</div>})}</div></div>}

function RadialMap({owner,items,clickable=true,mineId}:{owner:string;items:any[];clickable?:boolean;mineId?:string|null}){
 const maxVisible=16;
 const visible=items.slice(0,maxVisible);
 const nodes=visible.map((item:any)=>{
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
 const node=(n:any)=>{const inner=<><i>{relationIcon(n.type_code,n.relationship_type)}</i><b>{n.id===mineId?'나':n.nickname}</b><small>{n.score}</small>{n.id===mineId&&<em>NEW</em>}</>;return clickable?<Link to={`/result/${n.id}`} key={n.id} className={`radial-node ring-${n.ring} ${n.id===mineId?'mine-node':''}`} style={{left:`${n.x}%`,top:`${n.y}%`}} title={`${n.nickname} · ${n.relationship_type}`}>{inner}</Link>:<div key={n.id} className={`radial-node ring-${n.ring} visitor-node ${n.id===mineId?'mine-node':''}`} style={{left:`${n.x}%`,top:`${n.y}%`}} title={n.id===mineId?'나의 인연':`${n.nickname}의 인연`}>{inner}</div>};
 return <div className="radial-card card">
   <div className="radial-title"><p className="eyebrow">전생 인연지도</p><h2>{mineId?'내 자리도 지도에 추가됐어요':'누가 내 곁에 가장 가까이 있을까?'}</h2><p>{mineId?'빛나는 노드가 방금 참여한 나입니다.':'인연의 깊이가 높을수록 중심에 가깝게 표시됩니다.'}</p></div>
   <div className="radial-map">
     <div className="orbit orbit-1"/><div className="orbit orbit-2"/><div className="orbit orbit-3"/>
     <div className="center-person"><span>☯</span><b>{owner}</b></div>
     {nodes.map(node)}
   </div>
   {items.length>maxVisible&&<p className="radial-more">+ {items.length-maxVisible}명의 인연이 더 있습니다.</p>}
   <div className="map-legend"><span><i className="dot d1"/> 깊은 인연</span><span><i className="dot d2"/> 가까운 인연</span><span><i className="dot d3"/> 스쳐온 인연</span>{mineId&&<span><i className="dot dmine"/> 나</span>}</div>
 </div>
}
function Page(){const {slug}=useParams();const [data,setData]=React.useState<any>(null);const [loading,setLoading]=React.useState(true);const [ownerMode,setOwnerMode]=React.useState(false);
 const mineId=new URLSearchParams(location.search).get('mine');
 const load=React.useCallback(async()=>{setLoading(true);setOwnerMode(!!localStorage.getItem(`owner:${slug}`));try{const r=await fetch(`${API}/pages/${encodeURIComponent(slug||'')}`);const d=await r.json();setData(r.ok?d:null)}finally{setLoading(false)}},[slug]);React.useEffect(()=>{load()},[load]);
 if(loading)return <Shell><div className="card loading-card">인연지도를 불러오는 중...</div></Shell>;if(!data)return <Shell><div className="card">존재하지 않는 인연지도입니다.</div></Shell>;
 const mine=data.relationships?.find((x:any)=>x.id===mineId);
 const submit=async(v:PersonInput)=>{const r=await fetch(`${API}/pages/${encodeURIComponent(slug||'')}/join`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(toApi(v))});const d=await r.json();if(!r.ok)return alert(d.error||'분석에 실패했습니다.');location.href=`/ad/${d.relationship_id}?page=${encodeURIComponent(slug||'')}`};
 const share=async()=>{const url=`${location.origin}/n/${slug}`;if(navigator.share){try{await navigator.share({title:`${data.owner_nickname}의 전생 인연지도`,text:`나랑 전생에 무슨 사이였는지 확인해봐!`,url});return}catch{}}await navigator.clipboard.writeText(url);alert('공유 링크를 복사했습니다.');};
 const publicMap=data.relationships?.length>0?<RadialMap owner={data.owner_nickname} items={data.relationships} clickable={ownerMode} mineId={mineId}/>:<div className="empty-public-map card"><span>☯</span><b>아직 첫 인연을 기다리고 있어요</b><p>첫 번째로 참여해서 {data.owner_nickname}의 인연지도를 시작해보세요.</p></div>;
 return <Shell><section><p className="eyebrow">🔮 전생 인연지도</p><h1>{data.owner_nickname}의<br/>전생 인연지도</h1><div className="count">지금까지 참여한 인연 <strong>{data.count}명</strong></div><AdSlot placement="map"/>
 {ownerMode?<><>{publicMap}{data.relationships.length>0&&<><div className="relation-list card"><div className="section-title"><span>🗂️</span><div><small>발견된 인연</small><h3>전체 인연 보기</h3></div></div>{data.relationships.map((x:any)=><Link className="relation-row" to={`/result/${x.id}`} key={x.id}><i>{relationIcon(x.type_code,x.relationship_type)}</i><div><b>{x.nickname}</b><span>{x.relationship_type}</span></div><strong>{scoreOf(x,'인연의깊이')}</strong></Link>)}</div><HighlightGrid items={data.relationships} count={data.count}/></>}<button className="primary" onClick={share}>친구에게 공유하기</button><p className="viral-copy">친구가 참여할수록 잠긴 전생 기록이 열립니다.</p></>:
 mine?<><div className="joined-banner card"><span>✨</span><div><small>인연지도 참여 완료</small><h2>{mine.nickname}님이 새 인연으로 추가됐어요</h2><p>지도에서 빛나는 노드가 내 자리입니다.</p></div></div>{publicMap}<Link className="primary link detail-cta" to={`/result/${mine.id}`}>나와 {data.owner_nickname}의 관계 자세히 보기</Link><p className="detail-hint">전생 역할 · 관계 점수 · 사주 근거 · 전생 이야기를 확인할 수 있어요.</p><button className="secondary visitor-share" onClick={share}>이 인연지도 친구에게 공유하기</button></>:
 <><div className="join-intro"><h2>{data.owner_nickname}과 나는<br/>전생에 무슨 사이였을까?</h2><p className="muted">먼저 아래에 내 정보를 입력해보세요. 참여하기 전에도 현재까지 완성된 인연지도를 볼 수 있습니다.</p></div><PersonForm buttonText="내 자리 인연지도에 추가하기" onSubmit={submit}/><div className="map-preview-heading"><p className="eyebrow">LIVE MAP</p><h2>벌써 {data.count}명이<br/>{data.owner_nickname}의 지도에 들어왔어요</h2><p>정보를 입력하면 나도 이 지도에 새로운 인연으로 추가됩니다.</p></div>{publicMap}</>}
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

function Result(){const {id}=useParams();const [d,setD]=React.useState<any>(null);const [error,setError]=React.useState(false);const [making,setMaking]=React.useState(false);React.useEffect(()=>{fetch(`${API}/relationships/${encodeURIComponent(id||'')}`).then(async r=>{const j=await r.json();if(!r.ok)throw new Error();setD(j)}).catch(()=>setError(true))},[id]);if(error)return <Shell><div className="card">전생 기록을 찾을 수 없습니다.</div></Shell>;if(!d?.relationship)return <Shell><div className="card loading-card">두 사람의 전생 기록을 펼치는 중...</div></Shell>;
 const r=d.relationship;const icon=relationIcon(r.typeCode,r.label);const basis=r.analysisBasis;const factors=Array.isArray(basis?.key_factors)?basis.key_factors:[];
 const share=async()=>{const url=location.href;const text=`${r.ownerNickname} × ${r.participantNickname}\n${icon} ${r.label}\n“${r.oneLiner}”`;if(navigator.share){try{await navigator.share({title:'사주로 보는 전생의 인연',text,url});return}catch{}}await navigator.clipboard.writeText(`${text}\n${url}`);alert('결과와 링크를 복사했습니다.');};
 const storyShare=async()=>{setMaking(true);try{await shareStoryCard(r)}finally{setMaking(false)}};
 return <Shell><section className="result"><div className="result-hero"><p className="eyebrow">사주로 보는 전생의 인연</p><div className="result-icon">{icon}</div><p className="era">{r.era}</p><h1>{r.label}</h1><p className="pair">{r.ownerNickname} <span>×</span> {r.participantNickname}</p><p className="result-quote">“{r.oneLiner}”</p></div>
 <div className="card roles"><div><small>전생의 역할</small><strong>{r.ownerNickname}</strong><span>{r.ownerRole}</span></div><div><small>전생의 역할</small><strong>{r.participantNickname}</strong><span>{r.participantRole}</span></div></div>
 <div className="card story"><div className="section-title"><span>📜</span><div><small>전생 기록</small><h3>두 사람의 이야기</h3></div></div><p>{r.story}</p></div>
 <ScoreBars scores={r.scores||{}}/><AdSlot placement="result"/>
 {factors.length>0&&<div className="card basis"><div className="section-title"><span>🧭</span><div><small>사주 관계 해석</small><h3>왜 이런 결과가 나왔을까요?</h3></div></div><div className="factor-list">{factors.map((x:string)=><span key={x}>{x}</span>)}</div><p className="basis-copy">두 사람의 일간·일지와 오행의 상생·상극, 합·충 관계를 함께 계산해 가장 가까운 전생 관계 유형을 찾았습니다.</p>{basis?.notice&&<p className="basis-notice">{basis.notice}</p>}</div>}
 <div className="share-card-box card"><div><span>📱</span><div><b>인스타 스토리용 이미지</b><p>9:16 비율의 결과 카드를 만들어 공유할 수 있어요.</p></div></div><button disabled={making} className="story-share" onClick={storyShare}>{making?'이미지 만드는 중...':'스토리 이미지 만들기'}</button></div>
 <button className="primary share-btn" onClick={share}>링크로 결과 공유하기</button>{r.pageSlug&&<Link className="secondary link" to={`/n/${r.pageSlug}`}>전생 인연지도 돌아가기</Link>}<Link className="ghost-link" to="/create">나도 내 전생 인연지도 만들기 →</Link></section></Shell>}



const RELATION_GUIDE=[
['👑','임금과 충신','책임과 신뢰가 강하게 연결된 인연'],['📜','임금과 책사','결단과 조언이 맞물리는 인연'],['⚔️','목숨을 맡긴 전우','위기에서 서로를 믿는 인연'],['📖','스승과 제자','배움과 성장의 영향을 주고받는 인연'],['🔥','숙명의 라이벌','부딪치면서 서로를 성장시키는 인연'],['🤝','평생의 벗','편안함과 신뢰가 오래 이어지는 인연'],['💘','이루지 못한 연인','강한 끌림과 아쉬움이 함께 남는 인연'],['💎','목숨을 구한 은인','한 사람이 다른 사람에게 큰 힘이 되는 인연'],['💰','상단의 경쟁자','목표를 두고 실력을 겨루는 인연'],['💥','사고뭉치와 해결사','문제를 만들고 수습하며 맞물리는 인연'],['🛡️','호위무사와 왕족','보호와 책임이 강하게 드러나는 인연'],['🪢','원수에서 친구로','충돌해도 쉽게 끊어지지 않는 인연'],['🏠','한집의 형제자매','티격태격해도 익숙함이 남는 인연'],['🧭','길 위에서 만난 동행','같은 방향을 바라보며 함께하는 인연'],['🌿','치유자와 환자','회복과 안정에 영향을 주는 인연'],['🎨','후원자와 예술가','재능을 알아보고 밀어주는 인연'],['🌙','금지된 사랑','끌림과 제약이 동시에 강한 인연'],['💌','엇갈린 짝사랑','마음의 속도와 방향이 다른 인연'],['🏘️','이웃 마을 라이벌','가깝기에 더 자주 경쟁하는 인연'],['⛵','선장과 항해사','목표와 방향을 함께 맞추는 인연'],['⚔️','장군과 부관','결단과 실행이 맞물리는 인연'],['🩸','피보다 진한 의형제','선택한 신뢰가 가족처럼 깊어진 인연'],['🏃','도망친 혼례의 두 사람','강한 결속과 변화 욕구가 함께하는 인연'],['🍶','주막 주인과 단골','반복된 만남이 만든 편안한 인연'],['🧹','주인과 말 안 듣는 하인','부딪치면서 계속 엮이는 인연'],['🛟','위기에서 만난 구조자','필요한 순간 큰 영향을 남기는 인연'],['🍃','스쳐 지나간 오래된 인연','강렬하지 않아도 익숙하게 느껴지는 인연']];

function About(){return <Shell><article className="editorial"><p className="eyebrow">ABOUT</p><h1>사주로 보는<br/>전생의 인연</h1><p className="lead">친구와 나의 관계를 숫자 하나로 끝내지 않고, 한 편의 전생 이야기처럼 즐길 수 있도록 만든 소셜 사주 콘텐츠입니다.</p><section><h2>왜 만들었나요?</h2><p>궁합이나 성격 테스트는 결과만큼 “우리 진짜 이렇지 않아?”라고 이야기하는 과정이 재미있습니다. 이 서비스는 한 사람의 테스트에서 끝내지 않고 친구들이 하나의 페이지에 모여 관계 지도를 함께 완성하도록 설계했습니다.</p></section><section><h2>어떻게 해석하나요?</h2><p>생년월일을 바탕으로 두 사람 사이의 오행 상생·상극과 합·충·형·파·해·원진 같은 관계 요소를 조합합니다. 그 특징에 가까운 관계 유형을 고른 뒤 역할, 인연 지표와 전생 이야기로 보여줍니다.</p><p>출생시간은 선택 정보라 몰라도 이용할 수 있습니다.</p></section><section><h2>결과는 사실인가요?</h2><p>실제 전생을 확인하는 서비스가 아닙니다. 전통 명리 요소에서 아이디어를 얻은 엔터테인먼트 해석으로, 친구들과 대화를 시작하는 재미있는 소재로 이용해 주세요.</p></section><section><h2>친구가 참여하면</h2><p>페이지 주인을 중심으로 친구들이 인연지도에 쌓입니다. 인연의 깊이에 따라 거리가 달라지고 참여자가 늘어나면 가장 깊은 인연, 귀인, 라이벌 같은 추가 기록도 열립니다.</p></section><Link className="primary link" to="/create">내 인연지도 만들어보기</Link></article></Shell>}

function Guide(){return <Shell><article className="editorial"><p className="eyebrow">RELATION GUIDE</p><h1>27가지<br/>전생 인연</h1><p className="lead">두 사람의 사주 관계 특징에 따라 만날 수 있는 전생 관계들을 소개합니다.</p><div className="guide-grid">{RELATION_GUIDE.map(([i,t,d])=><section className="guide-item" key={t}><span>{i}</span><div><h2>{t}</h2><p>{d}</p></div></section>)}</div><section className="guide-note"><h2>점수가 높으면 무조건 좋은 관계인가요?</h2><p>아닙니다. 인연의 깊이, 서로에게 주는 영향, 충돌, 질긴 인연은 서로 다른 관계 특징을 표현합니다. 높고 낮음 자체가 관계의 좋고 나쁨을 뜻하지 않습니다.</p></section></article></Shell>}

function FAQ(){const q=[['출생시간을 몰라도 할 수 있나요?','네. 출생시간은 선택 입력이라 비워두고 진행할 수 있습니다.'],['친구가 제 생년월일을 볼 수 있나요?','아니요. 입력한 생년월일과 출생시간은 다른 이용자에게 공개하지 않습니다.'],['반대쪽 페이지에서도 같은 결과가 나오나요?','같은 두 사람은 방향이 바뀌어도 동일한 핵심 관계가 유지되도록 설계했습니다. 방향성이 있는 역할은 서로 대응됩니다.'],['실제 전생을 알려주는 건가요?','아닙니다. 전통 명리 관계 요소를 활용한 엔터테인먼트 콘텐츠입니다.'],['정보를 삭제할 수 있나요?','네. 하단의 참여정보 삭제 메뉴에서 해당 친구 페이지에 남긴 참여 기록을 삭제할 수 있습니다.'],['문의는 어디로 하나요?','서비스 및 개인정보 문의는 kikine901@gmail.com 으로 보내주세요.']];return <Shell><article className="editorial"><p className="eyebrow">FAQ</p><h1>자주 묻는 질문</h1><p className="lead">서비스 이용 전에 궁금할 만한 내용을 모았습니다.</p><div className="faq-list">{q.map(([a,b])=><details key={a}><summary>{a}</summary><p>{b}</p></details>)}</div><div className="contact-card"><span>✉️</span><div><b>더 궁금한 점이 있나요?</b><a href="mailto:kikine901@gmail.com">kikine901@gmail.com</a></div></div></article></Shell>}

function LegalLayout({title,updated,children}:{title:string;updated:string;children:React.ReactNode}){return <Shell><article className="legal"><p className="eyebrow">SERVICE POLICY</p><h1>{title}</h1><p className="legal-updated">최종 수정: {updated}</p>{children}<div className="draft-notice"><b>MVP 운영 안내</b><p>정식 공개 전 서비스 운영자명·연락처·사업자 정보(해당 시)를 최종 확정하여 이 문서에 추가해야 합니다.</p></div></article></Shell>}

function Privacy(){return <LegalLayout title="개인정보처리방침" updated="2026.08.15">
 <section><h2>1. 처리하는 개인정보와 이용 목적</h2><p>서비스는 전생 관계 분석과 인연지도 제공을 위해 닉네임, 생년월일, 양력·음력 구분, 이용자가 선택적으로 입력한 출생시간을 처리합니다. 입력한 생년월일과 출생시간은 다른 이용자에게 공개하지 않습니다.</p></section>
 <section><h2>2. 개인정보의 보유 및 이용기간</h2><p>개인정보는 인연지도와 관계 결과를 계속 제공하기 위해 서비스 이용 기간 동안 보관될 수 있으며, 정보주체가 삭제를 요청하거나 서비스 제공 목적이 소멸하면 관련 법령상 보관 의무가 있는 경우를 제외하고 파기합니다.</p></section>
 <section><h2>3. 개인정보의 제3자 제공</h2><p>현재 서비스는 이용자의 개인정보를 다른 이용자나 광고주 등 제3자에게 판매하거나 제공하지 않습니다. 향후 제3자 제공이 필요한 기능을 도입하는 경우 관련 법령에 따라 별도 안내 및 필요한 동의 절차를 마련합니다.</p></section>
 <section><h2>4. 처리업무의 외부 서비스 이용</h2><p>서비스 운영을 위해 Cloudflare(웹 호스팅·전송)와 Supabase(데이터베이스·서버 기능)를 사용합니다. 실제 정식 운영 전 각 서비스의 데이터 처리 위치와 계약·보호조치 등을 확인하여 필요한 국외 이전 또는 위탁 관련 고지를 보완해야 합니다.</p></section>
 <section><h2>5. 정보주체의 권리</h2><p>이용자는 자신의 개인정보에 대한 열람, 정정, 삭제, 처리정지 등을 요청할 수 있습니다. 특정 친구 페이지에 남긴 참여 기록은 <Link to="/delete">참여정보 삭제</Link> 화면에서 본인 확인 후 직접 삭제할 수 있으며, 추가 문의는 <a href="mailto:kikine901@gmail.com">kikine901@gmail.com</a>으로 접수할 수 있습니다.</p></section>
 <section><h2>6. 개인정보의 파기</h2><p>삭제 요청 등으로 보유 목적이 없어지면 해당 참여 연결 기록을 삭제합니다. 관계 기록이 더 이상 어떤 페이지에서도 사용되지 않는 경우 관련 관계 결과도 함께 정리하도록 설계되어 있습니다.</p></section>
 <section><h2>7. 안전성 확보조치</h2><p>브라우저가 개인정보 테이블에 직접 접근하지 않도록 서버 API를 통해 처리하고, 데이터베이스 접근 권한을 제한합니다. 삭제용 비밀값은 원문 대신 해시값 형태로 서버에 저장합니다.</p></section>
 <section><h2>8. 아동의 개인정보</h2><p>정식 출시 전에 서비스의 이용 연령 정책을 확정해야 합니다. 만 14세 미만 이용자의 개인정보를 처리하게 되는 경우 법정대리인 동의 등 필요한 별도 절차를 마련합니다.</p></section>
 <section><h2>9. 개인정보 관련 문의</h2><p>개인정보 관련 문의 및 삭제 요청: <a href="mailto:kikine901@gmail.com">kikine901@gmail.com</a></p></section><section><h2>10. 처리방침 변경</h2><p>개인정보 처리 방식이 변경되는 경우 이 페이지의 내용을 갱신하고 중요한 변경사항은 서비스 내에서 알립니다.</p></section>
 </LegalLayout>}

function Terms(){return <LegalLayout title="이용약관" updated="2026.08.15">
 <section><h2>1. 서비스의 성격</h2><p>‘사주로 보는 전생의 인연’은 전통 명리 요소를 바탕으로 관계 성향을 계산하여 전생 이야기 형식으로 재해석하는 엔터테인먼트 서비스입니다.</p></section>
 <section><h2>2. 결과에 대한 안내</h2><p>서비스 결과는 재미와 소셜 콘텐츠를 위한 해석이며 실제 전생, 운명, 인간관계의 사실 여부나 미래를 과학적으로 증명하거나 보장하지 않습니다. 중요한 의료·법률·금융·인간관계 의사결정의 근거로 사용해서는 안 됩니다.</p></section>
 <section><h2>3. 이용자의 책임</h2><p>이용자는 본인이 입력할 권한이 있는 정보를 사용해야 하며 타인의 개인정보를 동의 없이 수집하거나 악의적으로 입력해서는 안 됩니다. 모욕, 괴롭힘, 사칭 등 타인의 권리를 침해하는 방식으로 서비스를 이용해서는 안 됩니다.</p></section>
 <section><h2>4. 서비스 변경 및 중단</h2><p>MVP 기간에는 기능, 관계 계산식, 화면, 데이터 구조가 개선될 수 있으며 안정성 확보나 운영상 필요에 따라 일부 기능이 변경 또는 일시 중단될 수 있습니다.</p></section>
 <section><h2>5. 지식재산권</h2><p>서비스가 제공하는 UI, 문구, 관계 유형 및 자체 제작 콘텐츠에 관한 권리는 법령 또는 별도 약정에 따라 보호됩니다. 이용자가 생성한 공유 이미지는 개인적인 공유 목적으로 사용할 수 있습니다.</p></section>
 <section><h2>6. 면책</h2><p>서비스는 엔터테인먼트 결과의 정확성이나 특정 관계 개선 효과를 보장하지 않습니다. 이용자의 입력 오류, 네트워크 장애, 외부 플랫폼 장애 등 서비스가 합리적으로 통제하기 어려운 사유로 발생한 문제에 대해서는 관련 법령이 허용하는 범위에서 책임이 제한될 수 있습니다.</p></section>
 </LegalLayout>}

function DeleteData(){
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

function App(){return <Routes><Route path="/" element={<Home/>}/><Route path="/create" element={<Create/>}/><Route path="/n/:slug" element={<Page/>}/><Route path="/ad/:id" element={<AdGate/>}/><Route path="/result/:id" element={<Result/>}/><Route path="/about" element={<About/>}/><Route path="/guide" element={<Guide/>}/><Route path="/faq" element={<FAQ/>}/><Route path="/privacy" element={<Privacy/>}/><Route path="/terms" element={<Terms/>}/><Route path="/delete" element={<DeleteData/>}/></Routes>}
createRoot(document.getElementById('root')!).render(<BrowserRouter><App/></BrowserRouter>);
