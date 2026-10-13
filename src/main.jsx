import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Languages,ArrowLeftRight,Copy,Share2,MessageCircle,History,Mic,Send,Globe, Sparkles, Trash2} from 'lucide-react';
import './style.css';

const LANGS=[
 {id:'en',name:'English',native:'English',code:'en'},
 {id:'tr',name:'Turkish',native:'Türkçe',code:'tr'},
 {id:'ur',name:'Urdu',native:'اردو',code:'ur'},
 {id:'roman',name:'Roman Urdu',native:'Roman Urdu',code:'ur'}
];
function App(){
 const [mode,setMode]=useState('translate');
 const [source,setSource]=useState('en'),[target,setTarget]=useState('ur');
 const [input,setInput]=useState(''),[result,setResult]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [history,setHistory]=useState(()=>{try{return JSON.parse(localStorage.getItem('afnan-history')||'[]')}catch{return[]}});
 const [chat,setChat]=useState([]),[chatInput,setChatInput]=useState(''),[chatBusy,setChatBusy]=useState(false);
 const [provider,setProvider]=useState('free');
 const [ollamaUrl,setOllamaUrl]=useState('http://localhost:11434');
 const [model,setModel]=useState('qwen2.5:3b');
 const [showSettings,setShowSettings]=useState(false);
 const labels=Object.fromEntries(LANGS.map(x=>[x.id,x.name]));
 const saveHistory=(item)=>{const next=[item,...history].slice(0,30);setHistory(next);localStorage.setItem('afnan-history',JSON.stringify(next))};
 async function translate(){
  if(!input.trim())return;setBusy(true);setError('');setResult('');
  try{
   let text='';
   if(provider==='ollama'){
    const r=await fetch(ollamaUrl.replace(/\/$/,'')+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,prompt:`Translate the following text from ${labels[source]} to ${labels[target]}. Preserve meaning and tone. If target is Roman Urdu, write Urdu in Latin letters. If target is Urdu, use Urdu script. Return only the translation.\n\n${input}`,stream:false}),signal:AbortSignal.timeout(60000)});
    if(!r.ok)throw new Error('Ollama request failed. Check that Ollama is running and CORS/network access is enabled.');
    text=(await r.json()).response?.trim();
   }else{
    const langMap={en:'en',tr:'tr',ur:'ur',roman:'ur'};
    const url=`https://api.mymemory.translated.net/get?q=${encodeURIComponent(input.slice(0,450))}&langpair=${langMap[source]}|${langMap[target]}`;
    const r=await fetch(url);if(!r.ok)throw new Error('Translation service unavailable. Try again or select Local Ollama in settings.');
    const data=await r.json();text=data.responseData?.translatedText;
    if(!text || data.responseStatus!==200)throw new Error(data.responseDetails||'Could not translate this text.');
    if(target==='roman' && /[\u0600-\u06FF]/.test(text)) text='Roman Urdu conversion is not guaranteed by the free translation service. Select Local Ollama for better script control.';
   }
   setResult(text||'No translation returned.');saveHistory({input,output:text,source,target,date:new Date().toISOString()});
  }catch(e){setError((e.message||'Translation failed')+' For privacy, avoid sending sensitive text to online translation services.');}
  finally{setBusy(false)}
 }
 function detectChatLanguage(q){
  const s=q.toLowerCase();
  if(/[\u0600-\u06FF]/.test(q))return 'ur';
  if(/[çğıöşü]/i.test(q)||/\b(merhaba|nasılsın|nasilsin|teşekkür|tesekkur|lütfen|lutfen|evet|hayır|hayir|neden|nasıl|nasil)\b/.test(s))return 'tr';
  if(/\b(kya|kaise|kaisa|ho|hain|hai|mera|meri|mujhe|ap|aap|tum|tumhara|tumhari|kyun|kahan|kab|acha|achha|shukriya|salam|assalam|walaikum|batao|btao|karna|karo|chahiye|nahi|nahin|haan|han|theek|thik|bhai|yaar|aur|mein|main|kese|kesy|kia|kiya)\b/.test(s))return 'roman';
  return 'en';
 }
 function freeChatReply(q){
  const lang=detectChatLanguage(q),s=q.toLowerCase();
  const greeting=/\b(hi|hello|hey|salam|assalam|salaam|aoa|merhaba|selam)\b/.test(s);
  const how=/\b(how are you|kaise ho|kese ho|kesy ho|kya haal|nasılsın|nasilsin)\b/.test(s);
  const who=/\b(who are you|tum kon|aap kon|ap kon|tum kaun|what are you)\b/.test(s);
  const thanks=/\b(thanks|thank you|shukriya|shukria|teşekkür|tesekkur)\b/.test(s);
  const help=/\b(help|madad|kya kar sakte|what can you do|yardım)\b/.test(s);
  if(lang==='roman'){
   if(greeting)return 'Wa Alaikum Assalam! 😊 Ji, batayein aap ko kis cheez mein madad chahiye? Main Roman Urdu mein jawab dunga.';
   if(how)return 'Alhamdulillah, main theek hoon! 😊 Aap sunayein, aap ko kis cheez mein madad chahiye?';
   if(who)return 'Main Muhammad Afnan AI hoon. Main translation aur language help de sakta hoon. Har topic par detailed AI jawab ke liye Settings mein Local Ollama ka working server aur model connect karein.';
   if(thanks)return 'Khushi hui madad karke! 😊 Aur kuch poochna ho to zaroor batayein.';
   if(help)return 'Main English, Turkish, Urdu aur Roman Urdu mein translation aur language help kar sakta hoon. Detailed AI jawab ke liye Settings mein Local Ollama ka working server URL aur model set karein.';
   return 'Aap ka message mil gaya. Abhi Free mode mein full AI model connected nahi hai, is liye main har sawal ka reliable detailed jawab nahi bana sakta. Settings mein Local Ollama ko working AI server se connect karein, ya Translator tab mein text translate karein.';
  }
  if(lang==='ur'){
   if(greeting)return 'وعلیکم السلام! 😊 جی بتائیے، آپ کو کس چیز میں مدد چاہیے؟';
   if(how)return 'الحمدللہ، میں ٹھیک ہوں! 😊 آپ سنائیں، میں آپ کی کیا مدد کر سکتا ہوں؟';
   if(who)return 'میں محمد افنان AI ہوں۔ میں ترجمے اور زبان سے متعلق مدد کر سکتا ہوں۔ تفصیلی AI جوابات کے لیے Settings میں فعال Ollama سرور اور ماڈل منسلک کریں۔';
   if(thanks)return 'خوشی ہوئی کہ میں مدد کر سکا! 😊 مزید کچھ پوچھنا ہو تو بتائیے۔';
   if(help)return 'میں انگریزی، ترکی، اردو اور رومن اردو کے ترجمے میں مدد کر سکتا ہوں۔ تفصیلی AI جوابات کے لیے Settings میں فعال Ollama سرور اور ماڈل سیٹ کریں۔';
   return 'آپ کا پیغام موصول ہوا۔ ابھی Free mode میں مکمل AI ماڈل منسلک نہیں ہے، اس لیے میں ہر سوال کا قابلِ اعتماد تفصیلی جواب نہیں دے سکتا۔ Settings میں فعال Ollama سرور منسلک کریں، یا Translator ٹیب استعمال کریں۔';
  }
  if(lang==='tr'){
   if(greeting)return 'Merhaba! 😊 Size nasıl yardımcı olabilirim?';
   if(how)return 'İyiyim, teşekkür ederim! 😊 Size nasıl yardımcı olabilirim?';
   if(who)return 'Ben Muhammad Afnan AI. Çeviri ve dil konusunda yardımcı olabilirim. Ayrıntılı yapay zekâ yanıtları için Ayarlar bölümünden çalışan bir Ollama sunucusu ve model bağlayın.';
   if(thanks)return 'Rica ederim! 😊 Başka bir konuda yardımcı olabilir miyim?';
   if(help)return 'İngilizce, Türkçe, Urduca ve Roman Urdu arasında çeviri yapabilirim. Ayrıntılı yapay zekâ yanıtları için Ayarlar bölümünde çalışan bir Ollama sunucusu yapılandırın.';
   return 'Mesajınızı aldım. Ücretsiz modda tam bir yapay zekâ modeli bağlı değil; bu yüzden her soruya güvenilir ve ayrıntılı yanıt veremem. Ayarlar bölümünden çalışan bir Ollama sunucusu bağlayın veya Çeviri sekmesini kullanın.';
  }
  if(greeting)return 'Hello! 😊 How can I help you today?';
  if(how)return 'I’m doing well, thank you! 😊 What can I help you with?';
  if(who)return 'I’m Muhammad Afnan AI. I can help with translation and language questions. For detailed AI answers on any topic, connect a working Ollama server and model in Settings.';
  if(thanks)return 'You’re welcome! 😊 Let me know if you need anything else.';
  if(help)return 'I can help translate between English, Turkish, Urdu and Roman Urdu. For detailed AI answers on general topics, configure a working Ollama server in Settings.';
  return 'I received your message. Full AI chat is not connected in Free mode, so I cannot reliably generate detailed answers to every question yet. Connect a working AI server and model in Settings → Local Ollama, or use the Translator tab.';
 }
 async function sendChat(){
  const q=chatInput.trim();if(!q||chatBusy)return;setChatInput('');
  const next=[...chat,{role:'user',text:q}];setChat(next);setChatBusy(true);
  try{
   const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:next.slice(-12)}),signal:AbortSignal.timeout(50000)});
   const data=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(data.error||'AI service is unavailable. Please try again.');
   if(!data.reply)throw new Error('AI ne jawab nahi bheja. Dobara koshish karein.');
   setChat(c=>[...c,{role:'assistant',text:data.reply}]);
  }catch(e){
   const lang=detectChatLanguage(q);
   let msg=e.message||'Chat request failed. Please try again.';
   if(lang==='roman' && /failed to fetch|networkerror|load failed/i.test(msg))msg='AI backend tak connection nahi ho saka. Website ko Vercel par deploy karein aur GEMINI_API_KEY environment variable set karein.';
   else if(lang==='ur' && /failed to fetch|networkerror|load failed/i.test(msg))msg='AI سرور سے رابطہ نہیں ہو سکا۔ ویب سائٹ کو Vercel پر deploy کریں اور GEMINI_API_KEY سیٹ کریں۔';
   else if(lang==='tr' && /failed to fetch|networkerror|load failed/i.test(msg))msg='AI sunucusuna bağlanılamadı. Siteyi Vercel üzerinde dağıtın ve GEMINI_API_KEY değişkenini ayarlayın.';
   setChat(c=>[...c,{role:'assistant',text:msg}]);
  }finally{setChatBusy(false)}
 }
 async function copy(text){try{await navigator.clipboard.writeText(text)}catch{setError('Clipboard unavailable. Please select and copy the text manually.')}}
 async function share(text){if(navigator.share){try{await navigator.share({title:'Muhammad Afnan AI translation',text})}catch{}}else copy(text)}
 function swap(){setSource(target);setTarget(source);setInput(result);setResult('')}
 return <div className="app">
  <header><div className="brand"><div className="logo"><Languages size={23}/></div><div><h1>Muhammad Afnan AI</h1><p>Translate freely. Connect globally.</p></div></div><button className="iconbtn" onClick={()=>setShowSettings(!showSettings)} title="Settings">⚙</button></header>
  <main>
   <div className="hero"><div className="pill"><Sparkles size={14}/> FOUR LANGUAGES · ONE ASSISTANT</div><h2>Your words,<br/><span>every language.</span></h2><p>Translate between English, Turkish, Urdu and Roman Urdu.</p></div>
   {showSettings&&<section className="panel settings"><h3>AI & privacy settings</h3><label>Translation engine<select value={provider} onChange={e=>setProvider(e.target.value)}><option value="free">Free online translation (internet required)</option><option value="ollama">Local Ollama AI (your own device/server)</option></select></label>{provider==='ollama'&&<><label>Ollama URL<input value={ollamaUrl} onChange={e=>setOllamaUrl(e.target.value)}/></label><label>Model name<input value={model} onChange={e=>setModel(e.target.value)}/></label><p className="hint">For a deployed website, localhost points to each visitor’s device. Use a secured private server URL for remote access. Never expose Ollama directly to the public internet.</p></>}<p className="hint">Free online mode sends text to a third-party translation service. Do not submit passwords, private chats, or sensitive information.</p></section>}
   <nav><button className={mode==='translate'?'active':''} onClick={()=>setMode('translate')}><Languages size={17}/> Translator</button><button className={mode==='chat'?'active':''} onClick={()=>setMode('chat')}><MessageCircle size={17}/> AI Chat</button><button className={mode==='history'?'active':''} onClick={()=>setMode('history')}><History size={17}/> History</button></nav>
   {mode==='translate'&&<section className="panel">
    <div className="language-row"><label><span>FROM</span><select value={source} onChange={e=>setSource(e.target.value)}>{LANGS.map(l=><option key={l.id} value={l.id}>{l.native} · {l.name}</option>)}</select></label><button className="swap" onClick={swap} title="Swap languages"><ArrowLeftRight size={18}/></button><label><span>TO</span><select value={target} onChange={e=>setTarget(e.target.value)}>{LANGS.map(l=><option key={l.id} value={l.id}>{l.native} · {l.name}</option>)}</select></label></div>
    <label className="field"><span>Your text</span><textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Type or paste text here…" rows="5" maxLength="4500"/></label>
    <div className="tools"><span>{input.length}/4500</span><button className="textbtn" onClick={()=>{setInput('');setResult('');setError('')}}><Trash2 size={15}/> Clear</button></div>
    <button className="primary" disabled={!input.trim()||busy} onClick={translate}>{busy?'Translating…':<><Globe size={18}/> Translate now</>}</button>
    {error&&<div className="error">{error}</div>}
    {result&&<div className="result"><div className="result-head"><span>TRANSLATION · {labels[target]}</span><div><button className="iconbtn" onClick={()=>copy(result)} title="Copy"><Copy size={17}/></button><button className="iconbtn" onClick={()=>share(result)} title="Share"><Share2 size={17}/></button></div></div><p dir={target==='ur'?'rtl':'auto'} className={target==='ur'?'urdu':''}>{result}</p></div>}
    <div className="quick"><span>Try an example</span><button onClick={()=>{setSource('en');setTarget('ur');setInput('How are you?');setResult('')}}>How are you?</button><button onClick={()=>{setSource('en');setTarget('tr');setInput('Thank you very much');setResult('')}}>Thank you</button></div>
   </section>}
   {mode==='chat'&&<section className="panel chatpanel"><div className="chatlog">{chat.length===0&&<div className="empty"><div className="logo"><MessageCircle/></div><h3>Chat with Afnan AI</h3><p>Ask for translation help, wording, or language tips.</p></div>}{chat.map((m,i)=><div key={i} className={'bubble '+m.role}>{m.text}</div>)}</div><form onSubmit={e=>{e.preventDefault();sendChat()}} className="chatform"><input value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Ask something…"/><button className="primary send" disabled={!chatInput.trim()||chatBusy}>{chatBusy?'Thinking…':<Send size={18}/>}</button></form><p className="hint">AI chat uses a secure server-side Gemini API. The deployment owner must configure GEMINI_API_KEY; the secret is never placed in browser code.</p></section>}
   {mode==='history'&&<section className="panel"><div className="historyhead"><h3>Recent translations</h3><button className="textbtn" onClick={()=>{setHistory([]);localStorage.removeItem('afnan-history')}}>Clear history</button></div>{history.length===0?<div className="empty"><History size={30}/><p>Your translations will appear here.</p></div>:history.map((h,i)=><article className="historyitem" key={i}><div className="hint">{labels[h.source]} → {labels[h.target]}</div><p>{h.input}</p><p className="muted">{h.output}</p><button className="textbtn" onClick={()=>{setSource(h.source);setTarget(h.target);setInput(h.input);setResult(h.output);setMode('translate')}}>Open translation</button></article>)}</section>}
   <section className="feature-grid"><div><Globe/><b>4 languages</b><span>English · Türkçe · اردو · Roman Urdu</span></div><div><Copy/><b>Copy & share</b><span>Move translations into your apps</span></div><div><Mic/><b>Voice-ready</b><span>Voice input can be added next</span></div></section>
   <footer>Muhammad Afnan AI <span>·</span> Built for clear communication</footer>
  </main>
 </div>
}
createRoot(document.getElementById('root')).render(<App/>);
