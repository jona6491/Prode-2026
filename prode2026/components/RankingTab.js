import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { scorePoints, GROUPS, flagUrl, PHASE_MATCHES, isPhaseOpen } from '../lib/worldcup'

const GROUP_KEYS = Object.keys(GROUPS)
const PHASES = ['f1', 'f2', 'f3']

function canShowPrediction(matchKey) {
  return PHASES.some(phase => PHASE_MATCHES[phase].includes(matchKey) && !isPhaseOpen(phase))
}

function getVisibleMatchKeys() {
  return PHASES.flatMap(phase => isPhaseOpen(phase) ? [] : PHASE_MATCHES[phase])
}

export default function RankingTab({ player, transparencyEnabled: transparencyProp }) {
  const [players, setPlayers] = useState([])
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(true)
  const [transparencyEnabled, setTransparencyEnabled] = useState(false)
  const [viewingPlayer, setViewingPlayer] = useState(null)
  const [viewPredictions, setViewPredictions] = useState({})
  const [viewLoading, setViewLoading] = useState(false)
  const [selGrp, setSelGrp] = useState('A')


useEffect(() => {
  loadRanking()
  async function checkTransparency() {
    const { data } = await supabase.from('admin_config').select('transparency_enabled').eq('id',1).single()
    if (data) setTransparencyEnabled(data.transparency_enabled)
  }
  checkTransparency()
}, [])

  async function loadRanking() {
    setLoading(true)
    const [{ data: playersData }, { data: resultsData }] = await Promise.all([
      supabase.from('players').select('*, predictions(*)').order('created_at'),
      supabase.from('match_results').select('*')
    ])
    const resultsMap = {}
    if (resultsData) resultsData.forEach(r => {
      resultsMap[r.match_key] = { l: r.goals_local, v: r.goals_visitor, double: r.is_double }
    })
    setResults(resultsMap)
    if (playersData) {
      const ranked = playersData.map(p => {
        let pts = 0, pleno = 0, parcial = 0, doubled = 0
        if (p.predictions && p.saved) {
          p.predictions.forEach(pred => {
            const real = resultsMap[pred.match_key]
            if (real) {
              const score = scorePoints({ l: pred.goals_local, v: pred.goals_visitor }, real, real.double)
              pts += score.pts
              if (score.type === 'pleno') pleno++
              if (score.type === 'parcial') parcial++
              if (score.doubled) doubled++
            }
          })
        }
        return { ...p, pts, pleno, parcial, doubled }
      })
      // Sort: saved first by pts, then unsaved alphabetically
      const saved = ranked.filter(p => p.saved).sort((a,b) => b.pts-a.pts || b.pleno-a.pleno)
      const unsaved = ranked.filter(p => !p.saved).sort((a,b) => a.team_name.localeCompare(b.team_name))
      setPlayers([...saved, ...unsaved])
    }
    setLoading(false)
  }

  async function viewPlayerPredictions(p) {
    if (viewingPlayer?.id === p.id) { setViewingPlayer(null); return }
    setViewLoading(true); setViewingPlayer(p)
    const visibleMatchKeys = getVisibleMatchKeys()
    const { data } = visibleMatchKeys.length > 0
      ? await supabase.from('predictions').select('*').eq('player_id', p.id).in('match_key', visibleMatchKeys)
      : { data: [] }
    const map = {}
    if (data) data.forEach(d => { map[d.match_key] = { l: d.goals_local, v: d.goals_visitor } })
    setViewPredictions(map); setSelGrp('A'); setViewLoading(false)
  }

  const me = players.find(p => p.id === player?.id)
  const medals = ['🥇','🥈','🥉']
  const playedMatches = Object.keys(results).length
  const savedPlayers = players.filter(p => p.saved)

  // VIEW MODE
  if (viewingPlayer) {
    const grpData = GROUPS[selGrp]
    return (
      <div style={{display:'flex',flexDirection:'column',flex:1}}>
        <div style={{padding:'10px 14px',background:'var(--bg2)',borderBottom:'1px solid var(--bd)',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
          <button onClick={()=>setViewingPlayer(null)}
            style={{background:'transparent',border:'none',color:'var(--em)',cursor:'pointer',fontSize:13,fontWeight:600,padding:0}}>
            ← Volver
          </button>
          <span style={{fontSize:13,color:'var(--tx2)'}}>·</span>
          <span style={{fontSize:13,fontWeight:600,color:'var(--tx)'}}>{viewingPlayer.team_name}</span>
          <span style={{fontSize:11,color:'var(--tx3)'}}>({viewingPlayer.name})</span>
        </div>
        {viewLoading && <div className="loading">Cargando...</div>}
        {!viewLoading && (
          <>
            <div className="pills">
              {GROUP_KEYS.map(g => (
                <button key={g} className={`pill ${selGrp===g?'active':''}`} onClick={()=>setSelGrp(g)}>Grupo {g}</button>
              ))}
            </div>
            <div style={{flex:1,overflowY:'auto'}}>
              <div className="grp-block">
                <div className="grp-bar"><h3>Grupo {selGrp}</h3></div>
                <div className="matches-sec">
                  <div className="matches-lbl">Pronósticos de {viewingPlayer.team_name}</div>
                  {grpData.matches.map((match, i) => {
                    const key = selGrp + i
                    const pred = viewPredictions[key]
                    const showPrediction = canShowPrediction(key)
                    const real = results[key]
                    let rowBg = 'transparent'
                    if (showPrediction && pred && real) {
                      const score = scorePoints({l:pred.l,v:pred.v}, real, real.double)
                      if (score.type==='pleno') rowBg='rgba(34,201,138,0.1)'
                      else if (score.type==='parcial') rowBg='rgba(96,165,250,0.1)'
                      else rowBg='rgba(239,83,80,0.07)'
                    }
                    return (
                      <div key={key} className="mrow" style={{background:rowBg,borderRadius:6,padding:'7px 4px'}}>
                        <div className="mteam">
                          {flagUrl(match[0])?<img src={flagUrl(match[0])} className="mflag" alt={match[0]}/>:<span style={{fontSize:20}}>🏳</span>}
                          <span className="mnm">{match[0]}</span><span className="mdate">{match[2]}</span>
                        </div>
                        <div className="sbox">
  <div className="lkd">{showPrediction && pred ? pred.l : '?'}</div>
  <span className="sdash">-</span>
  <div className="lkd">{showPrediction && pred ? pred.v : '?'}</div>

 
</div>
                        <div className="mteam">
                          {flagUrl(match[1])?<img src={flagUrl(match[1])} className="mflag" alt={match[1]}/>:<span style={{fontSize:20}}>🏳</span>}
                          <span className="mnm">{match[1]}</span>
                        </div>
                        {showPrediction && real && pred && (
                          <div style={{fontSize:10,minWidth:44,textAlign:'center',color:
                            scorePoints({l:pred.l,v:pred.v},real,real.double).type==='pleno'?'var(--em)':
                            scorePoints({l:pred.l,v:pred.v},real,real.double).type==='parcial'?'var(--blue)':'var(--red)'}}>
                            {scorePoints({l:pred.l,v:pred.v},real,real.double).type==='pleno'?`⭐+${real.double?6:3}`:
                             scorePoints({l:pred.l,v:pred.v},real,real.double).type==='parcial'?`✓+${real.double?2:1}`:'✗ 0'}
                            {real.double && <div style={{fontSize:9,color:'var(--gold)'}}>x2</div>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div style={{padding:'12px 14px',overflowY:'auto',flex:1}}>
      <div className="stat-row">
        <div className="stat-c"><div className="stat-l">Puntos</div><div className="stat-v em">{me?.saved?me.pts:'—'}</div></div>
        <div className="stat-c"><div className="stat-l">⭐ Pleno</div><div className="stat-v gold">{me?.saved?me.pleno:'—'}</div></div>
        <div className="stat-c"><div className="stat-l">✓ Parcial</div><div className="stat-v blue">{me?.saved?me.parcial:'—'}</div></div>
        <div className="stat-c"><div className="stat-l">Jugadores</div><div className="stat-v">{players.length}</div></div>
      </div>

      {transparencyEnabled && (
        <div style={{fontSize:12,color:'var(--em)',marginBottom:10,padding:'8px 12px',background:'var(--em-bg)',borderRadius:8,border:'1px solid rgba(34,201,138,.25)'}}>
          👁️ <strong>Modo transparencia activo</strong> — Tocá cualquier jugador para ver sus pronósticos
        </div>
      )}
      {playedMatches===0 && (
        <div style={{fontSize:11,color:'var(--tx3)',marginBottom:10,padding:'9px 14px',background:'var(--bg3)',borderRadius:8}}>
          ⏳ Los puntos se actualizarán cuando el organizador cargue los resultados.
        </div>
      )}
     {playedMatches>0 && (
  <>
    <div style={{fontSize:11,color:'var(--tx3)',marginBottom:4,textAlign:'center'}}>
      Van {playedMatches} partidos · Quedan {72 - playedMatches}
    </div>

    {savedPlayers.length > 0 && (
      <div style={{fontSize:11,color:'var(--tx3)',marginBottom:10,textAlign:'center'}}>
         Felicitaciones CAMPEÓN! {savedPlayers[0].team_name} 🏆
      </div>
    )}
  </>
)}

      <div className="rk-tbl">
        <div className="rk-head">
          Tabla general · <span style={{color:'var(--em)'}}>{savedPlayers.length} con pronósticos</span>
          {players.length > savedPlayers.length && <span style={{color:'var(--tx3)',fontWeight:400}}> · {players.length-savedPlayers.length} pendiente{players.length-savedPlayers.length!==1?'s':''}</span>}
        </div>
        {loading && <div className="loading">Cargando...</div>}
        {!loading && players.length===0 && <div className="empty">Nadie se registró aún.</div>}
        {players.map((p, i) => {
          const isSaved = p.saved
          const isMe = p.id === player?.id
          const rank = savedPlayers.findIndex(sp => sp.id === p.id)
          return (
            <div key={p.id} className={`rk-row ${isMe?'me':''}`}
              style={{cursor:transparencyEnabled&&isSaved?'pointer':'default', opacity:isSaved?1:0.6}}
              onClick={()=>transparencyEnabled&&isSaved&&viewPlayerPredictions(p)}>
              <div className="rk-pos">
                {isSaved?(rank<3?medals[rank]:rank+1):'⏳'}
              </div>
              <div className="rk-info">
                <div className="rk-tnm">
                  {p.team_name}
                  {isMe&&<span style={{fontSize:10,color:'var(--em)',marginLeft:6}}>(vos)</span>}
                  {!isSaved&&<span style={{fontSize:10,color:'var(--tx3)',marginLeft:6}}>· pendiente</span>}
                  {transparencyEnabled&&isSaved&&<span style={{fontSize:10,color:'var(--tx2)',fontWeight:600,marginLeft:6,textTransform:'uppercase'}}>· 👁️ Ver →</span>}
                </div>
                <div className="rk-unm">
                  {isSaved
                    ? `${p.name} · ⭐${p.pleno} pleno · ✓${p.parcial} parcial${p.doubled>0?` · 🟡${p.doubled} x2`:''}`
                    : p.name
                  }
                </div>
              </div>
              {isSaved && (
                <div style={{textAlign:'right'}}>
                  <div className="rk-pts">{p.pts}</div>
                  <div className="rk-ptsl">pts</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
