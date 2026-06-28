/**
 * Reports Page
 * View and export various reports
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          Generate and export workload reports
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Reports module will be implemented here
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
