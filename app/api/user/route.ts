import { createClient } from '@/utils/supabase/server'
// import { getUser } from '@/lib/db/queries';

export async function GET() {
    //   const user = await getUser();
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (data?.user) {
        return Response.json({
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || data.user.user_metadata?.username || '',
            updatedAt: data.user.updated_at || null,
        })
    }
    return Response.json(null)
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const body = await request.json()
    const { newPassword } = body

    if (!newPassword) {
        return new Response(
            JSON.stringify({ error: 'Password is required' }),
            { status: 400 }
        )
    }

    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    })

    if (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400 }
        )
    }

    return new Response(
        JSON.stringify({ message: 'Password updated successfully' }),
        { status: 200 }
    )
}