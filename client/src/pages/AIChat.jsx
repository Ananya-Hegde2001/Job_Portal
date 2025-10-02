import React, { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../util/api.js';
import { useAuth } from '../state/AuthContext.jsx';

/*
  Enhanced AI Chat Experience
  Features:
  - Split layout (messages + contextual quick prompts panel on wide screens)
  - Animated, elevated message bubbles with avatars & copy button
  - Quick prompt categories & smart insertion
  - Keyboard shortcuts: Enter = send, Shift+Enter = new line, Esc = blur
  - Reset session button & clear confirmation
  - Subtle loader shimmer + scroll anchor auto-follow
  - Accessible (aria-live for assistant replies)
*/

export default function AIChat(){
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'there';
  const welcome = `Hi ${firstName}! I'm your academic hiring & career assistant. Ask me about:\n\n• Subject-specific interview prep\n• Strong, quantified resume bullets\n• Crafting / refining job descriptions\n• Evaluating candidates & hiring strategy\n• Career growth & salary positioning\n\nWhat would you like to explore first?`;

  const [messages, setMessages] = useState(()=>[
    { id:'welcome', role:'assistant', content: welcome }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastMeta, setLastMeta] = useState(null);
  const [showPrompts, setShowPrompts] = useState(true);
  const streamRef = useRef(null); // streaming controller (no UI toggle, always fast streaming)
  const viewRef = useRef(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(()=>{
    if (endRef.current) endRef.current.scrollIntoView({ behavior:'smooth', block:'end' });
  }, [messages, loading]);

  const pushMessage = useCallback((role, content) => {
    setMessages(ms => [...ms, { id: role + '-' + Date.now() + Math.random().toString(36).slice(2), role, content }]);
  }, []);

  async function send(reset=false){
    if (!reset && !input.trim()) return;
    const userContent = reset ? '' : input.trim();
    if (!reset) {
      pushMessage('user', userContent);
      setInput('');
    }
    setLoading(true); setError(null);
    try {
      if (!reset) {
        // Always use streaming fast mode for normal prompts
        const id = 'assistant-' + Date.now();
        setMessages(ms => [...ms, { id, role:'assistant', content:'' }]);
        let accumulated = '';
        streamRef.current = api.aiChatStream(userContent, {
          reset: false,
          fast: true,
          onDelta: (chunk) => {
            accumulated += chunk;
            setMessages(ms => ms.map(m => m.id === id ? { ...m, content: accumulated } : m));
          },
          onDone: (finalMeta) => {
            setLoading(false);
            setLastMeta({ chosenModel: finalMeta.model, latency: finalMeta.latency, sdkUsed: finalMeta.sdk });
          },
          onError: (err) => {
            // Fallback to non-stream single request if stream failed early
            if (accumulated.length === 0) {
              api.aiChat(userContent, false).then(r=>{
                setLastMeta(r.meta || null);
                setMessages(ms => ms.map(m => m.id === id ? { ...m, content: r.reply || 'No response' } : m));
              }).catch(e2=>{
                setError(e2.message || err.message);
              }).finally(()=> setLoading(false));
            } else {
              setLoading(false);
              setError(err.message);
            }
          }
        });
        return;
      } else {
        // Reset path: use non-stream simple call
        const res = await api.aiChat("Let's start fresh.", true);
        setLastMeta(res.meta || null);
        pushMessage('assistant', res.reply || 'No response');
      }
    } catch (e) {
      if (e.response && e.response.meta) setLastMeta(e.response.meta);
      setError(e.message || 'Failed to reach AI');
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e){
    if (e.key === 'Enter' && !e.shiftKey){
      e.preventDefault();
      if (!loading) send();
    } else if (e.key === 'Escape') {
      e.currentTarget.blur();
    }
  }

  function usePrompt(prompt){
    // Insert prompt and send instantly if empty, else append
    if (!input.trim()) {
      setInput(prompt);
      setTimeout(()=>{ send(); }, 0);
    } else {
      setInput(inp => (inp.endsWith('\n') ? inp + prompt : inp + '\n' + prompt));
      inputRef.current?.focus();
    }
  }

  function resetSession(){
    if (loading) return;
    setMessages([]);
    send(true);
  }

  const promptGroups = [
    {
      title: 'Interview Prep',
      items: [
        'Generate 6 challenging Math teacher interview questions with ideal answer guidance.',
        'Mock interview: Ask me one Computer Science lecturer question at a time and evaluate my answers.'
      ]
    },
    {
      title: 'Resume Upgrade',
      items: [
        "Rewrite this bullet using metrics: 'Led science club activities for students.'",
        'Turn this experience into 3 quantified resume bullets: Taught 5 classes of 40 students with diverse learning levels.'
      ]
    },
    {
      title: 'Employer / JD',
      items: [
        'Draft a concise Physics Lecturer job description with responsibilities + measurable outcomes.',
        'Provide screening criteria for shortlisting English Literature faculty candidates.'
      ]
    },
    {
      title: 'Hiring Strategy',
      items: [
        'Suggest a structured rubric to evaluate teaching demonstration sessions.',
        'List red + green flags in early-stage educator interviews.'
      ]
    },
    {
      title: 'Career Growth',
      items: [
        'Outline a 12‑month growth plan to transition from Assistant Professor to Associate Professor.',
        'How to frame salary negotiation for a senior teaching position with 8 years experience.'
      ]
    }
  ];

  // Fix side panel position (no scroll) on wide screens
  const sideRef = useRef(null);
  useEffect(()=>{
    function applyFixed(){
      const el = sideRef.current; if(!el) return;
      const width = window.innerWidth;
      if(width < 1180){
        el.style.position='';
        el.style.top='';
        el.style.left='';
        el.style.width='';
        el.style.maxHeight='';
        return;
      }
      const nav = document.querySelector('.navbar');
      const navBottom = nav ? (nav.getBoundingClientRect().bottom + (window.scrollY||document.documentElement.scrollTop)) : ((window.scrollY||0) + 70);
      const desiredTop = navBottom + 12; // small gap below navbar
      const rect = el.getBoundingClientRect();
      // lock width & left only once (store on dataset)
      if(!el.dataset.locked){
        el.dataset.locked='1';
        el.style.left = rect.left + 'px';
        el.style.width = rect.width + 'px';
      }
      el.style.position='fixed';
      el.style.top = desiredTop + 'px';
      el.style.maxHeight = 'calc(100vh - ' + (desiredTop + 30) + 'px)';
      el.style.overflow='auto';
    }
    setTimeout(applyFixed,0);
    window.addEventListener('resize', applyFixed);
    return ()=> window.removeEventListener('resize', applyFixed);
  }, []);

  return (
    <div className="ai-chat-root">
      <div className="ai-chat-grid">
        <div className="ai-chat-main">
          <header className="ai-chat-header">
            <div className="ai-chat-head-text">
              <h1 className="ai-chat-title">AI Chat Assistant</h1>
              <p className="ai-chat-sub">Tailored academic career & hiring guidance. This session is temporary and not stored.</p>
            </div>
          </header>
          <div className="ai-chat-messages" ref={viewRef} aria-live="polite">
            {messages.map(m => (
              <ChatMessage key={m.id} role={m.role} content={m.content} />
            ))}
            {loading && <LoadingBubble />}
            {error && (
              <div className="ai-error-row">
                <span>{error}{lastMeta?.error ? `: ${lastMeta.error}` : ''}</span>
                <button className="btn-xs pill-btn-outline" onClick={()=>send()}>Retry</button>
              </div>
            )}
            {lastMeta && !error && (
              <div className="ai-meta-row">
                <small>
                  Model: {lastMeta.chosenModel || '—'} | SDK: {lastMeta.sdkUsed || '—'} {lastMeta.latency ? `| ${lastMeta.latency}ms` : ''}
                </small>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="ai-input-wrap">
            <div className="ai-input-bar">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about interviews, resume, hiring strategy, growth…"
                rows={1}
              />
              <div className="ai-bar-actions">
                <button
                  className="icon-btn ai-copy-btn"
                  title="Copy last AI reply"
                  disabled={!messages.some(m=>m.role==='assistant')}
                  onClick={()=>copyLast(messages)}
                >
                  <SvgCopy />
                </button>
                <button
                  className="icon-btn"
                  title="Reset conversation"
                  disabled={loading}
                  onClick={()=>resetSession()}
                >
                  <SvgReset />
                </button>
                <button
                  className="btn btn-sm ai-send-btn"
                  disabled={loading || !input.trim()}
                  onClick={()=>send()}
                >Send</button>
              </div>
            </div>
            <div className="ai-foot-note">AI may generate inaccuracies. Verify important information. Powered by Gemini.</div>
          </div>
        </div>
        <aside ref={sideRef} className={"ai-chat-side" + (showPrompts?'' : ' collapsed')}>
          <div className="ai-side-head">
            <h3>Quick Prompts</h3>
            <button className="icon-btn" title={showPrompts?'Collapse':'Expand'} onClick={()=>setShowPrompts(v=>!v)}>
              {showPrompts ? <SvgCollapse /> : <SvgExpand />}
            </button>
          </div>
          {showPrompts && (
            <div className="ai-prompts-groups">
              {promptGroups.map((g,i)=>(
                <div key={i} className="ai-prompt-group">
                  <div className="pg-head">{g.title}</div>
                  <div className="pg-items">
                    {g.items.map((p,j)=>(
                      <button
                        key={j}
                        type="button"
                        className="pg-chip"
                        onClick={()=>usePrompt(p)}
                        disabled={loading}
                      >{p.slice(0,64)}{p.length>64?'…':''}</button>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{height:'24px'}} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function copyLast(messages){
  const last = [...messages].reverse().find(m=>m.role==='assistant');
  if (!last) return;
  navigator.clipboard?.writeText(last.content).catch(()=>{});
}

function ChatMessage({ role, content }){
  const isUser = role === 'user';
  return (
    <div className={"ai-msg-row" + (isUser?' user':'')}>      
      {!isUser && <div className="ai-avatar ai-bot" title="Assistant"><BotIcon /></div>}
      {isUser && <div className="ai-avatar ai-user" title="You">{/* initial */}{'You'.slice(0,1)}</div>}
      <div className={"ai-bubble" + (isUser?' you':'')}>
        <RichText content={content} />
      </div>
    </div>
  );
}

function RichText({ content }){
  if (!content) return null;
  const blocks = content.trim().split(/\n{2,}/);
  return <div className="ai-rich">{blocks.map((block, i) => <Block key={i} text={block} />)}</div>;
}

function Block({ text }){
  const lines = text.split(/\n/).filter(l=>l.trim().length>0);
  // Group consecutive bullet lines into a list
  const groups = [];
  let current = null;
  const bulletRe = /^\s*(?:[-*•]|\d+[.)])\s+/;
  for (const ln of lines){
    if (bulletRe.test(ln)) {
      if (!current || current.type !== 'list') {
        current = { type:'list', items:[] };
        groups.push(current);
      }
      current.items.push(ln.replace(bulletRe, '').trim());
    } else {
      current = null;
      groups.push({ type:'line', text: ln });
    }
  }
  return (
    <div className="ai-p-block">
      {groups.map((g,idx)=>{
        if (g.type === 'list') {
          return <ul key={idx} className="ai-list">{g.items.map((it,i2)=><li key={i2}>{renderInline(it)}</li>)}</ul>;
        }
        return <div key={idx} className="ai-line">{renderInline(g.text)}</div>;
      })}
    </div>
  );
}

function renderInline(text){
  // Escape angle brackets to avoid accidental HTML injection
  const safe = text.replace(/</g,'&lt;').replace(/>/g,'&gt;');
  // Tokenize **bold**, *italic*, `code`
  const tokens = [];
  let remaining = safe;
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/;
  let idx = 0;
  while (remaining.length){
    const m = remaining.match(regex);
    if (!m){ tokens.push({t:'text', v:remaining}); break; }
    if (m.index > 0) tokens.push({t:'text', v:remaining.slice(0,m.index)});
    const frag = m[0];
    if (frag.startsWith('**')) tokens.push({t:'bold', v:frag.slice(2,-2)});
    else if (frag.startsWith('`')) tokens.push({t:'code', v:frag.slice(1,-1)});
    else if (frag.startsWith('*')) tokens.push({t:'italic', v:frag.slice(1,-1)});
    remaining = remaining.slice(m.index + frag.length);
    idx++;
  }
  return tokens.map((tok,i)=>{
    switch(tok.t){
      case 'bold': return <strong key={i}>{tok.v}</strong>;
      case 'italic': return <em key={i}>{tok.v}</em>;
      case 'code': return <code key={i}>{tok.v}</code>;
      default: return <span key={i}>{tok.v}</span>;
    }
  });
}

function LoadingBubble(){
  return (
    <div className="ai-msg-row">
      <div className="ai-avatar ai-bot"><BotIcon /></div>
      <div className="ai-bubble loading"><span className="loader-dots"><span /><span /><span /></span></div>
    </div>
  );
}

/* SVG Icons */
function BotIcon(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="9" cy="16" r="1" />
      <circle cx="15" cy="16" r="1" />
    </svg>
  );
}
function SvgCopy(){
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4c0-1.1.9-2 2-2h9a2 2 0 0 1 2 2v1" /></svg>);
}
function SvgReset(){
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12a10 10 0 1 0 4-8" /><path d="M2 4v8h8" /></svg>);
}
function SvgCollapse(){
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5-5 5 5" /></svg>);
}
function SvgExpand(){
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m7 9 5 5 5-5" /></svg>);
}
