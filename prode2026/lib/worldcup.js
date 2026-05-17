export const COUNTRY_CODES = {
  'México':'mx','Corea del Sur':'kr','Sudáfrica':'za','Rep. Checa':'cz',
  'Canadá':'ca','Suiza':'ch','Qatar':'qa','Bosnia y Herz.':'ba',
  'Brasil':'br','Marruecos':'ma','Escocia':'gb-sct','Haití':'ht',
  'Estados Unidos':'us','Australia':'au','Paraguay':'py','Turquía':'tr',
  'Alemania':'de','Ecuador':'ec','Costa de Marfil':'ci','Curazao':'cw',
  'Países Bajos':'nl','Japón':'jp','Túnez':'tn','Suecia':'se',
  'Bélgica':'be','Irán':'ir','Egipto':'eg','Nueva Zelanda':'nz',
  'España':'es','Uruguay':'uy','Cabo Verde':'cv','Arabia Saudita':'sa',
  'Francia':'fr','Senegal':'sn','Noruega':'no','Iraq':'iq',
  'Argentina':'ar','Argelia':'dz','Austria':'at','Jordania':'jo',
  'Portugal':'pt','RD del Congo':'cd','Uzbekistán':'uz','Colombia':'co',
  'Inglaterra':'gb-eng','Croacia':'hr','Ghana':'gh','Panamá':'pa'
}

// Deadlines hora Argentina (UTC-3)
// Fecha 1: 11 Jun 15:30 ARG = 18:30 UTC
// Fecha 2: 18 Jun 12:30 ARG = 15:30 UTC  
// Fecha 3: 24 Jun 15:30 ARG = 18:30 UTC
export const PHASE_DEADLINES = {
  f1: new Date('2026-06-11T18:30:00Z'), // Fecha 1
  f2: new Date('2026-06-18T15:30:00Z'), // Fecha 2
  f3: new Date('2026-06-24T18:30:00Z'), // Fecha 3
}

export function isPhaseOpen(phase) {
  return new Date() < PHASE_DEADLINES[phase]
}

export function getPhaseLabel(phase) {
  if (phase === 'f1') return 'Fecha 1'
  if (phase === 'f2') return 'Fecha 2'
  if (phase === 'f3') return 'Fecha 3'
  return ''
}

export function getDeadlineText(phase) {
  if (phase === 'f1') return 'Miércoles 11 de Junio — 15:30hs'
  if (phase === 'f2') return 'Miércoles 18 de Junio — 12:30hs'
  if (phase === 'f3') return 'Miércoles 24 de Junio — 15:30hs'
  return ''
}

// Match keys per phase — cada grupo tiene 6 partidos (0-5)
// Fecha 1: partidos 0 y 1 de cada grupo
// Fecha 2: partidos 2 y 3 de cada grupo
// Fecha 3: partidos 4 y 5 de cada grupo
export const F1_MATCHES = [
  'A0','A1','B0','B1','C0','C1','D0','D1',
  'E0','E1','F0','F1','G0','G1','H0','H1',
  'I0','I1','J0','J1','K0','K1','L0','L1',
]
export const F2_MATCHES = [
  'A2','A3','B2','B3','C2','C3','D2','D3',
  'E2','E3','F2','F3','G2','G3','H2','H3',
  'I2','I3','J2','J3','K2','K3','L2','L3',
]
export const F3_MATCHES = [
  'A4','A5','B4','B5','C4','C5','D4','D5',
  'E4','E5','F4','F5','G4','G5','H4','H5',
  'I4','I5','J4','J5','K4','K5','L4','L5',
]

export const PHASE_MATCHES = { f1: F1_MATCHES, f2: F2_MATCHES, f3: F3_MATCHES }
// Keep backward compat
export const EARLY_MATCHES = [...F1_MATCHES, ...F2_MATCHES]
export const LATE_MATCHES = F3_MATCHES

export const GROUPS = {
  A:{teams:['México','Corea del Sur','Sudáfrica','Rep. Checa'],
    matches:[['México','Sudáfrica','11 Jun 16:00'],['Corea del Sur','Rep. Checa','11 Jun 23:00'],['Rep. Checa','Sudáfrica','18 Jun 13:00'],['México','Corea del Sur','18 Jun 22:00'],['Rep. Checa','México','24 Jun 16:00'],['Sudáfrica','Corea del Sur','24 Jun 16:00']]},
  B:{teams:['Canadá','Suiza','Qatar','Bosnia y Herz.'],
    matches:[['Canadá','Bosnia y Herz.','12 Jun 16:00'],['Qatar','Suiza','13 Jun 16:00'],['Suiza','Bosnia y Herz.','18 Jun 16:00'],['Canadá','Qatar','18 Jun 19:00'],['Suiza','Canadá','24 Jun 16:00'],['Bosnia y Herz.','Qatar','24 Jun 16:00']]},
  C:{teams:['Brasil','Marruecos','Escocia','Haití'],
    matches:[['Brasil','Marruecos','13 Jun 19:00'],['Haití','Escocia','13 Jun 22:00'],['Escocia','Marruecos','19 Jun 19:00'],['Brasil','Haití','19 Jun 22:00'],['Escocia','Brasil','25 Jun'],['Marruecos','Haití','25 Jun']]},
  D:{teams:['Estados Unidos','Australia','Paraguay','Turquía'],
    matches:[['Estados Unidos','Paraguay','12 Jun 22:00'],['Australia','Turquía','13 Jun 01:00'],['Turquía','Paraguay','19 Jun 01:00'],['Estados Unidos','Australia','19 Jun 16:00'],['Turquía','Estados Unidos','25 Jun'],['Paraguay','Australia','25 Jun']]},
  E:{teams:['Alemania','Ecuador','Costa de Marfil','Curazao'],
    matches:[['Alemania','Curazao','14 Jun 14:00'],['Costa de Marfil','Ecuador','14 Jun 20:00'],['Alemania','Costa de Marfil','20 Jun 17:00'],['Ecuador','Curazao','20 Jun 21:00'],['Ecuador','Alemania','25 Jun'],['Curazao','Costa de Marfil','25 Jun']]},
  F:{teams:['Países Bajos','Japón','Túnez','Suecia'],
    matches:[['Países Bajos','Japón','14 Jun 17:00'],['Suecia','Túnez','14 Jun 23:00'],['Países Bajos','Suecia','20 Jun 14:00'],['Túnez','Japón','20 Jun 01:00'],['Japón','Suecia','25 Jun'],['Túnez','Países Bajos','25 Jun']]},
  G:{teams:['Bélgica','Irán','Egipto','Nueva Zelanda'],
    matches:[['Irán','Nueva Zelanda','15 Jun 22:00'],['Bélgica','Egipto','15 Jun 16:00'],['Bélgica','Irán','21 Jun 16:00'],['Nueva Zelanda','Egipto','21 Jun 22:00'],['Egipto','Irán','26 Jun'],['Nueva Zelanda','Bélgica','26 Jun']]},
  H:{teams:['España','Uruguay','Cabo Verde','Arabia Saudita'],
    matches:[['España','Cabo Verde','15 Jun 13:00'],['Arabia Saudita','Uruguay','15 Jun 19:00'],['España','Arabia Saudita','21 Jun 13:00'],['Uruguay','Cabo Verde','21 Jun 19:00'],['Cabo Verde','Arabia Saudita','26 Jun'],['Uruguay','España','26 Jun']]},
  I:{teams:['Francia','Senegal','Noruega','Iraq'],
    matches:[['Francia','Senegal','16 Jun 16:00'],['Iraq','Noruega','16 Jun 19:00'],['Francia','Iraq','22 Jun 18:00'],['Noruega','Senegal','22 Jun 21:00'],['Noruega','Francia','27 Jun'],['Senegal','Iraq','27 Jun']]},
  J:{teams:['Argentina','Argelia','Austria','Jordania'],
    matches:[['Argentina','Argelia','16 Jun 22:00'],['Austria','Jordania','16 Jun 01:00'],['Argentina','Austria','22 Jun 14:00'],['Jordania','Argelia','22 Jun 00:00'],['Argelia','Austria','27 Jun'],['Jordania','Argentina','27 Jun 23:00']]},
  K:{teams:['Portugal','RD del Congo','Uzbekistán','Colombia'],
    matches:[['Portugal','RD del Congo','17 Jun 14:00'],['Uzbekistán','Colombia','17 Jun 23:00'],['Portugal','Uzbekistán','23 Jun 14:00'],['Colombia','RD del Congo','23 Jun 23:00'],['Colombia','Portugal','27 Jun 20:30'],['RD del Congo','Uzbekistán','27 Jun 20:30']]},
  L:{teams:['Inglaterra','Croacia','Ghana','Panamá'],
    matches:[['Inglaterra','Croacia','17 Jun 17:00'],['Ghana','Panamá','17 Jun 20:00'],['Inglaterra','Ghana','23 Jun 17:00'],['Panamá','Croacia','23 Jun 20:00'],['Panamá','Inglaterra','27 Jun 18:00'],['Croacia','Ghana','27 Jun 18:00']]}
}

export function flagUrl(name) {
  const code = COUNTRY_CODES[name]
  return code ? `https://flagcdn.com/w40/${code}.png` : null
}

export function calcStandings(groupKey, predictions) {
  const group = GROUPS[groupKey]
  const st = {}
  group.teams.forEach(t => st[t] = { pts:0, pj:0, gw:0, emp:0, perd:0, gf:0, gc:0 })
  group.matches.forEach((match, i) => {
    const pr = predictions[groupKey + i]
    if (pr != null) {
      const [lo, vi] = match
      st[lo].pj++; st[vi].pj++
      st[lo].gf += pr.l; st[lo].gc += pr.v
      st[vi].gf += pr.v; st[vi].gc += pr.l
      if (pr.l > pr.v) { st[lo].pts+=3; st[lo].gw++; st[vi].perd++ }
      else if (pr.l < pr.v) { st[vi].pts+=3; st[vi].gw++; st[lo].perd++ }
      else { st[lo].pts++; st[vi].pts++; st[lo].emp++; st[vi].emp++ }
    }
  })
  return group.teams
    .map(t => ({ team: t, ...st[t], dg: st[t].gf - st[t].gc }))
    .sort((a,b) => b.pts-a.pts || b.dg-a.dg || b.gf-a.gf)
}

export function scorePoints(prediction, result, isDouble = false) {
  if (!prediction || !result) return { pts: 0, type: null }
  const predWinner = prediction.l > prediction.v ? 'L' : prediction.l < prediction.v ? 'V' : 'E'
  const realWinner = result.l > result.v ? 'L' : result.l < result.v ? 'V' : 'E'
  let pts = 0, type = 'fallo'
  if (prediction.l === result.l && prediction.v === result.v) { pts = 3; type = 'pleno' }
  else if (predWinner === realWinner) { pts = 1; type = 'parcial' }
  if (isDouble) pts *= 2
  return { pts, type, doubled: isDouble && pts > 0 }
}
