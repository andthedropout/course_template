import { useEffect, useState, useRef } from 'react'
import { Icon } from '@/components/ui/icon'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

// DON'T import Yoast at module level - we'll dynamically import in useEffect
// to avoid any potential module-level caching issues

// Import Jed for i18n support required by Yoast assessors
import Jed from 'jed'

interface SeoAnalysisProps {
  content: string
  title: string
  metaDescription: string
  focusKeyword: string
  excerpt: string
  onFocusKeywordChange: (value: string) => void
}

interface AssessmentResult {
  score: number
  text: string
  rating: 'good' | 'ok' | 'bad'
}

export function SeoAnalysis({
  content,
  title,
  metaDescription,
  focusKeyword,
  excerpt,
  onFocusKeywordChange,
}: SeoAnalysisProps) {
  const [seoResults, setSeoResults] = useState<AssessmentResult[]>([])
  const [readabilityResults, setReadabilityResults] = useState<AssessmentResult[]>([])
  const [overallSeoScore, setOverallSeoScore] = useState<number>(0)
  const [overallReadabilityScore, setOverallReadabilityScore] = useState<number>(0)
  const lastAnalyzedContentRef = useRef<string>('')

  console.log('🎨 [SeoAnalysis] Component render - PROPS RECEIVED:', {
    contentLength: content?.length,
    contentPreview: content?.substring(0, 100),
    titleLength: title?.length,
    title: title,
    seoScore: overallSeoScore,
    readabilityScore: overallReadabilityScore,
    seoResultsCount: seoResults.length,
    readabilityResultsCount: readabilityResults.length,
  })

  // Debounce analysis to avoid running on every keystroke
  useEffect(() => {
    console.log('🔍 [SEO Analysis] useEffect triggered', {
      contentLength: content?.length || 0,
      titleLength: title?.length || 0,
      hasContent: !!content,
      hasTitle: !!title,
    })

    const timer = setTimeout(async () => {
      console.log('⏰ [SEO Analysis] Timer fired after 1s', {
        contentLength: content?.length || 0,
        contentPreview: content?.substring(0, 50),
      })

      // If no content or title, clear the results
      if (!content || !title) {
        console.log('❌ [SEO Analysis] No content/title - clearing results')
        setSeoResults([])
        setReadabilityResults([])
        setOverallSeoScore(0)
        setOverallReadabilityScore(0)
        return
      }

      // Check if content actually changed
      if (content === lastAnalyzedContentRef.current) {
        console.log('⏭️ [SEO Analysis] Content unchanged, skipping analysis')
        return
      }

      console.log('✅ [SEO Analysis] Running analysis...')
      console.log('🔄 [SEO Analysis] Content CHANGED:', {
        oldLength: lastAnalyzedContentRef.current?.length || 0,
        newLength: content?.length || 0,
        oldPreview: lastAnalyzedContentRef.current?.substring(0, 30),
        newPreview: content?.substring(0, 30),
      })

      try {
        // Store the content we're analyzing
        lastAnalyzedContentRef.current = content

        // CRITICAL: Dynamically import Yoast components FRESH each time
        const { Paper, ContentAssessor, SeoAssessor } = await import('yoastseo')
        const ResearcherModule = await import('yoastseo/build/languageProcessing/languages/en/Researcher')
        const Researcher = ResearcherModule.default

        console.log('📦 [SEO Analysis] Yoast modules loaded fresh')

        // Create i18n object required by Yoast assessors
        const i18n = new Jed({
          domain: 'js-text-analysis',
          locale_data: {
            'js-text-analysis': { '': {} }
          }
        })

        console.log('🌐 [SEO Analysis] i18n object created')

        // Create Paper instance for SEO
        // Use metaDescription if provided, otherwise fall back to excerpt
        const seoPaper = new Paper(content, {
          keyword: focusKeyword || '',
          title: title || '',
          description: metaDescription || excerpt || '',
          excerpt: excerpt || '',
          locale: 'en_US',
        })

        console.log('📄 [SEO Analysis] Paper created:', {
          contentLength: seoPaper.getText()?.length,
          contentPreview: seoPaper.getText()?.substring(0, 50),
          fullText: seoPaper.getText(), // Log FULL text to verify
          title: seoPaper.getTitle(),
          hasText: seoPaper.hasText(),
        })

        // Create separate Researcher for SEO (fresh instance each time)
        const seoResearcher = new Researcher(seoPaper)
        console.log('🔬 [SEO Analysis] Researcher created for SEO')

        // Run SEO analysis with FRESH assessor (pass researcher + i18n in options)
        const seoAssessor = new SeoAssessor(seoResearcher, { i18n })
        console.log('⚙️ [SEO Analysis] SeoAssessor created, starting assessment...')

        seoAssessor.assess(seoPaper)
        console.log('✅ [SEO Analysis] Assessment complete, getting results...')

        const seoResults = seoAssessor.getValidResults()
        console.log('📊 [SEO Analysis] Got results, count:', seoResults.length)

        console.log('🔍 [SEO Analysis] Raw SEO results from Yoast:', seoResults.length)
        console.log('🔍 [SEO Analysis] First 3 results in detail:', seoResults.slice(0, 3).map((r, idx) => ({
          index: idx,
          score: r.score,
          identifier: r.identifier || r._identifier || 'unknown',
          text: r.text,
          hasMarks: r.hasMarks,
          marks: r.marks?.length || 0
        })))

        // Run Readability analysis with FRESH assessor AND researcher (prevent cache contamination)
        const readabilityResearcher = new Researcher(seoPaper)
        const contentAssessor = new ContentAssessor(readabilityResearcher, { i18n })
        contentAssessor.assess(seoPaper)
        const readabilityResults = contentAssessor.getValidResults()

        console.log('📖 [SEO Analysis] Raw Readability results from Yoast:', readabilityResults.length)

        // Filter out -999 scores (Yoast uses -999 for "not applicable")
        const validSeoResults = seoResults.filter((r: any) => r.score !== -999)
        const validReadabilityResults = readabilityResults.filter((r: any) => r.score !== -999)

        // Convert results
        const seoAssessments: AssessmentResult[] = seoResults.map((result: any) => ({
          score: result.score,
          text: result.text,
          rating: result.score > 6 ? 'good' : result.score > 4 ? 'ok' : 'bad',
        }))

        const readabilityAssessments: AssessmentResult[] = readabilityResults.map((result: any) => ({
          score: result.score,
          text: result.text,
          rating: result.score > 6 ? 'good' : result.score > 4 ? 'ok' : 'bad',
        }))

        // Calculate overall scores - Filter out -999 "not applicable" scores
        const seoScore = validSeoResults.length > 0
          ? validSeoResults.reduce((sum: number, r: any) => sum + r.score, 0) / validSeoResults.length
          : 0
        const readabilityScore = validReadabilityResults.length > 0
          ? validReadabilityResults.reduce((sum: number, r: any) => sum + r.score, 0) / validReadabilityResults.length
          : 0

        console.log('📊 [SEO Analysis] Analysis complete', {
          seoScore,
          readabilityScore,
          seoChecks: seoAssessments.length,
          readabilityChecks: readabilityAssessments.length,
        })

        console.log('🔄 [SEO Analysis] Setting state...', {
          beforeSeoScore: overallSeoScore,
          afterSeoScore: seoScore,
          beforeReadabilityScore: overallReadabilityScore,
          afterReadabilityScore: readabilityScore,
        })

        console.log('📝 [SEO Analysis] New SEO results sample:', seoAssessments.slice(0, 2).map(r => r.text.substring(0, 80)))
        console.log('📖 [SEO Analysis] New Readability results sample:', readabilityAssessments.slice(0, 2).map(r => r.text.substring(0, 80)))

        setSeoResults(seoAssessments)
        setReadabilityResults(readabilityAssessments)
        setOverallSeoScore(seoScore)
        setOverallReadabilityScore(readabilityScore)

        console.log('✅ [SEO Analysis] State set calls completed')

        // Force log current state after setState
        setTimeout(() => {
          console.log('🔍 [SEO Analysis] State after update (in next tick):', {
            seoResultsLength: seoResults.length,
            readabilityResultsLength: readabilityResults.length,
            currentSeoScore: overallSeoScore,
            currentReadabilityScore: overallReadabilityScore,
          })
        }, 0)
      } catch (error) {
        console.error('❗ [SEO Analysis] Error:', error)
      }
    }, 1000) // Debounce 1 second

    return () => {
      console.log('🧹 [SEO Analysis] Cleanup - clearing timer')
      clearTimeout(timer)
    }
  }, [content, title, metaDescription, focusKeyword, excerpt])

  // Overall score display
  const getScoreColor = (score: number) => {
    if (score > 6) return 'text-green-600 dark:text-green-400'
    if (score > 4) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreIcon = (score: number) => {
    if (score > 6) return 'CheckCircle'
    if (score > 4) return 'AlertCircle'
    return 'XCircle'
  }

  const getScoreLabel = (score: number) => {
    if (score > 6) return 'Good'
    if (score > 4) return 'Needs Improvement'
    return 'Poor'
  }

  const getRatingIcon = (rating: string) => {
    if (rating === 'good') return 'CheckCircle'
    if (rating === 'ok') return 'AlertCircle'
    return 'XCircle'
  }

  const getRatingColor = (rating: string) => {
    if (rating === 'good') return 'text-green-600 dark:text-green-400'
    if (rating === 'ok') return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  if (!content && !title) {
    return (
      <div className="text-center text-muted-foreground text-sm py-8">
        <Icon name="FileSearch" className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Start writing to see SEO analysis</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Overall Scores - Always visible */}
      <div className="space-y-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon
              name={getScoreIcon(overallSeoScore) as any}
              className={`h-5 w-5 ${getScoreColor(overallSeoScore)}`}
            />
            <span className={`font-semibold ${getScoreColor(overallSeoScore)}`}>
              SEO: {getScoreLabel(overallSeoScore)}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {Math.round(overallSeoScore)}/9
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon
              name={getScoreIcon(overallReadabilityScore) as any}
              className={`h-5 w-5 ${getScoreColor(overallReadabilityScore)}`}
            />
            <span className="text-sm font-medium">Readability</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {Math.round(overallReadabilityScore)}/9
          </span>
        </div>
      </div>

      {/* Focus Keyword Input */}
      <div className="space-y-2">
        <Label htmlFor="focus-keyword" className="text-sm font-medium">
          Focus Keyword
        </Label>
        <Input
          id="focus-keyword"
          type="text"
          placeholder="Enter your target keyword..."
          value={focusKeyword}
          onChange={(e) => onFocusKeywordChange(e.target.value)}
          className="text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Add a focus keyword to get keyword-specific SEO analysis and recommendations
        </p>
      </div>

      {/* Accordion for detailed analysis */}
      <Accordion type="multiple" className="w-full">
        {/* SEO Checks */}
        {seoResults.length > 0 && (
          <AccordionItem value="seo">
            <AccordionTrigger className="text-sm font-semibold">
              SEO Analysis ({seoResults.length} checks)
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {seoResults.map((result, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Icon
                      name={getRatingIcon(result.rating) as any}
                      className={`h-4 w-4 mt-0.5 flex-shrink-0 ${getRatingColor(result.rating)}`}
                    />
                    <div
                      className="flex-1 text-foreground/80"
                      dangerouslySetInnerHTML={{ __html: result.text }}
                    />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Readability Checks */}
        {readabilityResults.length > 0 && (
          <AccordionItem value="readability">
            <AccordionTrigger className="text-sm font-semibold">
              Readability Analysis ({readabilityResults.length} checks)
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {readabilityResults.map((result, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Icon
                      name={getRatingIcon(result.rating) as any}
                      className={`h-4 w-4 mt-0.5 flex-shrink-0 ${getRatingColor(result.rating)}`}
                    />
                    <div
                      className="flex-1 text-foreground/80"
                      dangerouslySetInnerHTML={{ __html: result.text }}
                    />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  )
}
