/**
 * DASHBOARD PAGE - Volume 6 Screen 2
 * 
 * Main dashboard with 10 KPI widgets, charts, tables, and quick actions
 * Inspired by: Linear, Notion, Stripe Dashboard
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  FolderKanban,
  CheckCircle,
  Clock,
  TrendingUp,
  Gauge,
  Calendar,
  AlertCircle,
  Activity,
  Zap,
} from 'lucide-react'
import { KPICard } from '@/components/ui/KPICard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { RecentAssignments } from '@/components/dashboard/RecentAssignments'
import { UpcomingAvailability } from '@/components/dashboard/UpcomingAvailability'
import { CapacityHeatmap } from '@/components/dashboard/CapacityHeatmap'
import { ProjectsByAssociateChart } from '@/components/dashboard/ProjectsByAssociateChart'
import { WeeklyTrendChart } from '@/components/dashboard/WeeklyTrendChart'

export default function DashboardPage() {
  const navigate = useNavigate()

  // TODO: Replace with real data from API
  const loading = false

  // Mock KPI Data
  const kpiData = {
    totalAssociates: 24,
    activeAssociates: 21,
    totalProjects: 156,
    activeProjects: 42,
    completedProjects: 89,
    assignedToday: 8,
    remainingCapacity: 67,
    utilizationPercentage: 78,
    avgWorkload: 3.2,
    busyAssociates: 5,
  }

  // Mock Trend Data
  const trends = {
    associates: { value: 12, direction: 'up' as const, label: 'vs last month' },
    projects: { value: 8, direction: 'up' as const, label: 'vs last week' },
    completed: { value: 15, direction: 'up' as const, label: 'vs last week' },
    capacity: { value: -5, direction: 'down' as const, label: 'vs last week' },
    utilization: { value: 3, direction: 'up' as const, label: 'vs last week' },
  }

  // Mock Recent Assignments
  const recentAssignments = [
    {
      id: '1',
      projectName: 'Website Redesign - Phase 2',
      associateName: 'Sarah Johnson',
      assignedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
      status: 'assigned' as const,
    },
    {
      id: '2',
      projectName: 'Mobile App Development',
      associateName: 'Michael Chen',
      assignedAt: new Date(Date.now() - 1000 * 60 * 45), // 45 min ago
      status: 'in_progress' as const,
    },
    {
      id: '3',
      projectName: 'Database Migration',
      associateName: 'Emily Rodriguez',
      assignedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      status: 'in_progress' as const,
    },
    {
      id: '4',
      projectName: 'API Integration',
      associateName: 'James Wilson',
      assignedAt: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
      status: 'completed' as const,
    },
    {
      id: '5',
      projectName: 'Security Audit',
      associateName: 'Lisa Anderson',
      assignedAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      status: 'assigned' as const,
    },
  ]

  // Mock Upcoming Availability
  const upcomingAvailability = [
    {
      id: '1',
      name: 'David Kim',
      email: 'david.kim@company.com',
      currentWorkload: 4,
      capacity: 5,
      availableFrom: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days
      upcomingCapacity: 1,
    },
    {
      id: '2',
      name: 'Rachel Thompson',
      email: 'rachel.t@company.com',
      currentWorkload: 3,
      capacity: 5,
      availableFrom: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days
      upcomingCapacity: 2,
    },
    {
      id: '3',
      name: 'Alex Martinez',
      email: 'alex.m@company.com',
      currentWorkload: 5,
      capacity: 5,
      availableFrom: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days
      upcomingCapacity: 3,
    },
  ]

  // Mock Weekly Trend Data
  const weeklyTrendData = [
    { week: 'W20', assigned: 12, completed: 10, capacity: 120 },
    { week: 'W21', assigned: 15, completed: 12, capacity: 120 },
    { week: 'W22', assigned: 18, completed: 14, capacity: 120 },
    { week: 'W23', assigned: 14, completed: 16, capacity: 120 },
    { week: 'W24', assigned: 20, completed: 15, capacity: 120 },
    { week: 'W25', assigned: 16, completed: 18, capacity: 120 },
  ]

  // Mock Projects by Associate Data
  const projectsByAssociate = [
    { name: 'Sarah J.', projects: 5, capacity: 5, utilization: 100 },
    { name: 'Michael C.', projects: 4, capacity: 5, utilization: 80 },
    { name: 'Emily R.', projects: 4, capacity: 5, utilization: 80 },
    { name: 'James W.', projects: 3, capacity: 5, utilization: 60 },
    { name: 'Lisa A.', projects: 3, capacity: 5, utilization: 60 },
    { name: 'David K.', projects: 2, capacity: 5, utilization: 40 },
  ]

  // Mock Heatmap Data
  const heatmapData = [
    { week: 20, year: 2024, utilization: 65, projectCount: 12 },
    { week: 21, year: 2024, utilization: 75, projectCount: 15 },
    { week: 22, year: 2024, utilization: 90, projectCount: 18 },
    { week: 23, year: 2024, utilization: 70, projectCount: 14 },
    { week: 24, year: 2024, utilization: 100, projectCount: 20 },
    { week: 25, year: 2024, utilization: 80, projectCount: 16 },
    { week: 26, year: 2024, utilization: 85, projectCount: 17 },
    { week: 27, year: 2024, utilization: 60, projectCount: 12 },
    { week: 28, year: 2024, utilization: 75, projectCount: 15 },
    { week: 29, year: 2024, utilization: 95, projectCount: 19 },
    { week: 30, year: 2024, utilization: 88, projectCount: 18 },
    { week: 31, year: 2024, utilization: 78, projectCount: 16 },
  ]

  // Quick Action Handlers
  const handleCreateProject = () => {
    // TODO: Open Project Assignment Wizard
    console.log('Create Project')
  }

  const handleAddAssociate = () => {
    navigate('/associates/new')
  }

  const handleImportOpeningBalance = () => {
    navigate('/opening-balance')
  }

  const handleViewReports = () => {
    navigate('/reports')
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-page-title font-bold">Dashboard</h1>
        <p className="text-secondary mt-1">
          Overview of workload and project assignments
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions
        onCreateProject={handleCreateProject}
        onAddAssociate={handleAddAssociate}
        onImportOpeningBalance={handleImportOpeningBalance}
        onViewReports={handleViewReports}
      />

      {/* KPI Grid - 4 columns on desktop */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Total Associates */}
        <KPICard
          icon={Users}
          title="Total Associates"
          value={kpiData.totalAssociates}
          trend={trends.associates}
          loading={loading}
        />

        {/* KPI 2: Active Projects */}
        <KPICard
          icon={FolderKanban}
          title="Active Projects"
          value={kpiData.activeProjects}
          trend={trends.projects}
          loading={loading}
        />

        {/* KPI 3: Completed Projects */}
        <KPICard
          icon={CheckCircle}
          title="Completed Projects"
          value={kpiData.completedProjects}
          trend={trends.completed}
          loading={loading}
        />

        {/* KPI 4: Assigned Today */}
        <KPICard
          icon={Zap}
          title="Assigned Today"
          value={kpiData.assignedToday}
          trend={{ value: 0, direction: 'neutral', label: 'Last 24 hours' }}
          loading={loading}
        />
      </div>

      {/* Secondary KPI Grid - 3 columns */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* KPI 5: Remaining Capacity */}
        <KPICard
          icon={Activity}
          title="Remaining Capacity"
          value={kpiData.remainingCapacity}
          trend={trends.capacity}
          loading={loading}
        />

        {/* KPI 6: Capacity Utilization */}
        <KPICard
          icon={Gauge}
          title="Capacity Utilization"
          value={`${kpiData.utilizationPercentage}%`}
          trend={trends.utilization}
          loading={loading}
        />

        {/* KPI 7: Average Workload */}
        <KPICard
          icon={TrendingUp}
          title="Average Workload"
          value={kpiData.avgWorkload}
          trend={{ value: 0, direction: 'neutral', label: 'Projects per associate' }}
          loading={loading}
        />
      </div>

      {/* Charts Row - 2 columns on desktop */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* KPI 8: Weekly Trend */}
        <WeeklyTrendChart data={weeklyTrendData} loading={loading} />

        {/* KPI 9: Projects by Associate */}
        <ProjectsByAssociateChart data={projectsByAssociate} loading={loading} />
      </div>

      {/* KPI 10: Capacity Heatmap - Full width */}
      <CapacityHeatmap data={heatmapData} loading={loading} />

      {/* Tables Row - 2 columns on desktop */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Assignments */}
        <RecentAssignments assignments={recentAssignments} loading={loading} />

        {/* Upcoming Availability */}
        <UpcomingAvailability associates={upcomingAvailability} loading={loading} />
      </div>

      {/* Additional Metrics - 2 cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Busy Associates Alert */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100 dark:bg-warning-900/20">
              <AlertCircle className="h-5 w-5 text-warning-600 dark:text-warning-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{kpiData.busyAssociates}</div>
              <div className="text-sm text-muted-foreground">At or near capacity</div>
            </div>
          </div>
        </div>

        {/* Idle Associates */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100 dark:bg-success-900/20">
              <Calendar className="h-5 w-5 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {kpiData.activeAssociates - kpiData.busyAssociates}
              </div>
              <div className="text-sm text-muted-foreground">Available for new projects</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
