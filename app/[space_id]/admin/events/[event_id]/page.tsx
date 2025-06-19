"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Plus, MoreHorizontal, Search, Camera } from "lucide-react"
import type { Event, EventStudent, Student, Group, EventType } from "@/lib/db/schema"

type ActivityItem = {
  id: string
  name: string
  description?: string
  groupPoints: GroupItem[]
}

type GroupItem = {
  id: string
  name: string
  points: string
}

export default function EventAttendancePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const spaceId = params?.space_id as string
  const initialEventId = searchParams?.get('eventId')

  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEventId)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [currentEventType, setCurrentEventType] = useState<EventType | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [attendance, setAttendance] = useState<Record<string, boolean>>({})
  const [attendanceExtraPoints, setAttendanceExtraPoints] = useState<Record<string, Record<string, number>>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState("activities")

  // Face recognition states
  const [guessedStudents, setGuessedStudents] = useState<string[]>([])
  const [currentGuess, setCurrentGuess] = useState<number | null>(null)

  useEffect(() => {
    loadGroups()
    loadEvents()
    loadStudents()
  }, [spaceId])

  useEffect(() => {
    if (selectedEventId) {
      selectEvent(selectedEventId)
    }
  }, [selectedEventId])

  const loadGroups = async () => {
    try {
      const response = await fetch(`/api/groups?spaceId=${spaceId}`)
      if (!response.ok) throw new Error("Failed to fetch groups")
      const data = await response.json()
      setGroups(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const loadEvents = async () => {
    try {
      const response = await fetch(`/api/events?spaceId=${spaceId}`)
      if (!response.ok) throw new Error("Failed to fetch events")
      const data = await response.json()
      setEvents(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadStudents = async () => {
    try {
      const response = await fetch(`/api/students?spaceId=${spaceId}`)
      if (!response.ok) throw new Error("Failed to fetch students")
      const data = await response.json()
      setStudents(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const selectEvent = async (eventId: string) => {
    try {
      // Fetch attendance data for the event
      const attendanceResponse = await fetch(`/api/eventAttendance?spaceId=${spaceId}&handler=event&eventId=${eventId}`)
      if (!attendanceResponse.ok) throw new Error("Failed to fetch attendance")
      const attendanceData = await attendanceResponse.json()

      // Update attendance status
      const newAttendance: Record<string, boolean> = {}
      const newExtraPoints: Record<string, Record<string, number>> = {}
      
      attendanceData.forEach((record: any) => {
        newAttendance[record.studentId] = record.isPresent
        if (record.description) {
          try {
            newExtraPoints[record.studentId] = JSON.parse(record.description)
          } catch (e) {
            // Handle JSON parse error
          }
        }
      })

      setAttendance(newAttendance)
      setAttendanceExtraPoints(newExtraPoints)

      // Fetch event type details
      const selectedEvent = events.find(event => event.id === eventId)
      if (selectedEvent?.eventTypeId) {
        const eventTypeResponse = await fetch(`/api/types?spaceId=${spaceId}&typeId=${selectedEvent.eventTypeId}`)
        if (eventTypeResponse.ok) {
          const eventTypeData = await eventTypeResponse.json()
          setCurrentEventType(eventTypeData)
        }
      }

      // Fetch activities for the event
      await fetchActivitiesAndGroups(eventId)
      
      setSelectedEventId(eventId)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchActivitiesAndGroups = async (eventId: string) => {
    try {
      const response = await fetch(`/api/activities?spaceId=${spaceId}&eventId=${eventId}`)
      if (!response.ok) throw new Error("Failed to fetch activities")
      const data = await response.json()
      
      const activitiesWithGroups = data.map((activity: any) => ({
        id: activity.id,
        name: activity.name,
        description: activity.description,
        groupPoints: groups.map(group => ({
          id: group.id,
          name: group.name,
          points: activity.points?.find((p: any) => p.groupId === group.id)?.points?.toString() || "0"
        }))
      }))
      
      setActivities(activitiesWithGroups)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const updateAttendance = async (studentId: string, isPresent: boolean) => {
    if (!selectedEventId || !currentEventType) return

    let extraPointsTotal = isPresent ? (currentEventType.attendancePoints || 0) : 0
    
    // Calculate extra points
    if (currentEventType.extraPoints && attendanceExtraPoints[studentId]) {
      Object.entries(attendanceExtraPoints[studentId]).forEach(([key, value]) => {
        const extraPoint = currentEventType.extraPoints?.find((e: any) => e.name === key)
        extraPointsTotal += value * (extraPoint?.points || 0)
      })
    }

    try {
      const response = await fetch("/api/eventAttendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          eventId: selectedEventId,
          isPresent,
          points: extraPointsTotal,
          description: attendanceExtraPoints[studentId] ? JSON.stringify(attendanceExtraPoints[studentId]) : null
        })
      })

      if (!response.ok) throw new Error("Failed to update attendance")

      setAttendance(prev => ({ ...prev, [studentId]: isPresent }))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const saveActivityPoints = async (activityId: string, groupId: string, points: string) => {
    try {
      const response = await fetch("/api/activities/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId,
          groupId,
          points: parseInt(points) || 0
        })
      })

      if (!response.ok) throw new Error("Failed to save points")
    } catch (err: any) {
      setError(err.message)
    }
  }

  const addActivity = async (name: string, description: string) => {
    if (!selectedEventId) return

    try {
      const response = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          eventId: selectedEventId,
          spaceId
        })
      })

      if (!response.ok) throw new Error("Failed to add activity")

      await fetchActivitiesAndGroups(selectedEventId)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const getGroupName = (id: string | null) => {
    if (!id) return null
    return groups.find(group => group.id === id)?.name
  }

  const filterStudents = () => {
    let filteredStudents = students.filter(student => {
      const matchesGroup = !selectedGroupId || student.groupId === selectedGroupId
      const matchesSearch = !searchQuery || student.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesGroup && matchesSearch
    })

    return filteredStudents.sort((a, b) => a.name.localeCompare(b.name))
  }

  const filterGroups = (groupPoints: GroupItem[]) => {
    return groupPoints.filter(group => 
      !selectedGroupId || group.id === selectedGroupId
    )
  }

  const nextGuess = () => {
    if (!guessedStudents.length) {
      setCurrentGuess(null)
      return
    }
    
    if (currentGuess === null) {
      setCurrentGuess(0)
    } else {
      setCurrentGuess((currentGuess + 1) % guessedStudents.length)
    }
  }

  const studentWidget = (student: Student) => (
    <div key={student.id} className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <img
          src={student.imagePath || `https://ui-avatars.com/api/?name=${student.name}&background=random`}
          alt={student.name}
          className="h-14 w-14 rounded-full object-cover"
        />
        <div>
          <div className="font-medium">{student.name}</div>
          <div className="text-sm text-gray-500">
            Group: {getGroupName(student.groupId) || 'N/A'}
          </div>
          <div className="text-sm text-gray-500">
            DOB: {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {currentEventType?.extraPoints && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {/* Show extra points dialog */}}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
        {selectedEventId && (
          <Switch
            checked={attendance[student.id] || false}
            onCheckedChange={(value) => updateAttendance(student.id, value)}
          />
        )}
      </div>
    </div>
  )

  if (loading) return <div className="text-center py-8">Loading...</div>
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>

  return (
    <main className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Event Attendance</h1>
        
        {/* Event and Group Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Select value={selectedEventId || ""} onValueChange={setSelectedEventId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Event" />
            </SelectTrigger>
            <SelectContent>
              {events.map(event => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedGroupId || ""} onValueChange={setSelectedGroupId}>
            <SelectTrigger>
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {groups.map(group => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <div className="space-y-4">
            {activities.map(activity => (
              <Card key={activity.id}>
                <Collapsible
                  open={expandedActivity === activity.id}
                  onOpenChange={(open) => setExpandedActivity(open ? activity.id : null)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50">
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
                            onChange={(e) => {
                              const newActivities = activities.map(act => 
                                act.id === activity.id 
                                  ? {
                                      ...act,
                                      groupPoints: act.groupPoints.map(gp =>
                                        gp.id === group.id ? { ...gp, points: e.target.value } : gp
                                      )
                                    }
                                  : act
                              )
                              setActivities(newActivities)
                            }}
                            onBlur={() => saveActivityPoints(activity.id, group.id, group.points)}
                            className="w-20 text-center"
                            placeholder="Points"
                          />
                        </div>
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Activity</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Activity Name" id="activity-name" />
                  <Input placeholder="Activity Description" id="activity-description" />
                  <Button onClick={() => {
                    const name = (document.getElementById('activity-name') as HTMLInputElement)?.value
                    const description = (document.getElementById('activity-description') as HTMLInputElement)?.value
                    if (name) {
                      addActivity(name, description || "")
                    }
                  }}>
                    Add
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <div className="space-y-4">
            <Input
              placeholder="Search by name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
            <Card>
              <CardContent className="p-0">
                {filterStudents().map(student => studentWidget(student))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Search Tab (Face Recognition) */}
        <TabsContent value="search">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <Camera className="h-16 w-16 mx-auto text-gray-400" />
                  <p className="text-gray-500">Face recognition camera would go here</p>
                  <Button onClick={nextGuess} disabled={!guessedStudents.length}>
                    Next Guess
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {currentGuess !== null && guessedStudents[currentGuess] && (
              <Card>
                <CardContent className="p-0">
                  {studentWidget(students.find(s => s.id === guessedStudents[currentGuess])!)}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}