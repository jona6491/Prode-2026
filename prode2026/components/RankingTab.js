import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { scorePoints, GROUPS, flagUrl } from '../lib/worldcup'

const GROUP_KEYS = Object.keys(GROUPS)

export default function RankingTab({ player }) {
  const [players, setPlayers] = useState([])
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(true)
  const [transparencyEnabled, setTransparencyEnabled] = useState(false)
  const [viewingPlayer, setViewingPlayer] = useState(null) // player whose predictions we're viewing
  const [viewPredictions, setViewPredictions] = useState({})
  const [viewLoading, setViewLoading] = useState(false)
  const [selGrp, setSelGrp] = useState('A')

  useEffect(() => {
    loadRanking()
    const interval = setInterval(loadRanking, 60000)
    return () => clearInterval(interval)
  }, [])

  async function loadRanking() {
    setLoading(true)
    const [{ data: playersData }, { data: resultsData }, { data: configData }] = await Promise.all([
      supabase.from('players').select('*, predictions(*)').eq('saved', true).order('created_at'),
      supabase.from('match_results').select('*'),
      supabase.from('admin_config').select('transparency_enabled').eq('id', 1).single()
    ])

    const resultsMap = {}
    if (resultsData) resultsData.forEach(r => { resultsMap[r.match_key] = { l: r.goals_local, v: r.goals_visitor } })
    setResults(resultsMap)
    setTransparencyEnabled(configData?.transparency_enabled || false)

    if (playersData) {
      const ranked = playersData.map(p => {
        let pts = 0, pleno = 0, parcial = 0
        if (p.predictions) {
          p.predictions.forEach(pred => {
            const real = resultsMap[pred.match_key]
            if (real) {
              const score = scorePoints({ l: pred.goals_local, v: pred.goals_visitor }, real)
              pts += score.pts
              if (score.type === 'pleno') pleno++
              if (score.type === 'parcial') parcial++
            }
          })
        }
        return { ...p, pts, pleno, parcial }
      })
      ranked.sort((a, b) => b.pts - a.pts || b.pleno - a.pleno)
      setPlayers(ranked)
    }
    setLoading(false)
  }

  async function viewPlayerPredictions(p) {
    if (viewingPlayer?.id === p.id) { setViewingPlayer(null); return }
    setViewLoading(true)
    setViewingPlayer(p)
    const { data } = await supabase.from('predictions').select('*').eq('player_id', p.id)
    const map = {}
    if (data) data.forEach(d => { map[d.match_key] = { l: d.goals_local, v: d.goals_visitor } })
    setViewPredictions(map)
    setSelGrp('A')
    setViewLoading(false)
  }

  const me = players.find(p => p.id === player?.id)
  const medals = ['🥇', '🥈', '🥉']
  const playedMatches = Object.keys(results).length

  // VIEW MODE — showing another player's predictions
  if (viewingPlayer) {
    const grpData = GROUPS[selGrp]
    return (
      <div style={{display:'flex', flexDirection:'column', flex:1}}>
        {/* Header */}
        <div style={{padding:'10px 14px', background:'var(--bg2)', borderBottom:'1px solid var(--bd)', display:'flex', alignItems:'center', gap:10}}>
          <button onClick={() => setViewingPlayer(null)}
            style={{background:'transparent', border:'none', color:'var(--em)', cursor:'pointer', fontSize:13, fontWeight:600, padding:0}}>
            ← Volver al ranking
          </button>
          <span style={{fontSize:13, color:'var(--tx2)'}}>·</span>
          <span style={{fontSize:13, fontWeight:600, color:'var(--tx)'}}>{viewingPlayer.team_name}</span>
          <span style={{fontSize:11, color:'var(--tx3)'}}>({viewingPlayer.name})</span>
        </div>

        {viewLoading && <div className="loading">Cargando pronósticos...</div>}

        {!viewLoading && (
          <>
            <div className="pills">
              {GROUP_KEYS.map(g => (
                <button key={g} className={`pill ${selGrp===g?'active':''}`} onClick={()=>setSelGrp(g)}>Grupo {g}</button>
              ))}
            </div>
            <div style={{flex:1, overflowY:'auto'}}>
              <div className="grp-block">
                <div className="grp-bar">
                  <h3>Grupo {selGrp} <span className="cnt">{grpData.matches.filter((_,i)=>viewPredictions[selGrp+i]!=null).length}/6</span></h3>
                </div>
                <div className="matches-sec">
                  <div className="matches-lbl">Pronósticos de {viewingPlayer.team_name}</div>
                  {grpData.matches.map((match, i) => {
                    const key = selGrp + i
                    const pred = viewPredictions[key]
                    const real = results[key]
                    let rowColor = 'transparent'
                    if (pred && real) {
                      const score = scorePoints({ l: pred.l, v: pred.v }, real)
                      if (score.type === 'pleno') rowColor = 'rgba(34,201,138,0.1)'
                      else if (score.type === 'parcial') rowColor = 'rgba(96,165,250,0.1)'
                      else rowColor = 'rgba(239,83,80,0.07)'
                    }
                    return (
                      <div key={key} className="mrow" style={{background: rowColor, borderRadius:6, padding:'7px 4px'}}>
                        <div className="mteam">
                          {flagUrl(match[0]) ? <img src={flagUrl(match[0])} className="mflag" alt={match[0]} /> : <span style={{fontSize:20}}>🏳</span>}
                          <span className="mnm">{match[0]}</span>
                          <span className="mdate">{match[2]}</span>
                        </div>
                        <div className="sbox">
                          <div className="lkd">{pred ? pred.l : '?'}</div>
                          <span className="sdash">-</span>
                          <div className="lkd">{pred ? pred.v : '?'}</div>
                        </div>
                        <div className="mteam">
                          {flagUrl(match[1]) ? <img src={flagUrl(match[1])} className="mflag" alt={match[1]} /> : <span style={{fontSize:20}}>🏳</span>}
                          <span className="mnm">{match[1]}</span>
                        </div>
                        {real && pred && (
                          <div style={{fontSize:10, minWidth:40, textAlign:'center', color:
                            scorePoints({l:pred.l,v:pred.v},real).type==='pleno'?'var(--em)':
                            scorePoints({l:pred.l,v:pred.v},real).type==='parcial'?'var(--blue)':'var(--red)'}}>
                            {scorePoints({l:pred.l,v:pred.v},real).type==='pleno'?'⭐+3':
                             scorePoints({l:pred.l,v:pred.v},real).type==='parcial'?'✓+1':'✗ 0'}
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

  // NORMAL RANKING VIEW
  return (
    <div style={{padding:'12px 14px', overflowY:'auto', flex:1}}>
      <div className="stat-row">
        <div className="stat-c"><div className="stat-l">Puntos</div><div className="stat-v em">{me?me.pts:'—'}</div></div>
        <div className="stat-c"><div className="stat-l">⭐ Pleno</div><div className="stat-v gold">{me?me.pleno:'—'}</div></div>
        <div className="stat-c"><div className="stat-l">✓ Parcial</div><div className="stat-v blue">{me?me.parcial:'—'}</div></div>
        <div className="stat-c"><div className="stat-l">Jugadores</div><div className="stat-v">{players.length}</div></div>
      </div>

      {transparencyEnabled && (
        <div style={{fontSize:12, color:'var(--em)', marginBottom:10, padding:'8px 12px',
          background:'var(--em-bg)', borderRadius:8, border:'1px solid rgba(34,201,138,.25)',
          display:'flex', alignItems:'center', gap:6}}>
          👁️ <strong>Modo transparencia activo</strong> — Podés ver los pronósticos de todos
        </div>
      )}

      {playedMatches === 0 && (
        <div style={{fontSize:11, color:'var(--tx3)', marginBottom:10, padding:'8px 12px', background:'var(--bg3)', borderRadius:8}}>
          ⏳ Los puntos se actualizarán cuando el organizador cargue los resultados reales.
        </div>
      )}
      {playedMatches > 0 && (
        <div style={{fontSize:11, color:'var(--tx3)', marginBottom:10, textAlign:'center'}}>
          {playedMatches} partido{playedMatches!==1?'s':''} jugado{playedMatches!==1?'s':''} · Se actualiza cada 60s
        </div>
      )}

      <div className="rk-tbl">
        <div className="rk-head">Tabla general — Prode Mundial 2026</div>
        {loading && <div className="loading">Cargando ranking...</div>}
        {!loading && players.length === 0 && <div className="empty">Nadie guardó sus pronósticos aún.</div>}
        {players.map((p, i) => (
          <div key={p.id}>
            <div className={`rk-row ${p.id===player?.id?'me':''}`}
              style={{cursor: transparencyEnabled ? 'pointer' : 'default'}}
              onClick={() => transparencyEnabled && viewPlayerPredictions(p)}>
              <div className="rk-pos">{i<3?medals[i]:i+1}</div>
              <div className="rk-info">
                <div className="rk-tnm">
                  {p.team_name}
                  {p.id===player?.id && <span style={{fontSize:10, color:'var(--em)', marginLeft:6}}>(vos)</span>}
                  {transparencyEnabled && <span style={{fontSize:10, color:'var(--tx3)', marginLeft:6}}>· ver pronósticos →</span>}
                </div>
                <div className="rk-unm">{p.name} · ⭐{p.pleno} pleno · ✓{p.parcial} parcial</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div className="rk-pts">{p.pts}</div>
                <div className="rk-ptsl">pts</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
