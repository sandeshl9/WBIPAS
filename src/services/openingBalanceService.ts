/**
 * Opening Balance Service
 * Handles import of historical projects
 */

import { supabase } from '@/lib/supabase'
import type { OpeningBalance, OpeningBalanceImportLog } from '@/types'
import { createAuditLog } from './auditService'
import { generateId } from '@/lib/utils'

export interface OpeningBalanceImportRow {
  project_id: string
  project_name: string
  client: string
  project_date: string
  assigned_associate_id: string
}

/**
 * Import opening balance from data
 */
export async function importOpeningBalance(
  rows: OpeningBalanceImportRow[]
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const batchId = generateId()
    const importResults = {
      total: rows.length,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Validate and import each row
    for (const row of rows) {
      try {
        // Validate required fields
        if (!row.project_id || !row.project_name || !row.client || 
            !row.project_date || !row.assigned_associate_id) {
          throw new Error('Missing required fields')
        }

        // Validate associate exists
        const { data: associate, error: associateError } = await supabase
          .from('associates')
          .select('id')
          .eq('id', row.assigned_associate_id)
          .single()

        if (associateError || !associate) {
          throw new Error(`Associate not found: ${row.assigned_associate_id}`)
        }

        // Insert opening balance record
        const { error: insertError } = await supabase
          .from('opening_balance')
          .insert({
            project_id: row.project_id,
            project_name: row.project_name,
            client: row.client,
            project_date: row.project_date,
            assigned_associate_id: row.assigned_associate_id,
            imported_by: user.id,
            import_batch_id: batchId,
          })

        if (insertError) throw insertError

        importResults.successful++
      } catch (error: any) {
        importResults.failed++
        importResults.errors.push(
          `Row ${importResults.successful + importResults.failed}: ${error.message}`
        )
      }
    }

    // Create import log
    const { data: importLog, error: logError } = await supabase
      .from('opening_balance_import_logs')
      .insert({
        batch_id: batchId,
        total_records: importResults.total,
        successful_imports: importResults.successful,
        failed_imports: importResults.failed,
        errors: importResults.errors.length > 0 ? importResults.errors : null,
        imported_by: user.id,
      })
      .select()
      .single()

    if (logError) throw logError

    // Create audit log
    await createAuditLog({
      action: 'import_opening_balance',
      entityType: 'opening_balance',
      metadata: {
        batch_id: batchId,
        total: importResults.total,
        successful: importResults.successful,
        failed: importResults.failed,
      },
    })

    return {
      data: {
        importLog: importLog as OpeningBalanceImportLog,
        results: importResults,
      },
      error: null,
    }
  } catch (error: any) {
    console.error('Error importing opening balance:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Parse CSV/Excel data to opening balance format
 */
export function parseImportData(
  csvText: string,
  columnMapping: {
    project_id: number
    project_name: number
    client: number
    project_date: number
    assigned_associate_id: number
  }
): OpeningBalanceImportRow[] {
  const lines = csvText.trim().split('\n')
  const rows: OpeningBalanceImportRow[] = []

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(',').map(col => col.trim().replace(/^"|"$/g, ''))

    rows.push({
      project_id: columns[columnMapping.project_id] || '',
      project_name: columns[columnMapping.project_name] || '',
      client: columns[columnMapping.client] || '',
      project_date: columns[columnMapping.project_date] || '',
      assigned_associate_id: columns[columnMapping.assigned_associate_id] || '',
    })
  }

  return rows
}

/**
 * Get all opening balance records
 */
export async function getOpeningBalance(filters?: {
  associateId?: string
  batchId?: string
  weekNumber?: number
  year?: number
}) {
  try {
    let query = supabase
      .from('opening_balance')
      .select('*')
      .order('project_date', { ascending: false })

    if (filters?.associateId) {
      query = query.eq('assigned_associate_id', filters.associateId)
    }

    if (filters?.batchId) {
      query = query.eq('import_batch_id', filters.batchId)
    }

    if (filters?.weekNumber) {
      query = query.eq('week_number', filters.weekNumber)
    }

    if (filters?.year) {
      query = query.eq('year', filters.year)
    }

    const { data, error } = await query

    if (error) throw error
    return { data: data as OpeningBalance[], error: null }
  } catch (error: any) {
    console.error('Error fetching opening balance:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Get import logs
 */
export async function getImportLogs() {
  try {
    const { data, error } = await supabase
      .from('opening_balance_import_logs')
      .select('*')
      .order('imported_at', { ascending: false })

    if (error) throw error
    return { data: data as OpeningBalanceImportLog[], error: null }
  } catch (error: any) {
    console.error('Error fetching import logs:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Get import log by batch ID
 */
export async function getImportLogByBatchId(batchId: string) {
  try {
    const { data, error } = await supabase
      .from('opening_balance_import_logs')
      .select('*')
      .eq('batch_id', batchId)
      .single()

    if (error) throw error
    return { data: data as OpeningBalanceImportLog, error: null }
  } catch (error: any) {
    console.error('Error fetching import log:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Delete an import batch
 */
export async function deleteImportBatch(batchId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Delete opening balance records
    const { error: deleteError } = await supabase
      .from('opening_balance')
      .delete()
      .eq('import_batch_id', batchId)

    if (deleteError) throw deleteError

    // Create audit log
    await createAuditLog({
      action: 'delete_import',
      entityType: 'opening_balance',
      metadata: {
        batch_id: batchId,
      },
    })

    return { data: true, error: null }
  } catch (error: any) {
    console.error('Error deleting import batch:', error)
    return { data: null, error: error.message }
  }
}
