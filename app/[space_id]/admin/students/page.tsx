"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import type { Group, Student, User } from "@/lib/db/schema"
import { Info, Pencil, Trash2, Plus, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { isDescendant } from "@/lib/utils"

export default function StudentsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const spaceId = params?.space_id as string
  
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  
  // Get filters from URL or use defaults
  const [filter, setFilter] = useState(searchParams.get('search') || "")
  const [genderFilter, setGenderFilter] = useState(searchParams.get('gender') || "all")
  const [groupFilter, setGroupFilter] = useState(searchParams.get('group') || "all")
  const [showFilters, setShowFilters] = useState(
    searchParams.get('showFilters') === 'true' || 
    searchParams.has('search') || 
    searchParams.has('gender') || 
    searchParams.has('group')
  )

  // Function to update URL with current filters
  const updateURL = (newFilters: {
    search?: string
    gender?: string
    group?: string
    showFilters?: boolean
  }) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    
    // Update or remove search filter
    if (newFilters.search !== undefined) {
      if (newFilters.search) {
        current.set('search', newFilters.search)
      } else {
        current.delete('search')
      }
    }
    
    // Update or remove gender filter
    if (newFilters.gender !== undefined) {
      if (newFilters.gender !== 'all') {
        current.set('gender', newFilters.gender)
      } else {
        current.delete('gender')
      }
    }
    
    // Update or remove group filter
    if (newFilters.group !== undefined) {
      if (newFilters.group !== 'all') {
        current.set('group', newFilters.group)
      } else {
        current.delete('group')
      }
    }
    
    // Update or remove showFilters
    if (newFilters.showFilters !== undefined) {
      if (newFilters.showFilters) {
        current.set('showFilters', 'true')
      } else {
        current.delete('showFilters')
      }
    }

    const search = current.toString()
    const query = search ? `?${search}` : ""
    
    // Use replace to avoid adding to browser history for every filter change
    router.replace(`/${spaceId}/admin/students${query}`, { scroll: false })
  }

  // Handle filter changes
  const handleFilterChange = (value: string) => {
    setFilter(value)
    updateURL({ search: value })
  }

  const handleGenderFilterChange = (value: string) => {
    setGenderFilter(value)
    updateURL({ gender: value })
  }

  const handleGroupFilterChange = (value: string) => {
    setGroupFilter(value)
    updateURL({ group: value })
  }

  const handleShowFiltersToggle = () => {
    const newShowFilters = !showFilters
    setShowFilters(newShowFilters)
    updateURL({ showFilters: newShowFilters })
  }

  // Clear all filters
  const clearFilters = () => {
    setFilter("")
    setGenderFilter("all")
    setGroupFilter("all")
    setShowFilters(false)
    router.replace(`/${spaceId}/admin/students`, { scroll: false })
  }

  useEffect(() => {
    if (!spaceId) return
    setLoading(true)
    setError(null)
    // Fetch students and groups in parallel
    Promise.all([
      fetch(`/api/students?spaceId=${spaceId}`).then(async res => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.message || "Failed to load students")
        }
        return res.json()
      }),
      fetch(`/api/groups?spaceId=${spaceId}`).then(async res => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.message || "Failed to load groups")
        }
        return res.json()
      }),
      fetch(`/api/users?spaceId=${spaceId}`).then(async res => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.message || "Failed to load users")
        }
        return res.json()
      }),
    ])
      .then(([studentsData, groupsData, usersData]) => {
        setStudents(studentsData)
        setGroups(groupsData)
        setUsers(usersData)
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to load students or groups or users")
        setLoading(false)
      })
  }, [spaceId])

  // Update state when URL changes (browser back/forward)
  useEffect(() => {
    setFilter(searchParams.get('search') || "")
    setGenderFilter(searchParams.get('gender') || "all")
    setGroupFilter(searchParams.get('group') || "all")
    setShowFilters(
      searchParams.get('showFilters') === 'true' || 
      searchParams.has('search') || 
      searchParams.has('gender') || 
      searchParams.has('group')
    )
  }, [searchParams])

  // Build a map of groupId to groupName for fast lookup
  const groupMap = groups.reduce<Record<string, string>>((acc, group) => {
    acc[group.id] = group.name
    return acc
  }, {})

  // Build a map of userId to userName for fast lookup
  const userMap = users.reduce<Record<string, string>>((acc, user) => {
    acc[user.id] = user.name
    return acc
  }, {})

  // Delete handler
  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    const res = await fetch(`/api/students?id=${deleteId}`, { method: "DELETE" })
    if (res.ok) {
      setStudents(students.filter(s => s.id !== deleteId))
      setDeleteId(null)
    } else {
      // Optionally handle error
      setDeleteId(null)
    }
    setDeleting(false)
  }

  // Filter students by name, gender, and group
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(filter.toLowerCase()) &&
    (genderFilter === "all" || (student.gender?.toLowerCase?.() === genderFilter)) &&
    (groupFilter === "all" || (student.groupId === groupFilter) || isDescendant(groups, groupFilter, student.groupId))
  )

  // Check if any filters are active
  const hasActiveFilters = filter || genderFilter !== "all" || groupFilter !== "all"

  return (
    <main className="max-w-6xl mx-auto py-8 px-4">
      {/* Title and Create Button */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Students</h1>
          {!hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filteredStudents.length} of {students.length} students
              </span>
            </div>
          )}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filteredStudents.length} of {students.length} students
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-6 text-xs"
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            className="flex items-center gap-1"
            onClick={handleShowFiltersToggle}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/20 rounded-full">
                {[filter ? 1 : 0, genderFilter !== "all" ? 1 : 0, groupFilter !== "all" ? 1 : 0].reduce((a, b) => a + b, 0)}
              </span>
            )}
          </Button>
          <Button
            className="flex items-center gap-1"
            onClick={() => router.push(`/${spaceId}/admin/students/create`)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Student</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="relative flex-1">
            <Filter className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Filter by name"
              value={filter}
              onChange={e => handleFilterChange(e.target.value)}
              className="pl-8 pr-2 py-2 w-full sm:w-56"
            />
          </div>
          <Select value={genderFilter} onValueChange={handleGenderFilterChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
          <Select value={groupFilter} onValueChange={handleGroupFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {groups.map(group => (
                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-1"
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map(student => (
            <div
              key={student.id}
              className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 flex flex-col items-center"
            >
              <div className="flex items-center justify-between w-full">
                <img
                  src={student.imagePath || `https://ui-avatars.com/api/?name=${student.name}&background=random`}
                  alt={student.name}
                  className="h-32 w-32 rounded-xl object-cover border"
                />
                <div className="flex-1 ml-4">
                  <div className="text-lg font-semibold">{student.name}</div>
                  <div className="text-lg text-gray-500 dark:text-gray-400 mb-2">{student.dob}</div>
                  <div className="text-sm text-gray-400 dark:text-gray-500">
                    Group: {groupMap[student.groupId] || student.groupId || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500">
                    Mentor: {userMap[student.mentorId] || student.mentorId || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-2 items-center justify-between w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  title="Info"
                  onClick={() => router.push(`/${spaceId}/admin/students/${student.id}`)}
                >
                  <Info className="h-4 w-4" /> Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  title="Edit"
                  onClick={() => router.push(`/${spaceId}/admin/students/${student.id}/edit`)}
                >
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-1"
                  title="Delete"
                  onClick={() => setDeleteId(student.id)}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {!loading && !error && filteredStudents.length === 0 && students.length > 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No students match the current filters.</p>
          <Button variant="outline" onClick={clearFilters} className="mt-2">
            Clear all filters
          </Button>
        </div>
      )}

      {/* Confirmation Modal */}
      <Dialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this student?</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}