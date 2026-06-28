import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  buildKnockoutBracket,
  DEMO_PREDICTIONS,
  DEMO_RESULTS,
  displaySlot,
  getKnockoutDeadlineText,
  isKnockoutMatchOpen,
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

function useBracketScroll(dependency) {
  const scrollRef = useRef(null)
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0 })
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
  }, [dependency])

  function scrollTo(position) {
    const el = scrollRef.current
    if (!el) return
    const target = position === 'left' ? 0 : position === 'right' ? el.scrollWidth : (el.scrollWidth - el.clientWidth) / 2
    el.scrollTo({ left: target, behavior: 'smooth' })
  }

  function beginDrag(event) {
    const el = scrollRef.current
    if (!el || event.target.closest('button, input')) return
    dragRef.current = { active: true, startX: event.clientX, scrollLeft: el.scrollLeft }
    setDragging(true)
    el.setPointerCapture?.(event.pointerId)
  }

  function moveDrag(event) {
    const el = scrollRef.current
    const drag = dragRef.current
    if (!el || !drag.active) return
    event.preventDefault()
    el.scrollLeft = drag.scrollLeft - (event.clientX - drag.startX)
  }

  function endDrag(event) {
    const el = scrollRef.current
    if (dragRef.current.active) el?.releasePointerCapture?.(event.pointerId)
    dragRef.current.active = false
    setDragging(false)
  }

  return {
    scrollRef,
    dragging,
    scrollTo,
    dragHandlers: {
      onPointerDown: beginDrag,
      onPointerMove: moveDrag,
      onPointerUp: endDrag,
      onPointerLeave: endDrag,
      onPointerCancel: endDrag,
    },
  }
}

export default function KnockoutTab({ mode = 'predictions', player, adminUnlocked = false, onSaved }) {
  if (player) return <KnockoutPredictions player={player} onSaved={onSaved} />
  if (mode === 'results') return <KnockoutResults adminUnlocked={adminUnlocked} />
  return <KnockoutDemo mode={mode} />
}

export function KnockoutPredictions({ player, onSaved }) {
  const [predictions, setPredictions] = useState({})
  const [savedKeys, setSavedKeys] = useState(new Set())
  const [savingKeys, setSavingKeys] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const bracket = useMemo(() => buildKnockoutBracket(predictions), [predictions])
  const { scrollRef, dragging, scrollTo, dragHandlers } = useBracketScroll(loading)

  useEffect(() => { loadPredictions() }, [player?.id])

  async function loadPredictions() {
    if (!player?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('knockout_predictions')
      .select('*')
      .eq('player_id', player.id)

    const map = {}
    const keys = new Set()
    if (data) {
      data.forEach(row => {
        map[row.match_key] = { l: row.goals_local, v: row.goals_visitor, winner: row.winner }
        keys.add(row.match_key)
      })
    }
    setPredictions(map)
    setSavedKeys(keys)
    setLoading(false)
  }

  function updateScore(matchId, side, value) {
    if (!isKnockoutMatchOpen(matchId)) return
    const num = value === '' ? '' : Math.max(0, Math.min(20, parseInt(value) || 0))
    setPredictions(prev => ({
      ...prev,
      [matchId]: { ...(prev[matchId] || { l: '', v: '', winner: null }), [side]: num },
    }))
    setMessage(null)
  }

  function chooseWinner(matchId, team) {
    if (!team || !isKnockoutMatchOpen(matchId)) return
    setPredictions(prev => ({
      ...prev,
      [matchId]: { ...(prev[matchId] || { l: '', v: '' }), winner: team },
    }))
    setMessage(null)
  }

  async function saveMatch(matchId) {
    const value = predictions[matchId]
    if (!value || value.l === '' || value.v === '' || !value.winner) {
      setMessage({ ok: false, text: 'Completa marcador y clasificado antes de guardar.' })
      return
    }
    if (!isKnockoutMatchOpen(matchId)) {
      setMessage({ ok: false, text: `Ese partido ya cerro. Cierre: ${getKnockoutDeadlineText(matchId)}.` })
      return
    }

    setSavingKeys(prev => new Set([...prev, matchId]))
    const { error } = await supabase.from('knockout_predictions').upsert({
      player_id: player.id,
      match_key: matchId,
      goals_local: value.l,
      goals_visitor: value.v,
      winner: value.winner,
    }, { onConflict: 'player_id,match_key' })

    setSavingKeys(prev => {
      const next = new Set(prev)
      next.delete(matchId)
      return next
    })

    if (error) {
      setMessage({ ok: false, text: 'No se pudo guardar. Revisar que la migracion de Supabase este aplicada.' })
      return
    }

    setSavedKeys(prev => new Set([...prev, matchId]))
    setMessage({ ok: true, text: `Partido ${matchId.slice(1)} guardado.` })
    onSaved?.(player)
  }

  async function saveAllReady() {
    const matchIds = getAllMatchIds(bracket)
    const readyIds = matchIds.filter(matchId => {
      const value = predictions[matchId]
      return isKnockoutMatchOpen(matchId) && value?.l !== '' && value?.v !== '' && value?.winner
    })
    if (readyIds.length === 0) {
      setMessage({ ok: false, text: 'No hay partidos completos abiertos para guardar.' })
      return
    }

    setSavingKeys(new Set(readyIds))
    const rows = readyIds.map(matchId => ({
      player_id: player.id,
      match_key: matchId,
      goals_local: predictions[matchId].l,
      goals_visitor: predictions[matchId].v,
      winner: predictions[matchId].winner,
    }))
    const { error } = await supabase.from('knockout_predictions').upsert(rows, { onConflict: 'player_id,match_key' })
    setSavingKeys(new Set())

    if (error) {
      setMessage({ ok: false, text: 'No se pudieron guardar los partidos. Revisar Supabase.' })
      return
    }
    setSavedKeys(prev => new Set([...prev, ...readyIds]))
    setMessage({ ok: true, text: `${readyIds.length} partido${readyIds.length !== 1 ? 's' : ''} guardado${readyIds.length !== 1 ? 's' : ''}.` })
    onSaved?.(player)
  }

  if (loading) return <div className="loading">Cargando eliminatorias...</div>

  return (
    <KnockoutShell
      bracket={bracket}
      source={predictions}
      scrollRef={scrollRef}
      dragging={dragging}
      scrollTo={scrollTo}
      dragHandlers={dragHandlers}
      mode="predictions"
      onScore={updateScore}
      onWinner={chooseWinner}
      onSaveMatch={saveMatch}
      savedKeys={savedKeys}
      savingKeys={savingKeys}
      message={message}
      footer={(
        <button className="btn" onClick={saveAllReady} disabled={savingKeys.size > 0}>
          {savingKeys.size > 0 ? 'Guardando...' : 'Guardar partidos completos'}
        </button>
      )}
    />
  )
}

export function KnockoutResults({ adminUnlocked }) {
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(true)
  const [editingMatch, setEditingMatch] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const bracket = useMemo(() => buildKnockoutBracket(results), [results])
  const { scrollRef, dragging, scrollTo, dragHandlers } = useBracketScroll(loading)

  useEffect(() => { loadResults() }, [])

  async function loadResults() {
    setLoading(true)
    const { data } = await supabase.from('knockout_results').select('*')
    const map = {}
    if (data) {
      data.forEach(row => {
        map[row.match_key] = {
          l: row.goals_local,
          v: row.goals_visitor,
          winner: row.winner,
          penalties: row.penalties,
        }
      })
    }
    setResults(map)
    setLoading(false)
  }

  function openEditor(match) {
    if (!adminUnlocked) return
    const current = results[match.id]
    setEditingMatch({
      id: match.id,
      home: match.home,
      away: match.away,
      l: current?.l ?? '',
      v: current?.v ?? '',
      winner: current?.winner ?? null,
      penalties: current?.penalties ?? '',
    })
    setMessage(null)
  }

  async function saveResult() {
    if (!editingMatch?.id || editingMatch.l === '' || editingMatch.v === '' || !editingMatch.winner) {
      setMessage({ ok: false, text: 'Completa marcador y clasificado.' })
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
    const request = results[editingMatch.id]
      ? supabase.from('knockout_results').update(payload).eq('match_key', editingMatch.id)
      : supabase.from('knockout_results').insert(payload)
    const { error } = await request
    setSaving(false)

    if (error) {
      setMessage({ ok: false, text: 'No se pudo guardar el resultado. Revisar Supabase.' })
      return
    }

    setEditingMatch(null)
    setMessage({ ok: true, text: `Resultado del partido ${payload.match_key.slice(1)} guardado.` })
    await loadResults()
  }

  if (loading) return <div className="loading">Cargando eliminatorias...</div>

  return (
    <>
      <KnockoutShell
        bracket={bracket}
        source={results}
        scrollRef={scrollRef}
        dragging={dragging}
        scrollTo={scrollTo}
        dragHandlers={dragHandlers}
        mode="results"
        adminUnlocked={adminUnlocked}
        onEdit={openEditor}
        message={message}
      />
      {editingMatch && (
        <div className="ko-modal-bg">
          <div className="ko-modal">
            <h3>Partido {editingMatch.id.slice(1)}</h3>
            <div className="ko-editor-teams">
              <span>{displaySlot(editingMatch.home)}</span>
              <input type="number" min="0" max="20" value={editingMatch.l} onChange={e => setEditingMatch(prev => ({ ...prev, l: e.target.value }))} />
              <span>-</span>
              <input type="number" min="0" max="20" value={editingMatch.v} onChange={e => setEditingMatch(prev => ({ ...prev, v: e.target.value }))} />
              <span>{displaySlot(editingMatch.away)}</span>
            </div>
            <div className="ko-editor-picks">
              {[editingMatch.home, editingMatch.away].filter(Boolean).map(team => (
                <button
                  key={team}
                  className={editingMatch.winner === team ? 'active' : ''}
                  onClick={() => setEditingMatch(prev => ({ ...prev, winner: team }))}
                >
                  Clasifica {displaySlot(team)}
                </button>
              ))}
            </div>
            <input
              className="ko-penalty-input"
              placeholder="Penales opcional, ej. 5-4"
              value={editingMatch.penalties}
              onChange={e => setEditingMatch(prev => ({ ...prev, penalties: e.target.value }))}
            />
            <div className="ko-modal-actions">
              <button className="btn" onClick={saveResult} disabled={saving}>{saving ? 'Guardando...' : 'Guardar resultado'}</button>
              <button className="btn-sm" onClick={() => setEditingMatch(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function KnockoutDemo({ mode }) {
  const [predictions, setPredictions] = useState(DEMO_PREDICTIONS)
  const [saved, setSaved] = useState(false)
  const source = mode === 'results' ? DEMO_RESULTS : predictions
  const bracket = useMemo(() => buildKnockoutBracket(source), [source])
  const { scrollRef, dragging, scrollTo, dragHandlers } = useBracketScroll(mode)

  function updateScore(matchId, side, value) {
    const num = value === '' ? '' : Math.max(0, Math.min(20, parseInt(value) || 0))
    setSaved(false)
    setPredictions(prev => ({
      ...prev,
      [matchId]: { ...(prev[matchId] || { l: '', v: '', winner: null }), [side]: num },
    }))
  }

  function chooseWinner(matchId, team) {
    if (!team) return
    setSaved(false)
    setPredictions(prev => ({
      ...prev,
      [matchId]: { ...(prev[matchId] || { l: '', v: '' }), winner: team },
    }))
  }

  return (
    <KnockoutShell
      bracket={bracket}
      source={source}
      scrollRef={scrollRef}
      dragging={dragging}
      scrollTo={scrollTo}
      dragHandlers={dragHandlers}
      mode={mode}
      onScore={updateScore}
      onWinner={chooseWinner}
      footer={mode === 'predictions' && (
        <button className="btn" onClick={() => setSaved(true)}>
          {saved ? 'Llave guardada en la demostracion' : 'Guardar llave de demostracion'}
        </button>
      )}
    />
  )
}

function KnockoutShell({
  bracket,
  source,
  scrollRef,
  dragging,
  scrollTo,
  dragHandlers,
  mode,
  adminUnlocked,
  onScore,
  onWinner,
  onSaveMatch,
  onEdit,
  savedKeys = new Set(),
  savingKeys = new Set(),
  message,
  footer,
}) {
  return (
    <div className="ko-shell">
      <div className="ko-toolbar">
        <div>
          <div className="ko-title">Cuadro eliminatorio</div>
          <div className="ko-subtitle">Cierre por partido: 15 minutos antes</div>
        </div>
        <div className="ko-score-legend">
          <span><strong>+{KNOCKOUT_SCORING.exactScore}</strong> exacto</span>
          <span><strong>+{KNOCKOUT_SCORING.qualifiedTeam}</strong> clasificado</span>
        </div>
      </div>

      {message && (
        <div className={`info-bar ${message.ok ? 'ok' : ''}`} style={{ margin: '0 14px 8px' }}>
          <span>{message.text}</span>
        </div>
      )}

      <div className="ko-view-nav">
        <button onClick={() => scrollTo('left')}>Rama izquierda</button>
        <button className="center" onClick={() => scrollTo('center')}>Final</button>
        <button onClick={() => scrollTo('right')}>Rama derecha</button>
      </div>

      <div className={`ko-scroll ${dragging ? 'is-dragging' : ''}`} ref={scrollRef} {...dragHandlers}>
        <div className="ko-opposed-board">
          <BracketSide
            side="left"
            rounds={bracket.left}
            source={source}
            mode={mode}
            adminUnlocked={adminUnlocked}
            onScore={onScore}
            onWinner={onWinner}
            onSaveMatch={onSaveMatch}
            onEdit={onEdit}
            savedKeys={savedKeys}
            savingKeys={savingKeys}
          />

          <div className="ko-center-stage">
            <div className="ko-trophy">🏆</div>
            <div className="ko-center-label">Final · 19 Jul</div>
            <MatchCard
              match={bracket.final}
              value={source[bracket.final.id]}
              mode={mode}
              adminUnlocked={adminUnlocked}
              onScore={onScore}
              onWinner={onWinner}
              onSaveMatch={onSaveMatch}
              onEdit={() => onEdit?.(bracket.final)}
              saved={savedKeys.has(bracket.final.id)}
              saving={savingKeys.has(bracket.final.id)}
              featured
            />
            <div className="ko-center-label third">3.º puesto · 18 Jul</div>
            <MatchCard
              match={bracket.thirdPlace}
              value={source[bracket.thirdPlace.id]}
              mode={mode}
              adminUnlocked={adminUnlocked}
              onScore={onScore}
              onWinner={onWinner}
              onSaveMatch={onSaveMatch}
              onEdit={() => onEdit?.(bracket.thirdPlace)}
              saved={savedKeys.has(bracket.thirdPlace.id)}
              saving={savingKeys.has(bracket.thirdPlace.id)}
            />
          </div>

          <BracketSide
            side="right"
            rounds={[...bracket.right].reverse()}
            source={source}
            mode={mode}
            adminUnlocked={adminUnlocked}
            onScore={onScore}
            onWinner={onWinner}
            onSaveMatch={onSaveMatch}
            onEdit={onEdit}
            savedKeys={savedKeys}
            savingKeys={savingKeys}
          />
        </div>
      </div>

      {footer && <div className="save-footer">{footer}</div>}
    </div>
  )
}

function BracketSide({ side, rounds, source, mode, adminUnlocked, onScore, onWinner, onSaveMatch, onEdit, savedKeys, savingKeys }) {
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
              <MatchCard
                key={match.id}
                match={match}
                value={source[match.id]}
                mode={mode}
                adminUnlocked={adminUnlocked}
                onScore={onScore}
                onWinner={onWinner}
                onSaveMatch={onSaveMatch}
                onEdit={() => onEdit?.(match)}
                side={side}
                saved={savedKeys.has(match.id)}
                saving={savingKeys.has(match.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function MatchCard({ match, value, mode, adminUnlocked, onScore, onWinner, onSaveMatch, onEdit, side, featured = false, saved, saving }) {
  const teams = [
    { scoreSide: 'l', name: match.home },
    { scoreSide: 'v', name: match.away },
  ]
  const hasTeams = Boolean(match.home && match.away)
  const resultMode = mode === 'results'
  const open = isKnockoutMatchOpen(match.id)
  const complete = value?.l !== '' && value?.v !== '' && value?.l != null && value?.v != null && value?.winner
  const editable = mode === 'predictions' && open && hasTeams

  return (
    <div className={`ko-card ${side || ''} ${featured ? 'featured' : ''} ${!open ? 'locked' : ''}`}>
      <div className="ko-match-id">
        <span>Partido {match.id.slice(1)}</span>
        <span className={open ? 'ko-open-badge' : 'ko-lock-badge'}>{open ? getKnockoutDeadlineText(match.id) : 'Cerrado'}</span>
      </div>
      {teams.map(team => {
        const selected = value?.winner === team.name
        return (
          <div key={team.scoreSide} className={`ko-team-row ${selected ? 'selected' : ''} ${!team.name ? 'pending' : ''}`}>
            <button
              className="ko-team-pick"
              onClick={() => editable && onWinner(match.id, team.name)}
              disabled={!editable}
              title={editable ? `Clasifica ${displaySlot(team.name)}` : ''}
            >
              <span className="ko-seed-badge">{slotBadge(team.name)}</span>
              <span>{displaySlot(team.name)}</span>
              {selected && <span className="ko-qualified">✓</span>}
            </button>
            {resultMode ? (
              <span className="ko-score-readonly">{value?.[team.scoreSide] ?? '-'}</span>
            ) : (
              <input
                type="number"
                min="0"
                max="20"
                value={value?.[team.scoreSide] ?? ''}
                onChange={e => onScore(match.id, team.scoreSide, e.target.value)}
                disabled={!editable}
                aria-label={`Goles de ${displaySlot(team.name)}`}
              />
            )}
          </div>
        )
      })}
      {resultMode && value?.penalties && <div className="ko-penalties">Penales {value.penalties}</div>}
      {!resultMode && (
        <button
          className={`ko-card-action ${saved ? 'saved' : ''}`}
          onClick={() => onSaveMatch?.(match.id)}
          disabled={!editable || !complete || saving}
        >
          {saving ? 'Guardando...' : saved ? 'Guardado · modificar' : open ? 'Guardar partido' : 'Cerrado'}
        </button>
      )}
      {resultMode && adminUnlocked && hasTeams && (
        <button className="ko-card-action" onClick={onEdit}>
          {value ? 'Editar resultado' : 'Cargar resultado'}
        </button>
      )}
    </div>
  )
}

function getAllMatchIds(bracket) {
  return [
    ...bracket.left.flatMap(round => round.matches.map(match => match.id)),
    ...bracket.right.flatMap(round => round.matches.map(match => match.id)),
    bracket.thirdPlace.id,
    bracket.final.id,
  ]
}
