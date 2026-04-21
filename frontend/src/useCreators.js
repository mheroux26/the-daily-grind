import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

/**
 * Hook for community-submitted BookTok creators.
 * Fetches from Supabase `creators` table, allows adding new ones.
 */
export function useCreators(userId) {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCreators = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("creators")
        .select("*, submitted_by_user:users!creators_submitted_by_fkey(nickname)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCreators(
        (data || []).map((c) => ({
          id: c.id,
          name: c.name,
          handle: c.tiktok_handle ? `@${c.tiktok_handle}` : null,
          tiktok: c.tiktok_url,
          instagram: c.instagram_url,
          avatar: c.avatar_emoji || "📚",
          isSelf: c.is_self,
          submittedBy: c.submitted_by_user?.nickname || "unknown",
          submittedById: c.submitted_by,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch creators:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  async function addCreator({ name, tiktokHandle, tiktokUrl, instagramUrl, avatarEmoji, isSelf }) {
    if (!userId) return;

    // Clean up tiktok handle — strip @ if user includes it
    const cleanHandle = tiktokHandle?.replace(/^@/, "").trim() || null;

    // Build TikTok URL from handle if not provided
    let finalTiktokUrl = tiktokUrl?.trim() || null;
    if (!finalTiktokUrl && cleanHandle) {
      finalTiktokUrl = `https://www.tiktok.com/@${cleanHandle}`;
    }

    const { error } = await supabase.from("creators").insert({
      submitted_by: userId,
      name: name.trim(),
      tiktok_handle: cleanHandle,
      tiktok_url: finalTiktokUrl,
      instagram_url: instagramUrl?.trim() || null,
      avatar_emoji: avatarEmoji || "📚",
      is_self: isSelf || false,
    });

    if (error) {
      console.error("Failed to add creator:", error);
      throw error;
    }

    await fetchCreators();
  }

  async function removeCreator(creatorId) {
    const { error } = await supabase.from("creators").delete().eq("id", creatorId);
    if (error) {
      console.error("Failed to remove creator:", error);
      throw error;
    }
    await fetchCreators();
  }

  return { creators, loading, addCreator, removeCreator, refetch: fetchCreators };
}

/**
 * Hook for updating the logged-in user's social profile.
 */
export function useUserProfile(userId) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("users")
      .select("tiktok_handle, instagram_handle, bio")
      .eq("id", userId)
      .single()
      .then(({ data }) => setProfile(data));
  }, [userId]);

  async function updateProfile({ tiktokHandle, instagramHandle, bio }) {
    if (!userId) return;
    const { error } = await supabase
      .from("users")
      .update({
        tiktok_handle: tiktokHandle?.replace(/^@/, "").trim() || null,
        instagram_handle: instagramHandle?.replace(/^@/, "").trim() || null,
        bio: bio?.trim() || null,
      })
      .eq("id", userId);

    if (error) throw error;

    setProfile({ tiktok_handle: tiktokHandle, instagram_handle: instagramHandle, bio });
  }

  return { profile, updateProfile };
}
