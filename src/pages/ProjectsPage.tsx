/**
 * Projects Page
 * Manage projects and assignments
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Create and manage project assignments
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Project management interface will be implemented here
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
