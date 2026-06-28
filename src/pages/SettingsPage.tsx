/**
 * Settings Page
 * Application configuration
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure application preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Settings interface will be implemented here
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
