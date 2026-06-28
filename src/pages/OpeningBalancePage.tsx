/**
 * OPENING BALANCE PAGE - Volume 6 Screen 5
 * 
 * Import existing projects (manual entry + Excel import)
 */

import React, { useState } from 'react'
import { Upload, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { ManualEntry } from '@/components/opening-balance/ManualEntry'
import { ExcelImport } from '@/components/opening-balance/ExcelImport'
import type { OpeningBalanceFormValues } from '@/schemas/openingBalanceSchema'
import type { ImportedProject } from '@/utils/excelUtils'

export default function OpeningBalancePage() {
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual')

  // TODO: Replace with real data from API
  const mockAssociates = [
    { id: '1', name: 'Sarah Johnson', email: 'sarah.johnson@company.com' },
    { id: '2', name: 'Michael Chen', email: 'michael.chen@company.com' },
    { id: '3', name: 'Emily Rodriguez', email: 'emily.rodriguez@company.com' },
    { id: '4', name: 'James Wilson', email: 'james.wilson@company.com' },
    { id: '5', name: 'Lisa Anderson', email: 'lisa.anderson@company.com' },
  ]

  const handleManualSubmit = async (data: OpeningBalanceFormValues) => {
    try {
      // TODO: Replace with actual API call
      console.log('Adding opening balance project:', data)
      
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Show success message
      toast.success('Project added to opening balance!')
    } catch (error) {
      console.error('Error adding project:', error)
      toast.error('Failed to add project. Please try again.')
      throw error
    }
  }

  const handleBulkImport = async (projects: ImportedProject[]) => {
    try {
      // TODO: Replace with actual API call
      console.log('Importing projects:', projects)
      
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Show success message
      toast.success(`Successfully imported ${projects.length} projects!`)
    } catch (error) {
      console.error('Error importing projects:', error)
      toast.error('Failed to import projects. Please try again.')
      throw error
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-page-title font-bold">Opening Balance</h1>
        <p className="text-secondary mt-1">
          Import existing active projects to initialize workload tracking
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="card p-1">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('manual')}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all
              ${
                activeTab === 'manual'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-accent'
              }
            `}
          >
            <FileText className="h-4 w-4" />
            Manual Entry
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all
              ${
                activeTab === 'import'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-accent'
              }
            `}
          >
            <Upload className="h-4 w-4" />
            Excel Import
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'manual' ? (
        <ManualEntry
          associates={mockAssociates}
          onSubmit={handleManualSubmit}
        />
      ) : (
        <ExcelImport
          associates={mockAssociates}
          onImport={handleBulkImport}
        />
      )}

      {/* Help Section */}
      <div className="card p-6 bg-muted/50">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          What is Opening Balance?
        </h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Opening balance allows you to import existing active projects into the system. This is
            useful when you're starting to use WBIPAS and need to account for projects that are
            already in progress.
          </p>
          <p>
            <strong>Important:</strong> Only import projects with active statuses (Pending, Assigned,
            In Progress, On Hold). Completed or cancelled projects should not be imported.
          </p>
          <p>
            <strong>Effect:</strong> Imported projects will immediately affect associate workload
            calculations and capacity recommendations.
          </p>
        </div>
      </div>
    </div>
  )
}
