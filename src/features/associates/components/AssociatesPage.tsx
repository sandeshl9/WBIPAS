/**
 * Associates Page
 * Manage associates and their capacities
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function AssociatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Associates</h1>
          <p className="text-muted-foreground">
            Manage team members and their capacities
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Associates List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Associate management interface will be implemented here
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
