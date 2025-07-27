"use client"

import { useState } from "react"
import { EventSelectionDialog } from "@/components/event/attendanceModel"
import { Student, Group, EventType, Event } from "@/lib/db/schema"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"

interface Props {
    student: Student
    getGroupName: (groupId: string | null) => string | null
    currentEventType: EventType
    event: Event
    attendance: { isPresent: boolean, extraPoints: Record<string, number> }
    onAttendanceChange: (isPresent: boolean, extraPoints: Record<string, number>) => void
}

export const StudentList = ({ student, getGroupName, currentEventType, event, attendance, onAttendanceChange }: Props) => {
    const [extraPointsDialog, setExtraPointsDialog] = useState<boolean>(false)
    return (
        <div key={student.id} className="flex items-center justify-between p-4 border-b">
            <div className="flex gap-4">
                <img
                    src={student.imagePath || `https://ui-avatars.com/api/?name=${student.name}&background=random`}
                    className="h-14 w-14 rounded-full"
                    alt={student.name}
                />
                <div>
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-gray-500">Group: {getGroupName(student.groupId) || 'N/A'}</div>
                    <div className="text-sm text-gray-500">Date of Birth: {student.dob}</div>
                </div>
            </div>
            <div className="flex gap-2">
                {currentEventType?.extraPoints && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {setExtraPointsDialog(true) }}
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                )}
                {event && (
                    <Switch
                        checked={attendance.isPresent || false}
                        onCheckedChange={(value) => onAttendanceChange(value, attendance.extraPoints)}
                    />
                )}
            </div>
            {/* Dialog for extra points */}
            {extraPointsDialog && (
                <EventSelectionDialog
                    eventType={currentEventType}
                    event={event}
                    initialValue={attendance.extraPoints}
                    onSave={(selectedPoints) => onAttendanceChange(attendance.isPresent, selectedPoints)}
                    onClose={() => setExtraPointsDialog(false)}
                />
            )}
        </div>
    )
}
