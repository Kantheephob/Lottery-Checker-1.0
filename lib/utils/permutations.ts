/**
 * Generate all unique permutations of a number string
 * For example: "123" -> ["123", "132", "213", "231", "312", "321"]
 */
export function generatePermutations(numStr: string): string[] {
  if (numStr.length !== 3) {
    return [numStr]
  }

  const digits = numStr.split("")
  const permutations = new Set<string>()

  function permute(arr: string[], index: number): void {
    if (index === arr.length - 1) {
      permutations.add(arr.join(""))
      return
    }

    for (let i = index; i < arr.length; i++) {
      // swap
      ;[arr[index], arr[i]] = [arr[i], arr[index]]

      permute(arr, index + 1)

      // swap back (🔥 จุดที่พังเดิม)
      ;[arr[index], arr[i]] = [arr[i], arr[index]]
    }
  }

  permute(digits, 0)
  return Array.from(permutations).sort()
}

/**
 * Get the canonical (sorted) form of a number for grouping permutations
 * For example: "123", "132", "213" all return "123"
 */
export function getCanonicalForm(numStr: string): string {
  return numStr.split("").sort().join("")
}

/**
 * Check if two numbers are permutations of each other
 */
export function arePermutations(num1: string, num2: string): boolean {
  return getCanonicalForm(num1) === getCanonicalForm(num2)
}
