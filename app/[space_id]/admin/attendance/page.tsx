"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Student, Event, Group, EventType } from '@/lib/db/schema';
import { AttendanceModel } from "@/components/event/attendanceModel"

const AttendanceTab: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [attendanceEvents, setAttendanceEvents] = useState<Event[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [attendanceDate, setAttendanceDate] = useState(() => {
        const init = new Date()
        const d = new Date(Date.UTC(init.getFullYear(), init.getMonth(), init.getDate()))
        d.setHours(0, 0, 0, 0)
        return d
    });
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [openAttendanceDialog, setOpenAttendanceDialog] = useState<boolean>(false);
    const [loading, setLoading] = useState(true)

    const params = useParams()
    const spaceId = params?.space_id as string

    useEffect(() => {
        if (spaceId) fetchAll();
    }, [spaceId]);

    async function fetchAll() {
        setLoading(true)
        const [studentsRes, eventsRes, eventTypesRes, groupsRes] = await Promise.all([
            fetchStudents(),
            fetchEvents(),
            fetchEventTypes(),
            fetchGroups(),
        ])
        setStudents(studentsRes)
        setEvents(eventsRes ?? [])
        setEventTypes(eventTypesRes)
        setGroups(groupsRes)
        setLoading(false)
    }

    const fetchStudents = async (): Promise<Student[]> => {
        const response = await fetch(`/api/students?spaceId=${spaceId}`);
        const data = await response.json();
        return data;
    };

    const fetchEventTypes = async (): Promise<EventType[]> => {
        const response = await fetch(`/api/types?spaceId=${spaceId}`);
        const data = await response.json();
        return data;
    };

    const fetchGroups = async (): Promise<Group[]> => {
        const response = await fetch(`/api/groups?spaceId=${spaceId}`);
        const data = await response.json();
        return data;
    };

    // Build a map of groupId to groupName for fast lookup
    const groupMap = groups.reduce<Record<string, string>>((acc, group) => {
        acc[group.id] = group.name
        return acc
    }, {})

    const fetchEvents = async (): Promise<Event[] | null> => {
        const response = await fetch(`/api/events?spaceId=${spaceId}`);
        const data = await response.json();
        return (data);
    };

    useEffect(() => {
        const filteredEvents = events.filter((event) => {
            const startDate = event.startDate ? new Date(event.startDate) : null;
            const endDate = event.endDate ? new Date(event.endDate) : null;
            return (
                (!startDate || startDate <= attendanceDate) &&
                (!endDate || endDate >= attendanceDate)
            );
        });
        setAttendanceEvents(filteredEvents);
    }, [attendanceDate, events]);

    useEffect(() => {
        // filteredStudents

        // setStudents(updatedStudents);
    }, [selectedGroupId, searchQuery, students]);

    const handleDateChange = (newDate: Date | null) => {
        if (newDate) {
            const date = new Date(Date.UTC(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 0, 0, 0));
            setAttendanceDate(date);
        }
    };

    const handleShowAttendanceDetails = (student: Student) => {
        setSelectedStudent(student);
        setOpenAttendanceDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenAttendanceDialog(false);
        setSelectedStudent(null); // Clear selected student
    };

    const filteredStudents = students.filter(
        (student) =>
            (!selectedGroupId || student.groupId === selectedGroupId) &&
            student.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const getGroupName = (id: string | null) => {
        if (!id) return null
        return groups.find(group => group.id === id)?.name ?? null
    }

    return (
        <main className="max-w-screen-xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">Attendance Management</h1>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                    <Label>Date</Label>
                    <Input
                        type="date"
                        value={attendanceDate.toISOString().slice(0, 10)}
                        onChange={e => {
                            const d = new Date(e.target.value)
                            d.setHours(0, 0, 0, 0)
                            handleDateChange(e.target.value ? d : null)
                        }}
                    />
                </div>
                <div className="flex-1">
                    <Label>Group</Label>
                    <Select
                        value={selectedGroupId ?? "all"}
                        onValueChange={val => setSelectedGroupId(val === "all" ? null : val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All Groups" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {groups.map((group: any) => (
                                <SelectItem key={group.id} value={group.id}>
                                    {group.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-1">
                    <Label>Search by Name</Label>
                    <Input
                        placeholder="Search by Name"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <>
                    <div className="border rounded-lg divide-y">
                        {filteredStudents.map(student => (
                            <div key={student.id} className="flex items-center justify-between px-4 py-2">
                                <div className="flex items-center gap-3">
                                    {/* Avatar with student image */}
                                    <div className="h-10 w-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                                        {student.imagePath ? (
                                            <img
                                                src={student.imagePath}
                                                alt={student.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-lg font-bold text-muted-foreground">
                                                {student.name?.[0] || "?"}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-semibold">{student.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            Group: {groupMap[student.groupId] || student.groupId}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Date of Birth: {student.dob}
                                        </div>
                                    </div>
                                </div>
                                {attendanceEvents.length > 0 && (
                                    <Button size="sm" onClick={() => { setSelectedStudent(student); setOpenAttendanceDialog(true) }}>
                                        Details
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* <div className="mt-8">
                        <h2 className="text-lg font-semibold mb-2">
                            Attendance Events on {attendanceDate.toDateString()}
                        </h2>
                        <ul>
                            {attendanceEvents.map((event: any) => (
                                <li key={event.id} className="mb-1">
                                    <span className="font-medium">{event.name}</span>
                                    {event.startDate && (
                                        <span className="text-xs text-muted-foreground ml-2">
                                            ({event.startDate} - {event.endDate})
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div> */}
                </>
            )}

            {/* Attendance Details Dialog */}
            <Dialog open={openAttendanceDialog} onOpenChange={setOpenAttendanceDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedStudent?.name} Actions</DialogTitle>
                    </DialogHeader>
                    <div className="mb-2">
                        <div>Group: {getGroupName(selectedStudent?.groupId ?? null) || 'N/A'}</div>
                        <div>Date of Birth: {selectedStudent?.dob}</div>
                    </div>
                    {selectedStudent && (
                        <AttendanceModel spaceId={spaceId}
                            student={selectedStudent!}
                            eventTypes={eventTypes}
                            attendanceEvents={attendanceEvents}
                            onAttendanceUpdated={() => { }} />)}
                    {/* You can add more attendance-related info or actions here */}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenAttendanceDialog(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
};

export default AttendanceTab;
