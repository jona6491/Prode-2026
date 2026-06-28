import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  buildKnockoutBracket,
  displaySlot,
  KNOCKOUT_SCORING,
  slotBadge,
} from '../lib/knockout'

export function StageSwitch({ value, onChange }) {
  return (
    <div className="stage-switch" role="tablist" aria-label="Etapa del torneo">
      <button className={value === 'groups' ? 'active' : ''} onClick={() => onChange('groups')}>Grupos</button>
      <button className={value === 'knockout' ? 'active' : ''} onClick={() => onChange('knockout')}>Eliminatorias</button>
    </div>
  )
}

// ─── PREDICTIONS MODE ────────────────────────────────────────────────────────
export function KnockoutPredictions({ player, onSaved }) {
  const [predictions, setPredictions] = useState({})
  const [savedKeys, setSavedKeys] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savedAll, setSavedAll] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => { loadPredictions() }, [player])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
  }, [loading])

  async function loadPredictions() {
    setLoading(true)
    const { data } = await supabase
      .from('knockout_predictions')
      .select('*')
      .eq('player_id', player.id)
    if (data && data.length > 0) {
      const map = {}
      const keys = new Set()
      data.forEach(d => {
        map[d.match_key] = { l: d.goals_local, v: d.goals_visitor, winner: d.winner }
        keys.add(d.match_key)
      })
      setPredictions(map)
      setSavedKeys(keys)
      setSavedAll(true)
    }
    setLoading(false)
  }

  const bracket = useMemo(() => buildKnockoutBracket(predictions), [predictions])

  function updateScore(matchId, side, value) {
    const num = value === '' ? '' : Math.max(0, Math.min(20, parseInt(value) || 0))
    setPredictions(prev => ({
      ...prev,
      [matchId]: { ...(prev[matchId] || { l: '', v: '', winner: null }), [side]: num },
    }))
    setSavedAll(false)
  }

  function chooseWinner(matchId, team) {
    if (!team) return
    setPredictions(prev => ({
      ...prev,
      [matchId]: { ...(prev[matchId] || { l: '', v: '' }), winner: team },
    }))
    setSavedAll(false)
  }

  async function handleSave() {
    // Validate: all matches with teams defined must have scores + winner
    const allMatches = getAllMatchIds(bracket)
    const missing = allMatches.filter(id => {
      const p = predictions[id]
      return !p || p.l === '' || p.v === '' || !p.winner
    })
    if (missing.length > 0) {
      alert(`⚠️ Completá todos los partidos antes de guardar.\nFaltan ${missing.length} partido${missing.length > 1 ? 's' : ''}.`)
      return
    }

    setSaving(true)
    // Upsert all predictions
    const rows = Object.entries(predictions).map(([match_key, p]) => ({
      player_id: player.id,
      match_key,
      goals_local: p.l,
      goals_visitor: p.v,
      winner: p.winner,
    }))

    const { error } = await supabase
      .from('knockout_predictions')
      .upsert(rows, { onConflict: 'player_id,match_key' })

    if (error) {
      alert('Error al guardar. Intentá de nuevo.')
      setSaving(false)
      return
    }

    // Mark player as having saved knockout
    const { data: updatedPlayer } = await supabase
      .from('players')
      .update({ saved_knockout: true })
      .eq('id', player.id)
      .select()
      .single()

    setSavedAll(true)
    const newKeys = new Set(rows.map(r => r.match_key))
    setSavedKeys(newKeys)
    setSaving(false)
    if (updatedPlayer && onSaved) onSaved(updatedPlayer)
  }

  function scrollTo(position) {
    const el = scrollRef.current
    if (!el) return
    const target = position === 'left' ? 0 : position === 'right' ? el.scrollWidth : (el.scrollWidth - el.clientWidth) / 2
    el.scrollTo({ left: target, behavior: 'smooth' })
  }

  if (loading) return <div className="loading" style={{padding:'2rem',textAlign:'center'}}>Cargando llave...</div>

  return (
    <div className="ko-shell">
      <div className="ko-toolbar">
        <div>
          <div className="ko-title">Cuadro eliminatorio</div>
          <div className="ko-subtitle">Pronosticá marcador y clasificado en cada partido</div>
        </div>
        <div className="ko-score-legend">
          <span><strong>+{KNOCKOUT_SCORING.exactScore}</strong> exacto</span>
          <span><strong>+{KNOCKOUT_SCORING.qualifiedTeam}</strong> clasificado</span>
        </div>
      </div>

      <div className="ko-view-nav">
        <button onClick={() => scrollTo('left')}>← Izquierda</button>
        <button className="center" onClick={() => scrollTo('center')}>🏆 Final</button>
        <button onClick={() => scrollTo('right')}>Derecha →</button>
      </div>

      <div className="ko-scroll" ref={scrollRef}>
        <div className="ko-opposed-board">
          <BracketSide side="left" rounds={bracket.left} source={predictions}
            resultMode={false} onScore={updateScore} onWinner={chooseWinner} />
          <div className="ko-center-stage">
            <div className="ko-trophy">🏆</div>
            <div className="ko-center-label">Final · 19 Jul</div>
            <MatchCard match={bracket.final} value={predictions[bracket.final.id]}
              resultMode={false} onScore={updateScore} onWinner={chooseWinner} featured />
            <div className="ko-center-label third">3.º puesto · 18 Jul</div>
            <MatchCard match={bracket.thirdPlace} value={predictions[bracket.thirdPlace.id]}
              resultMode={false} onScore={updateScore} onWinner={chooseWinner} />
          </div>
          <BracketSide side="right" rounds={[...bracket.right].reverse()} source={predictions}
            resultMode={false} onScore={updateScore} onWinner={chooseWinner} />
        </div>
      </div>

      <div className="save-footer">
        {savedAll
          ? <div style={{textAlign:'center',fontSize:13,color:'var(--em)',padding:'10px 0'}}>✅ Llave guardada</div>
          : <button className="btn" onClick={handleSave} disabled={saving}>
              {saving ? '⏳ Guardando...' : '💾 Guardar llave eliminatoria'}
            </button>
        }
      </div>
    </div>
  )
}

// ─── RESULTS MODE ────────────────────────────────────────────────────────────
export function KnockoutResults({ adminUnlocked }) {
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(true)
  const [editingMatch, setEditingMatch] = useState(null) // { id, l, v, winner }
  const [saving, setSaving] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => { loadResults() }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
  }, [loading])

  async function loadResults() {
    setLoading(true)
    const { data } = await supabase.from('knockout_results').select('*')
    const map = {}
    if (data) data.forEach(r => {
      map[r.match_key] = { l: r.goals_local, v: r.goals_visitor, winner: r.winner, penalties: r.penalties }
    })
    setResults(map)
    setLoading(false)
  }

  async function saveResult() {
    if (editingMatch.l === '' || editingMatch.v === '' || !editingMatch.winner) {
      alert('Completá marcador y clasificado.')
      return
    }
    setSaving(true)
    const payload = {
      match_key: editingMatch.id,
      goals_local: parseInt(editingMatch.l),
      goals_visitor: parseInt(editingMatch.v),
      winner: editingMatch.winner,
      penalties: editingMatch.penalties || null,
    }
    const existing = results[editingMatch.id]
    if (existing) {
      await supabase.from('knockout_results').update(payload).eq('match_key', editingMatch.id)
    } else {
      await supabase.from('knockout_results').insert(payload)
    }
    await loadResults()
    setSaving(false)
    setEditingMatch(null)
  }

  const bracket = useMemo(() => buildKnockoutBracket(results), [results])

  function scrollTo(position) {
    const el = scrollRef.current
    if (!el) return
    const target = position === 'left' ? 0 : position === 'right' ? el.scrollWidth : (el.scrollWidth - el.clientWidth) / 2
    el.scrollTo({ left: target, behavior: 'smooth' })
  }

  if (loading) return <div className="loading" style={{padding:'2rem',textAlign:'center'}}>Cargando resultados...</div>

  return (
    <div className="ko-shell">
      <div className="ko-toolbar">
        <div>
          <div className="ko-title">Resultados eliminatorias</div>
          <div className="ko-subtitle">{Object.keys(results).length} de 31 partidos jugados</div>
        </div>
        <div className="ko-score-legend">
          <span><strong>+{KNOCKOUT_SCORING.exactScore}</strong> exacto</span>
          <span><strong>+{KNOCKOUT_SCORING.qualifiedTeam}</strong> clasificado</span>
        </div>
      </div>

      <div className="ko-view-nav">
        <button onClick={() => scrollTo('left')}>← Izquierda</button>
        <button className="center" onClick={() => scrollTo('center')}>🏆 Final</button>
        <button onClick={() => scrollTo('right')}>Derecha →</button>
      </div>

      <div className="ko-scroll" ref={scrollRef}>
        <div className="ko-opposed-board">
          <BracketSide side="left" rounds={bracket.left} source={results}
            resultMode={true} adminUnlocked={adminUnlocked}
            onEdit={(match) => setEditingMatch({ id: match.id, l: results[match.id]?.l ?? '', v: results[match.id]?.v ?? '', winner: results[match.id]?.winner ?? null, penalties: results[match.id]?.penalties ?? '' })} />
          <div className="ko-center-stage">
            <div className="ko-trophy">🏆</div>
            <div className="ko-center-label">Final · 19 Jul</div>
            <MatchCard match={bracket.final} value={results[bracket.final.id]}
              resultMode={true} adminUnlocked={adminUnlocked}
              onEdit={() => setEditingMatch({ id: bracket.final.id, l: results[bracket.final.id]?.l ?? '', v: results[bracket.final.id]?.v ?? '', winner: results[bracket.final.id]?.winner ?? null, penalties: '' })}
              featured />
            <div className="ko-center-label third">3.º puesto · 18 Jul</div>
            <MatchCard match={bracket.thirdPlace} value={results[bracket.thirdPlace.id]}
              resultMode={true} adminUnlocked={adminUnlocked}
              onEdit={() => setEditingMatch({ id: bracket.thirdPlace.id, l: results[bracket.thirdPlace.id]?.l ?? '', v: results[bracket.thirdPlace.id]?.v ?? '', winner: results[bracket.thirdPlace.id]?.winner ?? null, penalties: '' })} />
          </div>
          <BracketSide side="right" rounds={[...bracket.right].reverse()} source={results}
            resultMode={true} adminUnlocked={adminUnlocked}
            onEdit={(match) => setEditingMatch({ id: match.id, l: results[match.id]?.l ?? '', v: results[match.id]?.v ?? '', winner: results[match.id]?.winner ?? null, penalties: results[match.id]?.penalties ?? '' })} />
        </div>
      </div>

      {/* Edit modal */}
      {editingMatch && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div className="card" style={{maxWidth:320,width:'90%',padding:'20px'}}>
            <p style={{fontSize:14,fontWeight:700,color:'var(--tx)',marginBottom:16}}>Cargar resultado · Partido {editingMatch.id.slice(1)}</p>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:12}}>
              <input className="sinp" type="number" min="0" max="20"
                value={editingMatch.l} onChange={e => setEditingMatch(prev => ({...prev, l: e.target.value}))}
                style={{width:50}} placeholder="0"/>
              <span style={{color:'var(--tx2)'}}>-</span>
              <input className="sinp" type="number" min="0" max="20"
                value={editingMatch.v} onChange={e => setEditingMatch(prev => ({...prev, v: e.target.value}))}
                style={{width:50}} placeholder="0"/>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:'var(--tx3)',marginBottom:6}}>Clasificado (obligatorio)</div>
              <input type="text" value={editingMatch.winner || ''}
                onChange={e => setEditingMatch(prev => ({...prev, winner: e.target.value}))}
                placeholder="Ej: 1A, 2B, 3C/D/E..."
                style={{width:'100%',padding:'8px 10px',fontSize:13,border:'1px solid var(--bd2)',borderRadius:8,background:'var(--bg3)',color:'var(--tx)',fontFamily:'inherit'}}/>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:'var(--tx3)',marginBottom:6}}>Penales (opcional, ej: 5-4)</div>
              <input type="text" value={editingMatch.penalties || ''}
                onChange={e => setEditingMatch(prev => ({...prev, penalties: e.target.value}))}
                placeholder="Ej: 5-4"
                style={{width:'100%',padding:'8px 10px',fontSize:13,border:'1px solid var(--bd2)',borderRadius:8,background:'var(--bg3)',color:'var(--tx)',fontFamily:'inherit'}}/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn" onClick={saveResult} disabled={saving}
                style={{flex:1}}>{saving ? '...' : '✓ Guardar'}</button>
              <button onClick={() => setEditingMatch(null)}
                style={{padding:'8px 14px',background:'transparent',border:'1px solid var(--bd2)',borderRadius:8,color:'var(--tx2)',cursor:'pointer',fontFamily:'inherit'}}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
function getAllMatchIds(bracket) {
  const ids = []
  bracket.left.forEach(r => r.matches.forEach(m => { if (m.home && m.away) ids.push(m.id) }))
  bracket.right.forEach(r => r.matches.forEach(m => { if (m.home && m.away) ids.push(m.id) }))
  if (bracket.final.home && bracket.final.away) ids.push(bracket.final.id)
  if (bracket.thirdPlace.home && bracket.thirdPlace.away) ids.push(bracket.thirdPlace.id)
  return ids
}

function BracketSide({ side, rounds, source, resultMode, adminUnlocked, onScore, onWinner, onEdit }) {
  return (
    <div className={`ko-branch ${side}`}>
      {rounds.map(round => (
        <section key={`${side}-${round.id}`} className="ko-round">
          <div className="ko-round-head">
            <strong>{round.label}</strong>
            <span>{round.date}</span>
          </div>
          <div className="ko-round-matches">
            {round.matches.map(match => (
              <MatchCard key={match.id} match={match} value={source[match.id]}
                resultMode={resultMode} adminUnlocked={adminUnlocked}
                onScore={onScore} onWinner={onWinner}
                onEdit={onEdit ? () => onEdit(match) : undefined}
                side={side} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function MatchCard({ match, value, resultMode, adminUnlocked, onScore, onWinner, onEdit, side, featured = false }) {
  const teams = [
    { scoreSide: 'l', name: match.home },
    { scoreSide: 'v', name: match.away },
  ]
  const hasTeams = match.home && match.away

  return (
    <div className={`ko-card ${side || ''} ${featured ? 'featured' : ''}`}>
      <div className="ko-match-id">Partido {match.id.slice(1)}</div>
      {teams.map(team => {
        const selected = value?.winner === team.name
        return (
          <div key={team.scoreSide} className={`ko-team-row ${selected ? 'selected' : ''} ${!team.name ? 'pending' : ''}`}>
            <button
              className="ko-team-pick"
              onClick={() => !resultMode && onWinner && onWinner(match.id, team.name)}
              disabled={resultMode || !team.name}
              title={resultMode ? '' : `Clasifica ${displaySlot(team.name)}`}
            >
              <span className="ko-seed-badge">{slotBadge(team.name)}</span>
              <span>{displaySlot(team.name)}</span>
              {selected && <span className="ko-qualified">✓</span>}
            </button>
            {resultMode ? (
              <span className="ko-score-readonly">{value?.[team.scoreSide] ?? '-'}</span>
            ) : (
              <input
                type="number" min="0" max="20"
                value={value?.[team.scoreSide] ?? ''}
                onChange={e => onScore && onScore(match.id, team.scoreSide, e.target.value)}
                disabled={!hasTeams}
                aria-label={`Goles de ${displaySlot(team.name)}`}
              />
            )}
          </div>
        )
      })}
      {resultMode && value?.penalties && (
        <div className="ko-penalties">Penales {value.penalties}</div>
      )}
      {resultMode && adminUnlocked && hasTeams && (
        <button onClick={onEdit}
          style={{width:'100%',marginTop:4,padding:'4px',background:'transparent',border:'none',
            color:'var(--tx3)',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
          {value ? '✏️ Editar' : '➕ Cargar'}
        </button>
      )}
    </div>
  )
}

export default KnockoutPredictions
