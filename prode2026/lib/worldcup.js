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

export const GROUPS = {
  A:{teams:['México','Corea del Sur','Sudáfrica','Rep. Checa'],
    matches:[['México','Sudáfrica','11 Jun'],['Corea del Sur','Rep. Checa','11 Jun'],['Rep. Checa','Sudáfrica','18 Jun'],['México','Corea del Sur','18 Jun'],['Rep. Checa','México','24 Jun'],['Sudáfrica','Corea del Sur','24 Jun']]},
  B:{teams:['Canadá','Suiza','Qatar','Bosnia y Herz.'],
    matches:[['Canadá','Bosnia y Herz.','12 Jun'],['Qatar','Suiza','13 Jun'],['Suiza','Bosnia y Herz.','18 Jun'],['Canadá','Qatar','18 Jun'],['Suiza','Canadá','24 Jun'],['Bosnia y Herz.','Qatar','24 Jun']]},
  C:{teams:['Brasil','Marruecos','Escocia','Haití'],
    matches:[['Brasil','Marruecos','13 Jun'],['Haití','Escocia','13 Jun'],['Escocia','Marruecos','19 Jun'],['Brasil','Haití','19 Jun'],['Escocia','Brasil','24 Jun'],['Marruecos','Haití','24 Jun']]},
  D:{teams:['Estados Unidos','Australia','Paraguay','Turquía'],
    matches:[['Estados Unidos','Paraguay','12 Jun'],['Australia','Turquía','13 Jun'],['Turquía','Paraguay','19 Jun'],['Estados Unidos','Australia','19 Jun'],['Turquía','Estados Unidos','25 Jun'],['Paraguay','Australia','25 Jun']]},
  E:{teams:['Alemania','Ecuador','Costa de Marfil','Curazao'],
    matches:[['Alemania','Curazao','14 Jun'],['Costa de Marfil','Ecuador','14 Jun'],['Alemania','Costa de Marfil','20 Jun'],['Ecuador','Curazao','20 Jun'],['Ecuador','Alemania','25 Jun'],['Curazao','Costa de Marfil','25 Jun']]},
  F:{teams:['Países Bajos','Japón','Túnez','Suecia'],
    matches:[['Países Bajos','Japón','14 Jun'],['Suecia','Túnez','14 Jun'],['Países Bajos','Suecia','20 Jun'],['Túnez','Japón','20 Jun'],['Japón','Suecia','25 Jun'],['Túnez','Países Bajos','25 Jun']]},
  G:{teams:['Bélgica','Irán','Egipto','Nueva Zelanda'],
    matches:[['Irán','Nueva Zelanda','15 Jun'],['Bélgica','Egipto','15 Jun'],['Bélgica','Irán','21 Jun'],['Nueva Zelanda','Egipto','21 Jun'],['Egipto','Irán','26 Jun'],['Nueva Zelanda','Bélgica','26 Jun']]},
  H:{teams:['España','Uruguay','Cabo Verde','Arabia Saudita'],
    matches:[['España','Cabo Verde','15 Jun'],['Arabia Saudita','Uruguay','15 Jun'],['España','Arabia Saudita','21 Jun'],['Uruguay','Cabo Verde','21 Jun'],['Cabo Verde','Arabia Saudita','26 Jun'],['Uruguay','España','26 Jun']]},
  I:{teams:['Francia','Senegal','Noruega','Iraq'],
    matches:[['Francia','Senegal','16 Jun'],['Iraq','Noruega','16 Jun'],['Francia','Iraq','22 Jun'],['Noruega','Senegal','22 Jun'],['Noruega','Francia','26 Jun'],['Senegal','Iraq','26 Jun']]},
  J:{teams:['Argentina','Argelia','Austria','Jordania'],
    matches:[['Argentina','Argelia','16 Jun'],['Austria','Jordania','16 Jun'],['Argentina','Austria','22 Jun'],['Jordania','Argelia','22 Jun'],['Argelia','Austria','27 Jun'],['Jordania','Argentina','27 Jun']]},
  K:{teams:['Portugal','RD del Congo','Uzbekistán','Colombia'],
    matches:[['Portugal','RD del Congo','17 Jun'],['Uzbekistán','Colombia','17 Jun'],['Portugal','Uzbekistán','23 Jun'],['Colombia','RD del Congo','23 Jun'],['Colombia','Portugal','27 Jun'],['RD del Congo','Uzbekistán','27 Jun']]},
  L:{teams:['Inglaterra','Croacia','Ghana','Panamá'],
    matches:[['Inglaterra','Croacia','17 Jun'],['Ghana','Panamá','17 Jun'],['Inglaterra','Ghana','23 Jun'],['Panamá','Croacia','23 Jun'],['Panamá','Inglaterra','27 Jun'],['Croacia','Ghana','27 Jun']]}
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

export function scorePoints(prediction, result) {
  if (!prediction || !result) return { pts: 0, type: null }
  const predWinner = prediction.l > prediction.v ? 'L' : prediction.l < prediction.v ? 'V' : 'E'
  const realWinner = result.l > result.v ? 'L' : result.l < result.v ? 'V' : 'E'
  if (prediction.l === result.l && prediction.v === result.v) return { pts: 3, type: 'pleno' }
  if (predWinner === realWinner) return { pts: 1, type: 'parcial' }
  return { pts: 0, type: 'fallo' }
}
