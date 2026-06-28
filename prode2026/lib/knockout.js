export const KNOCKOUT_SCORING = {
  exactScore: 3,
  qualifiedTeam: 2,
}

export const KNOCKOUT_MATCHES = {
  m73: { home: 'A2', away: 'B2', dateUtc: '2026-06-28T18:00:00Z' },
  m74: { home: 'C1', away: 'F2', dateUtc: '2026-06-29T16:00:00Z' },
  m75: { home: 'E1', away: '3ABCDF', dateUtc: '2026-06-29T19:30:00Z' },
  m76: { home: 'F1', away: 'C2', dateUtc: '2026-06-30T00:00:00Z' },
  m77: { home: 'E2', away: 'I2', dateUtc: '2026-06-30T17:00:00Z' },
  m78: { home: 'I1', away: '3CDFGH', dateUtc: '2026-06-30T21:00:00Z' },
  m79: { home: 'A1', away: '3CEFHI', dateUtc: '2026-07-01T02:00:00Z' },
  m80: { home: 'L1', away: '3EHIJK', dateUtc: '2026-07-01T16:00:00Z' },
  m81: { home: 'G1', away: '3AEHIJ', dateUtc: '2026-07-01T21:00:00Z' },
  m82: { home: 'K2', away: 'L2', dateUtc: '2026-07-02T01:00:00Z' },
  m83: { home: 'D1', away: '3BEFIJ', dateUtc: '2026-07-02T20:00:00Z' },
  m84: { home: 'B1', away: '3DFGHI', dateUtc: '2026-07-02T22:00:00Z' },
  m85: { home: 'J2', away: 'K1', dateUtc: '2026-07-04T04:00:00Z' },
  m86: { home: 'H2', away: 'J1', dateUtc: '2026-07-03T18:00:00Z' },
  m87: { home: 'D2', away: 'G2', dateUtc: '2026-07-03T22:00:00Z' },
  m88: { home: 'H1', away: '3ABDEG', dateUtc: '2026-07-04T01:30:00Z' },
  m89: { homeSource: 'm73', awaySource: 'm75', dateUtc: '2026-07-05T16:00:00Z' },
  m90: { homeSource: 'm74', awaySource: 'm77', dateUtc: '2026-07-05T20:00:00Z' },
  m91: { homeSource: 'm76', awaySource: 'm78', dateUtc: '2026-07-06T16:00:00Z' },
  m92: { homeSource: 'm79', awaySource: 'm80', dateUtc: '2026-07-06T20:00:00Z' },
  m93: { homeSource: 'm83', awaySource: 'm84', dateUtc: '2026-07-07T15:00:00Z' },
  m94: { homeSource: 'm81', awaySource: 'm82', dateUtc: '2026-07-07T19:00:00Z' },
  m95: { homeSource: 'm86', awaySource: 'm88', dateUtc: '2026-07-08T15:00:00Z' },
  m96: { homeSource: 'm85', awaySource: 'm87', dateUtc: '2026-07-08T19:00:00Z' },
  m97: { homeSource: 'm89', awaySource: 'm90', dateUtc: '2026-07-10T16:00:00Z' },
  m98: { homeSource: 'm93', awaySource: 'm94', dateUtc: '2026-07-10T20:00:00Z' },
  m99: { homeSource: 'm91', awaySource: 'm92', dateUtc: '2026-07-11T17:00:00Z' },
  m100: { homeSource: 'm95', awaySource: 'm96', dateUtc: '2026-07-11T21:00:00Z' },
  m101: { homeSource: 'm97', awaySource: 'm98', dateUtc: '2026-07-14T15:00:00Z' },
  m102: { homeSource: 'm99', awaySource: 'm100', dateUtc: '2026-07-15T15:00:00Z' },
  m103: { homeLoserSource: 'm101', awayLoserSource: 'm102', dateUtc: '2026-07-18T17:00:00Z' },
  m104: { homeSource: 'm101', awaySource: 'm102', dateUtc: '2026-07-19T15:00:00Z' },
}

const LEFT_ROUNDS = [
  { id: 'r32', label: '16avos', date: '28 Jun - 3 Jul', ids: ['m73', 'm75', 'm74', 'm77', 'm83', 'm84', 'm81', 'm82'] },
  { id: 'r16', label: 'Octavos', date: '5 - 7 Jul', ids: ['m89', 'm90', 'm93', 'm94'] },
  { id: 'qf', label: 'Cuartos', date: '10 Jul', ids: ['m97', 'm98'] },
  { id: 'sf', label: 'Semifinal', date: '14 Jul', ids: ['m101'] },
]

const RIGHT_ROUNDS = [
  { id: 'r32', label: '16avos', date: '30 Jun - 4 Jul', ids: ['m76', 'm78', 'm79', 'm80', 'm86', 'm88', 'm85', 'm87'] },
  { id: 'r16', label: 'Octavos', date: '6 - 8 Jul', ids: ['m91', 'm92', 'm95', 'm96'] },
  { id: 'qf', label: 'Cuartos', date: '11 Jul', ids: ['m99', 'm100'] },
  { id: 'sf', label: 'Semifinal', date: '15 Jul', ids: ['m102'] },
]

export const DEMO_RESULTS = {
  m73: { l: 2, v: 1, winner: 'A2' },
  m74: { l: 2, v: 0, winner: 'C1' },
  m75: { l: 1, v: 2, winner: '3ABCDF' },
  m76: { l: 3, v: 1, winner: 'F1' },
  m77: { l: 2, v: 1, winner: 'E2' },
  m78: { l: 1, v: 0, winner: 'I1' },
  m79: { l: 2, v: 0, winner: 'A1' },
  m80: { l: 1, v: 1, winner: 'L1', penalties: '5-4' },
  m81: { l: 2, v: 0, winner: 'G1' },
  m82: { l: 2, v: 1, winner: 'K2' },
  m83: { l: 0, v: 1, winner: '3BEFIJ' },
  m84: { l: 2, v: 0, winner: 'B1' },
  m85: { l: 1, v: 0, winner: 'K1' },
  m86: { l: 2, v: 1, winner: 'J1' },
  m87: { l: 1, v: 2, winner: 'G2' },
  m88: { l: 1, v: 3, winner: 'H1' },
  m89: { l: 2, v: 1, winner: 'A2' },
  m90: { l: 1, v: 2, winner: 'E2' },
  m91: { l: 2, v: 0, winner: 'F1' },
  m92: { l: 1, v: 2, winner: 'A1' },
  m93: { l: 1, v: 2, winner: 'B1' },
  m94: { l: 2, v: 1, winner: 'G1' },
  m95: { l: 1, v: 0, winner: 'J1' },
  m96: { l: 0, v: 1, winner: 'G2' },
  m97: { l: 1, v: 2, winner: 'E2' },
  m98: { l: 1, v: 0, winner: 'B1' },
  m99: { l: 1, v: 2, winner: 'A1' },
  m100: { l: 0, v: 2, winner: 'J1' },
  m101: { l: 2, v: 1, winner: 'E2' },
  m102: { l: 1, v: 2, winner: 'J1' },
  m103: { l: 2, v: 0, winner: 'A1' },
  m104: { l: 1, v: 2, winner: 'J1' },
}

export const DEMO_PREDICTIONS = Object.fromEntries(
  Object.entries(DEMO_RESULTS).map(([key, result], index) => [key, {
    l: index % 5 === 0 ? Math.max(0, result.l - 1) : result.l,
    v: result.v,
    winner: result.winner,
  }])
)

export function getKnockoutDeadline(matchId) {
  const dateUtc = KNOCKOUT_MATCHES[matchId]?.dateUtc
  if (!dateUtc) return null
  return new Date(new Date(dateUtc).getTime() - 15 * 60 * 1000)
}

export function isKnockoutMatchOpen(matchId, now = new Date()) {
  const deadline = getKnockoutDeadline(matchId)
  return deadline ? now < deadline : true
}

export function getKnockoutDeadlineText(matchId) {
  const deadline = getKnockoutDeadline(matchId)
  if (!deadline) return 'Sin cierre'
  return deadline.toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function displaySlot(slot) {
  if (!slot) return 'Por definir'
  if (/^[A-L][12]$/.test(slot)) return `${slot[1]}.º Grupo ${slot[0]}`
  if (/^3[A-L]+$/.test(slot)) return `3.º ${slot.slice(1).split('').join(' / ')}`
  return slot
}

export function slotBadge(slot) {
  if (!slot) return '?'
  if (/^3[A-L]+$/.test(slot)) return '3.º'
  return slot
}

function baseMatch(matchId) {
  const match = KNOCKOUT_MATCHES[matchId]
  return { id: matchId, home: match?.home || null, away: match?.away || null }
}

function winnerOf(match, source) {
  const winner = source[match.id]?.winner
  return winner === match.home || winner === match.away ? winner : null
}

function loserOf(match, source) {
  const winner = winnerOf(match, source)
  if (!winner) return null
  return winner === match.home ? match.away : match.home
}

function matchFromSource(matchId, source, built) {
  const match = KNOCKOUT_MATCHES[matchId]
  if (match.home && match.away) return baseMatch(matchId)
  const homeMatch = built[match.homeSource]
  const awayMatch = built[match.awaySource]
  const homeLoserMatch = built[match.homeLoserSource]
  const awayLoserMatch = built[match.awayLoserSource]
  return {
    id: matchId,
    home: homeLoserMatch ? loserOf(homeLoserMatch, source) : homeMatch ? winnerOf(homeMatch, source) : null,
    away: awayLoserMatch ? loserOf(awayLoserMatch, source) : awayMatch ? winnerOf(awayMatch, source) : null,
  }
}

function buildRounds(roundDefinitions, source, built) {
  return roundDefinitions.map(round => {
    const matches = round.ids.map(id => {
      const match = matchFromSource(id, source, built)
      built[id] = match
      return match
    })
    return { ...round, matches }
  })
}

export function buildKnockoutBracket(source = {}) {
  const built = {}
  const left = buildRounds(LEFT_ROUNDS, source, built)
  const right = buildRounds(RIGHT_ROUNDS, source, built)
  const thirdPlace = matchFromSource('m103', source, built)
  const final = matchFromSource('m104', source, built)
  built.m103 = thirdPlace
  built.m104 = final
  return { left, right, final, thirdPlace }
}

export function scoreKnockoutPrediction(prediction, result) {
  if (!prediction || !result) return { pts: 0, exact: false, qualified: false }
  const exact = prediction.l === result.l && prediction.v === result.v
  const qualified = prediction.winner === result.winner
  return {
    exact,
    qualified,
    pts: (exact ? KNOCKOUT_SCORING.exactScore : 0) +
      (qualified ? KNOCKOUT_SCORING.qualifiedTeam : 0),
  }
}
