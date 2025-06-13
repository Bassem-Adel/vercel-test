"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Group } from "@/lib/db/schema"
import { isDescendant } from "@/lib/utils"

export default function GroupsPage() {
    const params = useParams()
    const spaceId = params?.space_id as string

    const [groups, setGroups] = useState<Group[]>([])
    const [groupPoints, setGroupPoints] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [openFormDialog, setOpenFormDialog] = useState(false)
    const [openTransactionDialog, setOpenTransactionDialog] = useState(false)
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
    const [groupName, setGroupName] = useState("")
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
    const [amount, setAmount] = useState<number | string>("")
    const [comment, setComment] = useState("")

    useEffect(() => {
        async function loadGroups() {
            setLoading(true)
            try {
                const groupsRes = await fetch(`/api/groups?spaceId=${spaceId}`)
                const pointsRes = await fetch(`/api/groups?spaceId=${spaceId}&handler=points`)
                // const pointsRes = await fetch(`/api/groups?spaceId=${spaceId}&includePoints=true`)
                // const pointsRes = await fetch(`/api/points?spaceId=${spaceId}&type=group`)

                if (!groupsRes.ok || !pointsRes.ok) {
                    throw new Error("Failed to fetch data")
                }

                const groupsData = await groupsRes.json()
                const pointsData = await pointsRes.json()

                setGroups(groupsData)
                setGroupPoints(pointsData)
            } catch (err: any) {
                setError(err.message || "Failed to load data")
            } finally {
                setLoading(false)
            }
        }

        if (spaceId) {
            loadGroups()
        }
    }, [spaceId])

    const handleAddGroup = async () => {
        if (groupName.trim()) {
            try {
                const res = await fetch("/api/groups", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: groupName, parentId: selectedParentId, spaceId }),
                })

                if (!res.ok) throw new Error("Failed to add group")
                setGroupName("")
                setSelectedParentId(null)
                setOpenFormDialog(false)
                const updatedGroups = await fetch(`/api/groups?spaceId=${spaceId}`).then(res => res.json())
                setGroups(updatedGroups)
            } catch (err: any) {
                setError(err.message || "Failed to add group")
            }
        }
    }

    const handleUpdateGroup = async () => {
        if (groupName.trim() && selectedGroup) {
            try {
                const res = await fetch("/api/groups", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: selectedGroup.id, name: groupName, parentId: selectedParentId, spaceId }),
                })

                if (!res.ok) throw new Error("Failed to update group")
                setGroupName("")
                setSelectedParentId(null)
                setSelectedGroup(null)
                setOpenFormDialog(false)
                const updatedGroups = await fetch(`/api/groups?spaceId=${spaceId}`).then(res => res.json())
                setGroups(updatedGroups)
            } catch (err: any) {
                setError(err.message || "Failed to update group")
            }
        }
    }

    const handleDeleteGroup = async (groupId: string) => {
        try {
            const res = await fetch(`/api/groups?id=${groupId}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed to delete group")
            const updatedGroups = await fetch(`/api/groups?spaceId=${spaceId}`).then(res => res.json())
            setGroups(updatedGroups)
        } catch (err: any) {
            setError(err.message || "Failed to delete group")
        }
    }

    const handleAddPointsTransaction = async () => {
        try {
            const res = await fetch("/api/groups/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ groupId: selectedGroup?.id, amount, comment, spaceId }),
            })

            if (!res.ok) throw new Error("Failed to add transaction")
            setAmount("")
            setComment("")
            setOpenTransactionDialog(false)
        } catch (err: any) {
            setError(err.message || "Failed to add transaction")
        }
    }

    const renderGroupList = (groups: Group[], parentId: string | null = null) => {
        return groups
            .filter(group => group.parentId === parentId)
            .map(group => (
                <div key={group.id} className="pt-3">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-bold">{group.name}</p>
                            <p className="text-sm text-gray-500">Points: {groupPoints.find(g => g.id === group.id)?.totalPoints || 0}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => { setSelectedGroup(group); setGroupName(group.name); setSelectedParentId(group.parentId); setOpenFormDialog(true) }}>Edit</Button>
                            <Button variant="outline" onClick={() => { setSelectedGroup(group); setOpenTransactionDialog(true) }}>Points</Button>
                            <Button variant="destructive" onClick={() => handleDeleteGroup(group.id)}>Delete</Button>
                        </div>
                    </div>
                    <div className="ml-4">{renderGroupList(groups, group.id)}</div>
                </div>
            ))
    }

    return (
        <main className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Manage Groups</h2>
                <Button onClick={() => setOpenFormDialog(true)}>Create Group</Button>
            </div>
            {loading ? <div>Loading...</div> : <div>{renderGroupList(groups)}</div>}

            {/* Group Form Dialog */}
            <Dialog open={openFormDialog} onOpenChange={setOpenFormDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedGroup ? "Update Group" : "Add Group"}</DialogTitle>
                    </DialogHeader>
                    <Input
                        placeholder="Group Name"
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                        className="mb-4"
                    />
                    <Select value={selectedParentId || "none"} onValueChange={setSelectedParentId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Parent Group" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {groups.filter(group => group.id !== selectedGroup?.id && !isDescendant(groups, selectedGroup?.id ?? '', group.id)).map(group => (
                                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenFormDialog(false)}>Cancel</Button>
                        <Button onClick={selectedGroup ? handleUpdateGroup : handleAddGroup}>{selectedGroup ? "Update" : "Add"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Points Transaction Dialog */}
            <Dialog open={openTransactionDialog} onOpenChange={setOpenTransactionDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Points Transaction</DialogTitle>
                    </DialogHeader>
                    <Input
                        placeholder="Amount"
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="mb-4"
                    />
                    <Input
                        placeholder="Comment"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        className="mb-4"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenTransactionDialog(false)}>Cancel</Button>
                        <Button onClick={handleAddPointsTransaction}>Submit</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    )
}