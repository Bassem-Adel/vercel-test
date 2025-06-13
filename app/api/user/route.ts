import { createClient } from '@/utils/supabase/server'
// import { getUser } from '@/lib/db/queries';

export async function GET() {
    //   const user = await getUser();
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser();
    if (data?.user) {
        return Response.json({
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || '',
            updatedAt: data.user.updated_at || null
        });
    }
    return Response.json(null);
}