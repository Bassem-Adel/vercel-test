"use client"
import { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Activity, ChevronDown, ChevronRight, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export type ActivityItem = {
  id: string
  name: string
  description?: string
  groupPoints: GroupItem[]
}

export type GroupItem = {
  id: string
  name: string
  points: string
}

interface Props {
  activities: ActivityItem[]
  onSave: (activityId: string, groupId: string, points: string) => void
  setActivities: (activities: ActivityItem[]) => void
  filterGroups: (groupPoints: GroupItem[]) => GroupItem[]
  addActivity: (name: string, description?: string) => void
}

export const ActivityList = ({
  activities, onSave, setActivities, filterGroups, addActivity
}: Props) => {
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null)
  const [newActivityName, setNewActivityName] = useState("")
  const [newActivityDescription, setNewActivityDescription] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  // const [loading, setLoading] = useState(false)
  // const [error, setError] = useState<string | null>(null)
  const handlePointsChange = (activityId: string, groupId: string, newPoints: string) => {
    const updated = activities.map(a =>
      a.id === activityId
        ? {
          ...a,
          groupPoints: a.groupPoints.map(g =>
            g.id === groupId ? { ...g, points: newPoints } : g
          )
        }
        : a
    )
    setActivities(updated)
  }

  const handleAddActivity = () => {
    if (!newActivityName.trim()) return

    addActivity(newActivityName.trim(), newActivityDescription.trim())
    setNewActivityName("")
    setNewActivityDescription("")
    setDialogOpen(false) // 👈 Close the dialog
  }

  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <Card key={activity.id} className="py-2">
          <Collapsible open={expandedActivity === activity.id} onOpenChange={open => setExpandedActivity(open ? activity.id : null)}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{activity.name}</CardTitle>
                  {expandedActivity === activity.id ?
                    <ChevronDown className="h-4 w-4" /> :
                    <ChevronRight className="h-4 w-4" />
                  }
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                {filterGroups(activity.groupPoints).map(group => (
                  <div key={group.id} className="flex justify-between items-center py-2">
                    <span>{group.name}</span>
                    <Input
                      type="number"
                      value={group.points}
                      onChange={(e) => handlePointsChange(activity.id, group.id, e.target.value)}
                      onBlur={() => onSave(activity.id, group.id, group.points)}
                      className="w-20 text-center"
                      placeholder="Points" />
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}

      <Button onClick={() => setDialogOpen(true)} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Activity
      </Button>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Activity Name"
              value={newActivityName}
              onChange={e => setNewActivityName(e.target.value)}
            />
            <Input
              placeholder="Activity Description"
              value={newActivityDescription}
              onChange={e => setNewActivityDescription(e.target.value)}
            />
            <Button onClick={handleAddActivity}>Add</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
