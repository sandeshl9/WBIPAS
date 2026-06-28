/**
 * ASSOCIATES PAGE - Volume 6 Screen 3
 * 
 * Associate management with advanced table, search, filters, and actions
 */

import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { FilterDropdown } from '@/components/ui/FilterDropdown'
import { DataTable, Pagination, Column, SortDirection } from '@/components/ui/DataTable'
import { AssociateTableRow } from '@/components/associates/AssociateTableRow'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Associate, AssociateFilters } from '@/types/associate'

export default function AssociatesPage() {
  const navigate = useNavigate()

  // TODO: Replace with real data from API
  const loading = false

  // State management
  const [filters, setFilters] = useState<AssociateFilters>({
    search: '',
    availability: [],
    capacity: null,
    status: null,
  })

  const [sortBy, setSortBy] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Mock data
  const mockAssociates: Associate[] = [
    {
      id: '1',
      employeeCode: 'EMP001',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      weeklyCapacity: 5,
      currentWorkload: 5,
      availabilityStatus: 'available',
      department: 'Engineering',
      designation: 'Senior Developer',
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-06-20'),
    },
    {
      id: '2',
      employeeCode: 'EMP002',
      name: 'Michael Chen',
      email: 'michael.chen@company.com',
      weeklyCapacity: 5,
      currentWorkload: 4,
      availabilityStatus: 'available',
      department: 'Engineering',
      designation: 'Lead Developer',
      isActive: true,
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-06-18'),
    },
    {
      id: '3',
      employeeCode: 'EMP003',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@company.com',
      weeklyCapacity: 5,
      currentWorkload: 4,
      availabilityStatus: 'training',
      department: 'Engineering',
      designation: 'Developer',
      isActive: true,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-06-25'),
    },
    {
      id: '4',
      employeeCode: 'EMP004',
      name: 'James Wilson',
      email: 'james.wilson@company.com',
      weeklyCapacity: 5,
      currentWorkload: 3,
      availabilityStatus: 'available',
      department: 'Design',
      designation: 'UI/UX Designer',
      isActive: true,
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-06-22'),
    },
    {
      id: '5',
      employeeCode: 'EMP005',
      name: 'Lisa Anderson',
      email: 'lisa.anderson@company.com',
      weeklyCapacity: 5,
      currentWorkload: 3,
      availabilityStatus: 'leave',
      department: 'Engineering',
      designation: 'QA Engineer',
      isActive: true,
      createdAt: new Date('2024-02-15'),
      updatedAt: new Date('2024-06-15'),
    },
    {
      id: '6',
      employeeCode: 'EMP006',
      name: 'David Kim',
      email: 'david.kim@company.com',
      weeklyCapacity: 5,
      currentWorkload: 2,
      availabilityStatus: 'available',
      department: 'Engineering',
      designation: 'Developer',
      isActive: true,
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-06-28'),
    },
    {
      id: '7',
      employeeCode: 'EMP007',
      name: 'Rachel Thompson',
      email: 'rachel.thompson@company.com',
      weeklyCapacity: 5,
      currentWorkload: 2,
      availabilityStatus: 'available',
      department: 'Product',
      designation: 'Product Manager',
      isActive: true,
      createdAt: new Date('2024-03-10'),
      updatedAt: new Date('2024-06-26'),
    },
    {
      id: '8',
      employeeCode: 'EMP008',
      name: 'Alex Martinez',
      email: 'alex.martinez@company.com',
      weeklyCapacity: 5,
      currentWorkload: 0,
      availabilityStatus: 'holiday',
      department: 'Engineering',
      designation: 'Developer',
      isActive: false,
      createdAt: new Date('2024-03-15'),
      updatedAt: new Date('2024-06-10'),
    },
  ]

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let result = [...mockAssociates]

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (associate) =>
          associate.name.toLowerCase().includes(searchLower) ||
          associate.email.toLowerCase().includes(searchLower) ||
          associate.employeeCode.toLowerCase().includes(searchLower) ||
          associate.department?.toLowerCase().includes(searchLower)
      )
    }

    // Apply availability filter
    if (filters.availability.length > 0) {
      result = result.filter((associate) =>
        filters.availability.includes(associate.availabilityStatus)
      )
    }

    // Apply capacity filter
    if (filters.capacity) {
      result = result.filter((associate) => {
        const utilization = (associate.currentWorkload / associate.weeklyCapacity) * 100
        switch (filters.capacity) {
          case 'low':
            return utilization <= 50
          case 'medium':
            return utilization > 50 && utilization <= 80
          case 'high':
            return utilization > 80 && utilization < 100
          case 'full':
            return utilization >= 100
          default:
            return true
        }
      })
    }

    // Apply status filter
    if (filters.status) {
      result = result.filter((associate) =>
        filters.status === 'active' ? associate.isActive : !associate.isActive
      )
    }

    // Apply sorting
    if (sortBy && sortDirection) {
      result.sort((a, b) => {
        let aValue: any = (a as any)[sortBy]
        let bValue: any = (b as any)[sortBy]

        // Handle special cases
        if (sortBy === 'currentWorkload') {
          aValue = a.currentWorkload
          bValue = b.currentWorkload
        } else if (sortBy === 'remainingCapacity') {
          aValue = a.weeklyCapacity - a.currentWorkload
          bValue = b.weeklyCapacity - b.currentWorkload
        }

        if (typeof aValue === 'string') {
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }

        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      })
    }

    return result
  }, [mockAssociates, filters, sortBy, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize)
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Handle sorting
  const handleSort = (key: string) => {
    if (sortBy === key) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc')
      if (sortDirection === 'desc') {
        setSortBy('')
      }
    } else {
      setSortBy(key)
      setSortDirection('asc')
    }
  }

  // Action handlers
  const handleView = (id: string) => {
    console.log('View associate:', id)
    // TODO: Navigate to associate details
  }

  const handleEdit = (id: string) => {
    console.log('Edit associate:', id)
    navigate(`/associates/${id}/edit`)
  }

  const handleDisable = (id: string) => {
    console.log('Toggle associate status:', id)
    // TODO: Show confirmation dialog and update status
  }

  const handleHistory = (id: string) => {
    console.log('View history:', id)
    // TODO: Navigate to history page
  }

  const handleAddAssociate = () => {
    navigate('/associates/new')
  }

  const handleExport = () => {
    console.log('Export associates')
    // TODO: Export to CSV/Excel
  }

  const handleRefresh = () => {
    console.log('Refresh data')
    // TODO: Refetch data from API
  }

  // Table columns
  const columns: Column<Associate>[] = [
    {
      key: 'name',
      label: 'Associate',
      sortable: true,
      width: '250px',
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      width: '200px',
    },
    {
      key: 'weeklyCapacity',
      label: 'Capacity',
      sortable: true,
      width: '100px',
    },
    {
      key: 'currentWorkload',
      label: 'Workload',
      sortable: true,
      width: '150px',
    },
    {
      key: 'remainingCapacity',
      label: 'Remaining',
      sortable: true,
      width: '120px',
    },
    {
      key: 'availabilityStatus',
      label: 'Availability',
      sortable: false,
      width: '120px',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      width: '100px',
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      width: '80px',
    },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title font-bold">Associates</h1>
          <p className="text-secondary mt-1">
            Manage team members and their capacities
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" icon={RefreshCw} onClick={handleRefresh}>
            Refresh
          </Button>
          <Button variant="secondary" icon={Download} onClick={handleExport}>
            Export
          </Button>
          <Button variant="primary" icon={UserPlus} onClick={handleAddAssociate}>
            Add Associate
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <SearchInput
            value={filters.search}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, search: value }))
            }
            placeholder="Search by name, email, or department..."
            className="flex-1 min-w-[300px]"
          />

          {/* Availability Filter */}
          <FilterDropdown
            label="Availability"
            options={[
              { value: 'available', label: 'Available' },
              { value: 'leave', label: 'On Leave' },
              { value: 'training', label: 'Training' },
              { value: 'holiday', label: 'Holiday' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            selected={filters.availability}
            onSelectedChange={(selected) =>
              setFilters((prev) => ({ ...prev, availability: selected as any }))
            }
          />

          {/* Capacity Filter */}
          <FilterDropdown
            label="Capacity"
            options={[
              { value: 'low', label: 'Low (0-50%)' },
              { value: 'medium', label: 'Medium (51-80%)' },
              { value: 'high', label: 'High (81-99%)' },
              { value: 'full', label: 'Full (100%)' },
            ]}
            selected={filters.capacity ? [filters.capacity] : []}
            onSelectedChange={(selected) =>
              setFilters((prev) => ({
                ...prev,
                capacity: selected[0] as any || null,
              }))
            }
          />

          {/* Status Filter */}
          <FilterDropdown
            label="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            selected={filters.status ? [filters.status] : []}
            onSelectedChange={(selected) =>
              setFilters((prev) => ({
                ...prev,
                status: selected[0] as any || null,
              }))
            }
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={paginatedData}
        columns={columns}
        loading={loading}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={handleSort}
        emptyState={
          <EmptyState
            icon={require('lucide-react').Users}
            title="No associates found"
            description="Try adjusting your filters or add a new associate."
            action={{
              label: 'Add Associate',
              onClick: handleAddAssociate,
              icon: UserPlus,
            }}
          />
        }
      >
        {paginatedData.map((associate) => (
          <tr key={associate.id}>
            <AssociateTableRow
              associate={associate}
              onView={handleView}
              onEdit={handleEdit}
              onDisable={handleDisable}
              onHistory={handleHistory}
            />
          </tr>
        ))}
      </DataTable>

      {/* Pagination */}
      {filteredAndSortedData.length > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          totalItems={filteredAndSortedData.length}
        />
      )}
    </div>
  )
}
