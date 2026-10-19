
(function(){
"use strict";
var PREVIEW={};
function refOf(x){return x&&typeof x==="object"?x.src:x}
function sized(ref,w,q){var u=imgSrc(ref);if(/^https:\/\//.test(u)&&!/weserv/.test(u))return "https://images.weserv.nl/?url="+encodeURIComponent(u)+"&w="+w+"&h="+w+"&fit=inside&we=1&output=webp&q="+(q||72);return u}
function fallbackImg(img,ref){img.addEventListener("error",function f(){img.removeEventListener("error",f);img.src=imgSrc(ref)})}
function imgSrc(ref){ref=refOf(ref);if(!ref)return "";ref=String(ref);if(PREVIEW[ref])return PREVIEW[ref];if(/^(https?:|data:|blob:)/.test(ref))return ref;return ref.replace(/^\/+/,"")}

/* ---------- state ---------- */
var DATA={site:{},works:[],cv:[],statement:{ko:"",en:""}};
function normalize(d){d=d||{};d.site=d.site||{};
  d.works=(d.works||[]).map(function(w,i){w=w||{};w.id=w.id||("w"+i);
    var im=w.images;if(im&&!Array.isArray(im))im=[im];
    w.images=(im||[]).filter(Boolean).map(function(x){if(typeof x!=="object")return {src:String(x),caption:""};var o={src:x.src||"",caption:x.caption||""};if(x.opt){o.opt=x.opt;o.sm=x.sm;o.optOf=x.optOf}return o}).filter(function(x){return x.src});
    w.scale=+w.scale||1;w.x=(w.x===""||w.x==null)?null:+w.x;w.y=(w.y===""||w.y==null)?null:+w.y;return w});
  d.cv=(d.cv||[]).map(function(c){c=c||{};c.items=c.items||[];return c});d.statement=d.statement||{ko:"",en:""};return d}
var canEdit=false, dirty=false;
var GH={owner:"elpp1210",repo:"mine",branch:"main",path:"content/site.json",sha:null,token:null};
try{GH.token=localStorage.getItem("byunjiwon-admin-key")}catch(e){}
var PENDING={};
function ghGit(method,path,body){
  return fetch("https://api.github.com/repos/"+GH.owner+"/"+GH.repo+"/git/"+path,{method:method,cache:"no-store",headers:{"Authorization":"Bearer "+GH.token,"Accept":"application/vnd.github+json"},body:body?JSON.stringify(body):undefined})
    .then(function(r){return r.json().catch(function(){return {}}).then(function(j){if(!r.ok){var e=new Error(j.message||("HTTP "+r.status));e.status=r.status;throw e}return j})})}
function queueFile(p,b){PENDING[p]=b;PREVIEW[p]=URL.createObjectURL(b);return Promise.resolve(p)}
function ghApi(method,path,body){
  var url="https://api.github.com/repos/"+GH.owner+"/"+GH.repo+"/contents/"+path+(method==="GET"?"?ref="+GH.branch+"&t="+Date.now():"");
  return fetch(url,{method:method,cache:"no-store",headers:{"Authorization":"Bearer "+GH.token,"Accept":"application/vnd.github+json"},body:body?JSON.stringify(body):undefined})
    .then(function(r){return r.json().catch(function(){return {}}).then(function(j){if(!r.ok){var e=new Error(j.message||("HTTP "+r.status));e.status=r.status;throw e}return j})})}
function b64utf8(s){return btoa(unescape(encodeURIComponent(s)))}
function fromB64utf8(s){return decodeURIComponent(escape(atob(String(s).replace(/\n/g,""))))}
function blobB64(b){return new Promise(function(res,rej){var fr=new FileReader();fr.onload=function(){res(String(fr.result).split(",")[1])};fr.onerror=rej;fr.readAsDataURL(b)})}
function ghLoad(){return ghApi("GET",GH.path).then(function(j){GH.sha=j.sha;DATA=normalize(JSON.parse(fromB64utf8(j.content)));return DATA})}
var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- tiny DOM helper ---------- */
function h(tag,props){
  var el=document.createElement(tag);
  if(props)for(var k in props){var v=props[k];if(v==null||v===false)continue;
    if(k==="class")el.className=v;else if(k==="text")el.textContent=v;else if(k==="style")el.style.cssText=v;
    else if(k.slice(0,2)==="on")el.addEventListener(k.slice(2),v);else if(k==="value")el.value=v;else el.setAttribute(k,v===true?"":v)}
  for(var i=2;i<arguments.length;i++){var c=arguments[i];if(c==null||c===false)continue;
    if(Array.isArray(c))c.forEach(function(x){if(x!=null&&x!==false)el.appendChild(typeof x==="string"?document.createTextNode(x):x)});
    else el.appendChild(typeof c==="string"?document.createTextNode(c):c)}
  return el}
function paras(text){return String(text||"").split(/\n\s*\n/).filter(function(p){return p.trim()}).map(function(p){return h("p",{text:p.trim()})})}
function uid(){return "w"+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function toast(msg){var t=h("div",{class:"toast",role:"status",text:msg});document.body.appendChild(t);setTimeout(function(){t.remove()},2600)}

/* ---------- colour ---------- */
function lum(hex){var m=/^#?([0-9a-f]{6})$/i.exec(hex||"");if(!m)return .6;var n=parseInt(m[1],16);
  var c=[n>>16&255,n>>8&255,n&255].map(function(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]}
function applyBg(){var bg=DATA.site.bg||"#c9ccc3";var r=document.documentElement.style;r.setProperty("--desk",bg);
  var dark=lum(bg)<.22;r.setProperty("--label",dark?"#f6f6f2":"#1e201c");r.setProperty("--label-shadow",dark?"rgba(0,0,0,.45)":"rgba(255,255,255,.55)")}

/* ---------- shell ---------- */
var root=document.getElementById("root");
var desk=h("div",{class:"desk",id:"desk"});
var iconsLayer=h("div");
desk.appendChild(iconsLayer);
var hint=h("div",{class:"desk-hint",text:"작업을 끌어서 옮기거나 눌러서 열어 보세요"});
desk.appendChild(hint);
var nameBtn=h("button",{class:"mb-btn mb-name",onclick:function(){openInfo()}});
var adminBtn=h("button",{class:"gear",hidden:true,"aria-label":"관리 열기",title:"관리",onclick:function(){openAdmin()}});
adminBtn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#f4f4f2" fill-rule="evenodd" d="M10.3 2h3.4l.5 2.6c.6.2 1.2.5 1.7.9l2.5-.9 1.7 2.9-2 1.7c.1.6.1 1.2 0 1.8l2 1.7-1.7 2.9-2.5-.9c-.5.4-1.1.7-1.7.9l-.5 2.6h-3.4l-.5-2.6c-.6-.2-1.2-.5-1.7-.9l-2.5.9-1.7-2.9 2-1.7c-.1-.6-.1-1.2 0-1.8l-2-1.7 1.7-2.9 2.5.9c.5-.4 1.1-.7 1.7-.9zM12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z" transform="translate(0 1.2)"/></svg>';
var clock=h("span",{class:"mb-clock","aria-hidden":"true"});
var menubar=h("nav",{class:"menubar","aria-label":"메뉴"},h("div",{class:"row"},
  nameBtn,
  h("button",{class:"mb-btn",onclick:function(){openList()}},"작업"),
  h("button",{class:"mb-btn",onclick:function(){openCV()}},"이력"),
  h("button",{class:"mb-btn",onclick:function(){openStatement()}},"스테이트먼트"),
  h("span",{class:"mb-spacer"}),clock));
root.appendChild(desk);root.appendChild(menubar);root.appendChild(adminBtn);
function renderName(){nameBtn.textContent=DATA.site.name||"작가 이름"}
function tick(){var d=new Date();var days=["일","월","화","수","목","금","토"];
  clock.textContent=(d.getMonth()+1)+"월 "+d.getDate()+"일 ("+days[d.getDay()]+") "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")}
tick();setInterval(tick,15000);

/* ---------- desktop icons ---------- */
var TOP=40, BASE=104;
var place={};   /* id -> {fx,fy} fractions of free area */
var nodes={};   /* id -> {el,x,y,w,h} */
var narrow=false, zTop=1, selected=null;
function deskSize(){return {W:desk.clientWidth,H:desk.clientHeight}}
function gridPlace(){
  var s=deskSize(),cols=Math.max(2,Math.floor((s.W-16)/118)),cellW=(s.W-16)/cols;
  DATA.works.forEach(function(w,i){var c=i%cols,r=Math.floor(i/cols);
    var px=8+c*cellW+(cellW-boxW(w))/2, py=TOP+12+r*148;
    place[w.id]=toFrac(w,px,py)})}
/* icon size: from the work's real size unless set by hand */
function sizeMM(str){str=String(str||"");if(!str.trim())return null;if(/가변/.test(str))return 800;
  var cm=/cm/i.test(str)&&!/mm/i.test(str),m=/(^|[^a-z])m($|[^a-z])/i.test(str)&&!/mm|cm/i.test(str);
  var nums=(str.match(/\d+(?:\.\d+)?/g)||[]).map(Number).filter(function(n){return n>0});if(!nums.length)return null;
  var mx=Math.max.apply(null,nums);return mx*(cm?10:m?1000:1)}
function autoScale(w){var mm=sizeMM(w.size);if(!mm)return null;var v=0.55*Math.pow(mm/180,0.52);return Math.round(Math.min(2.4,Math.max(0.42,v))*100)/100}
function iconScale(w){if(w.scaleMode==="manual")return +w.scale||1;return autoScale(w)||(+w.scale||1)}
function curS(w){if(narrow&&msz[w.id])return msz[w.id];var s=Math.round(BASE*iconScale(w)),ar=arOf(w);
  var maxH=(desk.clientHeight-TOP-24)/Math.min(1,1/ar),maxW=(desk.clientWidth-24)/Math.min(1,ar);return Math.max(24,Math.round(Math.min(s,maxH,maxW)))}
function arOf(w){var n=nodes[w.id];return n&&n.el._ar||1}
function boxW(w){return Math.round(curS(w)*Math.min(1,arOf(w)))+12}
function boxH(w){return Math.round(curS(w)*Math.min(1,1/arOf(w)))+(narrow?12:30)}
function toFrac(w,x,y){var s=deskSize();var aw=Math.max(1,s.W-boxW(w)),ah=Math.max(1,s.H-TOP-boxH(w)-8);
  return {fx:Math.min(1,Math.max(0,x/aw)),fy:Math.min(1,Math.max(0,(y-TOP)/ah))}}
function fromFrac(w,p){var s=deskSize();var aw=Math.max(0,s.W-boxW(w)),ah=Math.max(0,s.H-TOP-boxH(w)-8);
  return {x:p.fx*aw,y:TOP+p.fy*ah}}
function setPos(id,x,y){var n=nodes[id];if(!n)return;n.x=x;n.y=y;n.el.style.transform="translate("+Math.round(x)+"px,"+Math.round(y)+"px)"}
function layoutAll(){if(narrow){layoutNarrow();return}DATA.works.forEach(function(w){var n=nodes[w.id];if(n)n.el.style.setProperty("--s",curS(w)+"px");var p=fromFrac(w,place[w.id]||{fx:.5,fy:.5});setPos(w.id,p.x,p.y)})}
/* phones: same desktop, icons scaled to fit one screen and scattered without overlap */
var msz={},mpos=null,mW=0;
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function packNarrow(){
  var W=desk.clientWidth,H=desk.clientHeight,x0=6,y0=TOP+4,x1=W-6,y1=H-58,A=(x1-x0)*(y1-y0);
  var raw=DATA.works.map(function(w){return BASE*iconScale(w)}),sum=raw.reduce(function(a,r){return a+(r+16)*(r+16)},0);
  var k=Math.min(1,Math.sqrt(0.52*A/Math.max(1,sum)));
  var items=DATA.works.map(function(w,i){var m=Math.max(38,Math.round(raw[i]*k));msz[w.id]=m;return {id:w.id,b:m+12,x:0,y:0}});
  var order=items.slice().sort(function(a,b){return b.b-a.b}),placed=[],R=rng(20261020);
  function ov(a,b){var dx=Math.min(a.x+a.b,b.x+b.b)-Math.max(a.x,b.x),dy=Math.min(a.y+a.b,b.y+b.b)-Math.max(a.y,b.y);return dx>0&&dy>0?dx*dy:0}
  order.forEach(function(it){var best=null,bs=Infinity;
    for(var t=0;t<160;t++){it.x=x0+R()*Math.max(1,x1-x0-it.b);it.y=y0+R()*Math.max(1,y1-y0-it.b);var sc=0;placed.forEach(function(p){sc+=ov(it,p)});if(sc<bs){bs=sc;best=[it.x,it.y]}if(sc===0)break}
    it.x=best[0];it.y=best[1];placed.push(it)});
  for(var it2=0;it2<80;it2++){var moved=false;
    for(var a=0;a<items.length;a++)for(var c=a+1;c<items.length;c++){var p=items[a],q=items[c],dx=Math.min(p.x+p.b,q.x+q.b)-Math.max(p.x,q.x),dy=Math.min(p.y+p.b,q.y+q.b)-Math.max(p.y,q.y);
      if(dx>0&&dy>0){moved=true;if(dx<dy){var sx=(p.x<q.x?-1:1)*dx/2;p.x+=sx;q.x-=sx}else{var sy=(p.y<q.y?-1:1)*dy/2;p.y+=sy;q.y-=sy}}}
    items.forEach(function(p){p.x=Math.min(Math.max(p.x,x0),x1-p.b);p.y=Math.min(Math.max(p.y,y0),y1-p.b)});if(!moved)break}
  mpos={};items.forEach(function(p){mpos[p.id]={x:p.x,y:p.y}});mW=W}
function layoutNarrow(){
  if(!mpos||Math.abs(desk.clientWidth-mW)>2||DATA.works.some(function(w){return !mpos[w.id]}))packNarrow();
  var W=desk.clientWidth,H=desk.clientHeight;
  DATA.works.forEach(function(w){var n=nodes[w.id];if(!n)return;var m=msz[w.id];n.el.style.setProperty("--s",m+"px");var p=mpos[w.id];
    setPos(w.id,Math.min(Math.max(p.x,0),W-m-12),Math.min(Math.max(p.y,TOP),H-m-12))})}
function initPlaces(){if(desk.clientWidth<720){narrow=true;return}
  narrow=desk.clientWidth<720;
  if(narrow){gridPlace()}else DATA.works.forEach(function(w){place[w.id]={fx:w.x==null?Math.random()*.9:w.x,fy:w.y==null?Math.random()*.8:w.y}})}

function renderDesk(){
  iconsLayer.textContent="";nodes={};
  if(!DATA.works.length){iconsLayer.appendChild(h("div",{class:"desk-empty",text:canEdit?"아직 작업이 없어요. 오른쪽 위 ‘관리’에서 첫 작업을 추가하세요.":"작업이 곧 올라옵니다."}));return}
  DATA.works.forEach(function(w){
    var s=curS(w);
    var el=h("button",{class:"icon",style:"--s:"+s+"px","aria-label":w.title+(w.year?", "+w.year:"")+" 열기"},
      h("span",{class:"pic"},(function(){var im=h("img",{src:w.thumb?imgSrc(w.thumb):sized(w.icon,240),alt:"",draggable:"false",decoding:"async"});var upgraded=false;im._checkRes=function(){
      var need=Math.round(curS(w)*(window.devicePixelRatio||1));
      if(!upgraded&&w.icon&&im.naturalWidth&&Math.max(im.naturalWidth,im.naturalHeight)<need*0.95){upgraded=true;var full=imgSrc(w.icon);var hi=/^https:/.test(full)?sized(w.icon,Math.min(1600,need)):full;
        var pre=new Image();pre.onload=function(){im.src=hi};pre.src=hi}};
    im.addEventListener("load",function(){if(!el._ar)shapeIcon(el,im);im._checkRes();im.classList.add("ok")});fallbackImg(im,w.icon);if(im.complete&&im.naturalWidth)im.classList.add("ok");return im})()),
      h("span",{class:"lab",text:w.title||"제목 없음"}));
    el._wid=w.id;nodes[w.id]={el:el,x:0,y:0,vx:0,vy:0,w:w};
    attachDrag(el,w);
    el.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();openWork(w.id)}});
    iconsLayer.appendChild(el)});
  layoutAll()}

/* icons take their image's shape; clicks on transparent parts fall through to what is underneath */
function shapeIcon(el,im){var W=im.naturalWidth,H=im.naturalHeight;if(!W||!H)return;var ar=W/H;el._ar=ar;
  var wid=el._wid;if(wid&&!narrow&&place[wid]){var ww=DATA.works.find(function(x){return x.id===wid});if(ww){el.style.setProperty("--s",curS(ww)+"px");var p=fromFrac(ww,place[wid]);setPos(wid,p.x,p.y)}}
  el.style.setProperty("--aw",ar>=1?1:ar.toFixed(4));el.style.setProperty("--ah",ar>=1?(1/ar).toFixed(4):1);
  try{var k=Math.min(1,96/Math.max(W,H)),c=document.createElement("canvas");c.width=Math.max(1,Math.round(W*k));c.height=Math.max(1,Math.round(H*k));
    var x=c.getContext("2d",{willReadFrequently:true});x.drawImage(im,0,0,c.width,c.height);el._alpha={w:c.width,h:c.height,d:x.getImageData(0,0,c.width,c.height).data}}catch(e){el._alpha=null}}
function solidAt(el,cx,cy){var pic=el.querySelector(".pic");if(!pic)return true;var r=pic.getBoundingClientRect();
  if(cx<r.left||cx>r.right||cy<r.top||cy>r.bottom)return false;var a=el._alpha;if(!a)return true;
  var px=Math.floor((cx-r.left)/r.width*a.w),py=Math.floor((cy-r.top)/r.height*a.h);
  for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++){var X=px+dx,Y=py+dy;if(X>=0&&Y>=0&&X<a.w&&Y<a.h&&a.d[(Y*a.w+X)*4+3]>24)return true}return false}
desk.addEventListener("pointerdown",function(e){var hit=e.target.closest&&e.target.closest(".icon");if(!hit)return;
  var stack=document.elementsFromPoint(e.clientX,e.clientY).map(function(n){return n.closest&&n.closest(".icon")}).filter(function(n,i,a){return n&&a.indexOf(n)===i});
  var pick=null;for(var i=0;i<stack.length;i++)if(solidAt(stack[i],e.clientX,e.clientY)){pick=stack[i];break}
  if(pick===hit)return;e.stopPropagation();e.preventDefault();if(pick&&pick._start)pick._start(e);else select(null)},true);
desk.addEventListener("click",function(e){var hit=e.target.closest&&e.target.closest(".icon");if(hit&&!solidAt(hit,e.clientX,e.clientY)){e.stopPropagation();e.preventDefault()}},true);
desk.addEventListener("mousemove",function(e){var hit=e.target.closest&&e.target.closest(".icon");if(!hit)return;hit.classList.toggle("thru",!solidAt(hit,e.clientX,e.clientY))});
function select(id){if(selected&&nodes[selected])nodes[selected].el.classList.remove("sel");selected=id;if(id&&nodes[id])nodes[id].el.classList.add("sel")}
desk.addEventListener("pointerdown",function(e){if(e.target===desk||e.target===iconsLayer)select(null)});

var anim=null;
function attachDrag(el,w){
  var sx,sy,ox,oy,moved,lastT,lx,ly,vx,vy,pid=null;
  el._start=function(e){
    if(e.button!==0)return;pid=e.pointerId;try{el.setPointerCapture(pid)}catch(er){}
    var n=nodes[w.id];n.vx=n.vy=0;sx=e.clientX;sy=e.clientY;ox=n.x;oy=n.y;moved=false;lastT=performance.now();lx=sx;ly=sy;vx=vy=0;
    el.style.zIndex=++zTop;select(w.id)};
  el.addEventListener("pointerdown",function(e){el._start(e)});
  el.addEventListener("pointermove",function(e){
    if(e.pointerId!==pid)return;var dx=e.clientX-sx,dy=e.clientY-sy;
    if(!moved&&Math.hypot(dx,dy)<5)return;
    if(!moved){moved=true;el.classList.add("dragging")}
    var s=deskSize();var x=Math.min(Math.max(ox+dx,-boxW(w)*.3),s.W-boxW(w)*.7),y=Math.min(Math.max(oy+dy,TOP-6),s.H-boxH(w)*.6);
    setPos(w.id,x,y);
    var t=performance.now(),dt=Math.max(8,t-lastT);vx=vx*.6+(e.clientX-lx)/dt*16*.4;vy=vy*.6+(e.clientY-ly)/dt*16*.4;lastT=t;lx=e.clientX;ly=e.clientY});
  function end(e){
    if(e.pointerId!==pid)return;pid=null;el.classList.remove("dragging");
    if(!moved){openWork(w.id);return}
    var n=nodes[w.id];
    if(!reduce&&performance.now()-lastT<60&&Math.hypot(vx,vy)>6){n.vx=vx;n.vy=vy;startAnim()}else settle(w)}
  el.addEventListener("pointerup",end);el.addEventListener("pointercancel",end);
  el.addEventListener("click",function(e){if(e.detail===0)return;e.preventDefault()})}
function settle(w){var n=nodes[w.id];if(!n)return;var s=deskSize();
  var x=Math.min(Math.max(n.x,0),s.W-boxW(w)),y=Math.min(Math.max(n.y,TOP),s.H-boxH(w)-8);setPos(w.id,x,y);
  place[w.id]=toFrac(w,x,y);if(narrow&&mpos)mpos[w.id]={x:x,y:y};
  if(canEdit&&!narrow){w.x=+place[w.id].fx.toFixed(4);w.y=+place[w.id].fy.toFixed(4);markDirty("배치")}}
function startAnim(){if(anim)return;
  var step=function(){var any=false,s=deskSize();
    Object.keys(nodes).forEach(function(id){var n=nodes[id];if(!n.vx&&!n.vy)return;
      var x=n.x+n.vx,y=n.y+n.vy,maxX=s.W-boxW(n.w),maxY=s.H-boxH(n.w)-8;
      if(x<0){x=0;n.vx=0}if(x>maxX){x=maxX;n.vx=0}
      if(y<TOP){y=TOP;n.vy=0}if(y>maxY){y=Math.max(TOP,maxY);n.vy=0}
      n.vx*=.9;n.vy*=.9;setPos(id,x,y);
      if(Math.abs(n.vx)<.15&&Math.abs(n.vy)<.15){n.vx=n.vy=0;settle(n.w)}else any=true});
    anim=any?requestAnimationFrame(step):null};
  anim=requestAnimationFrame(step)}
var rT;window.addEventListener("resize",function(){clearTimeout(rT);rT=setTimeout(function(){var was=narrow;narrow=desk.clientWidth<720;if(was!==narrow&&!narrow)DATA.works.forEach(function(w){place[w.id]={fx:w.x==null?Math.random()*.9:w.x,fy:w.y==null?Math.random()*.8:w.y}});layoutAll()},80)});

/* ---------- windows ---------- */
var wins={}, cascade=0;
function focusWin(win){Object.keys(wins).forEach(function(k){wins[k].classList.remove("front")});win.classList.add("front");win.style.zIndex=200+(++zTop)}
function closeWin(key){var w=wins[key];if(!w)return;w.remove();delete wins[key];
  if(location.hash.slice(1)===key)history.replaceState(null,"",location.pathname+location.search);
  var keys=Object.keys(wins);if(keys.length)focusWin(wins[keys[keys.length-1]])}
function openWindow(key,title,body,o){
  o=o||{};
  if(wins[key]){focusWin(wins[key]);if(o.refresh){var b=wins[key].querySelector(".win-body");b.textContent="";b.appendChild(body);wins[key].querySelector(".win-title").textContent=title}return wins[key]}
  var s=deskSize(),W=Math.min(o.w||640,s.W-16),H=Math.min(o.h||520,s.H-TOP-16);
  var x=Math.max(8,(s.W-W)/2+(cascade%5)*26-52),y=Math.max(TOP+6,(s.H-H)/2+(cascade%5)*22-30);cascade++;
  var titleEl=h("div",{class:"win-title",text:title});
  var bar=h("div",{class:"win-bar"},
    h("div",{class:"lights"},
      h("button",{class:"light close","aria-label":"닫기",onclick:function(e){e.stopPropagation();closeWin(key)}}),
      h("button",{class:"light min","aria-label":"닫기",tabindex:"-1",onclick:function(e){e.stopPropagation();closeWin(key)}}),
      h("button",{class:"light max","aria-label":"크게 보기",tabindex:"-1",onclick:function(e){e.stopPropagation();var ss=deskSize();win.style.left="8px";win.style.top=(TOP+4)+"px";win.style.width=(ss.W-16)+"px";win.style.height=(ss.H-TOP-12)+"px"}})),
    titleEl);
  var bodyEl=h("div",{class:"win-body"},body);
  var win=h("section",{class:"win",role:"dialog","aria-label":title,style:"left:"+x+"px;top:"+y+"px;width:"+W+"px;height:"+H+"px"},bar,bodyEl);
  win.addEventListener("pointerdown",function(){focusWin(win)},true);
  var dx,dy,pid=null;
  bar.addEventListener("pointerdown",function(e){if(e.target.closest(".light")||desk.clientWidth<720)return;pid=e.pointerId;bar.setPointerCapture(pid);dx=e.clientX-win.offsetLeft;dy=e.clientY-win.offsetTop});
  bar.addEventListener("pointermove",function(e){if(e.pointerId!==pid)return;var ss=deskSize();
    win.style.left=Math.min(Math.max(e.clientX-dx,-win.offsetWidth+120),ss.W-120)+"px";win.style.top=Math.min(Math.max(e.clientY-dy,TOP),ss.H-40)+"px"});
  bar.addEventListener("pointerup",function(){pid=null});
  desk.appendChild(win);wins[key]=win;focusWin(win);
  if(o.hash)history.replaceState(null,"","#"+key);
  setTimeout(function(){var f=win.querySelector(".light.close");if(f)f.focus({preventScroll:true})},0);
  return win}
document.addEventListener("keydown",function(e){if(e.key!=="Escape")return;var t=e.target;if(t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"))return;
  var top=null,z=-1;Object.keys(wins).forEach(function(k){var zz=+wins[k].style.zIndex;if(zz>z){z=zz;top=k}});if(top)closeWin(top)});

/* ---------- work window ---------- */
function openWork(id){
  var w=DATA.works.find(function(x){return x.id===id});if(!w)return;
  var pics=(w.images||[]).slice();var cutIdx=-1;
  if(w.icon&&!pics.some(function(p){return p.src===w.icon})){pics.push({src:w.icon,caption:""});cutIdx=pics.length-1}
  var defCap=[w.title,w.year,w.medium,w.size].filter(Boolean).join(", ");
  var mainImg=h("img",{alt:w.title||"",decoding:"async"});mainImg.addEventListener("error",function(){if(mainImg.dataset.full&&mainImg.src!==mainImg.dataset.full)mainImg.src=mainImg.dataset.full});
  var cap=h("p",{class:"work-cap"});
  var thumbs=h("div",{class:"thumbs"});
  function bigOf(p){return p.opt?imgSrc(p.opt):sized(p,Math.min(1800,Math.round(900*(window.devicePixelRatio||1))),80)}
  function smallOf(p){return p.sm?imgSrc(p.sm):sized(p,200)}
  var token=0;
  function show(i){var p=pics[i]||{},my=++token,hi=bigOf(p);mainImg.dataset.full=imgSrc(p);
    mainImg.className=(i===cutIdx)?"cut":"";cap.textContent=p.caption||defCap;
    if(p.sm||!p.opt){mainImg.src=smallOf(p);mainImg.classList.add("soft")}
    var pre=new Image();pre.onload=function(){if(my===token){mainImg.src=hi;mainImg.classList.remove("soft")}};pre.onerror=function(){if(my===token){mainImg.src=mainImg.dataset.full;mainImg.classList.remove("soft")}};pre.src=hi;
    [i+1,i-1].forEach(function(j){if(pics[j]){var q=new Image();q.src=bigOf(pics[j])}});
    Array.prototype.forEach.call(thumbs.children,function(t,j){t.setAttribute("aria-current",j===i?"true":"false")})}
  if(pics.length>1)pics.forEach(function(p,i){thumbs.appendChild(h("button",{class:"thumb","aria-label":(i+1)+"번째 이미지",style:"background-image:url(\""+(p.sm?imgSrc(p.sm):sized(p,160))+"\")",onclick:function(){show(i)}}))});
  var meta=h("dl",{class:"meta"});
  [["분류",w.type,1],["연도",w.year,0],["재료",w.medium,1],["크기",w.size,0]].forEach(function(r){if(r[1]){meta.appendChild(h("dt",{text:r[0]}));meta.appendChild(h("dd",{class:r[2]?"txt":null,text:r[1]}))}});
  var body=h("div",{class:"work"},
    h("div",{class:"work-stage"},h("figure",{class:"work-fig"},h("div",{class:"work-main"},mainImg),cap),pics.length>1?thumbs:null),
    h("div",{class:"work-info"},
      h("h2",null,w.title||"제목 없음",w.sample?h("span",{class:"tag",text:"예시"}):null),
      meta,
      h("div",{class:"prose"},paras(w.desc))));
  show(0);
  openWindow("w-"+id,w.title||"작업",body,{w:880,h:600,refresh:true})}

/* ---------- list / cv / statement / info ---------- */
function openList(){
  var tb=h("tbody");
  DATA.works.forEach(function(w){tb.appendChild(h("tr",{class:"rowbtn",tabindex:"0",onclick:function(){openWork(w.id)},onkeydown:function(e){if(e.key==="Enter")openWork(w.id)}},
    h("td",null,h("img",{class:"mini",src:sized(w.icon,80),alt:""})),h("td",{text:w.title||"제목 없음"}),h("td",{class:"num",text:w.year||""}),h("td",{text:w.type||""}),h("td",{text:w.medium||""})))});
  var body=h("div",{style:"overflow-x:auto"},h("table",{class:"list"},h("thead",null,h("tr",null,h("th",{style:"width:40px"}),h("th",{text:"제목"}),h("th",{text:"연도"}),h("th",{text:"분류"}),h("th",{text:"재료"}))),tb));
  openWindow("works","작업 목록 — "+DATA.works.length+"점",body,{w:620,h:440,refresh:true})}
function openCV(){
  var doc=h("div",{class:"doc"},h("div",{class:"doc-head"},h("h2",{text:DATA.site.name||""}),DATA.site.nameEn?h("p",{text:DATA.site.nameEn}):null));
  DATA.cv.forEach(function(sec){if(!sec.items||!sec.items.length)return;
    doc.appendChild(h("section",{class:"cv-sec"},h("h3",{text:sec.cat}),sec.items.map(function(it){return h("div",{class:"cv-row"},h("span",{class:"y",text:it.year||""}),h("span",{text:it.text||""}))})))});
  openWindow("cv","작가 이력",doc,{w:600,h:560,hash:true,refresh:true})}
function openStatement(){
  var lang=DATA.statement.ko?"ko":"en";
  var txt=h("div",{class:"prose"});
  var hasBoth=DATA.statement.ko&&DATA.statement.en;
  var bK=h("button",{"aria-pressed":"true",onclick:function(){set("ko")}},"한국어"),bE=h("button",{"aria-pressed":"false",onclick:function(){set("en")}},"English");
  function set(l){lang=l;bK.setAttribute("aria-pressed",l==="ko");bE.setAttribute("aria-pressed",l==="en");txt.textContent="";paras(DATA.statement[l]).forEach(function(p){txt.appendChild(p)});txt.lang=l}
  var doc=h("div",{class:"doc"},h("div",{class:"doc-head",style:"display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap"},
    h("h2",{text:"작가 노트"}),hasBoth?h("div",{class:"seg"},bK,bE):null),txt);
  set(lang);
  openWindow("statement","스테이트먼트",doc,{w:620,h:580,hash:true,refresh:true})}
function openInfo(){
  var dl=h("dl",{class:"meta"});
  if(DATA.site.email){dl.appendChild(h("dt",{text:"이메일"}));dl.appendChild(h("dd",null,h("span",{style:"user-select:all",text:DATA.site.email})))}
  if(DATA.site.instagram){var ig=DATA.site.instagram.replace(/^@/,"");dl.appendChild(h("dt",{text:"인스타그램"}));dl.appendChild(h("dd",null,h("a",{href:"https://instagram.com/"+encodeURIComponent(ig),target:"_blank",rel:"noopener",text:"@"+ig})))}
  var doc=h("div",{class:"doc"},h("div",{class:"doc-head"},h("h2",{text:DATA.site.name||""}),DATA.site.nameEn?h("p",{text:DATA.site.nameEn}):null),DATA.site.tagline?h("p",{class:"prose",style:"margin:0",text:DATA.site.tagline}):null,dl,
    h("div",{class:"row-acts"},h("button",{class:"btn",onclick:function(){openCV()}},"이력 보기"),h("button",{class:"btn",onclick:function(){openStatement()}},"스테이트먼트 읽기")));
  openWindow("info","정보",doc,{w:440,h:380,refresh:true})}

/* ================= ADMIN ================= */
var admTab="works", admSel=null, admStatus=null, saveBtn=null;
function markDirty(what){dirty=true;adminBtn.classList.add("dirty");adminBtn.setAttribute("aria-label","관리 열기 (저장 안 된 변경 있음)");
  if(admStatus){admStatus.className="adm-status";admStatus.textContent="저장하지 않은 변경이 있어요"+(what?" ("+what+")":"")+". ‘저장하고 게시’를 눌러야 방문자에게 보입니다."}
  if(saveBtn)saveBtn.disabled=false}
function openAdmin(){
  if(!GH.token||!canEdit){openLogin();return}
  var main=h("div",{class:"adm-main"});
  var tabs=h("div",{class:"adm-tabs",role:"tablist"});
  [["works","작업"],["cv","이력"],["statement","스테이트먼트"],["site","사이트 설정"]].forEach(function(t){
    tabs.appendChild(h("button",{role:"tab","aria-selected":admTab===t[0]?"true":"false",onclick:function(){admTab=t[0];Array.prototype.forEach.call(tabs.children,function(b,i){b.setAttribute("aria-selected",b===this?"true":"false")},this);draw()}},t[1]))});
  admStatus=h("div",{class:"adm-status",role:"status",text:dirty?"저장하지 않은 변경이 있어요.":"바탕화면에서 아이콘을 끌어 놓으면 그 배치도 함께 저장됩니다."});
  saveBtn=h("button",{class:"btn primary",disabled:!dirty,onclick:save},"저장하고 게시");
  var body=h("div",{class:"adm"},tabs,main,h("div",{class:"adm-foot"},admStatus,saveBtn));
  function draw(){main.textContent="";main.scrollTop=0;
    if(DATA.site.sample)main.appendChild(h("div",{class:"notice",text:"지금 보이는 작업·이력·스테이트먼트는 모두 예시입니다. 실제 내용으로 바꾸거나 지워 주세요. 예시 작업에는 ‘예시’ 표시가 붙어 있어요."}));
    ({works:drawWorks,cv:drawCV,statement:drawStatement,site:drawSite})[admTab](main)}
  draw();
  openWindow("admin","관리",body,{w:900,h:640});
}

/* --- image upload with resize --- */
function prepImage(file,max,forcePng){return new Promise(function(res,rej){
  if(!/^image\//.test(file.type))return rej(new Error("이미지 파일만 올릴 수 있어요."));
  if(file.type==="image/svg+xml"||file.type==="image/gif")return res(file);
  var url=URL.createObjectURL(file),im=new Image();
  im.onload=function(){var r=Math.min(1,max/Math.max(im.naturalWidth,im.naturalHeight));
    if(r===1&&file.size<4e6){URL.revokeObjectURL(url);return res(file)}
    var c=document.createElement("canvas");c.width=Math.round(im.naturalWidth*r);c.height=Math.round(im.naturalHeight*r);
    c.getContext("2d").drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(url);
    var png=forcePng||file.type==="image/png"||file.type==="image/webp";
    c.toBlob(function(b){b?res(b):rej(new Error("이미지를 처리하지 못했어요."))},png?"image/png":"image/jpeg",.9)};
  im.onerror=function(){URL.revokeObjectURL(url);rej(new Error("이미지를 읽지 못했어요. JPG나 PNG로 다시 저장해 올려 주세요."))};
  im.src=url})}
function upload(file,max,forcePng){
  if(!GH.token)return Promise.reject(new Error("먼저 관리 열쇠로 로그인해 주세요."));
  return prepImage(file,max,forcePng).then(function(b){
    if(b.size>20e6)throw new Error("파일이 너무 커요. 20MB 이하로 줄여 주세요.");
    var t=b.type||file.type,ext=t==="image/png"?"png":t==="image/jpeg"?"jpg":t==="image/svg+xml"?"svg":t==="image/gif"?"gif":t==="image/webp"?"webp":"png";
    var p="images/uploads/"+new Date().toISOString().slice(0,10)+"-"+Math.random().toString(36).slice(2,8)+"."+ext;
    return queueFile(p,b)})
  .catch(function(e){throw new Error(e.status===401?"관리 열쇠가 만료됐거나 틀렸어요. 다시 로그인해 주세요.":e.status===403||e.status===404?"이 열쇠로는 올릴 수 없어요. 열쇠 권한의 Contents가 Read and write인지 확인해 주세요.":(e.message||"업로드에 실패했어요."))})}
function putBlob(p,b){return queueFile(p,b)}
function thumbPath(w){return "images/thumbs/"+w.id+"-"+Math.random().toString(36).slice(2,6)+".webp"}
function canvasResize(blob,max,q){return new Promise(function(res,rej){var url=URL.createObjectURL(blob),im=new Image();
  im.onload=function(){var r=Math.min(1,max/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement("canvas");c.width=Math.round(im.naturalWidth*r);c.height=Math.round(im.naturalHeight*r);
    c.getContext("2d").drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(url);c.toBlob(function(b){b?res(b):rej(new Error("사진을 줄이지 못했어요."))},"image/webp",q)};
  im.onerror=function(){URL.revokeObjectURL(url);rej(new Error("사진을 읽지 못했어요."))};im.src=url})}
function photoBlob(src){var u=imgSrc(src);
  if(/^https:/.test(u)&&!PREVIEW[src])return fetch(sized(src,1600,82)).then(function(r){if(!r.ok)throw new Error("사진을 불러오지 못했어요 ("+r.status+").");return r.blob()});
  return fetch(u).then(function(r){if(!r.ok)throw new Error("사진을 불러오지 못했어요 ("+r.status+").");return r.blob()}).then(function(b){return canvasResize(b,1600,.82)})}
function needOpt(p){return p&&p.src&&(!p.opt||p.optOf!==p.src)}
function optimizePhotos(btn,msg,done){
  var todo=[];DATA.works.forEach(function(w){(w.images||[]).forEach(function(p,i){if(needOpt(p))todo.push([w,p,i])})});
  var n=todo.length,ok=0,fail=0;if(!n){msg.textContent="모든 사진이 이미 가벼워요.";return}
  btn.disabled=true;msg.textContent="사진 줄이는 중… 0/"+n;
  todo.reduce(function(pr,t){return pr.then(function(){var w=t[0],p=t[1],tag=w.id+"-"+t[2]+"-"+Math.random().toString(36).slice(2,6);
    return photoBlob(p.src).then(function(big){return canvasResize(big,240,.75).then(function(sm){
      return Promise.all([queueFile("images/photos/"+tag+".webp",big),queueFile("images/photos/"+tag+"-s.webp",sm)]).then(function(r){p.opt=r[0];p.sm=r[1];p.optOf=p.src;ok++})})})
    .catch(function(){fail++}).then(function(){msg.textContent="사진 줄이는 중… "+(ok+fail)+"/"+n+" (이 창을 닫지 말아 주세요)"})})},Promise.resolve())
  .then(function(){btn.disabled=false;if(ok)markDirty("사진 최적화");
    msg.textContent=ok+"장을 가볍게 만들었어요"+(fail?", "+fail+"장은 실패했어요(다시 누르면 실패한 것만 다시 해요)":"")+". 아래 ‘저장하고 게시’를 눌러야 사이트에 올라가요.";if(done)done()})}
function canvasThumb(blob){return new Promise(function(res,rej){var url=URL.createObjectURL(blob),im=new Image();
  im.onload=function(){var r=Math.min(1,640/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement("canvas");c.width=Math.round(im.naturalWidth*r);c.height=Math.round(im.naturalHeight*r);
    c.getContext("2d").drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(url);c.toBlob(function(b){b?res(b):rej(new Error("썸네일을 만들지 못했어요."))},"image/webp",.86)};
  im.onerror=function(){URL.revokeObjectURL(url);rej(new Error("썸네일을 만들지 못했어요."))};im.src=url})}
function makeThumb(w){
  var src=imgSrc(w.icon);var p;
  if(PREVIEW[w.icon]||/^blob:|^data:/.test(src)||!/^https:/.test(src))p=fetch(src).then(function(r){if(!r.ok)throw new Error("이미지를 읽지 못했어요.");return r.blob()}).then(canvasThumb);
  else p=fetch(sized(w.icon,640)).then(function(r){if(!r.ok)throw new Error("이미지를 줄이지 못했어요 ("+r.status+").");return r.blob()});
  return p.then(function(b){if(b.size>900000)return canvasThumb(b);return b}).then(function(b){return putBlob(thumbPath(w),b)}).then(function(path){w.thumb=path;w.thumbOf=w.icon;return path})}
function needThumb(w){return w.icon&&(!w.thumb||w.thumbOf!==w.icon)}
/* --- automatic background removal (runs in the admin's browser) --- */
var BG=null;
function loadBG(){if(BG)return BG;BG=import("https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.8/+esm").then(function(m){return m.removeBackground||m.default}).catch(function(e){BG=null;throw new Error("누끼 도구를 불러오지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.")});return BG}
function trimAlpha(blob){return new Promise(function(res){var url=URL.createObjectURL(blob),im=new Image();
  im.onload=function(){var W=im.naturalWidth,H=im.naturalHeight,c=document.createElement("canvas");c.width=W;c.height=H;var x=c.getContext("2d");x.drawImage(im,0,0);
    var d=x.getImageData(0,0,W,H).data,minX=W,minY=H,maxX=-1,maxY=-1;
    for(var y=0;y<H;y+=2)for(var xx=0;xx<W;xx+=2){if(d[(y*W+xx)*4+3]>16){if(xx<minX)minX=xx;if(xx>maxX)maxX=xx;if(y<minY)minY=y;if(y>maxY)maxY=y}}
    URL.revokeObjectURL(url);if(maxX<0){res(null);return}
    var pad=8;minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);maxX=Math.min(W-1,maxX+pad);maxY=Math.min(H-1,maxY+pad);
    var o=document.createElement("canvas");o.width=maxX-minX+1;o.height=maxY-minY+1;o.getContext("2d").drawImage(c,minX,minY,o.width,o.height,0,0,o.width,o.height);
    var cover=(o.width*o.height)/(W*H);o.toBlob(function(b){res({blob:b,cover:cover})},"image/png")};
  im.onerror=function(){URL.revokeObjectURL(url);res(null)};im.src=url})}
function srcBlob(w){var ref=w.iconOrig||w.icon||(w.images&&w.images[0]&&w.images[0].src);
  if(!ref)return Promise.reject(new Error("먼저 ‘누끼 이미지 올리기’나 아래 ‘작품 사진’에 사진을 올려 주세요. 그 사진에서 배경을 지워 드려요."));
  var src=imgSrc(ref);var u=(/^https:/.test(src)&&!PREVIEW[ref])?sized(ref,1200).replace("output=webp","output=png"):src;
  return fetch(u).then(function(r){var t=r.headers.get("content-type")||"";
    if(!r.ok||(t&&!/^image\//.test(t)))throw new Error(r.status===404||/html/.test(t)?"방금 올린 사진이 아직 사이트에 반영되는 중이에요. 1~2분 뒤 다시 눌러 주세요.":"사진을 불러오지 못했어요 ("+r.status+").");return r.blob()})}
function cutoutOne(w,onStep){
  if(!(w.iconOrig||w.icon||(w.images&&w.images[0]&&w.images[0].src)))return Promise.reject(new Error("먼저 ‘누끼 이미지 올리기’나 아래 ‘작품 사진’에 사진을 올려 주세요. 그 사진에서 배경을 지워 드려요."));
  return loadBG().then(function(rb){onStep&&onStep("사진 불러오는 중");return srcBlob(w).then(function(b){onStep&&onStep("배경 지우는 중");return rb(b,{model:"isnet_fp16",output:{format:"image/png"}})})})
  .then(trimAlpha).then(function(t){if(!t)throw new Error("작품을 찾지 못했어요.");
    return putBlob("images/cutouts/"+w.id+"-"+Math.random().toString(36).slice(2,6)+".png",t.blob).then(function(path){
      if(!w.iconOrig)w.iconOrig=w.icon;w.icon=path;w.cutout=true;return canvasThumb(t.blob).then(function(tb){return putBlob(thumbPath(w),tb)}).then(function(tp){w.thumb=tp;w.thumbOf=w.icon;return t})})})}
function cutoutAll(btn,msg,done){
  var todo=DATA.works.filter(function(w){return w.icon&&!w.cutout}),n=todo.length,ok=0,fail=[];if(!n){msg.textContent="모든 작업이 이미 누끼 아이콘이에요.";return}
  btn.disabled=true;msg.textContent="누끼 도구 준비 중… (처음엔 1분쯤 걸려요)";
  todo.reduce(function(p,w,i){return p.then(function(){return cutoutOne(w,function(st){msg.textContent=(i+1)+"/"+n+" ‘"+(w.title||"")+"’ "+st+"… 이 창을 닫지 말아 주세요."})
    .then(function(){ok++;var nd=nodes[w.id];if(nd){var im=nd.el.querySelector("img");im.src=imgSrc(w.thumb);}markDirty("누끼")},function(e){fail.push(w.title||w.id)})})},Promise.resolve())
  .then(function(){btn.disabled=false;
    msg.textContent=ok+"개 누끼를 땄어요"+(fail.length?". 실패: "+fail.join(", "):"")+". 바탕화면에서 확인하고, 이상한 건 그 작업의 ‘원래 사진으로 되돌리기’를 누른 뒤 ‘저장하고 게시’를 눌러 주세요.";if(done)done()})}

function lightenAll(btn,msg,done){
  var todo=DATA.works.filter(needThumb),n=todo.length,i=0,fail=0;if(!n){msg.textContent="모든 아이콘이 이미 가벼워요.";return}
  btn.disabled=true;msg.textContent="가볍게 만드는 중… 0/"+n;
  todo.reduce(function(p,w){return p.then(function(){return makeThumb(w).then(function(){i++},function(){fail++}).then(function(){msg.textContent="가볍게 만드는 중… "+(i+fail)+"/"+n})})},Promise.resolve())
  .then(function(){btn.disabled=false;markDirty("아이콘 썸네일");
    msg.textContent=i+"개를 가볍게 만들었어요"+(fail?", "+fail+"개는 실패했어요(다시 누르면 실패한 것만 다시 해요)":"")+". 아래 ‘저장하고 게시’를 눌러 주세요.";if(done)done()})}
function filePick(multiple,cb){var i=h("input",{type:"file",accept:"image/*",style:"display:none"});if(multiple)i.multiple=true;
  i.addEventListener("change",function(){cb(Array.prototype.slice.call(i.files));i.remove()});document.body.appendChild(i);i.click()}
function setStatus(msg,kind){if(admStatus){admStatus.textContent=msg;admStatus.className="adm-status"+(kind?" "+kind:"")}}

/* --- works tab --- */
function drawWorks(main){
  if(!admSel||!DATA.works.find(function(w){return w.id===admSel}))admSel=DATA.works[0]?DATA.works[0].id:null;
  var heavyPh=0;DATA.works.forEach(function(w){(w.images||[]).forEach(function(p){if(needOpt(p))heavyPh++})});
  if(heavyPh){var pb=h("button",{class:"btn sm primary"},"사진 가볍게 만들기"),pm=h("span",{text:"작업 창 사진 "+heavyPh+"장이 원본 크기라 열 때 느려요. 화면용으로 줄인 사본을 만들어 두면 바로 떠요. 원본은 그대로 남아요."});
    pb.addEventListener("click",function(){optimizePhotos(pb,pm)});
    main.appendChild(h("div",{class:"notice",style:"display:flex;gap:10px;align-items:center;flex-wrap:wrap"},pm,pb))}
  var raw=DATA.works.filter(function(w){return w.icon&&!w.cutout}).length;
  if(raw){var cb=h("button",{class:"btn sm primary"},"누끼 자동으로 따기"),cm=h("span",{text:"누끼가 아닌 아이콘이 "+raw+"개 있어요. 버튼을 누르면 이 브라우저에서 배경을 하나씩 지워요. 한 개에 10초~1분쯤 걸려요."});
    cb.addEventListener("click",function(){cutoutAll(cb,cm)});
    main.appendChild(h("div",{class:"notice",style:"display:flex;gap:10px;align-items:center;flex-wrap:wrap"},cm,cb))}
  var heavy=DATA.works.filter(needThumb).length;
  if(heavy){var lb=h("button",{class:"btn sm primary"},"가볍게 만들기"),lm=h("span",{text:"바탕화면 아이콘 "+heavy+"개가 원본 사진이라 무거워요. 작은 썸네일을 만들어 두면 첫 화면이 빨리 떠요."});
    lb.addEventListener("click",function(){lightenAll(lb,lm,function(){renderDesk()})});
    main.appendChild(h("div",{class:"notice",style:"display:flex;gap:10px;align-items:center;flex-wrap:wrap"},lm,lb))}
  var list=h("div",{class:"wk-list"});
  DATA.works.forEach(function(w){list.appendChild(h("button",{class:"wk-item","aria-current":w.id===admSel?"true":"false",onclick:function(){admSel=w.id;rerender()}},
    h("img",{src:sized(w.icon,80),alt:""}),h("span",{class:"t"},w.title||"제목 없음",h("small",{text:w.year||"—"}))))});
  list.appendChild(h("button",{class:"btn sm",style:"margin:8px 6px 0;align-self:flex-start",onclick:function(){
    var w={id:uid(),title:"새 작업",year:String(new Date().getFullYear()),medium:"",size:"",desc:"",icon:"",images:[],scale:1,x:.35+Math.random()*.3,y:.3+Math.random()*.3};
    DATA.works.push(w);admSel=w.id;place[w.id]={fx:w.x,fy:w.y};if(narrow)gridPlace();renderDesk();markDirty("작업 추가");rerender()}},"+ 새 작업"));
  var form=h("div",{class:"wk-form"});
  var w=DATA.works.find(function(x){return x.id===admSel});
  if(!w)form.appendChild(h("p",{style:"color:var(--ink-soft)",text:"‘+ 새 작업’으로 첫 작업을 추가하세요."}));
  else buildWorkForm(form,w);
  main.appendChild(h("div",{class:"wk"},list,form));
  function rerender(){main.textContent="";if(DATA.site.sample)main.appendChild(h("div",{class:"notice",text:"지금 보이는 작업·이력·스테이트먼트는 모두 예시입니다. 실제 내용으로 바꾸거나 지워 주세요."}));drawWorks(main)}
}
function txtField(label,val,on,o){o=o||{};var id="f-"+label.replace(/\s/g,"")+(o.idx||"");
  var inp=o.area?h("textarea",{id:id,class:o.long?"long":null}):h("input",{type:o.type||"text",id:id});inp.value=val||"";
  if(o.ph)inp.placeholder=o.ph;
  inp.addEventListener("input",function(){on(inp.value);markDirty()});
  return h("div",{class:"field"},h("label",{for:id,text:label}),inp,o.hint?h("div",{class:"hint",text:o.hint}):null)}
var sizeHook=null;
function buildWorkForm(form,w){
  function refreshDesk(){var n=nodes[w.id];if(n){n.el.querySelector(".lab").textContent=w.title||"제목 없음";n.el.querySelector("img").src=w.thumb?imgSrc(w.thumb):imgSrc(w.icon)}
    var it=document.querySelector('.wk-item[aria-current="true"] .t');if(it){it.firstChild.textContent=w.title||"제목 없음";it.querySelector("small").textContent=w.year||"—"}}
  form.appendChild(txtField("제목",w.title,function(v){w.title=v;delete w.sample;refreshDesk()}));
  form.appendChild(h("div",{class:"grid2"},
    txtField("연도",w.year,function(v){w.year=v;refreshDesk()},{ph:"2025"}),
    txtField("크기",w.size,function(v){w.size=v;if(sizeHook)sizeHook()},{ph:"W520xD140xH2840mm"})));
  form.appendChild(h("div",{class:"grid2"},txtField("분류",w.type,function(v){w.type=v},{ph:"가구 / 조명 / 조형"}),txtField("재료 / 기법",w.medium,function(v){w.medium=v},{ph:"도자"})));
  form.appendChild(txtField("작품 설명",w.desc,function(v){w.desc=v},{area:true,hint:"빈 줄로 문단을 나눌 수 있어요."}));

  /* icon */
  var icPrev=h("img",{src:imgSrc(w.icon),alt:"아이콘 미리보기"});icPrev.hidden=!w.icon;icPrev.addEventListener("load",function(){icPrev.hidden=false});
  var icMsg=h("div",{class:"hint",text:"배경을 지운 투명 PNG가 가장 잘 어울려요. 바탕화면 아이콘과 작업 창에 쓰입니다."});
  function doIcon(file){icMsg.textContent="올리는 중…";upload(file,1200,true).then(function(id){w.icon=id;w.cutout=true;delete w.iconOrig;delete w.sample;icPrev.src=imgSrc(id);
    icMsg.textContent="아이콘 썸네일 만드는 중…";return makeThumb(w).catch(function(){w.thumb="";})}).then(function(){refreshDesk();icMsg.textContent="준비됐어요. ‘저장하고 게시’를 누르면 사이트에 올라가요.";markDirty("아이콘")}).catch(function(e){icMsg.textContent=e.message})}
  var drop=h("div",{class:"drop"},icPrev,h("div",{class:"acts"},h("button",{class:"btn sm",onclick:function(){filePick(false,function(f){if(f[0])doIcon(f[0])})}},w.icon?"누끼 이미지 바꾸기":"누끼 이미지 올리기"),
    h("button",{class:"btn sm",onclick:function(e){var b=e.currentTarget;b.disabled=true;cutoutOne(w,function(st){icMsg.textContent=st+"…"}).then(function(){icPrev.src=imgSrc(w.icon);refreshDesk();icMsg.textContent="누끼를 땄어요. 마음에 들면 ‘저장하고 게시’를 눌러 주세요.";markDirty("누끼")},function(er){icMsg.textContent=er.message}).then(function(){b.disabled=false})}},"자동 누끼 따기"),
    w.iconOrig?h("button",{class:"btn sm",onclick:function(){w.icon=w.iconOrig;delete w.iconOrig;delete w.cutout;w.thumb="";icPrev.src=imgSrc(w.icon);icPrev.hidden=!w.icon;refreshDesk();icMsg.textContent="원래 사진으로 되돌렸어요.";markDirty("아이콘")}},"원래 사진으로 되돌리기"):null,
    icMsg));
  dnd(drop,function(fs){doIcon(fs[0])});
  form.appendChild(h("div",{class:"field"},h("span",{class:"lbl",text:"바탕화면 아이콘 (누끼 이미지)"}),drop));

  /* icon size */
  var rng=h("input",{type:"range",id:"sz-"+w.id,min:"0.3",max:"7",step:"0.05",style:"flex:1;min-width:140px"});rng.value=iconScale(w);
  var szOut=h("span",{class:"hint",style:"min-width:150px"});
  var autoBtn=h("button",{class:"btn sm"},"작업 크기로 맞추기");
  function szLabel(){var a=autoScale(w);szOut.textContent=w.scaleMode==="manual"?"직접 조절 ("+Math.round(iconScale(w)*100)+"%)":a?"작업 크기 기준 ("+Math.round(a*100)+"%)":"기본 크기";autoBtn.disabled=w.scaleMode!=="manual"}
  function liveSize(){var n=nodes[w.id];if(n){n.el.style.setProperty("--s",curS(w)+"px");var im=n.el.querySelector("img");if(im&&im._checkRes)im._checkRes()}}
  rng.addEventListener("input",function(){w.scaleMode="manual";w.scale=+(+rng.value).toFixed(2);liveSize();szLabel()});
  rng.addEventListener("change",function(){layoutAll();markDirty("아이콘 크기")});
  autoBtn.addEventListener("click",function(){delete w.scaleMode;rng.value=iconScale(w);liveSize();layoutAll();szLabel();markDirty("아이콘 크기")});
  szLabel();sizeHook=function(){if(w.scaleMode!=="manual"){rng.value=iconScale(w);liveSize();szLabel()}};
  form.appendChild(h("div",{class:"field"},h("span",{class:"lbl",text:"아이콘 크기"}),h("div",{class:"row-acts"},rng,szOut,autoBtn),
    h("div",{class:"hint",text:"처음에는 ‘크기’ 칸의 실제 치수로 정해져요. 큰 작업일수록 아이콘도 커져요. 막대를 움직이면 바탕화면에서 바로 바뀌어요."})));

  /* photos */
  var photos=h("div",{class:"photos"});var phMsg=h("div",{class:"hint",text:"설치 전경, 디테일 컷 등. 사진마다 캡션을 적을 수 있고, 비워 두면 ‘제목, 연도, 재료, 크기’가 기본 캡션으로 붙어요."});
  function swap(i,j){var t=w.images[i];w.images[i]=w.images[j];w.images[j]=t;drawPhotos();markDirty("사진 순서")}
  function drawPhotos(){photos.textContent="";(w.images||[]).forEach(function(ph,i){
    var capIn=h("input",{type:"text",id:"cap-"+w.id+"-"+i,"aria-label":(i+1)+"번째 사진 캡션",placeholder:"캡션 (비우면 기본 캡션)",value:ph.caption||""});
    capIn.addEventListener("input",function(){ph.caption=capIn.value;markDirty("캡션")});
    photos.appendChild(h("div",{class:"photo-item"},
      h("div",{class:"photo",style:"background-image:url(\""+imgSrc(ph)+"\")"},
        h("button",{class:"x","aria-label":"사진 빼기",onclick:function(){w.images.splice(i,1);drawPhotos();markDirty("사진")}},"×"),
        h("div",{class:"mv"},i>0?h("button",{"aria-label":"앞으로",onclick:function(){swap(i,i-1)}},"←"):null,
          i<w.images.length-1?h("button",{"aria-label":"뒤로",onclick:function(){swap(i,i+1)}},"→"):null)),
      capIn))});
    photos.appendChild(h("button",{class:"add-photo",onclick:function(){filePick(true,addPhotos)}},"+ 사진"))}
  function addPhotos(files){if(!files.length)return;w.images=w.images||[];var n=files.length,done=0;phMsg.textContent="올리는 중… 0/"+n;
    files.reduce(function(p,f){return p.then(function(){return upload(f,2200,false).then(function(src){var ent={src:src,caption:""};w.images.push(ent);return photoBlob(src).then(function(big){return canvasResize(big,240,.75).then(function(sm){return Promise.all([queueFile(src.replace(/\.[a-z]+$/,"")+"-v.webp",big),queueFile(src.replace(/\.[a-z]+$/,"")+"-s.webp",sm)]).then(function(r){ent.opt=r[0];ent.sm=r[1];ent.optOf=src})})}).catch(function(){});}).then(function(){done++;phMsg.textContent="올리는 중… "+done+"/"+n;drawPhotos()})})},Promise.resolve())
      .then(function(){phMsg.textContent=n+"장을 올렸어요. 캡션을 적고 ‘저장하고 게시’를 눌러 주세요.";markDirty("사진")}).catch(function(e){phMsg.textContent=e.message;if(done)markDirty("사진")})}
  drawPhotos();dnd(photos,addPhotos);
  form.appendChild(h("div",{class:"field"},h("span",{class:"lbl",text:"작품 사진"}),photos,phMsg));

  /* order + delete */
  var idx=DATA.works.indexOf(w);
  var del=h("button",{class:"btn danger",onclick:function(){
    if(!del.classList.contains("armed")){del.classList.add("armed");del.textContent="한 번 더 누르면 삭제";setTimeout(function(){if(del.isConnected){del.classList.remove("armed");del.textContent="이 작업 삭제"}},3500);return}
    DATA.works.splice(DATA.works.indexOf(w),1);delete place[w.id];admSel=null;renderDesk();closeWin("w-"+w.id);markDirty("작업 삭제");openAdminRefresh()}},"이 작업 삭제");
  form.appendChild(h("div",{class:"row-acts",style:"margin-top:6px"},
    h("button",{class:"btn sm",disabled:idx<=0,onclick:function(){move(-1)}},"목록에서 위로"),
    h("button",{class:"btn sm",disabled:idx>=DATA.works.length-1,onclick:function(){move(1)}},"아래로"),
    h("span",{class:"mb-spacer",style:"flex:1"}),
    h("button",{class:"btn sm",onclick:function(){openWork(w.id)}},"미리보기"),del));
  function move(d){var i=DATA.works.indexOf(w),j=i+d;DATA.works.splice(i,1);DATA.works.splice(j,0,w);if(narrow){gridPlace();layoutAll()}markDirty("순서");openAdminRefresh()}
}
function openAdminRefresh(){var t=wins.admin;if(!t)return;var tab=t.querySelector('.adm-tabs [aria-selected="true"]');if(tab)tab.click()}
function dnd(el,cb){
  el.addEventListener("dragover",function(e){e.preventDefault();el.classList.add("over")});
  el.addEventListener("dragleave",function(){el.classList.remove("over")});
  el.addEventListener("drop",function(e){e.preventDefault();el.classList.remove("over");var fs=Array.prototype.slice.call(e.dataTransfer.files||[]).filter(function(f){return /^image\//.test(f.type)});if(fs.length)cb(fs)})}

/* --- cv tab --- */
function drawCV(main){
  var wrap=h("div",{class:"pad"});
  wrap.appendChild(h("div",{class:"hint",style:"font-size:12.5px;color:var(--ink-soft)",text:"분류(학력, 개인전, 단체전 등)마다 연도와 내용을 한 줄씩 적어요. 위에서부터 그대로 보입니다."}));
  DATA.cv.forEach(function(sec,si){
    var box=h("div",{class:"cvc"});
    var nameIn=h("input",{type:"text",id:"cv-cat-"+si,"aria-label":"분류 이름",value:sec.cat||""});
    nameIn.addEventListener("input",function(){sec.cat=nameIn.value;markDirty("이력")});
    var delSec=h("button",{class:"btn sm danger",onclick:function(){if(!delSec.classList.contains("armed")){delSec.classList.add("armed");delSec.textContent="한 번 더";return}
      DATA.cv.splice(si,1);markDirty("이력");redraw()}},"분류 삭제");
    box.appendChild(h("div",{class:"cvc-head"},nameIn,
      h("button",{class:"iconbtn","aria-label":"분류 위로",disabled:si===0,onclick:function(){DATA.cv.splice(si,1);DATA.cv.splice(si-1,0,sec);markDirty("이력");redraw()}},"↑"),
      h("button",{class:"iconbtn","aria-label":"분류 아래로",onclick:function(){if(si>=DATA.cv.length-1)return;DATA.cv.splice(si,1);DATA.cv.splice(si+1,0,sec);markDirty("이력");redraw()}},"↓"),delSec));
    (sec.items||[]).forEach(function(it,ii){
      var y=h("input",{type:"text",class:"y",id:"cv-y-"+si+"-"+ii,"aria-label":"연도",value:it.year||"",placeholder:"2025"});
      var t=h("input",{type:"text",id:"cv-t-"+si+"-"+ii,"aria-label":"내용",value:it.text||"",placeholder:"《전시 제목》, 장소, 도시"});
      y.addEventListener("input",function(){it.year=y.value;markDirty("이력")});t.addEventListener("input",function(){it.text=t.value;markDirty("이력")});
      box.appendChild(h("div",{class:"cve"},y,t,h("button",{class:"iconbtn","aria-label":"이 줄 삭제",onclick:function(){sec.items.splice(ii,1);markDirty("이력");redraw()}},"×")))});
    box.appendChild(h("div",{class:"row-acts"},
      h("button",{class:"btn sm",onclick:function(){sec.items=sec.items||[];sec.items.unshift({year:String(new Date().getFullYear()),text:""});markDirty("이력");redraw()}},"+ 맨 위에 한 줄"),
      h("button",{class:"btn sm",onclick:function(){sec.items.sort(function(a,b){return String(b.year).localeCompare(String(a.year))});markDirty("이력");redraw()}},"최신 연도순 정렬")));
    wrap.appendChild(box)});
  wrap.appendChild(h("div",{class:"row-acts"},
    h("button",{class:"btn",onclick:function(){DATA.cv.push({cat:"새 분류",items:[{year:"",text:""}]});markDirty("이력");redraw()}},"+ 분류 추가"),
    h("button",{class:"btn",onclick:function(){openCV()}},"미리보기")));
  main.appendChild(wrap);
  function redraw(){var st=main.scrollTop;main.textContent="";drawCV(main);main.scrollTop=st;if(wins.cv)openCV()}
}

/* --- statement tab --- */
function drawStatement(main){
  var wrap=h("div",{class:"pad"});
  wrap.appendChild(txtField("스테이트먼트 (한국어)",DATA.statement.ko,function(v){DATA.statement.ko=v},{area:true,long:true,hint:"빈 줄로 문단을 나눌 수 있어요."}));
  wrap.appendChild(txtField("Statement (English)",DATA.statement.en,function(v){DATA.statement.en=v},{area:true,long:true,hint:"비워 두면 한국어만 보입니다."}));
  wrap.appendChild(h("div",{class:"row-acts"},h("button",{class:"btn",onclick:function(){if(wins.statement)closeWin("statement");openStatement()}},"미리보기")));
  main.appendChild(wrap)}

/* --- site tab --- */
var PRESETS=[["#c9ccc3","이끼 회색"],["#e4e1da","한지"],["#d6d9de","새벽"],["#b9c4cf","흐린 하늘"],["#d8c9b8","황토"],["#9aa594","쑥"],["#2f3133","먹"],["#1f2a3a","밤"]];
function drawSite(main){
  var wrap=h("div",{class:"pad"});
  wrap.appendChild(h("div",{class:"grid2"},
    txtField("작가 이름",DATA.site.name,function(v){DATA.site.name=v;renderName()}),
    txtField("영문 이름",DATA.site.nameEn,function(v){DATA.site.nameEn=v},{ph:"Han Seoyun"})));
  wrap.appendChild(h("div",{class:"grid2"},
    txtField("이메일",DATA.site.email,function(v){DATA.site.email=v},{type:"email",hint:"정보 창에 복사할 수 있는 글자로 보여요."}),
    txtField("인스타그램",DATA.site.instagram,function(v){DATA.site.instagram=v},{ph:"@아이디"})));
  wrap.appendChild(txtField("한 줄 소개",DATA.site.tagline,function(v){DATA.site.tagline=v},{hint:"이름을 눌렀을 때 뜨는 정보 창에 보여요."}));
  var sw=h("div",{class:"swatches"});
  var picker=h("input",{type:"color",id:"bg-pick","aria-label":"직접 고르기",value:DATA.site.bg||"#c9ccc3",style:"width:44px;height:34px;border:0;background:none;padding:0;cursor:pointer"});
  var prev=h("div",{class:"preview-desk"});
  DATA.works.slice(0,3).forEach(function(w){prev.appendChild(h("img",{src:imgSrc(w.icon),alt:""}))});
  function setBg(c){DATA.site.bg=c;applyBg();prev.style.background=c;picker.value=c;Array.prototype.forEach.call(sw.querySelectorAll(".sw"),function(b){b.setAttribute("aria-pressed",b.dataset.c===c?"true":"false")});markDirty("배경색")}
  PRESETS.forEach(function(p){var b=h("button",{class:"sw","data-c":p[0],title:p[1],"aria-label":p[1],"aria-pressed":DATA.site.bg===p[0]?"true":"false",style:"background:"+p[0],onclick:function(){setBg(p[0])}});sw.appendChild(b)});
  picker.addEventListener("input",function(){setBg(picker.value)});
  sw.appendChild(picker);prev.style.background=DATA.site.bg;
  wrap.appendChild(h("div",{class:"field"},h("span",{class:"lbl",text:"바탕화면 배경색"}),sw,prev,
    h("div",{class:"hint",text:"누끼 작업이 잘 보이도록 채도가 낮은 단색을 권해요. 어두운 색을 고르면 아이콘 이름이 흰 글씨로 바뀝니다."})));
  var arrange=h("button",{class:"btn",onclick:function(){if(narrow){toast("넓은 화면에서 정렬해 주세요.");return}
    var s=deskSize(),cols=Math.max(3,Math.ceil(Math.sqrt(DATA.works.length*1.6))),rows=Math.ceil(DATA.works.length/cols);
    DATA.works.forEach(function(w,i){var c=i%cols,r=Math.floor(i/cols);w.x=+((c+.5)/cols*.92+.04-.04).toFixed(4);w.y=+((r+.5)/Math.max(rows,1)*.8).toFixed(4);place[w.id]={fx:w.x,fy:w.y}});
    layoutAll();markDirty("배치")}},"아이콘 바둑판 정렬");
  var allAuto=h("button",{class:"btn",onclick:function(){DATA.works.forEach(function(w){delete w.scaleMode});renderDesk();markDirty("아이콘 크기");toast("모든 아이콘을 작업 크기에 맞췄어요.")}},"모든 아이콘 작업 크기로 맞추기");
  wrap.appendChild(h("div",{class:"field"},h("span",{class:"lbl",text:"배치"}),h("div",{class:"row-acts"},arrange,allAuto),
    h("div",{class:"hint",text:"관리 열쇠로 로그인한 상태에서 바탕화면 아이콘을 끌어 놓으면 그 위치가 저장돼요. 방문자가 옮긴 위치는 그 사람 화면에서만 바뀌어요. 휴대폰처럼 좁은 화면에서는 아이콘이 자동으로 줄 맞춰 놓입니다."})));
  if(DATA.site.sample)wrap.appendChild(h("div",{class:"field"},h("span",{class:"lbl",text:"예시 데이터"}),
    h("div",{class:"row-acts"},h("button",{class:"btn danger",onclick:function(e){var b=e.currentTarget;if(!b.classList.contains("armed")){b.classList.add("armed");b.textContent="한 번 더 누르면 예시 작업을 모두 지워요";return}
      DATA.works=DATA.works.filter(function(w){return !w.sample});delete DATA.site.sample;renderDesk();markDirty("예시 정리");openAdminRefresh()}},"예시 작업 모두 지우기"),
      h("button",{class:"btn",onclick:function(){delete DATA.site.sample;markDirty();openAdminRefresh()}},"예시 안내 숨기기"))));
  var lo=h("button",{class:"btn",onclick:function(){try{localStorage.removeItem("byunjiwon-admin-key")}catch(e){}GH.token=null;canEdit=false;adminBtn.hidden=true;closeWin("admin");toast("이 브라우저에서 로그아웃했어요.")}},"이 브라우저에서 로그아웃");
  wrap.appendChild(h("div",{class:"field"},h("span",{class:"lbl",text:"관리 열쇠"}),h("div",{class:"row-acts"},lo),
    h("div",{class:"hint",text:"공용 컴퓨터에서 관리했다면 꼭 로그아웃해 주세요. 다시 관리하려면 byunjiwon.com/#admin 으로 들어오면 돼요."})));
  main.appendChild(wrap)}

/* --- save = commit content/site.json to GitHub --- */
var saving=false;
function save(){
  if(saving)return;
  if(!GH.token){setStatus("먼저 관리 열쇠로 로그인해 주세요.","err");return}
  saving=true;saveBtn.disabled=true;setStatus("저장하는 중…");
  var out=JSON.stringify(DATA,null,2)+"\n";
  var used=JSON.stringify(DATA);var paths=Object.keys(PENDING).filter(function(p){return used.indexOf(p)>=0});
  var entries=[],n=paths.length,k=0;
  /* 1) send each new image once (these are not commits, so the site is rebuilt only once) */
  paths.reduce(function(pr,p){return pr.then(function(){return blobB64(PENDING[p]).then(function(c){return ghGit("POST","blobs",{content:c,encoding:"base64"})})
      .then(function(r){entries.push({path:p,mode:"100644",type:"blob",sha:r.sha});k++;setStatus("사진 올리는 중… "+k+"/"+n)})})},Promise.resolve())
  .then(function(){return ghGit("POST","blobs",{content:b64utf8(out),encoding:"base64"})})
  .then(function(jb){entries.push({path:GH.path,mode:"100644",type:"blob",sha:jb.sha});
    /* 2) one commit on top of the latest version, unless someone else changed the content meanwhile */
    function attempt(tries){
      return ghGit("GET","ref/heads/"+GH.branch).then(function(ref){var head=ref.object.sha;
        return ghGit("GET","commits/"+head).then(function(c){
          return ghApi("GET",GH.path).then(function(cur){
            if(GH.sha&&cur.sha!==GH.sha){var e=new Error("conflict");e.status=409;throw e}
            return ghGit("POST","trees",{base_tree:c.tree.sha,tree:entries})})
          .then(function(t){return ghGit("POST","commits",{message:"포트폴리오 내용 수정"+(n?" (사진 "+n+"장)":""),tree:t.sha,parents:[head]})})
          .then(function(cm){return ghGit("PATCH","refs/heads/"+GH.branch,{sha:cm.sha})})})})
      .catch(function(e){if(e.status===422&&tries>0)return attempt(tries-1);throw e})}
    return attempt(2).then(function(){GH.sha=jb.sha})})
  .then(function(){paths.forEach(function(p){delete PENDING[p]});
    saving=false;dirty=false;adminBtn.classList.remove("dirty");adminBtn.setAttribute("aria-label","관리 열기");
    setStatus("저장했어요. 1~2분 뒤 byunjiwon.com에 반영돼요.","good")})
  .catch(function(e){saving=false;saveBtn.disabled=false;var s=e.status;
    setStatus(s===409?"다른 곳에서 먼저 저장된 내용이 있어요. 새로고침한 뒤 다시 고쳐 주세요.":
      s===401?"관리 열쇠가 만료됐거나 틀렸어요. ‘사이트 설정’에서 로그아웃한 뒤 새 열쇠로 다시 로그인해 주세요.":
      s===403||s===404?"이 열쇠로는 저장할 수 없어요. 열쇠 권한의 Contents가 Read and write인지 확인해 주세요.":
      "저장하지 못했어요: "+e.message+". 잠시 뒤 다시 눌러 주세요.","err")})}

/* --- login with a GitHub key --- */
function openLogin(){
  var inp=h("input",{type:"password",id:"admin-key",autocomplete:"off",placeholder:"github_pat_로 시작하는 열쇠"});
  var msg=h("div",{class:"hint",role:"status"});
  var btn=h("button",{class:"btn primary",onclick:go},"로그인");
  inp.addEventListener("keydown",function(e){if(e.key==="Enter")go()});
  function go(){var k=inp.value.trim();if(!k){msg.textContent="열쇠를 붙여 넣어 주세요.";return}
    btn.disabled=true;msg.textContent="확인하는 중…";GH.token=k;
    ghLoad().then(function(){try{localStorage.setItem("byunjiwon-admin-key",k)}catch(e){}
      canEdit=true;adminBtn.hidden=false;refreshAll();closeWin("login");openAdmin()})
    .catch(function(e){GH.token=null;btn.disabled=false;
      msg.textContent=e.status===401?"열쇠가 틀렸거나 만료됐어요. 다시 복사해 붙여 넣어 주세요.":e.status===404||e.status===403?"이 열쇠로는 elpp1210/mine 저장소에 들어갈 수 없어요. 저장소 선택과 Contents 권한을 확인해 주세요.":"확인하지 못했어요: "+e.message})}
  var steps=h("ol",{class:"steps"},
    h("li",null,h("a",{href:"https://github.com/settings/personal-access-tokens/new",target:"_blank",rel:"noopener"},"깃허브 열쇠 만들기 페이지"),"를 여세요."),
    h("li",null,"Token name에 ‘byunjiwon 관리’, Expiration은 원하는 기간(최대 1년)으로 정해요."),
    h("li",null,"Repository access에서 ",h("b",{text:"Only select repositories"}),"를 고르고 ",h("b",{text:"elpp1210/mine"}),"을 선택해요."),
    h("li",null,"Permissions의 ",h("b",{text:"Contents"}),"를 ",h("b",{text:"Read and write"}),"로 바꿔요."),
    h("li",null,"맨 아래 ",h("b",{text:"Generate token"}),"을 누르고, 나온 열쇠를 복사해 아래에 붙여 넣어요."));
  var doc=h("div",{class:"doc"},h("div",{class:"doc-head"},h("h2",{text:"관리 로그인"}),h("p",{text:"처음 한 번만 하면 이 브라우저에서는 다음부터 바로 열려요."})),
    steps,h("div",{class:"field"},h("label",{for:"admin-key",text:"관리 열쇠"}),inp,msg),h("div",{class:"row-acts"},btn));
  openWindow("login","관리 로그인",doc,{w:520,h:560});
  setTimeout(function(){inp.focus()},50)}
function refreshAll(){applyBg();renderName();initPlaces();renderDesk();Object.keys(wins).forEach(function(k){if(k!=="login"&&k!=="admin")closeWin(k)})}

window.addEventListener("beforeunload",function(e){if(dirty&&!saving){e.preventDefault();e.returnValue=""}});

/* ---------- boot ---------- */
applyBg();renderName();
fetch("content/site.json",{cache:"no-cache"}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(d){DATA=normalize(d)}).catch(function(){DATA=normalize(DATA)}).then(function(){
  applyBg();renderName();
  requestAnimationFrame(function(){initPlaces();renderDesk();
    var hs=location.hash.slice(1);if(hs==="cv")openCV();else if(hs==="statement")openStatement();
    if(GH.token){ghLoad().then(function(){canEdit=true;adminBtn.hidden=false;refreshAll();if(hs==="admin")openAdmin()})
      .catch(function(e){adminBtn.hidden=false;if(hs==="admin"||e.status===401)openLogin()})}
    else if(hs==="admin")openLogin()})});
window.addEventListener("hashchange",function(){if(location.hash==="#admin")openAdmin()});
})();
