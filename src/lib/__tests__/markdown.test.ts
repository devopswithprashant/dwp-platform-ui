import { preserveExtraBlankLines } from '../markdown'

describe('Markdown Utilities', () => {
  describe('preserveExtraBlankLines', () => {
    it('should not modify markdown with single blank lines', () => {
      const input = 'Line 1\n\nLine 2\n\nLine 3'
      const result = preserveExtraBlankLines(input)
      expect(result).toBe(input)
    })

    it('should convert triple newlines to paragraph with NBSP', () => {
      const input = 'Line 1\n\n\nLine 2'
      const result = preserveExtraBlankLines(input)
      expect(result).toContain('\u00A0\n\n')
    })

    it('should handle multiple extra blank lines', () => {
      const input = 'Line 1\n\n\n\n\nLine 2'
      const result = preserveExtraBlankLines(input)
      // Should have 3 extra newline sequences (5 total - 2 for first blank line = 3 extra)
      const nbspCount = (result.match(/\u00A0/g) || []).length
      expect(nbspCount).toBe(3)
    })

    it('should handle markdown with code blocks', () => {
      const input = '```\ncode\n```\n\n\nMore text'
      const result = preserveExtraBlankLines(input)
      expect(result).toContain('```')
      expect(result).toContain('\u00A0\n\n')
    })

    it('should preserve existing structure while adding NBSPs', () => {
      const input = 'Para 1\n\n\nPara 2\n\nPara 3'
      const result = preserveExtraBlankLines(input)
      expect(result).toContain('Para 1')
      expect(result).toContain('Para 2')
      expect(result).toContain('Para 3')
    })

    it('should handle empty string', () => {
      const input = ''
      const result = preserveExtraBlankLines(input)
      expect(result).toBe('')
    })

    it('should handle string with only newlines', () => {
      const input = '\n\n\n'
      const result = preserveExtraBlankLines(input)
      expect(result).toContain('\u00A0')
    })

    it('should handle four consecutive newlines', () => {
      const input = 'Start\n\n\n\nEnd'
      const result = preserveExtraBlankLines(input)
      const nbspCount = (result.match(/\u00A0/g) || []).length
      expect(nbspCount).toBe(2) // 4 newlines - 2 = 2 extra
    })

    it('should not add NBSP for exactly two newlines', () => {
      const input = 'Line 1\n\nLine 2'
      const result = preserveExtraBlankLines(input)
      expect(result).not.toContain('\u00A0')
    })
  })
})
