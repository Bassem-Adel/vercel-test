"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"

export default function StudentDetailsPage() {
  const params = useParams()
  const studentId = params?.student_id as string
  const spaceId = params?.space_id as string

  const [student, setStudent] = useState<any>(null)
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState("info")

  useEffect(() => {
    async function fetchStudentDetails() {
      try {
        setLoading(true)
        const studentRes = await fetch(`/api/students?spaceId=${spaceId}&studentId=${studentId}`)
        // const balanceRes = await fetch(`/api/students/${studentId}/balance`)
        // const transactionsRes = await fetch(`/api/students/${studentId}/transactions`)
        // const attendanceRes = await fetch(`/api/students/${studentId}/attendance`)

        // if (!studentRes.ok || !balanceRes.ok || !transactionsRes.ok || !attendanceRes.ok) {
        if (!studentRes.ok || false || false || false) {
          throw new Error("Failed to fetch student details")
        }

        const studentData = await studentRes.json()
        // const balanceData = await balanceRes.json()
        // const transactionsData = await transactionsRes.json()
        // const attendanceData = await attendanceRes.json()

        setStudent(studentData)
        setBalance(0) // Assuming balance is a number, you can set it directly
        // setBalance(balanceData.balance)
        // setTransactions(transactionsData)
        // setAttendance(attendanceData)
      } catch (err: any) {
        setError(err.message || "Failed to load student details")
      } finally {
        setLoading(false)
      }
    }

    fetchStudentDetails()
  }, [studentId])

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <main className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {student?.imagePath ? (
          <Avatar className="h-20 w-20">
              <img
                src={student.imagePath || `https://ui-avatars.com/api/?name=${student.name}&background=random`}
                alt={student.name}
                className="h-20 w-20 rounded-full object-cover mb-4 border"
              />
          </Avatar>
        ) : (
          <Avatar className="h-20 w-20">
            <span className="text-xl font-bold">{student?.name?.charAt(0)}</span>
          </Avatar>
        )}
        <div>
          <h1 className="text-2xl font-bold">{student?.name || "N/A"}</h1>
          <p className="text-lg">Balance: {balance}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="missings">Missings</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="points">Points</TabsTrigger>
          <TabsTrigger value="ideas">Ideas</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info">
          <div>
            <h2 className="text-xl font-bold mb-4">Additional Info</h2>
            <p>Gender: {student?.gender || "N/A"}</p>
            <p>Date of Birth: {student?.dob || "N/A"}</p>
            <p>Group: {student?.groupId || "N/A"}</p>
          </div>
        </TabsContent>

        {/* Missings Tab */}
        <TabsContent value="missings">
          <div>
            <h2 className="text-xl font-bold mb-4">Missings</h2>
            <Button>Add Missing</Button>
            {/* Render missings here */}
          </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <div>
            <h2 className="text-xl font-bold mb-4">Attendance</h2>
            {/* Render attendance here */}
          </div>
        </TabsContent>

        {/* Points Tab */}
        <TabsContent value="points">
          <div>
            <h2 className="text-xl font-bold mb-4">Points</h2>
            <ul>
              {transactions.map((transaction, index) => (
                <li key={index}>
                  <p>{transaction.comment || "No comment"}</p>
                  <p>Points: {transaction.points}</p>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        {/* Ideas Tab */}
        <TabsContent value="ideas">
          <div>
            <h2 className="text-xl font-bold mb-4">Ideas</h2>
            <p>New ideas are welcomed!</p>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}