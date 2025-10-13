// src/components/ColorContrastAudit.tsx

import React, { useState, useEffect } from 'react'
import { 
  auditColorContrast, 
  checkTailwindContrast, 
  checkContrast,
  generateAccessibleColors,
  colorCombinations,
  type ColorContrastResult 
} from '../utils/colorContrast'

interface ContrastTest {
  name: string
  textClass: string
  bgClass: string
  fontSize?: 'normal' | 'large'
  result: ColorContrastResult
}

interface AuditResults {
  passed: number
  failed: number
  total: number
  tests: ContrastTest[]
}

const ColorContrastAudit: React.FC = () => {
  const [auditResults, setAuditResults] = useState<AuditResults | null>(null)
  const [customTest, setCustomTest] = useState({
    foreground: '#000000',
    background: '#FFFFFF',
    fontSize: 'normal' as 'normal' | 'large'
  })
  const [customResult, setCustomResult] = useState<ColorContrastResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  // Common color combinations to test
  const commonCombinations: ContrastTest[] = [
    // Text on white backgrounds
    { name: 'Black text on white', textClass: 'text-black', bgClass: 'bg-white', result: checkTailwindContrast('text-black', 'bg-white') },
    { name: 'Gray-900 text on white', textClass: 'text-gray-900', bgClass: 'bg-white', result: checkTailwindContrast('text-gray-900', 'bg-white') },
    { name: 'Gray-700 text on white', textClass: 'text-gray-700', bgClass: 'bg-white', result: checkTailwindContrast('text-gray-700', 'bg-white') },
    { name: 'Gray-600 text on white', textClass: 'text-gray-600', bgClass: 'bg-white', result: checkTailwindContrast('text-gray-600', 'bg-white') },
    { name: 'Gray-500 text on white', textClass: 'text-gray-500', bgClass: 'bg-white', result: checkTailwindContrast('text-gray-500', 'bg-white') },
    
    // Text on dark backgrounds
    { name: 'White text on gray-900', textClass: 'text-white', bgClass: 'bg-gray-900', result: checkTailwindContrast('text-white', 'bg-gray-900') },
    { name: 'White text on gray-800', textClass: 'text-white', bgClass: 'bg-gray-800', result: checkTailwindContrast('text-white', 'bg-gray-800') },
    { name: 'Gray-100 text on gray-900', textClass: 'text-gray-100', bgClass: 'bg-gray-900', result: checkTailwindContrast('text-gray-100', 'bg-gray-900') },
    { name: 'Gray-200 text on gray-800', textClass: 'text-gray-200', bgClass: 'bg-gray-800', result: checkTailwindContrast('text-gray-200', 'bg-gray-800') },
    
    // Brand colors
    { name: 'White text on blue-600', textClass: 'text-white', bgClass: 'bg-blue-600', result: checkTailwindContrast('text-white', 'bg-blue-600') },
    { name: 'White text on blue-500', textClass: 'text-white', bgClass: 'bg-blue-500', result: checkTailwindContrast('text-white', 'bg-blue-500') },
    { name: 'White text on green-600', textClass: 'text-white', bgClass: 'bg-green-600', result: checkTailwindContrast('text-white', 'bg-green-600') },
    { name: 'White text on red-600', textClass: 'text-white', bgClass: 'bg-red-600', result: checkTailwindContrast('text-white', 'bg-red-600') },
    
    // Priority colors
    { name: 'White text on red-600 (Urgent)', textClass: 'text-white', bgClass: 'bg-red-600', result: checkTailwindContrast('text-white', 'bg-red-600') },
    { name: 'White text on orange-600 (High)', textClass: 'text-white', bgClass: 'bg-orange-600', result: checkTailwindContrast('text-white', 'bg-orange-600') },
    { name: 'White text on yellow-500 (Medium)', textClass: 'text-white', bgClass: 'bg-yellow-500', result: checkTailwindContrast('text-white', 'bg-yellow-500') },
    { name: 'Black text on yellow-500 (Medium)', textClass: 'text-black', bgClass: 'bg-yellow-500', result: checkTailwindContrast('text-black', 'bg-yellow-500') },
    { name: 'White text on green-600 (Low)', textClass: 'text-white', bgClass: 'bg-green-600', result: checkTailwindContrast('text-white', 'bg-green-600') },
    
    // Form elements
    { name: 'Gray-900 text on gray-100', textClass: 'text-gray-900', bgClass: 'bg-gray-100', result: checkTailwindContrast('text-gray-900', 'bg-gray-100') },
    { name: 'Gray-700 text on gray-200', textClass: 'text-gray-700', bgClass: 'bg-gray-200', result: checkTailwindContrast('text-gray-700', 'bg-gray-200') },
    { name: 'Gray-500 text on white (placeholder)', textClass: 'text-gray-500', bgClass: 'bg-white', result: checkTailwindContrast('text-gray-500', 'bg-white') },
    
    // Large text tests
    { name: 'Gray-600 text on white (large)', textClass: 'text-gray-600', bgClass: 'bg-white', fontSize: 'large', result: checkTailwindContrast('text-gray-600', 'bg-white', 'large') },
    { name: 'Gray-500 text on white (large)', textClass: 'text-gray-500', bgClass: 'bg-white', fontSize: 'large', result: checkTailwindContrast('text-gray-500', 'bg-white', 'large') },
  ]

  const runAudit = () => {
    setIsRunning(true)
    
    // Simulate audit processing
    setTimeout(() => {
      const tests = commonCombinations.map(combo => ({
        ...combo,
        result: combo.fontSize === 'large' 
          ? checkTailwindContrast(combo.textClass, combo.bgClass, 'large')
          : checkTailwindContrast(combo.textClass, combo.bgClass)
      }))
      
      const passed = tests.filter(test => test.result.passesAA).length
      const failed = tests.filter(test => !test.result.passesAA).length
      
      setAuditResults({
        passed,
        failed,
        total: tests.length,
        tests
      })
      setIsRunning(false)
    }, 1000)
  }

  const testCustomColors = () => {
    const result = checkContrast(customTest.foreground, customTest.background, customTest.fontSize)
    setCustomResult(result)
  }

  const getStatusColor = (result: ColorContrastResult) => {
    if (result.passesAAA) return 'text-green-600 bg-green-100'
    if (result.passesAA) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getStatusText = (result: ColorContrastResult) => {
    if (result.passesAAA) return 'AAA'
    if (result.passesAA) return 'AA'
    return 'FAIL'
  }

  useEffect(() => {
    testCustomColors()
  }, [customTest])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Color Contrast Audit
        </h1>
        <p className="text-gray-600">
          WCAG AA Compliance Testing for Accessibility
        </p>
      </div>

      {/* Custom Color Tester */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Custom Color Tester
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Foreground Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={customTest.foreground}
                onChange={(e) => setCustomTest(prev => ({ ...prev, foreground: e.target.value }))}
                className="w-12 h-10 rounded border"
              />
              <input
                type="text"
                value={customTest.foreground}
                onChange={(e) => setCustomTest(prev => ({ ...prev, foreground: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Background Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={customTest.background}
                onChange={(e) => setCustomTest(prev => ({ ...prev, background: e.target.value }))}
                className="w-12 h-10 rounded border"
              />
              <input
                type="text"
                value={customTest.background}
                onChange={(e) => setCustomTest(prev => ({ ...prev, background: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Font Size
            </label>
            <select
              value={customTest.fontSize}
              onChange={(e) => setCustomTest(prev => ({ ...prev, fontSize: e.target.value as 'normal' | 'large' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="normal">Normal (4.5:1 required)</option>
              <option value="large">Large (3:1 required)</option>
            </select>
          </div>
        </div>
        
        {/* Preview */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preview
          </label>
          <div 
            className="p-4 rounded-lg border"
            style={{ backgroundColor: customTest.background }}
          >
            <p 
              className="text-lg font-medium"
              style={{ color: customTest.foreground }}
            >
              Sample text with your color combination
            </p>
            <p 
              className="text-sm"
              style={{ color: customTest.foreground }}
            >
              Smaller text to test readability
            </p>
          </div>
        </div>

        {/* Result */}
        {customResult && (
          <div className={`p-4 rounded-lg ${getStatusColor(customResult)}`}>
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold">Contrast Ratio: {customResult.ratio}:1</span>
                <span className="ml-2 text-sm">
                  ({customTest.fontSize === 'large' ? 'Large text' : 'Normal text'})
                </span>
              </div>
              <span className="font-bold text-lg">
                {getStatusText(customResult)}
              </span>
            </div>
            {!customResult.passesAA && (
              <p className="mt-2 text-sm">
                This combination does not meet WCAG AA standards. 
                {customTest.fontSize === 'normal' && ' Consider using larger text or improving contrast.'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Audit Button */}
      <div className="text-center">
        <button
          onClick={runAudit}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          {isRunning ? 'Running Audit...' : 'Run Full Color Audit'}
        </button>
      </div>

      {/* Audit Results */}
      {auditResults && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Audit Results
            </h2>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600 font-semibold">
                ✅ {auditResults.passed} Passed
              </span>
              <span className="text-red-600 font-semibold">
                ❌ {auditResults.failed} Failed
              </span>
              <span className="text-gray-600">
                Total: {auditResults.total}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {auditResults.tests.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(test.result)}`}>
                    {getStatusText(test.result)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{test.name}</div>
                    <div className="text-sm text-gray-500">
                      {test.textClass} on {test.bgClass}
                      {test.fontSize === 'large' && ' (Large text)'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {test.result.ratio}:1
                  </div>
                  {test.fontSize === 'large' && (
                    <div className="text-xs text-gray-500">Large text</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {auditResults.failed > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">
                Recommendations for Failed Tests:
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Use darker text colors on light backgrounds</li>
                <li>• Use lighter text colors on dark backgrounds</li>
                <li>• Consider using larger font sizes for better readability</li>
                <li>• Test with color blindness simulators</li>
                <li>• Ensure sufficient contrast in all UI states (hover, focus, disabled)</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* WCAG Guidelines */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          WCAG AA Guidelines
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Normal Text</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Minimum contrast ratio: 4.5:1</li>
              <li>• Applies to text smaller than 18pt</li>
              <li>• Applies to text smaller than 14pt bold</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Large Text</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Minimum contrast ratio: 3:1</li>
              <li>• Applies to text 18pt and larger</li>
              <li>• Applies to text 14pt bold and larger</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ColorContrastAudit
