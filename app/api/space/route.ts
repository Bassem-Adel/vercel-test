import { createClient } from '@/utils/supabase/server'
import type { Space } from '@/lib/db/schema';

export async function GET(request: Request) {
    const supabase = await createClient()
    const user = await supabase.auth.getUser();
    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId')

    if (!user)
        return Response.json(null);

    const { data, error } = await supabase
        .from("profile_space")
        .select("spaces(*)")
        .eq("profile_id", user.data.user?.id);

    if (error) throw error;

    const fetchedSpaces: Space[] = data?.filter((item: any) => {
        if (spaceId) {
            return item.spaces.id === spaceId;
        }
        return true; // If no spaceId is provided, return all spaces
    }).map((item: any) => ({
        id: item.spaces.id,
        name: item.spaces.name,
        createdAt: item.spaces.created_at,
        updatedAt: item.spaces.updated_at,
    })) || [];

    fetchedSpaces.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return Response.json(spaceId ? fetchedSpaces[0] : fetchedSpaces);
}