/**
 * EXCEL IMPORT - Opening Balance Component
 * 
 * Import multiple projects from Excel/CSV file
 */

import React, { useState } from 'react'
import { Upload, Download, AlertCircle, CheckCircle, X, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { motion, AnimatePresence } from 'framer-motion'
import { parseExcelFile, ImportResult, ImportedProject } from '@/utils/excelUtils'

export interface ExcelImportProps {
  associates: Array<{ id: string; name: string; email: string }>
  onImport: (projects: ImportedProject[]) => Promise<void>
}

export function ExcelImport({ associates, onImport }: ExcelImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setImporting(true)
      
      // Parse Excel file
      const parseResult = await parseExcelFile(file, associates)
      setResult(parseResult)

    } catch (error) {
      console.error('Error parsing file:', error)
      setResult({
        valid: [],
        invalid: [],
        duplicates: [],
        success: 0,
        failed: 0,
        skipped: 0,
      })
    } finally {
      setImporting(false)
    }
  }

  const handleImport = async () => {
    if (!result || result.valid.length === 0) return

    try {
      setImporting(true)
      await onImport(result.valid)
      
      // Clear file and result after successful import
      setFile(null)
      setResult(null)
      
      // Reset file input
      const fileInput = document.getElementById('excel-file') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
    } catch (error) {
      console.error('Error importing projects:', error)
    } finally {
      setImporting(false)
    }
  }

  const handleDownloadTemplate = () => {
    // Create CSV template
    const headers = 'Project ID,Project Name,Associate Email,Project Date,Status\n'
    const example = 'PROJ-001,Website Redesign,sarah.johnson@company.com,2024-06-15,assigned\n'
    const csvContent = headers + example
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'opening_balance_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    setFile(null)
    setResult(null)
    const fileInput = document.getElementById('excel-file') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  return (
    <div className="space-y-6">
      {/* Template Download */}
      <div className="card p-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-foreground">Download Template</p>
              <p className="text-xs text-muted-foreground">
                Use this template to prepare your data
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleDownloadTemplate}
          >
            Download CSV Template
          </Button>
        </div>
      </div>

      {/* File Upload Card */}
      <div className="card p-6">
        <h3 className="text-card-title font-semibold mb-4">Upload Excel/CSV File</h3>

        {/* Upload Area */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 transition-colors
            ${file ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'border-border bg-muted/30'}
          `}
        >
          <input
            id="excel-file"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={importing}
          />

          <div className="flex flex-col items-center text-center">
            <Upload className={`h-12 w-12 mb-4 ${file ? 'text-primary-600' : 'text-muted-foreground'}`} />
            
            {file ? (
              <>
                <p className="text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground">
                  Drop your file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports: Excel (.xlsx, .xls) and CSV (.csv)
                </p>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-4">
          {file && !result && (
            <>
              <Button
                variant="secondary"
                onClick={handleClear}
                disabled={importing}
              >
                Clear
              </Button>
              <Button
                variant="primary"
                onClick={handleUpload}
                loading={importing}
                disabled={importing}
              >
                Validate & Preview
              </Button>
            </>
          )}
          
          {result && result.valid.length > 0 && (
            <Button
              variant="primary"
              onClick={handleImport}
              loading={importing}
              disabled={importing}
            >
              Import {result.valid.length} Projects
            </Button>
          )}
        </div>
      </div>

      {/* Import Summary */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-card-title font-semibold">Import Summary</h3>
              <Button variant="ghost" size="sm" icon={X} onClick={handleClear}>
                Clear
              </Button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded-lg bg-success-50 dark:bg-success-900/20">
                <div className="text-2xl font-bold text-success-600">{result.valid.length}</div>
                <div className="text-xs text-success-700 dark:text-success-400">Valid</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-error-50 dark:bg-error-900/20">
                <div className="text-2xl font-bold text-error-600">{result.invalid.length}</div>
                <div className="text-xs text-error-700 dark:text-error-400">Invalid</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-warning-50 dark:bg-warning-900/20">
                <div className="text-2xl font-bold text-warning-600">{result.duplicates.length}</div>
                <div className="text-xs text-warning-700 dark:text-warning-400">Duplicates</div>
              </div>
            </div>

            {/* Valid Projects */}
            {result.valid.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-success-600" />
                  <h4 className="font-medium text-success-600">
                    {result.valid.length} Valid Projects
                  </h4>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                  {result.valid.map((project, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-success-50 dark:bg-success-900/10 border border-success-200 dark:border-success-800"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{project.projectName}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.projectId} • {project.associateEmail} • Week {project.weekNumber}
                        </p>
                      </div>
                      <Badge variant="success" size="sm">{project.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invalid Projects */}
            {result.invalid.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-error-600" />
                  <h4 className="font-medium text-error-600">
                    {result.invalid.length} Invalid Projects
                  </h4>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                  {result.invalid.map((project, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-error-50 dark:bg-error-900/10 border border-error-200 dark:border-error-800"
                    >
                      <p className="text-sm font-medium text-foreground">{project.projectName || 'Unknown'}</p>
                      <p className="text-xs text-error-600 mt-1">{project.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Duplicates */}
            {result.duplicates.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-warning-600" />
                  <h4 className="font-medium text-warning-600">
                    {result.duplicates.length} Duplicate Projects (Skipped)
                  </h4>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                  {result.duplicates.map((project, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-warning-50 dark:bg-warning-900/10 border border-warning-200 dark:border-warning-800"
                    >
                      <p className="text-sm font-medium text-foreground">{project.projectName}</p>
                      <p className="text-xs text-warning-700 dark:text-warning-400">
                        Project ID already exists: {project.projectId}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Required Format */}
      <div className="card p-4 bg-muted/50">
        <h4 className="text-sm font-medium text-foreground mb-2">Required Columns</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {['Project ID', 'Project Name', 'Associate Email', 'Project Date', 'Status'].map((col) => (
            <Badge key={col} variant="neutral" size="sm">
              {col}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Date format: YYYY-MM-DD • Valid statuses: pending, assigned, in_progress, on_hold
        </p>
      </div>
    </div>
  )
}
