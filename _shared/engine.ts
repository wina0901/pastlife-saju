type P={nickname:string;birth_date:string;birth_time?:string|null;calendar_type:string}
const TYPES=[
 ['KING_SUBJECT','👑','임금과 충신',['임금','충신']],['COMRADES','⚔️','목숨을 맡긴 전우',['선봉장','호위무사']],['SCHOLAR','📖','스승과 제자',['스승','제자']],['RIVALS','🔥','숙명의 라이벌',['라이벌','라이벌']],['FRIENDS','🤝','평생의 벗',['벗','벗']],['MERCHANTS','💰','경쟁 상인',['상단주','상인']],['SAVIOR','💎','목숨을 구한 은인',['은인','도움을 받은 사람']],['LOVERS','💘','이루지 못한 연인',['먼저 떠난 사람','기다린 사람']],['STRANGE','🍶','주막 주인과 단골',['주막 주인','단골']],['ARTIST','🎨','후원자와 예술가',['후원자','예술가']]
] as const;
async function hash(s:string){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)); return [...new Uint8Array(b)]}
function canon(a:P,b:P){const ka=`${a.birth_date}|${a.birth_time||''}|${a.calendar_type}|${a.nickname.trim()}`; const kb=`${b.birth_date}|${b.birth_time||''}|${b.calendar_type}|${b.nickname.trim()}`; return ka<=kb?[a,b,false] as const:[b,a,true] as const}
export async function relationship(owner:P,participant:P){
 const [low,high,swapped]=canon(owner,participant); const bytes=await hash(`${low.birth_date}|${low.birth_time||''}|${low.calendar_type}::${high.birth_date}|${high.birth_time||''}|${high.calendar_type}`); const t=TYPES[bytes[0]%TYPES.length];
 const roleLow=t[3][bytes[1]%2]; const roleHigh=t[3][0]===t[3][1]?t[3][1]:t[3][roleLow===t[3][0]?1:0];
 const eras=['조선','고려','삼국시대','실크로드','중세 유럽','대항해시대']; const era=eras[bytes[2]%eras.length];
 const scores={인연의깊이:65+bytes[3]%35,신뢰:55+bytes[4]%45,영향:55+bytes[5]%45,충돌:20+bytes[6]%75,질긴인연:55+bytes[7]%45};
 const lowRole=roleLow, highRole=roleHigh; const ownerRole=swapped?highRole:lowRole, participantRole=swapped?lowRole:highRole;
 const story=`두 사람은 ${era}의 어느 시절 처음 인연을 맺었습니다. ${owner.nickname}은(는) ${ownerRole}, ${participant.nickname}은(는) ${participantRole}의 역할로 서로의 삶에 깊게 관여했습니다. 편하기만 한 관계는 아니었지만 중요한 순간마다 서로의 선택에 영향을 주었고, 그 흔적이 이번 생의 인연으로 이어졌다는 이야기입니다.`;
 const oneLiner=t[0]==='KING_SUBJECT'?'전생에서 맡았던 역할만 달라졌을 뿐, 서로를 신경 쓰는 인연은 그대로.':t[0]==='RIVALS'?'계속 부딪히는데도 이상하게 끊어지지 않는 인연.':'처음 보는 것 같아도, 어쩌면 오래전부터 이어진 사이.';
 return {type:t[0],icon:t[1],label:t[2],ownerRole,participantRole,era,scores,story,oneLiner};
}
