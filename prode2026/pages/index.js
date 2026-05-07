import { useState, useEffect } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import PronosticosTab from '../components/PronosticosTab'
import RankingTab from '../components/RankingTab'
import ReglasTab from '../components/ReglasTab'

export default function Home() {
  const [screen, setScreen] = useState('login')
  const [tab, setTab] = useState('pronosticos')
  const [clave, setClave] = useState('')
  const [nombre, setNombre] = useState('')
  const [equipo, setEquipo] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [groupData, setGroupData] = useState(null)
  const [player, setPlayer] = useState(null)

  useEffect(() => {
    const savedPlayer = localStorage.getItem('prode_player')
    const savedGroup = localStorage.getItem('prode_group')
    if (savedPlayer && savedGroup) {
      const p = JSON.parse(savedPlayer)
      const g = JSON.parse(savedGroup)
      supabase.from('players').select('*').eq('id', p.id).single().then(({ data }) => {
        if (data) {
          setPlayer(data)
          setGroupData(g)
          setScreen('main')
        } else {
          localStorage.removeItem('prode_player')
          localStorage.removeItem('prode_group')
        }
      })
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
      setLoginErr('Clave incorrecta. Pedísela al organizador.')
      return
    }
    setGroupData(data)
    localStorage.setItem('prode_group', JSON.stringify(data))
    setScreen('register')
  }

  async function handleRegister() {
    if (!nombre.trim() || !equipo.trim()) return
    setLoading(true)
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
              <div style={{textAlign:'center', marginBottom:22}}>
                <div style={{fontSize:42, marginBottom:8}}>⚽</div>
                <h2 style={{fontSize:18, fontWeight:700, color:'var(--tx)', marginBottom:5}}>Prode Mundial 2026</h2>
                <p style={{fontSize:12, color:'var(--tx2)'}}>Ingresá la clave que te dio el organizador</p>
              </div>
              <div className="field">
                <label>Clave de acceso</label>
                <input
                  type="password"
                  maxLength={8}
                  value={clave}
                  onChange={e => setClave(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  autoComplete="off"
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
              <div style={{textAlign:'center', marginBottom:20}}>
                <div style={{fontSize:32, marginBottom:6}}>👤</div>
                <h2 style={{fontSize:16, fontWeight:700, color:'var(--tx)', marginBottom:4}}>Crear tu perfil</h2>
                <p style={{fontSize:12, color:'var(--tx2)'}}>El nombre de equipo es el que aparece en el ranking</p>
              </div>
              <div className="field">
                <label>Tu nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="field">
                <label>Nombre de tu equipo</label>
                <input
                  type="text"
                  value={equipo}
                  onChange={e => setEquipo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  autoComplete="off"
                />
              </div>
              <button className="btn" onClick={handleRegister} disabled={loading}>
                {loading ? 'Creando...' : 'Crear perfil y entrar'}
              </button>
              <button
                onClick={() => { setScreen('login'); setGroupData(null); localStorage.removeItem('prode_group') }}
                style={{width:'100%', marginTop:10, padding:'8px', background:'transparent', border:'none', color:'var(--tx3)', fontSize:12, cursor:'pointer'}}
              >
                ← Volver
              </button>
            </div>
          </div>
        )}

        {/* MAIN */}
        {screen === 'main' && (
          <>
            <div className="nav">
              <button className={`ntab ${tab==='pronosticos'?'active':''}`} onClick={() => setTab('pronosticos')}>✏️ Pronósticos</button>
              <button className={`ntab ${tab==='ranking'?'active':''}`} onClick={() => setTab('ranking')}>📊 Ranking</button>
              <button className={`ntab ${tab==='admin'?'active':''}`} onClick={() => setTab('admin')}>🔧 Admin</button>
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
            {tab === 'admin' && <AdminTab groupData={groupData} currentPlayer={player} />}
          </>
        )}
      </div>
    </>
  )
}

function AdminTab({ groupData, currentPlayer }) {
  const [adminCode, setAdminCode] = useState('')
  const [authed, setAuthed] = useState(false)
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(null)

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
      .select('*, predictions(count)')
      .eq('group_id', groupData.id)
      .order('created_at')
    setLoading(false)
    setPlayers(data || [])
  }

  async function deletePlayer(p) {
    if (!confirm(`¿Borrar al jugador "${p.team_name}" (${p.name})?\nEsta acción no se puede deshacer.`)) return
    setDeleting(p.id)
    await supabase.from('predictions').delete().eq('player_id', p.id)
    await supabase.from('players').delete().eq('id', p.id)
    setDeleting(null)
    loadPlayers()
  }

  function exportCSV() {
    if (!players.length) return
    const rows = [['Equipo','Jugador','Guardó','Pronósticos cargados']]
    players.forEach(p => {
      rows.push([p.team_name, p.name, p.saved ? 'Sí' : 'No', p.predictions?.[0]?.count || 0])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prode_${groupData.name}_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  if (!authed) return (
    <div style={{padding:'24px 14px', flex:1}}>
      <div className="card" style={{maxWidth:300}}>
        <p style={{fontSize:14, fontWeight:700, color:'var(--tx)', marginBottom:4}}>🔧 Acceso administrador</p>
        <p style={{fontSize:12, color:'var(--tx2)', marginBottom:14}}>Solo para el organizador del grupo</p>
        <div className="field">
          <label>Clave admin</label>
          <input
            type="password"
            value={adminCode}
            onChange={e => setAdminCode(e.target.value)}
            onKeyDown={e => e.key==='Enter' && checkAdmin()}
            autoComplete="off"
          />
        </div>
        <button className="btn" onClick={checkAdmin}>Entrar como admin</button>
      </div>
    </div>
  )

  return (
    <div style={{padding:'14px', overflowY:'auto', flex:1}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
        <span style={{fontSize:14, fontWeight:700, color:'var(--tx)'}}>
          {groupData.name} — {players.length} jugador{players.length !== 1 ? 'es' : ''}
        </span>
        <button className="btn-sm" onClick={exportCSV}>⬇️ CSV</button>
      </div>

      <div className="rk-tbl">
        <div className="rk-head">Jugadores registrados</div>
        {loading && <div className="loading">Cargando...</div>}
        {!loading && players.length === 0 && <div className="empty">No hay jugadores aún.</div>}
        {players.map(p => (
          <div key={p.id} style={{display:'flex', alignItems:'center', gap:10, padding:'10px 15px', borderBottom:'1px solid var(--bd)'}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13, fontWeight:600, color:'var(--tx)'}}>{p.team_name}</div>
              <div style={{fontSize:11, color:'var(--tx3)'}}>{p.name}</div>
            </div>
            <div style={{textAlign:'right', marginRight:8}}>
              <div style={{fontSize:11, color: p.saved ? 'var(--em)' : 'var(--tx3)'}}>
                {p.saved ? '✅ Guardó' : '⏳ Pendiente'}
              </div>
              <div style={{fontSize:10, color:'var(--tx3)'}}>{p.predictions?.[0]?.count || 0}/72</div>
            </div>
            <button
              className="btn-danger"
              onClick={() => deletePlayer(p)}
              disabled={deleting === p.id}
              style={{fontSize:11, padding:'4px 10px', flexShrink:0}}
            >
              {deleting === p.id ? '...' : '🗑 Borrar'}
            </button>
          </div>
        ))}
      </div>

      <div style={{marginTop:14, padding:'12px 14px', background:'var(--bg2)', borderRadius:10, border:'1px solid var(--bd)', fontSize:12, color:'var(--tx2)'}}>
        <p style={{fontWeight:700, marginBottom:6, color:'var(--tx)'}}>📋 Cargar resultados reales</p>
        <p>Para que el ranking sume puntos, ingresá los resultados en Supabase → Table Editor → tabla <code style={{background:'var(--bg4)', padding:'1px 5px', borderRadius:3}}>match_results</code>.</p>
        <p style={{marginTop:6}}>Campos necesarios: <code style={{background:'var(--bg4)', padding:'1px 4px', borderRadius:3}}>match_key</code> (ej: "A0"), <code style={{background:'var(--bg4)', padding:'1px 4px', borderRadius:3}}>goals_local</code>, <code style={{background:'var(--bg4)', padding:'1px 4px', borderRadius:3}}>goals_visitor</code>.</p>
      </div>
    </div>
  )
}
