import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { GROUPS, flagUrl } from '../lib/worldcup'
import { StageSwitch, KnockoutResults } from './KnockoutTab'

const GROUP_KEYS = Object.keys(GROUPS)

export default function ResultadosTab({ adminUnlocked }) {
  const [competitionStage, setCompetitionStage] = useState('knockout')
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(true)
  const [selGrp, setSelGrp] = useState('A')
  const [editing, setEditing] = useState(null)
  const [editL, setEditL] = useState('')
  const [editV, setEditV] = useState('')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState(null)

  useEffect(() => { loadResults() }, [])

  async function loadResults() {
    setLoading(true)
    const { data } = await supabase.from('match_results').select('*')
    const map = {}
    if (data) data.forEach(r => { map[r.match_key] = { l: r.goals_local, v: r.goals_visitor } })
    setResults(map)
    setLoading(false)
  }

  async function saveResult(grp, idx, match) {
    if (editL === '' || editV === '') return
    setSaving(true)
    const key = grp + idx
    const payload = {
      match_key: key, group_key: grp, match_index: idx,
      local_team: match[0], visitor_team: match[1],
      goals_local: parseInt(editL), goals_visitor: parseInt(editV)
    }
    if (results[key]) {
      await supabase.from('match_results').update(payload).eq('match_key', key)
    } else {
      await supabase.from('match_results').insert(payload)
    }
    await loadResults()
    setSaving(false)
    setEditing(null)
  }

  async function deleteResult(key) {
    if (!confirm('¿Borrar este resultado?')) return
    await supabase.from('match_results').delete().eq('match_key', key)
    await loadResults()
  }

  async function syncResults() {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await fetch('/api/sync-results', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setSyncMsg({ ok: true, text: `✅ ${data.synced} resultado${data.synced !== 1 ? 's' : ''} sincronizado${data.synced !== 1 ? 's' : ''}${data.skipped > 0 ? ` · ${data.skipped} salteado${data.skipped !== 1 ? 's' : ''}` : ''}` })
        await loadResults()
      } else {
        setSyncMsg({ ok: false, text: `❌ Error: ${data.error}` })
      }
    } catch (e) {
      setSyncMsg({ ok: false, text: '❌ Error de conexión' })
    }
    setSyncing(false)
  }

  const totalPlayed = Object.keys(results).length
  const grpData = GROUPS[selGrp]

  if (competitionStage === 'knockout') return (
    <div style={{display:'flex', flexDirection:'column', flex:1, minHeight:0}}>
      <StageSwitch value={competitionStage} onChange={setCompetitionStage} />
      <KnockoutResults adminUnlocked={adminUnlocked} />
    </div>
  )

  return (
    <div style={{display:'flex', flexDirection:'column', flex:1}}>
      <StageSwitch value={competitionStage} onChange={setCompetitionStage} />
      {adminUnlocked && (
        <div style={{margin:'10px 14px 0', flexShrink:0}}>
          <div className="info-bar ok" style={{marginBottom:8}}>
            <span style={{flex:1}}>⚙️ <strong style={{color:'var(--em)'}}>Modo admin</strong> — Cargá resultados manualmente o sincronizá con la API</span>
          </div>
          <button onClick={syncResults} disabled={syncing}
            style={{width:'100%', padding:'10px', background:'var(--bg3)', border:'1px solid var(--bd2)', borderRadius:8,
              fontSize:13, fontWeight:600, color: syncing ? 'var(--tx3)' : 'var(--tx)', cursor: syncing ? 'not-allowed' : 'pointer',
              fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8}}>
            {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar resultados con API'}
          </button>
          {syncMsg && (
            <div style={{marginTop:6, padding:'8px 12px', borderRadius:8, fontSize:12,
              background: syncMsg.ok ? 'var(--em-bg)' : 'rgba(239,83,80,0.1)',
              color: syncMsg.ok ? 'var(--em)' : 'var(--red)',
              border: `1px solid ${syncMsg.ok ? 'rgba(34,201,138,.25)' : 'rgba(239,83,80,.25)'}`}}>
              {syncMsg.text}
            </div>
          )}
        </div>
      )}
      {!adminUnlocked && (
        <div className="info-bar" style={{margin:'10px 14px 0', flexShrink:0}}>
          <span>⚽ Resultados oficiales · {totalPlayed} partido{totalPlayed !== 1 ? 's' : ''} jugado{totalPlayed !== 1 ? 's' : ''}</span>
        </div>
      )}

      <div className="pills" style={{flexShrink:0}}>
        {GROUP_KEYS.map(g => {
          const played = GROUPS[g].matches.filter((_, i) => results[g + i]).length
          return (
            <button key={g} className={`pill ${selGrp === g ? 'active' : ''}`} onClick={() => setSelGrp(g)}>
              Grupo {g}{played > 0 && <span style={{fontSize:9, marginLeft:2, opacity:.8}}> {played}/6</span>}
            </button>
          )
        })}
      </div>

      <div style={{flex:1, overflowY:'auto'}}>
        <div className="grp-block">
          <div className="grp-bar">
            <h3>Grupo {selGrp} <span className="cnt">{GROUPS[selGrp].matches.filter((_, i) => results[selGrp + i]).length}/6 jugados</span></h3>
          </div>
          <div className="matches-sec" style={{paddingTop:10}}>
            {loading && <div className="loading">Cargando...</div>}
            {!loading && grpData.matches.map((match, i) => {
              const key = selGrp + i
              const res = results[key]
              const isEditing = editing === key
              return (
                <div key={key} className="mrow" style={{flexDirection:'column', alignItems:'stretch', gap:6, padding:'10px 0'}}>
                  <div style={{display:'flex', alignItems:'center', gap:6}}>
                    <div className="mteam">
                      {flagUrl(match[0]) ? <img src={flagUrl(match[0])} className="mflag" alt={match[0]}/> : <span style={{fontSize:20}}>🏳</span>}
                      <span className="mnm">{match[0]}</span>
                      <span className="mdate">{match[2]}</span>
                    </div>
                    <div className="sbox">
                      {res ? (
                        <div style={{display:'flex', alignItems:'center', gap:4}}>
                          <div className="lkd" style={{background:'var(--em-bg)', color:'var(--tx)'}}>{res.l}</div>
                          <span className="sdash">-</span>
                          <div className="lkd" style={{background:'var(--em-bg)', color:'var(--tx)'}}>{res.v}</div>
                        </div>
                      ) : (
                        <div style={{fontSize:11, color:'var(--tx3)', padding:'7px 10px', background:'var(--bg4)', borderRadius:7, whiteSpace:'nowrap'}}>
                          {adminUnlocked ? 'Sin resultado' : 'No jugado'}
                        </div>
                      )}
                    </div>
                    <div className="mteam">
                      {flagUrl(match[1]) ? <img src={flagUrl(match[1])} className="mflag" alt={match[1]}/> : <span style={{fontSize:20}}>🏳</span>}
                      <span className="mnm">{match[1]}</span>
                    </div>
                  </div>

                  {adminUnlocked && !isEditing && (
                    <div style={{display:'flex', justifyContent:'center', gap:8}}>
                      <button className="btn-sm" onClick={() => { setEditing(key); setEditL(res?.l ?? ''); setEditV(res?.v ?? '') }}>
                        {res ? '✏️ Editar' : '➕ Cargar resultado'}
                      </button>
                      {res && <button className="btn-danger" onClick={() => deleteResult(key)} style={{fontSize:11, padding:'4px 10px'}}>🗑</button>}
                    </div>
                  )}

                  {adminUnlocked && isEditing && (
                    <div style={{padding:'10px', background:'var(--bg3)', borderRadius:8, display:'flex', flexDirection:'column', gap:10}}>
                      <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:8}}>
                        <span style={{fontSize:11, color:'var(--tx2)'}}>{match[0]}</span>
                        <input className="sinp" type="number" min="0" max="20" value={editL} onChange={e => setEditL(e.target.value)} style={{width:44}}/>
                        <span className="sdash">-</span>
                        <input className="sinp" type="number" min="0" max="20" value={editV} onChange={e => setEditV(e.target.value)} style={{width:44}}/>
                        <span style={{fontSize:11, color:'var(--tx2)'}}>{match[1]}</span>
                      </div>
                      <div style={{display:'flex', gap:8, justifyContent:'center'}}>
                        <button className="btn" onClick={() => saveResult(selGrp, i, match)} disabled={saving}
                          style={{padding:'7px 20px', fontSize:12, width:'auto'}}>{saving ? '...' : '✓ Guardar'}</button>
                        <button onClick={() => setEditing(null)}
                          style={{background:'transparent', border:'none', color:'var(--tx3)', cursor:'pointer', fontSize:16}}>✕</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
