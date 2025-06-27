"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Student, Event, EventType, EventStudent } from "@/lib/db/schema"
import { Edit } from "lucide-react" // Importing an icon from lucide-react

interface AttendanceModelProps {
    spaceId: string;
    student: Student;
    attendanceEvents: Event[];
    eventTypes: EventType[];
    onAttendanceUpdated: (student: Student, event: Event, attendanceStatus: boolean) => void;
}

export const AttendanceModel: React.FC<AttendanceModelProps> = ({
    spaceId,
    student,
    attendanceEvents,
    eventTypes,
    onAttendanceUpdated,
}) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [studentBalance, setStudentBalance] = useState<number>(0);
    const [originalStatus, setOriginalStatus] = useState<{ [key: string]: boolean }>({});
    const [originalExtraPoints, setOriginalExtraPoints] = useState<{ [key: string]: { [key: string]: number } }>({});
    const [updatedStatus, setUpdatedStatus] = useState<{ [key: string]: boolean }>({});
    const [updatedExtraPointsMap, setUpdatedExtraPointsMap] = useState<{ [key: string]: { [key: string]: number } }>({});
    const [updatedExtraPoints, setUpdatedExtraPoints] = useState<{ [key: string]: number }>({});
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const [selectExtraPointsDialog, setSelectExtraPointsDialog] = useState<Event | null>(null);

    const [openManualTransactionDialog, setOpenManualTransactionDialog] = useState<boolean>(false);
    const [action, setAction] = useState<string>('');
    const [amount, setAmount] = useState<number>(0);
    const [comment, setComment] = useState<string>('');

    // Fetch initial student data
    useEffect(() => {
        loadStudentData();
    }, [student, attendanceEvents]);

    const loadStudentData = async () => {
        // Mocking data loading, replace with actual API calls
        const balance = await fetchStudentBalance(student.id);
        const attendanceData = await fetchAttendanceByStudent(student.id);

        for (let i = 0; i < attendanceEvents.length; i++) {
            const eventId = attendanceEvents[i].id;
            const eventAttendance = attendanceData.find(e => e.eventId === eventId);
            if (eventAttendance) {
                if (eventAttendance.isPresent != null) {
                    originalStatus[eventId] = eventAttendance!.isPresent ?? false;
                }

                if (eventAttendance.description) {
                    originalExtraPoints[eventId] = JSON.parse(eventAttendance.description);
                }
            }
        }

        setOriginalStatus(originalStatus);
        setOriginalExtraPoints(originalExtraPoints);
        setStudentBalance(balance);
        setIsLoading(false);
    };

    const fetchStudentBalance = async (studentId: string): Promise<number> => {
        try {
            const response = await fetch(`/api/studentAccount?spaceId=${spaceId}&studentId=${studentId}&handler=balance`)
            if (!response.ok) {
                throw new Error('Failed to fetch student balance');
            }
            const data = await response.json();
            return data.balance;
        }
        catch (error) {
            console.error('Error fetching student balance:', error);
            return 0; // Dummy data
        }
    };

    const fetchAttendanceByStudent = async (studentId: string): Promise<EventStudent[]> => {
        try {
            const response = await fetch(`/api/eventAttendance?spaceId=${spaceId}&studentId=${studentId}&handler=student`)
            if (!response.ok) {
                throw new Error('Failed to fetch attendance data');
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error('Error fetching attendance data:', error);
            return []; // Dummy data
        }
    };

    const handleSwitchChange = (eventId: string, checked: boolean) => {
        setUpdatedStatus(prevState => ({
            ...prevState,
            [eventId]: checked,
        }));
    };

    // Handle attendance update
    const handleAttendanceUpdate = async () => {
        if (isSaving) return;

        setIsSaving(true);
        // get updated items 
        const allKeys = new Set([
            ...Object.keys(updatedStatus),
            ...Object.keys(updatedExtraPoints),
        ])
        try {
            for (const eventId of allKeys) {
                const event = attendanceEvents.find(e => e.id === eventId);
                if (!event) continue
                const eventType = eventTypes.find(e => e.id === event.eventTypeId);
                if (!eventType) continue;

                const isPresent = updatedStatus[event.id] ?? false;

                let points = isPresent ? eventType.attendancePoints ?? 0 : 0;
                if (updatedExtraPoints[eventId] != null) {
                    points += updatedExtraPoints[eventId]
                } else if (originalExtraPoints[eventId]) {
                    for (const [key, value] of Object.entries(originalExtraPoints[eventId])) {
                        const originalValue = originalExtraPoints[eventId]?.[key] ?? 0
                        if (value <= 0 && originalValue <= 0) continue

                        const extraPoint = eventType.extraPoints?.find((e) => e.name === key)
                        const pointValue = extraPoint?.points ?? 0
                        points += value * pointValue
                    }
                }
                const description =
                    updatedExtraPointsMap[eventId] ?? originalExtraPoints[eventId] ?? null

                await fetch(`/api/eventAttendance?spaceId=${spaceId}&studentId=${student.id}&eventId=${eventId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentId: student.id,
                        eventId,
                        isPresent: isPresent ? 1 : 0,
                        points,
                        description: description ? JSON.stringify(description) : null
                    })
                })

                // reset for next save
                setOriginalStatus((prev) => ({
                    ...prev,
                    [eventId]: isPresent,
                }));
                setOriginalExtraPoints((prev) => ({
                    ...prev,
                    [eventId]: {},
                }));

                onAttendanceUpdated(student, event, isPresent);
                setStudentBalance(await fetchStudentBalance(student.id));
            }
        } catch (error) {
            console.error('Error updating attendance:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Handle attendance update
    const handleAttendanceUpdateV1 = async () => {
        if (isSaving) return;

        setIsSaving(true);
        // get updated items 
        try {
            for (const event of attendanceEvents) {
                const isPresent = updatedStatus[event.id] ?? false;
                const eventType = eventTypes.find(e => e.id === event.eventTypeId);

                if (eventType) {
                    let points = isPresent ? eventType.attendancePoints ?? 0 : 0;
                    points += updatedExtraPoints[event.id] ?? 0;

                    //   await supabaseHelper.saveAttendance(
                    //     student.id,
                    //     event.id,
                    //     isPresent ? 1 : 0,
                    //     points
                    //   );
                    onAttendanceUpdated(student, event, isPresent);
                }
            }
        } catch (error) {
            console.error('Error updating attendance:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleExtraPointsDialogOpen = (event: Event) => {
        setSelectExtraPointsDialog(event);
    };

    const handleExtraPointsDialogClose = (selectedPoints: Record<string, number>, event: Event) => {
        const eventType = eventTypes.find((et) => et.id === event.eventTypeId)!
        const eventId = event.id;
        if (selectedPoints) {
            let extraPointsTotal = 0;
            var localUpdatedextraPointsMap = updatedExtraPointsMap[eventId] ??
                originalExtraPoints[eventId] ?? {};
            Object.entries(selectedPoints).forEach(([key, value]) => {
                const originalValue = originalExtraPoints[eventId]?.[key] ?? 0
                if (value <= 0 && (originalValue <= 0)) {
                    return;
                } else {
                    localUpdatedextraPointsMap[key] = value;
                    const extraPoint = eventType.extraPoints?.find((e) => e.name === key)
                    const pointValue = extraPoint?.points ?? 0
                    extraPointsTotal += value * pointValue
                }
            })
            console.log("Selected Extra Points:", extraPointsTotal);

            setUpdatedExtraPointsMap((prev) => ({
                ...prev,
                [eventId]: localUpdatedextraPointsMap,
            }));
            setUpdatedExtraPoints((prev) => ({
                ...prev,
                [eventId]: extraPointsTotal,
            }));
        }
        setSelectExtraPointsDialog(null);
    };

    const handleOpenManualTransactionDialog = (action: string) => {
        setAction(action);
        setOpenManualTransactionDialog(true);
    };

    const handleWithdrawDepositConfirm = async () => {
        if (amount > 0) {
            await handleWithdrawDepositAction(action, amount, comment);
            setStudentBalance(await fetchStudentBalance(student.id));
            setOpenManualTransactionDialog(false);
            setAmount(0);
            setComment('');
        } else {
            console.log('Amount should be greater than 0');
        }
    };

    const handleWithdrawDepositAction = async (action: string, amount: number, comment: string) => {
        console.log(`Action: ${action}, Amount: ${amount}, Comment: ${comment}`);

        await fetch(`/api/studentAccount?spaceId=${spaceId}&handler=transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId: student.id,
                amount: action.toLowerCase() == "Withdraw".toLowerCase() ? -1 * amount : amount,
                comment
            })
        })
    };

    const handleCloseManualTransactionDialog = () => {
        setOpenManualTransactionDialog(false);
        setAmount(0);
        setComment('');
    };

    if (isLoading) {
        return <div className="flex justify-center items-center">Loading...</div>
    }

    return (
        <div>
            {/* <Typography variant="h6">{student.name} Actions</Typography>
            <Typography variant="body2">Date of Birth: {student.dob}</Typography> */}
            <div className="flex justify-between items-center mt-4">
                <Button variant="outline" onClick={() => handleOpenManualTransactionDialog("withdraw")}>
                    Withdraw
                </Button>
                <span>Balance: {studentBalance}</span>
                <Button variant="outline" onClick={() => handleOpenManualTransactionDialog("deposit")}>
                    Deposit
                </Button>
            </div>
            <hr className="mt-4" />
            <div>
                {attendanceEvents.map(event => {
                    const eventType = eventTypes.find(e => e.id === event.eventTypeId);
                    return (
                        <div key={event.id} className="flex items-center justify-between px-4 py-2">
                            {/* <ListItemIcon>
                                <Edit />
                            </ListItemIcon> */}
                            <div>
                                <div className="font-semibold">{event.name}</div>
                                <div className="text-sm text-muted-foreground">{eventType?.name}</div>
                            </div>
                            {eventType?.extraPoints && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleExtraPointsDialogOpen(event)}
                                        className="p-0"
                                    >
                                        <Edit className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            )}
                            <Switch
                                checked={updatedStatus[event.id] ?? originalStatus[event.id] ?? false}
                                onCheckedChange={checked => handleSwitchChange(event.id, checked)}
                            />
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={() => { }}>
                    Close
                </Button>
                <Button onClick={handleAttendanceUpdate} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save"}
                </Button>
            </div>

            {/* Dialog for Manual Transaction */}
            <Dialog open={openManualTransactionDialog} onOpenChange={handleCloseManualTransactionDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{action} Funds</DialogTitle>
                    </DialogHeader>
                    <Input
                        type="number"
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="mb-4"
                    />
                    <Input
                        placeholder="Comment (Optional)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="mb-4"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseManualTransactionDialog}>
                            Cancel
                        </Button>
                        <Button onClick={handleWithdrawDepositConfirm}>Confirm</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog for extra points */}
            {selectExtraPointsDialog && (
                <EventSelectionDialog
                    eventType={eventTypes.find((et) => et.id === selectExtraPointsDialog.eventTypeId)!}
                    event={selectExtraPointsDialog}
                    initialValue={updatedExtraPointsMap[selectExtraPointsDialog.id] ?? originalExtraPoints[selectExtraPointsDialog.id]}
                    onSave={(selectedPoints) => handleExtraPointsDialogClose(selectedPoints, selectExtraPointsDialog)}
                    onClose={() => setSelectExtraPointsDialog(null)}
                />
            )}
        </div>
    );
};

interface EventSelectionDialogProps {
    eventType: EventType;
    event: Event;
    initialValue?: Record<string, number>;
    onSave: (selectedPoints: Record<string, number>) => void;
    onClose: () => void;
}

export const EventSelectionDialog: React.FC<EventSelectionDialogProps> = ({ eventType, event, initialValue, onSave, onClose }) => {
    const [selectedPoints, setSelectedPoints] = useState<Record<string, number>>({});
    const [extraPoints, setExtraPoints] = useState<{ name: string; points: number; maxPoints?: number }[]>([]);

    useEffect(() => {
        const initPoints: Record<string, number> = {};
        eventType.extraPoints?.forEach((entry) => {
            initPoints[entry['name']] = initialValue?.[entry['name']] ?? 0;
        });
        setExtraPoints(eventType.extraPoints?.map((ep) => ({
            name: ep['name'],
            points: ep['points'],
            maxPoints: ep['max_points'] ?? 1
        })) ?? []);
        setSelectedPoints(initPoints);
    }, [eventType, initialValue]);

    const handleChangePoints = (name: string, delta: number) => {
        setSelectedPoints((prev) => {
            const currentPoints = prev[name] ?? 0;
            const newPoints = currentPoints + delta;
            return { ...prev, [name]: newPoints < 0 ? 0 : newPoints };
        });
    };

    const handleSave = () => {
        onSave(selectedPoints);
        onClose();
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select Extra Points for {eventType.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {extraPoints.map((entry) => (
                        <div key={entry.name} className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{entry.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    Points: {entry.points} → Total: {(selectedPoints[entry.name] ?? 0) * entry.points}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleChangePoints(entry.name, -1)}
                                    disabled={selectedPoints[entry.name] === 0}
                                >
                                    -
                                </Button>
                                <span className="text-sm font-medium">{selectedPoints[entry.name] ?? 0}</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleChangePoints(entry.name, 1)}
                                    disabled={selectedPoints[entry.name] === (entry.maxPoints ?? 1)}
                                >
                                    +
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};