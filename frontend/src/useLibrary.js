import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

// Upsert a book into the shared books table, return its ID
async function ensureBook(book) {
  // Try to find existing by title + authors
  const { data: existing } = await supabase
    .from("books")
    .select("id")
    .eq("title", book.title)
    .eq("authors", book.authors || "")
    .single();

  if (existing) return existing.id;

  const { data: inserted, error } = await supabase
    .from("books")
    .insert({
      title: book.title,
      authors: book.authors || null,
      cover_url: book.cover_url || null,
      cover_fallback: book.cover_fallback || null,
      description: book.description || null,
      published_date: book.published_date || null,
      page_count: book.page_count || null,
      categories: book.categories || [],
      sub_genres: book.sub_genres || [],
      info_link: book.info_link || null,
      amazon_url: book.amazon_url || null,
      isbn: book.isbn || null,
    })
    .select("id")
    .single();

  if (error) {
    // Might be a race condition duplicate — try fetching again
    if (error.code === "23505") {
      const { data: retry } = await supabase
        .from("books")
        .select("id")
        .eq("title", book.title)
        .eq("authors", book.authors || "")
        .single();
      return retry?.id;
    }
    console.error("ensureBook error:", error);
    return null;
  }

  return inserted?.id;
}

export function useLibrary(userId) {
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's library from Supabase
  const fetchLibrary = useCallback(async () => {
    if (!userId) { setLibrary([]); setLoading(false); return; }

    const { data, error } = await supabase
      .from("library")
      .select(`
        id,
        status,
        rating,
        notes,
        added_at,
        updated_at,
        book:books (
          id, title, authors, cover_url, cover_fallback, description,
          published_date, page_count, categories, sub_genres,
          info_link, amazon_url, isbn
        )
      `)
      .eq("user_id", userId)
      .order("added_at", { ascending: false });

    if (error) {
      console.error("fetchLibrary error:", error);
      setLoading(false);
      return;
    }

    // Flatten: merge book fields into the library entry
    const flat = (data || []).map((entry) => ({
      ...entry.book,
      libraryId: entry.id,
      bookId: entry.book.id,
      status: entry.status,
      teaRating: entry.rating,
      notes: entry.notes,
      added_at: entry.added_at,
    }));

    setLibrary(flat);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchLibrary(); }, [fetchLibrary]);

  // Add a book to library
  async function addToLibrary(book) {
    if (!userId) return;
    const bookId = await ensureBook(book);
    if (!bookId) return;

    const { error } = await supabase
      .from("library")
      .insert({
        user_id: userId,
        book_id: bookId,
        status: "tbr",
        rating: 0,
      });

    if (error) {
      if (error.code === "23505") return; // Already in library
      console.error("addToLibrary error:", error);
      return;
    }

    await fetchLibrary();
  }

  // Update status
  async function updateStatus(libraryId, status) {
    await supabase.from("library").update({ status, updated_at: new Date().toISOString() }).eq("id", libraryId);
    await fetchLibrary();
  }

  // Update rating
  async function updateRating(libraryId, rating) {
    await supabase.from("library").update({ rating, updated_at: new Date().toISOString() }).eq("id", libraryId);
    await fetchLibrary();
  }

  // Update sub-genres on the book itself
  async function updateSubGenres(bookId, subGenres) {
    await supabase.from("books").update({ sub_genres: subGenres }).eq("id", bookId);
    await fetchLibrary();
  }

  // Remove from library
  async function removeFromLibrary(libraryId) {
    await supabase.from("library").delete().eq("id", libraryId);
    await fetchLibrary();
  }

  return {
    library,
    loading,
    addToLibrary,
    updateStatus,
    updateRating,
    updateSubGenres,
    removeFromLibrary,
    refetch: fetchLibrary,
  };
}
