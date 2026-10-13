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
 const [chat,setChat]=useState([]),[chatInput,setChatInput]=useState('');
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
 async function sendChat(){
  const q=chatInput.trim();if(!q)return;setChatInput('');setChat(c=>[...c,{role:'user',text:q}]);
  if(provider==='ollama'){
   try{const r=await fetch(ollamaUrl.replace(/\/$/,'')+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,messages:[...chat,{role:'user',content:q}].map(m=>({role:m.role==='assistant'?'assistant':'user',content:m.text})),stream:false}),signal:AbortSignal.timeout(60000)});if(!r.ok)throw new Error('Ollama connection failed');const d=await r.json();setChat(c=>[...c,{role:'assistant',text:d.message?.content||'No response'}]);}
   catch(e){setChat(c=>[...c,{role:'assistant',text:'Could not reach local Ollama. Open Settings and check the URL, model, and CORS configuration.'}]);}
  }else{
   setChat(c=>[...c,{role:'assistant',text:`Hi! I’m Muhammad Afnan AI. I can help with English, Turkish, Urdu and Roman Urdu translation. For an actual AI conversation, choose Local Ollama in Settings and run a model. You can translate text in the Translate tab.`}]);
  }
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
   {mode==='chat'&&<section className="panel chatpanel"><div className="chatlog">{chat.length===0&&<div className="empty"><div className="logo"><MessageCircle/></div><h3>Chat with Afnan AI</h3><p>Ask for translation help, wording, or language tips.</p></div>}{chat.map((m,i)=><div key={i} className={'bubble '+m.role}>{m.text}</div>)}</div><form onSubmit={e=>{e.preventDefault();sendChat()}} className="chatform"><input value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Ask something…"/><button className="primary send" disabled={!chatInput.trim()}><Send size={18}/></button></form><p className="hint">A real AI chat requires Local Ollama to be configured. Free mode provides translation-service guidance only.</p></section>}
   {mode==='history'&&<section className="panel"><div className="historyhead"><h3>Recent translations</h3><button className="textbtn" onClick={()=>{setHistory([]);localStorage.removeItem('afnan-history')}}>Clear history</button></div>{history.length===0?<div className="empty"><History size={30}/><p>Your translations will appear here.</p></div>:history.map((h,i)=><article className="historyitem" key={i}><div className="hint">{labels[h.source]} → {labels[h.target]}</div><p>{h.input}</p><p className="muted">{h.output}</p><button className="textbtn" onClick={()=>{setSource(h.source);setTarget(h.target);setInput(h.input);setResult(h.output);setMode('translate')}}>Open translation</button></article>)}</section>}
   <section className="feature-grid"><div><Globe/><b>4 languages</b><span>English · Türkçe · اردو · Roman Urdu</span></div><div><Copy/><b>Copy & share</b><span>Move translations into your apps</span></div><div><Mic/><b>Voice-ready</b><span>Voice input can be added next</span></div></section>
   <footer>Muhammad Afnan AI <span>·</span> Built for clear communication</footer>
  </main>
 </div>
}
createRoot(document.getElementById('root')).render(<App/>);
