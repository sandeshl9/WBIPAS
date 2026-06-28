/**
 * EXCEL UTILITIES
 * 
 * Helper functions for Excel/CSV parsing
 */

import { read, utils } from 'xlsx'
import { getWeekNumber, parseDate } from './dateUtils'

export interface ImportedProject {
  projectId: string
  projectName: string
  associateEmail: string
  associateId: string
  projectDate: string
  weekNumber: number
  year: number
  status: 'pending' | 'assigned' | 'in_progress' | 'on_hold'
  error?: string
}

export interface ImportResult {
  valid: ImportedProject[]
  invalid: Array<ImportedProject & { error: string }>
  duplicates: ImportedProject[]
  success: number
  failed: number
  skipped: number
}

interface Associate {
  id: string
  name: string
  email: string
}

/**
 * Parse Excel/CSV file and validate data
 */
export async function parseExcelFile(
  file: File,
  associates: Associate[]
): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData: any[] = utils.sheet_to_json(worksheet)

        const result = validateImportData(jsonData, associates)
        resolve(result)
      } catch (error) {
        console.error('Error parsing file:', error)
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsBinaryString(file)
  })
}

/**
 * Validate imported data
 */
function validateImportData(
  data: any[],
  associates: Associate[]
): ImportResult {
  const valid: ImportedProject[] = []
  const invalid: Array<ImportedProject & { error: string }> = []
  const duplicates: ImportedProject[] = []
  const seenProjectIds = new Set<string>()

  // Create associate lookup map
  const associateByEmail = new Map<string, Associate>()
  associates.forEach((a) => {
    associateByEmail.set(a.email.toLowerCase(), a)
  })

  for (const row of data) {
    try {
      // Extract fields (case-insensitive)
      const projectId = String(row['Project ID'] || row['project id'] || row['projectId'] || '').trim()
      const projectName = String(row['Project Name'] || row['project name'] || row['projectName'] || '').trim()
      const associateEmail = String(row['Associate Email'] || row['associate email'] || row['associateEmail'] || '').trim().toLowerCase()
      const projectDateStr = String(row['Project Date'] || row['project date'] || row['projectDate'] || '').trim()
      const status = String(row['Status'] || row['status'] || '').trim().toLowerCase()

      // Validate required fields
      if (!projectId) {
        invalid.push({
          projectId,
          projectName,
          associateEmail,
          associateId: '',
          projectDate: projectDateStr,
          weekNumber: 0,
          year: 0,
          status: 'assigned',
          error: 'Project ID is required',
        })
        continue
      }

      if (!projectName) {
        invalid.push({
          projectId,
          projectName,
          associateEmail,
          associateId: '',
          projectDate: projectDateStr,
          weekNumber: 0,
          year: 0,
          status: 'assigned',
          error: 'Project Name is required',
        })
        continue
      }

      // Check for duplicate project ID
      if (seenProjectIds.has(projectId)) {
        duplicates.push({
          projectId,
          projectName,
          associateEmail,
          associateId: '',
          projectDate: projectDateStr,
          weekNumber: 0,
          year: 0,
          status: status as any,
        })
        continue
      }

      // Validate associate
      const associate = associateByEmail.get(associateEmail)
      if (!associate) {
        invalid.push({
          projectId,
          projectName,
          associateEmail,
          associateId: '',
          projectDate: projectDateStr,
          weekNumber: 0,
          year: 0,
          status: 'assigned',
          error: `Associate not found: ${associateEmail}`,
        })
        continue
      }

      // Validate date
      const projectDate = parseDate(projectDateStr)
      if (!projectDate) {
        invalid.push({
          projectId,
          projectName,
          associateEmail,
          associateId: associate.id,
          projectDate: projectDateStr,
          weekNumber: 0,
          year: 0,
          status: 'assigned',
          error: 'Invalid date format. Use YYYY-MM-DD',
        })
        continue
      }

      // Validate status
      const validStatuses = ['pending', 'assigned', 'in_progress', 'on_hold']
      if (!validStatuses.includes(status)) {
        invalid.push({
          projectId,
          projectName,
          associateEmail,
          associateId: associate.id,
          projectDate: projectDateStr,
          weekNumber: 0,
          year: 0,
          status: 'assigned',
          error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`,
        })
        continue
      }

      // Calculate week number
      const { week, year } = getWeekNumber(projectDate)

      // Valid project
      seenProjectIds.add(projectId)
      valid.push({
        projectId,
        projectName,
        associateEmail,
        associateId: associate.id,
        projectDate: projectDateStr,
        weekNumber: week,
        year,
        status: status as any,
      })
    } catch (error) {
      console.error('Error processing row:', error)
      invalid.push({
        projectId: '',
        projectName: '',
        associateEmail: '',
        associateId: '',
        projectDate: '',
        weekNumber: 0,
        year: 0,
        status: 'assigned',
        error: 'Failed to process row',
      })
    }
  }

  return {
    valid,
    invalid,
    duplicates,
    success: valid.length,
    failed: invalid.length,
    skipped: duplicates.length,
  }
}
