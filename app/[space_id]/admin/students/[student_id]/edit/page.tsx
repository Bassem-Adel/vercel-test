"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { useParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Group, Student, User } from "@/lib/db/schema"

export default function EditStudentPage() {
    const params = useParams()
    const router = useRouter()
    const spaceId = params?.space_id as string
    const studentId = params?.student_id as string

    const [name, setName] = useState("")
    const [dob, setDob] = useState("")
    const [gender, setGender] = useState("male")
    const [embedding, setEmbedding] = useState<string | null>(null)
    const [groupId, setGroupId] = useState("")
    const [mentorId, setMentorId] = useState("")
    const [groups, setGroups] = useState<Group[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch student and groups data
    useEffect(() => {
        if (!spaceId || !studentId) return

        setLoading(true)
        setError(null)

        Promise.all([
            fetch(`/api/students?spaceId=${spaceId}&studentId=${studentId}`).then(res => res.json()),
            fetch(`/api/groups?spaceId=${spaceId}`).then(res => res.json()),
            fetch(`/api/users?spaceId=${spaceId}`).then(res => res.json()),
        ])
            .then(([studentData, groupsData, usersData]) => {
                setName(studentData.name)
                setDob(studentData.dob)
                setEmbedding(studentData.embedding)
                setGender(studentData.gender)
                setGroupId(studentData.groupId)
                setMentorId(studentData.mentorId)
                setImagePreview(studentData.imagePath)
                setGroups(groupsData)
                setUsers(usersData)
            })
            .catch(() => setError("Failed to load student or groups or users"))
            .finally(() => setLoading(false))
    }, [spaceId, studentId])

    // Handle file selection
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0])
            setImagePreview(URL.createObjectURL(e.target.files[0]))
        }
    }

    // Upload image to Supabase Storage and return the public URL
    const uploadImage = async (file: File) => {
        const fileName = `${Date.now()}-${file.name}`
        const formData = new FormData()
        formData.append("file", file)
        const res = await fetch(`/api/upload?bucket=${spaceId}_profile&filename=${fileName}`, {
            method: "POST",
            body: formData,
        })
        if (!res.ok) throw new Error("Failed to upload image")
        const { publicUrl } = await res.json()
        return publicUrl
    }

    const goBack = () => {
        if (window.history.length > 1) {
            router.back() // navigates to the previous page in browser history
        } else {
            router.push(`/${spaceId}/admin/students`) // fallback if there's no history
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        let imagePath = imagePreview

        try {
            if (imageFile) {
                imagePath = await uploadImage(imageFile)
            }

            const res = await fetch(`/api/students`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: studentId, name, dob, gender, groupId, mentorId, embedding, imagePath, spaceId }),
            })

            if (res.ok) {
                goBack()
            } else {
                const errorData = await res.json().catch(() => ({}))
                setError(errorData.message || "Failed to update student")
            }
        } catch (err: any) {
            setError(err.message || "Failed to update student")
        }
        setLoading(false)
    }

    return (
        <main className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Edit Student</h1>
            {loading && <div>Loading...</div>}
            {error && <div className="text-red-500">{error}</div>}
            {!loading && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Enter student name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Input
                                id="dob"
                                type="date"
                                value={dob}
                                onChange={e => setDob(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select value={gender} onValueChange={setGender}>
                                <SelectTrigger id="gender">
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="group">Group</Label>
                            <Select value={groupId} onValueChange={setGroupId}>
                                <SelectTrigger id="group">
                                    <SelectValue placeholder="Select group" />
                                </SelectTrigger>
                                <SelectContent>
                                    {groups.map(group => (
                                        <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mentor">Mentor</Label>
                            <Select value={mentorId} onValueChange={setMentorId}>
                                <SelectTrigger id="mentor">
                                    <SelectValue placeholder="Select mentor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map(user => (
                                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="imageFile">Image</Label>
                        <Input
                            id="imageFile"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        {imagePreview && (
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="mt-2 h-32 w-32 object-cover rounded border"
                            />
                        )}
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={goBack}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Updating..." : "Update Student"}
                        </Button>
                    </div>
                </form>
            )}
        </main>
    )
}