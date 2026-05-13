/**
 * 2次元配列の縦横変換（転置）
 * 行数が異なる場合は空文字で埋める
 */
export function transpose(data: string[][]): string[][] {
  if (data.length === 0) return []

  const maxCols = Math.max(...data.map(row => row.length))
  const result: string[][] = []

  for (let col = 0; col < maxCols; col++) {
    const newRow: string[] = []
    for (let row = 0; row < data.length; row++) {
      newRow.push(data[row][col] ?? '')
    }
    result.push(newRow)
  }

  return result
}

/**
 * 2次元配列の上下反転（行の順序を逆転）
 */
export function flipVertical(data: string[][]): string[][] {
  return [...data].reverse()
}

/**
 * 2次元配列の左右反転（列の順序を逆転）
 */
export function flipHorizontal(data: string[][]): string[][] {
  return data.map(row => [...row].reverse())
}
