"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { useParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Group } from "@/lib/db/schema"

export default function CreateStudentPage() {
    const params = useParams()
    const router = useRouter()
    const spaceId = params?.space_id as string
    const [name, setName] = useState("")
    const [dob, setDob] = useState("")
    const [gender, setGender] = useState("male")
    const [groupId, setGroupId] = useState("")
    const [groups, setGroups] = useState<Group[]>([])
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch groups for dropdown
    useEffect(() => {
        if (!spaceId) return
        fetch(`/api/groups?spaceId=${spaceId}`)
            .then(res => res.json())
            .then(setGroups)
            .catch(() => setGroups([]))
    }, [spaceId])

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
        // You need to implement an API route for uploading to Supabase Storage
        // const res = await fetch(`/api/upload?bucket=students&filename=${fileName}`, {
        const res = await fetch(`/api/upload?bucket=${spaceId}_profile&filename=${fileName}`, {
            method: "POST",
            body: formData,
        })
        if (!res.ok) throw new Error("Failed to upload image")
        const { publicUrl } = await res.json()
        return publicUrl
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        let imagePath = ""

        try {
            if (imageFile) {
                imagePath = await uploadImage(imageFile)
            }
            const res = await fetch(`/api/students`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, dob, gender, groupId, imagePath, spaceId }),
            })

            if (res.ok) {
                router.push(`/${spaceId}/admin/students`)
            } else {
                const errorData = await res.json().catch(() => ({}))
                setError(errorData.message || "Failed to create student")
            }
        } catch (err: any) {
            setError(err.message || "Failed to create student")
        }
        setLoading(false)
    }

    return (
        <main className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Create Student</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && <div className="text-red-500">{error}</div>}
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
                <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Student"}
                </Button>
            </form>
        </main>
    )
}