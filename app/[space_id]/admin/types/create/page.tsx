"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EventTypeIconOptions } from "@/lib/utils"

export default function CreateEventTypePage() {
    const params = useParams()
    const router = useRouter()
    const spaceId = params?.space_id as string

    const [name, setName] = useState("")
    const [icon, setIcon] = useState("")
    const [attendancePoints, setAttendancePoints] = useState<number | null>(null)
    const [acceptsActivities, setAcceptsActivities] = useState(false)
    const [extraPoints, setExtraPoints] = useState<Array<{ name: string; points: number; max_points: number }>>([])
    const [pointTypeName, setPointTypeName] = useState("")
    const [pointTypePoints, setPointTypePoints] = useState<number | null>(null)
    const [pointTypeMaxPoints, setPointTypeMaxPoints] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleAddPointType = () => {
        if (pointTypeName && pointTypePoints !== null && pointTypeMaxPoints !== null) {
            setExtraPoints([
                ...extraPoints,
                { name: pointTypeName, points: pointTypePoints, max_points: pointTypeMaxPoints },
            ])
            setPointTypeName("")
            setPointTypePoints(null)
            setPointTypeMaxPoints(null)
        }
    }

    const handleRemovePointType = (index: number) => {
        setExtraPoints(extraPoints.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const res = await fetch(`/api/types`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    icon,
                    attendancePoints,
                    acceptsActivities,
                    extraPoints,
                    spaceId,
                }),
            })

            if (res.ok) {
                router.push(`/${spaceId}/admin/types`)
            } else {
                const errorData = await res.json().catch(() => ({}))
                setError(errorData.message || "Failed to create event type")
            }
        } catch (err: any) {
            setError(err.message || "Failed to create event type")
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Create Event Type</h1>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        type="text"
                        placeholder="Enter event type name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="icon">Icon</Label>
                    <Select value={icon} onValueChange={setIcon}>
                        <SelectTrigger id="icon">
                            <SelectValue placeholder="Select an icon" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(EventTypeIconOptions).map(([key, Icon]) => (
                                <SelectItem key={key} value={key}>
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4 text-gray-500" />
                                        <span>{key}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="attendancePoints">Attendance Points</Label>
                    <Input
                        id="attendancePoints"
                        type="number"
                        placeholder="Enter attendance points (optional)"
                        value={attendancePoints ?? ""}
                        onChange={(e) => setAttendancePoints(e.target.value ? parseInt(e.target.value, 10) : null)}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <Label htmlFor="acceptsActivities">Accepts Activities</Label>
                    <Switch
                        id="acceptsActivities"
                        checked={acceptsActivities}
                        onCheckedChange={setAcceptsActivities}
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Extra Points</h3>
                    <div className="flex items-center gap-4">
                        <Input
                            type="text"
                            placeholder="Name"
                            value={pointTypeName}
                            onChange={(e) => setPointTypeName(e.target.value)}
                        />
                        <Input
                            type="number"
                            placeholder="Points"
                            value={pointTypePoints ?? ""}
                            onChange={(e) => setPointTypePoints(e.target.value ? parseInt(e.target.value, 10) : null)}
                        />
                        <Input
                            type="number"
                            placeholder="Max Count"
                            value={pointTypeMaxPoints ?? ""}
                            onChange={(e) => setPointTypeMaxPoints(e.target.value ? parseInt(e.target.value, 10) : null)}
                        />
                        <Button type="button" onClick={handleAddPointType}>
                            Add
                        </Button>
                    </div>
                    <table className="table-auto w-full border-collapse border border-gray-300 mt-4">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Points</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Max Count</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {extraPoints.map((pointType, index) => (
                                <tr key={index}>
                                    <td className="border border-gray-300 px-4 py-2">{pointType.name}</td>
                                    <td className="border border-gray-300 px-4 py-2">{pointType.points}</td>
                                    <td className="border border-gray-300 px-4 py-2">{pointType.max_points}</td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleRemovePointType(index)}
                                        >
                                            Remove
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Event Type"}
                </Button>
            </form>
        </main>
    )
}