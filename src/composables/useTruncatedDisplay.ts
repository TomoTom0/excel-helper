import { computed } from 'vue'
import type { Ref } from 'vue'

export function useTruncatedDisplay(fullResult: Ref<string>, maxDisplayLength = 10000) {
  const displayResult = computed(() => {
    if (fullResult.value.length <= maxDisplayLength) {
      return fullResult.value
    }

    const lines = fullResult.value.split('\n')
    const totalLines = lines.length
    const totalChars = fullResult.value.length

    let displayText = ''
    let charCount = 0
    let displayLines = 0

    for (const line of lines) {
      if (charCount + line.length + 1 > maxDisplayLength) break
      displayText += line + '\n'
      charCount += line.length + 1
      displayLines++
    }

    displayText += `\n... 以降省略（全体: ${totalLines}行、${totalChars.toLocaleString()}文字）\n`
    displayText += '※ダウンロードボタンで完全なデータを取得できます'

    return displayText
  })

  return {
    displayResult,
  }
}
