const priorityValue = (game) => {
  const value = Number(game?.game_priority ?? game?.position)
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER
}

export const sortCasinoGamesByPriority = (games = []) => (
  [...games].sort((a, b) => priorityValue(a) - priorityValue(b))
)

export default sortCasinoGamesByPriority
