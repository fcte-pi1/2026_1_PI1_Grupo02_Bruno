import api from './api.js'

export default function getCorridas(){
    return api.get('/corridas')
}

export function getCorridaTrajeto(corridaId) {
  return api.get(`/corridas/${corridaId}/trajeto`)
}

export function getLabirintos() {
  return api.get('/labirintos')
}