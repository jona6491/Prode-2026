import { useState, useEffect } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import PronosticosTab from '../components/PronosticosTab'
import RankingTab from '../components/RankingTab'
import ReglasTab from '../components/ReglasTab'

export default function Home() {
  const [screen, setScreen] = useState('login') // login | register | main
  const [tab, setTab] = useState('pronosticos')
  const [clave, setClave] = useState('')
  const [nombre, setNombre] = useState('')
  const [equipo, setEquipo] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [groupData, setGroupData] = useState(null) // { id, name, prode_group_name }
  const [player, setPlayer] = useState(null) // { id, name, team_name, saved }

  // Check session on load
  useEffect(() => {
    const saved = localStorage.getItem('prode_player')
    const savedGroup = localStorage.getItem('prode_group')
    if (saved && savedGroup) {
      setPlayer(JSON.parse(saved))
      setGroupData(JSON.parse(savedGroup))
      setScreen('main')
    }
  }, [])

  async function handleLogin() {
    if (!clave.trim()) return
    setLoading(true)
    setLoginErr('')
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('access_code', clave.trim().toUpperCase())
      .single()
    setLoading(false)
    if (error || !data) {
      setLoginErr('Clave incorrecta. Verificá con tu organizador.')
      return
    }
    setGroupData(data)
    localStorage.setItem('prode_group', JSON.stringify(data))
    setScreen('register')
  }

  async function handleRegister() {
    if (!nombre.trim() || !equipo.trim()) return
    setLoading(true)
    // Check if team name already exists in this group
    const { data: existing } = await supabase
      .from('players')
      .select('id')
      .eq('group_id', groupData.id)
      .eq('team_name', equipo.trim())
    if (existing && existing.length > 0) {
      setLoading(false)
      alert('Ya existe un equipo con ese nombre en tu grupo. Elegí otro.')
      return
    }
    const { data, error } = await supabase
      .from('players')
      .insert({ group_id: groupData.id, name: nombre.trim(), team_name: equipo.trim(), saved: false })
      .select()
      .single()
    setLoading(false)
    if (error) { alert('Error al crear perfil. Intentá de nuevo.'); return }
    setPlayer(data)
    localStorage.setItem('prode_player', JSON.stringify(data))
    setScreen('main')
  }

  function handleLogout() {
    localStorage.removeItem('prode_player')
    localStorage.removeItem('prode_group')
    setPlayer(null); setGroupData(null)
    setClave(''); setNombre(''); setEquipo('')
    setScreen('login'); setTab('pronosticos')
  }

  return (
    <>
      <Head>
        <title>Prode Mundial 2026</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#18191f" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚽</text></svg>" />
      </Head>
      <div className="wrap">
        {/* HEADER */}
        <div className="hdr">
          <span className="hdr-ico">⚽</span>
          <div style={{flex:1}}>
            <div className="hdr-title">Prode Mundial 2026</div>
            <div className="hdr-sub">
              {player ? `${player.team_name} · ${groupData?.name}` : 'Ingresá con tu clave para participar'}
            </div>
          </div>
          {screen === 'main' && (
            <button className="btn-sm" onClick={handleLogout}>Salir</button>
          )}
        </div>

        {/* LOGIN */}
        {screen === 'login' && (
          <div style={{flex:1, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'32px 16px'}}>
            <div className="card" style={{maxWidth:320, width:'100%'}}>
              <h2 style={{fontSize:15, fontWeight:700, color:'var(--tx)', marginBottom:4}}>🔐 Ingresar al prode</h2>
              <p style={{fontSize:12, color:'var(--tx2)', marginBottom:18}}>Pedile la clave a tu organizador</p>
              <div className="field">
                <label>Clave del grupo</label>
                <input
                  type="password" placeholder="Ej: MON001" maxLength={8}
                  value={clave} onChange={e => setClave(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
              </div>
              {loginErr && <div className="err">{loginErr}</div>}
              <button className="btn" onClick={handleLogin} disabled={loading}>
                {loading ? 'Verificando...' : 'Entrar'}
              </button>
            </div>
          </div>
        )}

        {/* REGISTER */}
        {screen === 'register' && (
          <div style={{flex:1, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'32px 16px'}}>
            <div className="card" style={{maxWidth:320, width:'100%'}}>
              <h2 style={{fontSize:15, fontWeight:700, color:'var(--tx)', marginBottom:4}}>👤 Crear tu perfil</h2>
              <p style={{fontSize:12, color:'var(--tx2)', marginBottom:18}}>El nombre de equipo aparece en el ranking</p>
              <div className="field">
                <label>Tu nombre</label>
                <input type="text" placeholder="Ej: Rodrigo" value={nombre} onChange={e => setNombre(e.target.value)} />
              </div>
              <div className="field">
                <label>Nombre de tu equipo</label>
                <input type="text" placeholder="Ej: Los Invictos" value={equipo} onChange={e => setEquipo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()} />
              </div>
              <button className="btn" onClick={handleRegister} disabled={loading}>
                {loading ? 'Creando...' : 'Crear perfil y entrar'}
              </button>
            </div>
          </div>
        )}

        {/* MAIN APP */}
        {screen === 'main' && (
          <>
            <div className="nav">
              <button className={`ntab ${tab==='pronosticos'?'active':''}`} onClick={() => setTab('pronosticos')}>✏️ Pronósticos</button>
              <button className={`ntab ${tab==='ranking'?'active':''}`} onClick={() => setTab('ranking')}>📊 Ranking</button>
              {groupData?.admin_code && <button className={`ntab ${tab==='admin'?'active':''}`} onClick={() => setTab('admin')}>🔧 Admin</button>}
              <button className={`ntab ${tab==='reglas'?'active':''}`} onClick={() => setTab('reglas')}>📋 Reglas</button>
            </div>

            {tab === 'pronosticos' && (
              <PronosticosTab player={player} groupData={groupData} onSaved={updatedPlayer => {
                setPlayer(updatedPlayer)
                localStorage.setItem('prode_player', JSON.stringify(updatedPlayer))
              }} />
            )}
            {tab === 'ranking' && <RankingTab player={player} groupData={groupData} />}
            {tab === 'reglas' && <ReglasTab />}
            {tab === 'admin' && <AdminTab groupData={groupData} />}
          </>
        )}
      </div>
    </>
  )
}

// Inline admin tab
function AdminTab({ groupData }) {
  const [adminCode, setAdminCode] = useState('')
  const [authed, setAuthed] = useState(false)
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(false)

  async function checkAdmin() {
    if (adminCode === groupData.admin_code) {
      setAuthed(true)
      loadPlayers()
    } else {
      alert('Clave admin incorrecta.')
    }
  }

  async function loadPlayers() {
    setLoading(true)
    const { data } = await supabase
      .from('players')
      .select('*, predictions(*)')
      .eq('group_id', groupData.id)
      .order('created_at')
    setLoading(false)
    setPlayers(data || [])
  }

  function exportCSV() {
    if (!players.length) return
    const rows = [['Equipo','Jugador','Guardó','Total pronósticos']]
    players.forEach(p => {
      rows.push([p.team_name, p.name, p.saved ? 'Sí' : 'No', p.predictions?.length || 0])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `prode_${groupData.name}_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  if (!authed) return (
    <div style={{padding:'20px 14px'}}>
      <div className="card" style={{maxWidth:300}}>
        <p style={{fontSize:13, color:'var(--tx2)', marginBottom:12}}>🔧 Acceso administrador</p>
        <div className="field">
          <label>Clave admin</label>
          <input type="password" value={adminCode} onChange={e => setAdminCode(e.target.value)}
            onKeyDown={e => e.key==='Enter' && checkAdmin()} placeholder="Clave secreta" />
        </div>
        <button className="btn" onClick={checkAdmin}>Entrar como admin</button>
      </div>
    </div>
  )

  return (
    <div style={{padding:'14px', overflowY:'auto', flex:1}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
        <span style={{fontSize:13, fontWeight:700, color:'var(--tx)'}}>
          {groupData.name} — {players.length} jugadores
        </span>
        <button className="btn-sm" onClick={exportCSV}>⬇️ Exportar CSV</button>
      </div>
      <div className="rk-tbl">
        <div className="rk-head">Jugadores registrados</div>
        {loading && <div className="loading">Cargando...</div>}
        {players.map(p => (
          <div key={p.id} className="admin-row" style={{padding:'10px 15px'}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13, fontWeight:600, color:'var(--tx)'}}>{p.team_name}</div>
              <div style={{fontSize:11, color:'var(--tx3)'}}>{p.name}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:11, color: p.saved ? 'var(--em)' : 'var(--tx3)'}}>
                {p.saved ? '✅ Guardó' : '⏳ Pendiente'}
              </div>
              <div style={{fontSize:10, color:'var(--tx3)'}}>{p.predictions?.length || 0}/72 partidos</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{marginTop:16, padding:'12px 14px', background:'var(--bg2)', borderRadius:10, border:'1px solid var(--bd)', fontSize:12, color:'var(--tx2)'}}>
        <p style={{fontWeight:600, marginBottom:6, color:'var(--tx)'}}>📋 Cargar resultados reales</p>
        <p>Para ingresar los resultados de los partidos y que el sistema calcule los puntos automáticamente, usá el panel de Supabase directamente en la tabla <code style={{background:'var(--bg4)', padding:'1px 5px', borderRadius:3}}>match_results</code>.</p>
      </div>
    </div>
  )
}
