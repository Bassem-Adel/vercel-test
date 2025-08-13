"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useParams } from "next/navigation"
import { Plus } from "lucide-react"
import { User } from "@/lib/db/schema"

export default function UsersPage() {
    const params = useParams()
    const spaceId = params?.space_id as string

    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [addUserModalOpen, setAddUserModalOpen] = useState(false)
    const [deleteUserModalOpen, setDeleteUserModalOpen] = useState(false)
    const [email, setEmail] = useState("")
    const [deleteUserId, setDeleteUserId] = useState<string | null>(null)

    useEffect(() => {
        async function fetchUsers() {
            try {
                setLoading(true)
                const res = await fetch(`/api/users?spaceId=${spaceId}`)
                if (!res.ok) throw new Error("Failed to fetch users")
                const data = await res.json()
                setUsers(data)
            } catch (err: any) {
                setError(err.message || "Failed to load users")
            } finally {
                setLoading(false)
            }
        }

        fetchUsers()
    }, [spaceId])

    const handleAddUser = async () => {
        if (!email.trim()) {
            alert("Please enter an email.")
            return
        }

        try {
            const res = await fetch(`/api/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, spaceId }),
            })

            if (!res.ok) {
                const errorData = await res.json()
                alert(errorData.message || "Failed to add user.")
                return
            }

            const newUser = await res.json()
            setUsers([...users, newUser])
            setEmail("")
            setAddUserModalOpen(false)
        } catch (err: any) {
            alert(err.message || "Failed to add user.")
        }
    }

    const handleDeleteUser = async () => {
        if (!deleteUserId) return

        try {
            const res = await fetch(`/api/users?spaceId=${spaceId}&id=${deleteUserId}`, {
                method: "DELETE",
            })

            if (!res.ok) {
                const errorData = await res.json()
                alert(errorData.message || "Failed to delete user.")
                return
            }

            setUsers(users.filter(user => user.id !== deleteUserId))
            setDeleteUserId(null)
            setDeleteUserModalOpen(false)
        } catch (err: any) {
            alert(err.message || "Failed to delete user.")
        }
    }

    if (loading) return <div>Loading...</div>
    if (error) return <div className="text-red-500">{error}</div>

    return (
        <main className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Users</h1>
                <Button onClick={() => setAddUserModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add User
                    </span>
                </Button>
            </div>
            <div className="space-y-4">
                {users.map(user => (
                    <div
                        key={user.id}
                        className="flex items-center justify-between border rounded-lg p-4"
                    >
                        <div>
                            <p className="text-lg font-semibold">{user.name}</p>
                            <p className="text-sm text-gray-500">Email: {user.email || "N/A"}</p>
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                                setDeleteUserId(user.id)
                                setDeleteUserModalOpen(true)
                            }}
                        >
                            Delete
                        </Button>
                    </div>
                ))}
            </div>

            {/* Add User Modal */}
            <Dialog open={addUserModalOpen} onOpenChange={setAddUserModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add User</DialogTitle>
                    </DialogHeader>
                    <Input
                        type="email"
                        placeholder="Enter user email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-4"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddUserModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddUser}>Add</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete User Confirmation Modal */}
            <Dialog open={deleteUserModalOpen} onOpenChange={setDeleteUserModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this user?</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteUserModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteUser}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    )
}