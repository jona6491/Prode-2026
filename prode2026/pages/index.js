import { useState, useEffect } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import PronosticosTab from '../components/PronosticosTab'
import RankingTab from '../components/RankingTab'
import ReglasTab from '../components/ReglasTab'
import ResultadosTab from '../components/ResultadosTab'

export default function Home() {
  const [screen, setScreen] = useState('loading')
  const [tab, setTab] = useState('pronosticos')
  const [clave, setClave] = useState('')
  const [nombre, setNombre] = useState('')
  const [equipo, setEquipo] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [player, setPlayer] = useState(null)
  const [keyId, setKeyId] = useState(null)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [transparencyEnabled, setTransparencyEnabled] = useState(false)

  useEffect(() => {
    const savedPlayer = localStorage.getItem('prode_player')
    const savedKeyId = localStorage.getItem('prode_key_id')
    if (savedPlayer && savedKeyId) {
      const p = JSON.parse(savedPlayer)
      supabase.from('players').select('*').eq('id', p.id).single().then(({ data }) => {
        if (data) { setPlayer(data); setKeyId(savedKeyId); setScreen('main') }
        else { localStorage.removeItem('prode_player'); localStorage.removeItem('prode_key_id'); setScreen('login') }
      })
    } else { setScreen('login') }
  }, [])

  async function handleLogin() {
    const key = clave.trim().toUpperCase()
    if (!key) return
    setLoading(true); setLoginErr('')
    const { data: keyData } = await supabase.from('player_keys').select('*').eq('access_key', key).single()
    if (!keyData) { setLoginErr('Clave incorrecta. Pedísela al organizador.'); setLoading(false); return }
    const { data: existingPlayer } = await supabase.from('players').select('*').eq('key_id', keyData.id).single()
    setLoading(false)
    if (existingPlayer) {
      setPlayer(existingPlayer); setKeyId(keyData.id)
      localStorage.setItem('prode_player', JSON.stringify(existingPlayer))
      localStorage.setItem('prode_key_id', keyData.id)
      setScreen('main')
    } else { setKeyId(keyData.id); setScreen('register') }
  }

  async function handleRegister() {
    if (!nombre.trim() || !equipo.trim()) return
    setLoading(true)
    const { data: existing } = await supabase.from('players').select('id').eq('team_name', equipo.trim())
    if (existing && existing.length > 0) { setLoading(false); alert('Ese nombre de equipo ya existe. Elegí otro.'); return }
    const { data, error } = await supabase.from('players')
      .insert({ key_id: keyId, name: nombre.trim(), team_name: equipo.trim(), saved: false })
      .select().single()
    if (error) { alert('Error al crear perfil.'); setLoading(false); return }
    await supabase.from('player_keys').update({ used: true }).eq('id', keyId)
    setLoading(false); setPlayer(data)
    localStorage.setItem('prode_player', JSON.stringify(data))
    localStorage.setItem('prode_key_id', keyId)
    setScreen('main')
  }

  function handleLogout() {
    localStorage.removeItem('prode_player'); localStorage.removeItem('prode_key_id')
    setPlayer(null); setKeyId(null); setClave(''); setNombre(''); setEquipo('')
    setScreen('login'); setTab('pronosticos'); setAdminUnlocked(false); setShowAdminPanel(false)
  }

  async function handleAdminUnlock() {
    const { data } = await supabase.from('admin_config').select('admin_code').eq('id', 1).single()
    if (data && adminCode === data.admin_code) {
      setAdminUnlocked(true); setShowAdminModal(false); setTab('admin')
    } else { alert('Clave admin incorrecta.') }
  }

  if (screen === 'loading') return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#18191f',fontSize:40}}>⚽</div>
  )

  return (
    <>
      <Head>
        <title>Prode Mundial 2026</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#18191f" />
        <link rel="icon" href="/TROFEO.png" />
      </Head>
      <div className="wrap">
        <div className="hdr">
          <img src="/TROFEO.png" style={{width:34,height:34,objectFit:'contain'}} alt="trofeo" />
          <div style={{flex:1}}>
            <div className="hdr-title">Prode Mundial 2026</div>
            <div className="hdr-sub">{player ? player.team_name : 'Ingresá con tu clave para participar'}</div>
          </div>
          {screen === 'main' && (
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <button onClick={() => setShowAdminModal(true)}
                style={{background:'transparent',border:'none',color:'var(--tx3)',cursor:'pointer',fontSize:18,padding:'4px',lineHeight:1}}
                title="Admin">⚙️</button>
              <button className="btn-sm" onClick={handleLogout}>Salir</button>
            </div>
          )}
        </div>

        {/* ADMIN UNLOCK MODAL */}
        {showAdminModal && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
            <div className="card" style={{maxWidth:300,width:'90%'}}>
              <p style={{fontSize:14,fontWeight:700,color:'var(--tx)',marginBottom:4}}>⚙️ Acceso administrador</p>
              <p style={{fontSize:12,color:'var(--tx2)',marginBottom:14}}>Solo para el organizador</p>
              <div className="field">
                <label>Clave admin</label>
                <input type="password" value={adminCode} onChange={e=>setAdminCode(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&handleAdminUnlock()} autoComplete="off" />
              </div>
              <button className="btn" onClick={handleAdminUnlock} style={{marginBottom:8}}>Entrar</button>
              <button onClick={()=>setShowAdminModal(false)}
                style={{width:'100%',padding:'8px',background:'transparent',border:'none',color:'var(--tx3)',fontSize:12,cursor:'pointer'}}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* LOGIN */}
        {screen === 'login' && (
          <div style={{flex:1,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'32px 16px'}}>
            <div className="card" style={{maxWidth:320,width:'100%'}}>
              <div style={{textAlign:'center',marginBottom:22}}>
                <div style={{fontSize:44,marginBottom:8}}>⚽</div>
                <h2 style={{fontSize:20,fontWeight:700,color:'var(--tx)',marginBottom:5}}>ProDe Mundial 2026</h2>
                <p style={{fontSize:12,color:'var(--tx2)'}}>Ingresá la clave que te dio el organizador</p>
              </div>
              <div className="field">
                <label>Tu clave personal</label>
                <input type="password" maxLength={8} value={clave}
                  onChange={e=>setClave(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} autoComplete="off" />
              </div>
              {loginErr && <div className="err">{loginErr}</div>}
              <button className="btn" onClick={handleLogin} disabled={loading}>{loading?'Verificando...':'Entrar'}</button>
            </div>
          </div>
        )}

        {/* REGISTER */}
        {screen === 'register' && (
          <div style={{flex:1,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'32px 16px'}}>
            <div className="card" style={{maxWidth:320,width:'100%'}}>
              <div style={{textAlign:'center',marginBottom:20}}>
                <div style={{fontSize:34,marginBottom:6}}>👤</div>
                <h2 style={{fontSize:16,fontWeight:700,color:'var(--tx)',marginBottom:4}}>Crear tu perfil</h2>
                <p style={{fontSize:12,color:'var(--tx2)'}}>El nombre de equipo aparece en el ranking</p>
              </div>
              <div className="field">
                <label>Tu nombre</label>
                <input type="text" value={nombre} onChange={e=>setNombre(e.target.value)} autoComplete="off" />
              </div>
              <div className="field">
                <label>Nombre de tu equipo</label>
                <input type="text" value={equipo} onChange={e=>setEquipo(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&handleRegister()} autoComplete="off" />
              </div>
              <button className="btn" onClick={handleRegister} disabled={loading}>{loading?'Creando...':'Crear perfil y entrar'}</button>
              <button onClick={()=>{setScreen('login');setKeyId(null)}}
                style={{width:'100%',marginTop:10,padding:'8px',background:'transparent',border:'none',color:'var(--tx3)',fontSize:12,cursor:'pointer'}}>
                ← Volver
              </button>
            </div>
          </div>
        )}

        {/* MAIN */}
        {screen === 'main' && (
          <>
            <div className="nav" style={{overflowX:'auto'}}>
              <button className={`ntab ${tab==='pronosticos'?'active':''}`} onClick={()=>setTab('pronosticos')}>✏️ Pronósticos</button>
              <button className={`ntab ${tab==='resultados'?'active':''}`} onClick={()=>setTab('resultados')}>⚽ Resultados</button>
              <button className={`ntab ${tab==='ranking'?'active':''}`} onClick={()=>setTab('ranking')}>📊 Ranking</button>
              <button className={`ntab ${tab==='reglas'?'active':''}`} onClick={()=>setTab('reglas')}>📋 Reglas</button>
              {adminUnlocked && <button className={`ntab ${tab==='admin'?'active':''}`} onClick={()=>setTab('admin')}>⚙️ Admin</button>}
            </div>
            {tab==='pronosticos' && <PronosticosTab player={player} onSaved={p=>{setPlayer(p);localStorage.setItem('prode_player',JSON.stringify(p))}} />}
            {tab==='resultados' && <ResultadosTab adminUnlocked={adminUnlocked} />}
            {tab==='ranking' && <RankingTab player={player} transparencyEnabled={transparencyEnabled} />}
            {tab==='reglas' && <ReglasTab />}
             <div style={{padding:'10px 14px',textAlign:'center',fontSize:11,color:'var(--tx3)',borderTop:'1px solid var(--bd)',flexShrink:0}}>
  ⚽ Mundial 2026 · RECONTRAOFICIAL FIFA · 11 Jun — 27 Jun 2026
</div>
             <div style={{padding:'10px 14px',textAlign:'center',fontSize:11,color:'var(--tx3)',borderTop:'1px solid var(--bd)',flexShrink:0}}>
  ⚽ Mundial 2026 · RECONTRAOFICIAL FIFA · 11 Jun — 27 Jun 2026
</div>
            {tab==='admin' && adminUnlocked && <AdminPanel onClose={()=>{setAdminUnlocked(false);setTab('pronosticos')}} currentPlayer={player} transparencyEnabled={transparencyEnabled} setTransparencyEnabled={setTransparencyEnabled} />}
          </>
        )}
      </div>
    </>
  )
}

function AdminPanel({ onClose, currentPlayer, transparencyEnabled, setTransparencyEnabled }) {
  const [players, setPlayers] = useState([])
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [section, setSection] = useState('jugadores')
  const [togglingTransparency, setTogglingTransparency] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: pData }, { data: kData }, { data: cfgData }] = await Promise.all([
      supabase.from('players').select('*, predictions(count), player_keys(access_key)').order('created_at'),
      supabase.from('player_keys').select('*').order('access_key'),
      supabase.from('admin_config').select('transparency_enabled').eq('id',1).single()
    ])
    setPlayers(pData || []); setKeys(kData || [])
    if (cfgData) setTransparencyEnabled(cfgData.transparency_enabled)
    setLoading(false)
  }

  async function toggleTransparency() {
    setTogglingTransparency(true)
    const newVal = !transparencyEnabled
    await supabase.from('admin_config').update({ transparency_enabled: newVal }).eq('id', 1)
    setTransparencyEnabled(newVal)
    setTogglingTransparency(false)
  }

  async function deletePlayer(p) {
    if (!confirm(`¿Borrar "${p.team_name}" (${p.name})?\nSu clave quedará libre nuevamente.`)) return
    setDeleting(p.id)
    await supabase.from('predictions').delete().eq('player_id', p.id)
    await supabase.from('players').delete().eq('id', p.id)
    await supabase.from('player_keys').update({ used: false }).eq('id', p.key_id)
    setDeleting(null); loadData()
  }

  function exportCSV() {
    const rows = [['Clave','Jugador','Equipo','Guardó','Pronósticos']]
    keys.forEach(k => {
      const p = players.find(pl => pl.key_id === k.id)
      rows.push([k.access_key, p?p.name:'(libre)', p?p.team_name:'', p?(p.saved?'Sí':'No'):'', p?(p.predictions?.[0]?.count||0):''])
    })
    const blob = new Blob(['\uFEFF'+rows.map(r=>r.join(',')).join('\n')],{type:'text/csv;charset=utf-8'})
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `prode_admin_${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflowY:'hidden'}}>
      <div style={{background:'var(--bg2)',borderBottom:'1px solid var(--bd)',padding:'12px 16px',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
        <span style={{fontSize:16,fontWeight:700,color:'var(--tx)',flex:1}}>⚙️ Panel Admin</span>
        <button className="btn-sm" onClick={exportCSV}>⬇️ CSV</button>
        <button onClick={onClose} style={{background:'transparent',border:'none',color:'var(--tx2)',cursor:'pointer',fontSize:20,padding:'0 4px'}}>✕</button>
      </div>
      {/* TRANSPARENCY TOGGLE */}
      <div style={{padding:'12px 16px',background:transparencyEnabled?'rgba(34,201,138,0.08)':'var(--bg3)',borderBottom:'1px solid var(--bd)',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:600,color:transparencyEnabled?'var(--em)':'var(--tx)'}}>
            👁️ Modo transparencia
          </div>
          <div style={{fontSize:11,color:'var(--tx3)',marginTop:2}}>
            {transparencyEnabled ? 'Activo — todos pueden ver los pronósticos de los demás' : 'Inactivo — los pronósticos son privados'}
          </div>
        </div>
        <button onClick={toggleTransparency} disabled={togglingTransparency}
          style={{padding:'7px 18px',borderRadius:20,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',border:'none',
            background:transparencyEnabled?'var(--em)':'var(--bg4)',color:transparencyEnabled?'#fff':'var(--tx2)',
            transition:'all .2s',flexShrink:0}}>
          {togglingTransparency?'...': transparencyEnabled?'🟢 Apagar':'⚫ Activar'}
        </button>
      </div>
      <div style={{display:'flex',gap:1,background:'var(--bd)',flexShrink:0}}>
        {[['Claves usadas',`${keys.filter(k=>k.used).length}/60`,'var(--em)'],
          ['Guardaron',`${players.filter(p=>p.saved).length}/${players.length}`,'var(--gold)'],
          ['Pendientes',players.filter(p=>!p.saved).length,'var(--tx2)']
        ].map(([l,v,c])=>(
          <div key={l} style={{flex:1,background:'var(--bg2)',padding:'10px 6px',textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--tx3)',marginBottom:2,textTransform:'uppercase',letterSpacing:'.04em'}}>{l}</div>
            <div style={{fontSize:18,fontWeight:700,color:c}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',background:'var(--bg2)',borderBottom:'1px solid var(--bd)',flexShrink:0}}>
        {[['jugadores','👥 Jugadores'],['claves','🔑 Claves']].map(([id,label])=>(
          <button key={id} onClick={()=>setSection(id)}
            style={{flex:1,padding:'10px',fontSize:12,fontWeight:600,background:'none',border:'none',
              borderBottom:section===id?'2px solid var(--em)':'2px solid transparent',
              color:section===id?'var(--em)':'var(--tx2)',cursor:'pointer',fontFamily:'inherit'}}>{label}</button>
        ))}
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'12px 14px'}}>
        {loading && <div className="loading">Cargando...</div>}
        {!loading && section==='jugadores' && (
          <div className="rk-tbl">
            <div className="rk-head">Jugadores registrados — {players.length}</div>
            {players.length===0 && <div className="empty">Nadie se registró aún.</div>}
            {players.map(p=>(
              <div key={p.id} style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderBottom:'1px solid var(--bd)'}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--tx)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.team_name}</div>
                  <div style={{fontSize:11,color:'var(--tx3)'}}>{p.name} · <span style={{color:'var(--em)',fontWeight:600,fontFamily:'monospace'}}>{p.player_keys?.access_key}</span></div>
                </div>
                <div style={{textAlign:'right',marginRight:6,flexShrink:0}}>
                  <div style={{fontSize:11,color:p.saved?'var(--em)':'var(--tx3)'}}>{p.saved?'✅ Guardó':'⏳ Pendiente'}</div>
                  <div style={{fontSize:10,color:'var(--tx3)'}}>{p.predictions?.[0]?.count||0}/72</div>
                </div>
                <button className="btn-danger" onClick={()=>deletePlayer(p)} disabled={deleting===p.id}
                  style={{fontSize:11,padding:'4px 9px',flexShrink:0}}>{deleting===p.id?'...':'🗑'}</button>
              </div>
            ))}
          </div>
        )}
        {!loading && section==='claves' && (
          <div className="rk-tbl">
            <div className="rk-head">Todas las claves — {keys.length}</div>
            {keys.map(k=>{
              const p=players.find(pl=>pl.key_id===k.id)
              return (
                <div key={k.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderBottom:'1px solid var(--bd)'}}>
                  <span style={{fontSize:13,fontWeight:700,color:k.used?'var(--tx2)':'var(--em)',fontFamily:'monospace',minWidth:65}}>{k.access_key}</span>
                  <div style={{flex:1,fontSize:12,color:'var(--tx2)'}}>
                    {p?<><span style={{color:'var(--tx)',fontWeight:600}}>{p.team_name}</span> · {p.name}</>:<span style={{color:'var(--tx3)'}}>Sin asignar</span>}
                  </div>
                  <span style={{fontSize:10,color:k.used?'var(--tx3)':'var(--em)'}}>{k.used?'● Usada':'○ Libre'}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
