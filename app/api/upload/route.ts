import { createClient } from "@/utils/supabase/server"

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const bucket = searchParams.get("bucket")
        const filename = searchParams.get("filename")

        if (!bucket || !filename) {
            return Response.json({ message: "Missing bucket or filename" }, { status: 400 })
        }

        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return Response.json({ message: "No file provided" }, { status: 400 })
        }

        const { error } = await supabase.storage.from(bucket).upload(filename, file.stream(), {
            contentType: file.type,
            duplex: 'half'
        })

        if (error) {
            console.error("Supabase storage error:", error)
            return Response.json({ message: "Error uploading file", error }, { status: 500 })
        }

        // const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filename)
        const { data: publicUrlData } = await supabase.storage.from(bucket).createSignedUrl(filename, 60 * 60 * 24 * 365 * 10)

        // return Response.json({ message: "File uploaded successfully", publicUrl: publicUrlData.publicUrl })
        return Response.json({ message: "File uploaded successfully", publicUrl: publicUrlData?.signedUrl }, { status: 201 })
    } catch (err) {
        console.error("Unexpected error in POST /api/upload:", err)
        return Response.json({ message: "Internal server error", error: String(err) }, { status: 500 })
    }
}