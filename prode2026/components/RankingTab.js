import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { scorePoints } from '../lib/worldcup'

export default function RankingTab({ player }) {
  const [players, setPlayers] = useState([])
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRanking()
    const interval = setInterval(loadRanking, 60000)
    return () => clearInterval(interval)
  }, [])

  async function loadRanking() {
    setLoading(true)
    const [{ data: playersData }, { data: resultsData }] = await Promise.all([
      supabase.from('players').select('*, predictions(*)').eq('saved', true).order('created_at'),
      supabase.from('match_results').select('*')
    ])
    const resultsMap = {}
    if (resultsData) resultsData.forEach(r => { resultsMap[r.match_key] = { l: r.goals_local, v: r.goals_visitor } })
    setResults(resultsMap)
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

  const me = players.find(p => p.id === player?.id)
  const medals = ['🥇', '🥈', '🥉']
  const playedMatches = Object.keys(results).length

  return (
    <div style={{padding:'12px 14px',overflowY:'auto',flex:1}}>
      <div className="stat-row">
        <div className="stat-c"><div className="stat-l">Puntos</div><div className="stat-v em">{me?me.pts:'—'}</div></div>
        <div className="stat-c"><div className="stat-l">⭐ Pleno</div><div className="stat-v gold">{me?me.pleno:'—'}</div></div>
        <div className="stat-c"><div className="stat-l">✓ Parcial</div><div className="stat-v blue">{me?me.parcial:'—'}</div></div>
        <div className="stat-c"><div className="stat-l">Jugadores</div><div className="stat-v">{players.length}</div></div>
      </div>
      {playedMatches === 0 && (
        <div style={{fontSize:11,color:'var(--tx3)',marginBottom:10,padding:'8px 12px',background:'var(--bg3)',borderRadius:8}}>
          ⏳ Los puntos se actualizarán cuando el organizador cargue los resultados reales.
        </div>
      )}
      {playedMatches > 0 && (
        <div style={{fontSize:11,color:'var(--tx3)',marginBottom:10,textAlign:'center'}}>
          {playedMatches} partido{playedMatches!==1?'s':''} jugado{playedMatches!==1?'s':''} · Se actualiza cada 60s
        </div>
      )}
      <div className="rk-tbl">
        <div className="rk-head">Tabla general — Prode Mundial 2026</div>
        {loading && <div className="loading">Cargando ranking...</div>}
        {!loading && players.length === 0 && <div className="empty">Nadie guardó sus pronósticos aún.</div>}
        {players.map((p, i) => (
          <div key={p.id} className={`rk-row ${p.id===player?.id?'me':''}`}>
            <div className="rk-pos">{i<3?medals[i]:i+1}</div>
            <div className="rk-info">
              <div className="rk-tnm">{p.team_name}{p.id===player?.id&&<span style={{fontSize:10,color:'var(--em)',marginLeft:6}}>(vos)</span>}</div>
              <div className="rk-unm">{p.name} · ⭐{p.pleno} pleno · ✓{p.parcial} parcial</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div className="rk-pts">{p.pts}</div>
              <div className="rk-ptsl">pts</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
