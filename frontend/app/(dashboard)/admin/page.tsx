"use client"

import { useState } from "react"
import { useUser, useAuth } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, CheckCircle, XCircle, Loader2, AlertTriangle, BookOpen } from "lucide-react"
import { uploadQuestions, Question } from "@/lib/api"

interface ParsedQuestion extends Omit<Question, 'id' | 'created_at'> {
  rowNumber: number;
  errors?: string[];
}

export default function AdminPage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check if user is admin (via Clerk publicMetadata or hardcoded check)
  const isAdmin = user?.publicMetadata?.role === 'admin'

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Access Denied</strong>
            <br />
            You must be an admin to access this page.
            <br />
            <span className="text-xs mt-2 block">
              Current user: {user?.primaryEmailAddress?.emailAddress}
            </span>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setIsLoading(true)
    setUploadResult(null)
    setError(null)

    try {
      // Parse CSV/TSV
      const text = await selectedFile.text()
      const parsed = parseCSV(text)
      setParsedQuestions(parsed)
    } catch (err: any) {
      console.error('Failed to parse file:', err)
      setError(err.message || 'Failed to parse file')
    } finally {
      setIsLoading(false)
    }
  }

  const parseCSV = (csvText: string): ParsedQuestion[] => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('File must contain header row and at least one data row')
    }

    const headers = lines[0].split('\t').map(h => h.trim())
    const questions: ParsedQuestion[] = []

    // Helper to get column index
    const getCol = (name: string) => {
      const idx = headers.findIndex(h => h.toLowerCase() === name.toLowerCase())
      return idx
    }

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      const values = lines[i].split('\t').map(v => v.trim())
      const errors: string[] = []

      // Extract and validate fields
      const domainStr = values[getCol('Domain')]
      const domain = parseInt(domainStr?.replace(/Domain\s*/i, '') || '0')
      
      if (!domain || domain < 1 || domain > 5) {
        errors.push('Invalid domain (must be 1-5)')
      }

      const q_text = values[getCol('Question')]
      if (!q_text || q_text.length < 10) {
        errors.push('Question text too short (min 10 chars)')
      }

      const choice_a = values[getCol('Option A')]
      const choice_b = values[getCol('Option B')]
      const choice_c = values[getCol('Option C')]
      const choice_d = values[getCol('Option D')]
      
      if (!choice_a || !choice_b || !choice_c || !choice_d) {
        errors.push('All 4 options (A-D) are required')
      }

      const answer = values[getCol('Answer')]?.toUpperCase()
      if (!['A', 'B', 'C', 'D'].includes(answer)) {
        errors.push('Answer must be A, B, C, or D')
      }

      const enhanced_reasoning = values[getCol('Enhanced Reasoning')]
      const explanation = enhanced_reasoning || values[getCol('Reasoning')]
      
      if (!explanation || explanation.length < 20) {
        errors.push('Explanation too short (min 20 chars)')
      }

      const question: ParsedQuestion = {
        rowNumber: i + 1,
        question_id: values[getCol('ID')],
        domain,
        difficulty: values[getCol('Difficulty')] as any,
        topic: values[getCol('Topic')],
        q_text,
        choice_a,
        choice_b,
        choice_c,
        choice_d,
        answer: answer as any,
        explanation,
        reasoning: values[getCol('Reasoning')],
        incorrect_rationale: values[getCol('Incorrect Rationale')],
        enhanced_reasoning,
        errors: errors.length > 0 ? errors : undefined
      }

      questions.push(question)
    }

    return questions
  }

  const handleConfirmUpload = async () => {
    if (!parsedQuestions.length) return

    setIsLoading(true)
    setError(null)
    
    try {
      const token = await getToken()
      const validQuestions = parsedQuestions.filter(q => !q.errors?.length)
      
      if (validQuestions.length === 0) {
        setError('No valid questions to upload')
        return
      }

      // Remove rowNumber before uploading
      const questionsToUpload = validQuestions.map(({ rowNumber, errors, ...q }) => q)
      
      const result = await uploadQuestions(questionsToUpload, token)
      setUploadResult(result)
      
      if (result.success > 0) {
        setParsedQuestions([])
        setFile(null)
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      }
    } catch (err: any) {
      console.error('Upload failed:', err)
      setError(err.message || 'Upload failed')
    } finally {
      setIsLoading(false)
    }
  }

  const validCount = parsedQuestions.filter(q => !q.errors?.length).length
  const invalidCount = parsedQuestions.length - validCount

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admin: Question Upload</h1>
        <p className="text-muted-foreground">
          Upload questions via CSV/TSV file with tab-separated columns
        </p>
      </div>

      {/* Upload Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload CSV/TSV File
          </CardTitle>
          <CardDescription>
            Required columns: ID, Domain, Difficulty, Topic, Question, Option A, Option B, Option C, Option D, Answer, Reasoning, Enhanced Reasoning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            accept=".csv,.tsv,.txt"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {file && (
            <p className="text-sm text-muted-foreground mt-2">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Preview Section */}
      {parsedQuestions.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Preview Questions</span>
              <div className="flex gap-2">
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {validCount} Valid
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    {invalidCount} Invalid
                  </Badge>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              Review questions before inserting into database. Only valid questions will be uploaded.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {parsedQuestions.slice(0, 20).map((q, idx) => (
                <div 
                  key={idx} 
                  className={`border rounded-lg p-4 ${
                    q.errors?.length 
                      ? 'border-red-300 bg-red-50 dark:bg-red-950/20' 
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-2 flex-wrap">
                      {q.question_id && (
                        <Badge variant="outline" className="text-xs">
                          {q.question_id}
                        </Badge>
                      )}
                      <Badge variant="default" className="text-xs">
                        Domain {q.domain}
                      </Badge>
                      {q.difficulty && (
                        <Badge 
                          variant={
                            q.difficulty === 'Hard' ? 'destructive' :
                            q.difficulty === 'Medium' ? 'default' :
                            'secondary'
                          }
                          className="text-xs"
                        >
                          {q.difficulty}
                        </Badge>
                      )}
                      {q.topic && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <BookOpen className="h-3 w-3" />
                          {q.topic}
                        </Badge>
                      )}
                    </div>
                    {q.errors?.length ? (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Invalid
                      </Badge>
                    ) : (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Valid
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm font-medium mb-2 line-clamp-2">
                    {q.q_text}
                  </p>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Answer: <span className="font-semibold">{q.answer}</span></p>
                    {q.explanation && (
                      <p className="line-clamp-2">Explanation: {q.explanation.substring(0, 100)}...</p>
                    )}
                  </div>
                  
                  {q.errors && q.errors.length > 0 && (
                    <Alert variant="destructive" className="mt-3">
                      <AlertDescription className="text-xs">
                        {q.errors.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
              
              {parsedQuestions.length > 20 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  ... and {parsedQuestions.length - 20} more questions
                </p>
              )}
            </div>

            <div className="mt-6 flex gap-4">
              <Button
                onClick={handleConfirmUpload}
                disabled={isLoading || validCount === 0}
                className="flex-1"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {validCount} Valid Question{validCount !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setParsedQuestions([])
                  setFile(null)
                  setError(null)
                  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
                  if (fileInput) fileInput.value = ''
                }}
                disabled={isLoading}
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result Section */}
      {uploadResult && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900 dark:text-green-100">
            <strong>Upload Complete!</strong>
            <br />
            Successfully uploaded {uploadResult.success} question{uploadResult.success !== 1 ? 's' : ''}.
            {uploadResult.failed > 0 && (
              <> {uploadResult.failed} question{uploadResult.failed !== 1 ? 's' : ''} failed.</>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>CSV Format Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Required Columns (tab-separated):</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li><code>ID</code> - Question ID (e.g., CISA-00001)</li>
              <li><code>Domain</code> - Domain 1-5 (e.g., "Domain 2")</li>
              <li><code>Difficulty</code> - Easy, Medium, or Hard</li>
              <li><code>Topic</code> - Topic name (e.g., "IT Strategy Alignment")</li>
              <li><code>Question</code> - The question text</li>
              <li><code>Option A</code>, <code>Option B</code>, <code>Option C</code>, <code>Option D</code> - Answer choices</li>
              <li><code>Answer</code> - Correct answer (A, B, C, or D)</li>
              <li><code>Reasoning</code> - Basic explanation</li>
              <li><code>Incorrect Rationale</code> - Why other answers are wrong</li>
              <li><code>Enhanced Reasoning</code> - Detailed explanation (used as primary explanation)</li>
            </ul>
          </div>
          
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs font-mono whitespace-nowrap overflow-x-auto">
              ID&nbsp;&nbsp;&nbsp;Domain&nbsp;&nbsp;&nbsp;Difficulty&nbsp;&nbsp;&nbsp;Topic&nbsp;&nbsp;&nbsp;Question&nbsp;&nbsp;&nbsp;Option A&nbsp;&nbsp;&nbsp;...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
