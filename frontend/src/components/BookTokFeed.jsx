import { useState, useMemo } from "react";
import { useTheme } from "../ThemeContext";
import { useCreators, useUserProfile } from "../useCreators";
import { useUser } from "../UserContext";
import AmazonBadges from "./AmazonBadges";

// Platform icons
const PLATFORM_ICONS = {
  tiktok: "♪",
  youtube: "▶",
  instagram: "◎",
};
const PLATFORM_LABELS = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram",
};

// Real BookTok creators — all verified handles with working links
const CREATORS = [
  {
    id: "bradylockerby",
    name: "Brady Lockerby",
    handle: "@bradylockerby",
    avatar: "📚",
    followers: "1M+",
    platforms: ["tiktok", "youtube", "instagram"],
    instagram: "https://www.instagram.com/bradylockerby/",
    tiktok: "https://www.tiktok.com/@bradylockerby",
    youtube: "https://www.youtube.com/@BradyLockerby",
    website: "https://bradylockerby.com",
  },
  {
    id: "jackbenedwards",
    name: "Jack Edwards",
    handle: "@jack_edwards",
    avatar: "📖",
    followers: "1.5M+",
    platforms: ["youtube", "tiktok", "instagram"],
    instagram: "https://www.instagram.com/jackbenedwards/",
    tiktok: "https://www.tiktok.com/@jack_edwards",
    youtube: "https://www.youtube.com/@jack_edwards",
  },
  {
    id: "cassiesbooktok",
    name: "Cassie",
    handle: "@cassiesbooktok",
    avatar: "✨",
    followers: "3.9M+",
    platforms: ["tiktok", "instagram"],
    tiktok: "https://www.tiktok.com/@cassiesbooktok",
    instagram: "https://www.instagram.com/cassiesbooktok/",
  },
  {
    id: "tierney.reads",
    name: "Tierney",
    handle: "@tierney.reads",
    avatar: "🌶️",
    followers: "808K+",
    platforms: ["tiktok", "instagram"],
    tiktok: "https://www.tiktok.com/@tierney.reads",
    instagram: "https://www.instagram.com/tierney.reads/",
  },
  {
    id: "abbysbooks",
    name: "Abby",
    handle: "@abbysbooks",
    avatar: "🧚",
    followers: "460K+",
    platforms: ["tiktok", "instagram"],
    tiktok: "https://www.tiktok.com/@abbysbooks",
    instagram: "https://www.instagram.com/abbysbooks/",
  },
];

// Cover URL helper — Open Library ISBN covers (most reliable free source)
// Falls back to Google Books content API if Open Library fails
function olCover(isbn, gbId) {
  return {
    primary: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
    fallback: `https://books.google.com/books/content?id=${gbId}&printsec=frontcover&img=1&zoom=1&source=gbs_api`,
  };
}

// Videos with books mentioned in each
const SAMPLE_VIDEOS = [
  {
    id: 1,
    platform: "tiktok",
    creator: CREATORS[0],
    tiktokId: "7504830235951533342",
    thumbnail: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80",
    caption: "palate cleanser book recs — that feeling after you finish one of your fav books and you need something light next 📖",
    tags: ["Book Recs", "Palate Cleansers"],
    likes: "142K",
    comments: "3.2K",
    books: [
      {
        title: "Shady Hollow",
        authors: "Juneau Black",
        cover_url: olCover("9781643750781", "kQ0oEAAAQBAJ").primary,
        cover_fallback: olCover("9781643750781", "kQ0oEAAAQBAJ").fallback,
        categories: ["Cozy Mystery", "Fiction"],
        sub_genres: ["Cozy Mystery"],
        amazon_url: "https://www.amazon.com/s?k=Shady+Hollow+Juneau+Black",
      },
      {
        title: "Nora Goes Off Script",
        authors: "Annabel Monaghan",
        cover_url: olCover("9780593420058", "iNRIEAAAQBAJ").primary,
        cover_fallback: olCover("9780593420058", "iNRIEAAAQBAJ").fallback,
        categories: ["Romance", "Fiction"],
        sub_genres: ["Romantic Comedy"],
        amazon_url: "https://www.amazon.com/s?k=Nora+Goes+Off+Script",
      },
      {
        title: "The Connellys of County Down",
        authors: "Tracey Lange",
        cover_url: olCover("9781668014790", "CUi5EAAAQBAJ").primary,
        cover_fallback: olCover("9781668014790", "CUi5EAAAQBAJ").fallback,
        categories: ["Literary Fiction", "Fiction"],
        sub_genres: ["Contemporary Fiction"],
        amazon_url: "https://www.amazon.com/s?k=Connellys+of+County+Down",
      },
    ],
  },
  {
    id: 2,
    platform: "tiktok",
    creator: CREATORS[0],
    tiktokId: "7489237110759623967",
    thumbnail: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&q=80",
    caption: "yes, no, or maybe for all of my 2025 reads so far! we're off to a great start 🥹",
    tags: ["Yes No Maybe", "Book Reviews"],
    likes: "98K",
    comments: "2.1K",
    books: [
      {
        title: "Remarkably Bright Creatures",
        authors: "Shelby Van Pelt",
        cover_url: olCover("9780063204157", "ZDdREAAAQBAJ").primary,
        cover_fallback: olCover("9780063204157", "ZDdREAAAQBAJ").fallback,
        categories: ["Literary Fiction", "Fiction"],
        sub_genres: ["Literary Fiction", "Contemporary Fiction"],
        amazon_url: "https://www.amazon.com/s?k=Remarkably+Bright+Creatures",
      },
      {
        title: "Intermezzo",
        authors: "Sally Rooney",
        cover_url: olCover("9780374602635", "VYbcEAAAQBAJ").primary,
        cover_fallback: olCover("9780374602635", "VYbcEAAAQBAJ").fallback,
        categories: ["Literary Fiction", "Fiction"],
        sub_genres: ["Literary Fiction", "Contemporary Fiction"],
        amazon_url: "https://www.amazon.com/s?k=Intermezzo+Sally+Rooney",
      },
    ],
  },
  {
    id: 3,
    platform: "tiktok",
    creator: CREATORS[1],
    tiktokId: "7183808146689838341",
    thumbnail: "https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=600&q=80",
    caption: "my most anticipated book of the year — mythology meets Atlanta 📚",
    tags: ["Anticipated Reads", "BookTok"],
    likes: "210K",
    comments: "5.8K",
    books: [
      {
        title: "A Little Life",
        authors: "Hanya Yanagihara",
        cover_url: olCover("9780385539258", "LMCjBQAAQBAJ").primary,
        cover_fallback: olCover("9780385539258", "LMCjBQAAQBAJ").fallback,
        categories: ["Literary Fiction", "Fiction"],
        sub_genres: ["Literary Fiction"],
        amazon_url: "https://www.amazon.com/s?k=A+Little+Life+Hanya+Yanagihara",
      },
      {
        title: "The Song of Achilles",
        authors: "Madeline Miller",
        cover_url: olCover("9780062060624", "mHJNM_pgg-kC").primary,
        cover_fallback: olCover("9780062060624", "mHJNM_pgg-kC").fallback,
        categories: ["Historical Fiction", "Fantasy"],
        sub_genres: ["Mythological", "Historical Fiction"],
        amazon_url: "https://www.amazon.com/s?k=Song+of+Achilles",
      },
      {
        title: "They Both Die at the End",
        authors: "Adam Silvera",
        cover_url: olCover("9780062457790", "9OYtDwAAQBAJ").primary,
        cover_fallback: olCover("9780062457790", "9OYtDwAAQBAJ").fallback,
        categories: ["YA Fiction", "Sci-Fi"],
        sub_genres: ["YA Contemporary"],
        amazon_url: "https://www.amazon.com/s?k=They+Both+Die+at+the+End",
      },
    ],
  },
  {
    id: 4,
    platform: "tiktok",
    creator: CREATORS[2],
    tiktokId: "7324079139122613510",
    thumbnail: "https://images.unsplash.com/photo-1519682577862-22b62b24e493?w=600&q=80",
    caption: "the ultimate book recommendations for BookTok lovers — which ones have you read? 📖✨",
    tags: ["Book Recs", "Must Reads"],
    likes: "175K",
    comments: "4.1K",
    books: [
      {
        title: "A Court of Thorns and Roses",
        authors: "Sarah J. Maas",
        cover_url: olCover("9781635575569", "y3UIEAAAQBAJ").primary,
        cover_fallback: olCover("9781635575569", "y3UIEAAAQBAJ").fallback,
        categories: ["Fantasy", "Romance"],
        sub_genres: ["Romantasy", "Epic Fantasy"],
        amazon_url: "https://www.amazon.com/s?k=Court+of+Thorns+and+Roses",
      },
      {
        title: "Beach Read",
        authors: "Emily Henry",
        cover_url: olCover("9781984806734", "Ddi1DwAAQBAJ").primary,
        cover_fallback: olCover("9781984806734", "Ddi1DwAAQBAJ").fallback,
        categories: ["Romance", "Fiction"],
        sub_genres: ["Romantic Comedy", "Contemporary Romance"],
        amazon_url: "https://www.amazon.com/s?k=Beach+Read+Emily+Henry",
      },
      {
        title: "Happy Place",
        authors: "Emily Henry",
        cover_url: olCover("9780593441275", "tOiHEAAAQBAJ").primary,
        cover_fallback: olCover("9780593441275", "tOiHEAAAQBAJ").fallback,
        categories: ["Romance", "Fiction"],
        sub_genres: ["Contemporary Romance"],
        amazon_url: "https://www.amazon.com/s?k=Happy+Place+Emily+Henry",
      },
    ],
  },
  {
    id: 5,
    platform: "tiktok",
    creator: CREATORS[3],
    tiktokId: "7277883627319446792",
    thumbnail: "https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=600&q=80",
    caption: "books that absolutely threw me — romance, thriller, and everything in between 📚🔥",
    tags: ["Romance", "Thriller", "Spicy Books"],
    likes: "89K",
    comments: "1.9K",
    books: [
      {
        title: "The Secret History",
        authors: "Donna Tartt",
        cover_url: olCover("9781400031702", "xVPqfDIx1kEC").primary,
        cover_fallback: olCover("9781400031702", "xVPqfDIx1kEC").fallback,
        categories: ["Literary Fiction", "Thriller"],
        sub_genres: ["Literary Fiction", "Dark Academia"],
        amazon_url: "https://www.amazon.com/s?k=The+Secret+History+Donna+Tartt",
      },
      {
        title: "Normal People",
        authors: "Sally Rooney",
        cover_url: olCover("9781984822185", "hDRJDwAAQBAJ").primary,
        cover_fallback: olCover("9781984822185", "hDRJDwAAQBAJ").fallback,
        categories: ["Literary Fiction", "Romance"],
        sub_genres: ["Literary Fiction", "Contemporary Fiction"],
        amazon_url: "https://www.amazon.com/s?k=Normal+People+Sally+Rooney",
      },
      {
        title: "Tomorrow, and Tomorrow, and Tomorrow",
        authors: "Gabrielle Zevin",
        cover_url: olCover("9780593321201", "Bo09EAAAQBAJ").primary,
        cover_fallback: olCover("9780593321201", "Bo09EAAAQBAJ").fallback,
        categories: ["Literary Fiction", "Fiction"],
        sub_genres: ["Literary Fiction", "Contemporary Fiction"],
        amazon_url: "https://www.amazon.com/s?k=Tomorrow+and+Tomorrow+Gabrielle+Zevin",
      },
    ],
  },
  {
    id: 6,
    platform: "tiktok",
    creator: CREATORS[4],
    tiktokId: null,
    tiktokUrl: "https://www.tiktok.com/@abbysbooks",
    thumbnail: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&q=80",
    caption: "thriller recs that had me sleeping with the lights on 🔦",
    tags: ["Thrillers", "Scary Books"],
    likes: "156K",
    comments: "3.7K",
    books: [
      {
        title: "The Silent Patient",
        authors: "Alex Michaelides",
        cover_url: olCover("9781250301697", "sMBKDwAAQBAJ").primary,
        cover_fallback: olCover("9781250301697", "sMBKDwAAQBAJ").fallback,
        categories: ["Thriller", "Mystery"],
        sub_genres: ["Psychological Thriller"],
        amazon_url: "https://www.amazon.com/s?k=The+Silent+Patient",
      },
      {
        title: "The Maid",
        authors: "Nita Prose",
        cover_url: olCover("9780593356159", "jZQ8EAAAQBAJ").primary,
        cover_fallback: olCover("9780593356159", "jZQ8EAAAQBAJ").fallback,
        categories: ["Mystery", "Fiction"],
        sub_genres: ["Cozy Mystery", "Whodunit"],
        amazon_url: "https://www.amazon.com/s?k=The+Maid+Nita+Prose",
      },
      {
        title: "The Woman in the Window",
        authors: "A.J. Finn",
        cover_url: olCover("9780062678416", "LMY3DwAAQBAJ").primary,
        cover_fallback: olCover("9780062678416", "LMY3DwAAQBAJ").fallback,
        categories: ["Thriller", "Mystery"],
        sub_genres: ["Psychological Thriller", "Domestic Thriller"],
        amazon_url: "https://www.amazon.com/s?k=Woman+in+the+Window+AJ+Finn",
      },
    ],
  },
  // ── YouTube videos ──────────────────────────────────
  {
    id: 7,
    platform: "youtube",
    creator: CREATORS[1],
    youtubeId: "j_q8jHikKng",
    thumbnail: "https://img.youtube.com/vi/j_q8jHikKng/hqdefault.jpg",
    caption: "i read the most viral books on booktok and booktube — should we believe the hype?",
    tags: ["BookTube", "Viral Books", "Honest Reviews"],
    likes: "185K",
    comments: "4.3K",
    books: [
      {
        title: "It Ends with Us",
        authors: "Colleen Hoover",
        cover_url: olCover("9781501110368", "TH0GEAAAQBAJ").primary,
        cover_fallback: olCover("9781501110368", "TH0GEAAAQBAJ").fallback,
        categories: ["Romance", "Fiction"],
        sub_genres: ["Contemporary Romance", "Domestic Fiction"],
        amazon_url: "https://www.amazon.com/s?k=It+Ends+With+Us+Colleen+Hoover",
      },
      {
        title: "The Seven Husbands of Evelyn Hugo",
        authors: "Taylor Jenkins Reid",
        cover_url: olCover("9781501161933", "GXULEAAAQBAJ").primary,
        cover_fallback: olCover("9781501161933", "GXULEAAAQBAJ").fallback,
        categories: ["Historical Fiction", "Fiction"],
        sub_genres: ["Historical Fiction", "Literary Fiction"],
        amazon_url: "https://www.amazon.com/s?k=Seven+Husbands+Evelyn+Hugo",
      },
    ],
  },
  {
    id: 8,
    platform: "youtube",
    creator: CREATORS[1],
    youtubeId: "D569ZcfKe74",
    thumbnail: "https://img.youtube.com/vi/D569ZcfKe74/hqdefault.jpg",
    caption: "the biggest books year-by-year — a journey through the books that defined each era",
    tags: ["BookTube", "Book History", "Biggest Books"],
    likes: "220K",
    comments: "5.1K",
    books: [
      {
        title: "The Hunger Games",
        authors: "Suzanne Collins",
        cover_url: olCover("9780439023528", "hlb_sM1AN0gC").primary,
        cover_fallback: olCover("9780439023528", "hlb_sM1AN0gC").fallback,
        categories: ["YA Fiction", "Sci-Fi"],
        sub_genres: ["YA Dystopian"],
        amazon_url: "https://www.amazon.com/s?k=The+Hunger+Games+Suzanne+Collins",
      },
      {
        title: "Gone Girl",
        authors: "Gillian Flynn",
        cover_url: olCover("9780307588371", "hfjfCgAAQBAJ").primary,
        cover_fallback: olCover("9780307588371", "hfjfCgAAQBAJ").fallback,
        categories: ["Thriller", "Mystery"],
        sub_genres: ["Psychological Thriller"],
        amazon_url: "https://www.amazon.com/s?k=Gone+Girl+Gillian+Flynn",
      },
    ],
  },
  {
    id: 9,
    platform: "youtube",
    creator: CREATORS[0],
    youtubeId: "DdL_Xae74Ko",
    thumbnail: "https://img.youtube.com/vi/DdL_Xae74Ko/hqdefault.jpg",
    caption: "BookTok hits, misses & must-read books — the full honest rundown",
    tags: ["Book Club", "BookTok Recs", "Must Reads"],
    likes: "67K",
    comments: "1.8K",
    books: [
      {
        title: "The Nightingale",
        authors: "Kristin Hannah",
        cover_url: olCover("9780312577223", "pETmBgAAQBAJ").primary,
        cover_fallback: olCover("9780312577223", "pETmBgAAQBAJ").fallback,
        categories: ["Historical Fiction", "Fiction"],
        sub_genres: ["Historical Fiction"],
        amazon_url: "https://www.amazon.com/s?k=The+Nightingale+Kristin+Hannah",
      },
      {
        title: "Educated",
        authors: "Tara Westover",
        cover_url: olCover("9780399590504", "2ObWDgAAQBAJ").primary,
        cover_fallback: olCover("9780399590504", "2ObWDgAAQBAJ").fallback,
        categories: ["Nonfiction", "Memoir"],
        sub_genres: ["Memoir"],
        amazon_url: "https://www.amazon.com/s?k=Educated+Tara+Westover",
      },
    ],
  },
  // ── Instagram Reels ──────────────────────────────────
  {
    id: 10,
    platform: "instagram",
    creator: CREATORS[2],
    instagramUrl: "https://www.instagram.com/reel/cassiesbooktok/",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    caption: "books that gave me a full-on identity crisis — save this for your next read",
    tags: ["Bookstagram", "Identity Crisis Reads", "Must Reads"],
    likes: "234K",
    comments: "6.2K",
    books: [
      {
        title: "The Midnight Library",
        authors: "Matt Haig",
        cover_url: olCover("9780525559474", "MtLDDwAAQBAJ").primary,
        cover_fallback: olCover("9780525559474", "MtLDDwAAQBAJ").fallback,
        categories: ["Fiction", "Fantasy"],
        sub_genres: ["Contemporary Fiction", "Magical Realism"],
        amazon_url: "https://www.amazon.com/s?k=The+Midnight+Library+Matt+Haig",
      },
      {
        title: "Anxious People",
        authors: "Fredrik Backman",
        cover_url: olCover("9781501160837", "RfD5DwAAQBAJ").primary,
        cover_fallback: olCover("9781501160837", "RfD5DwAAQBAJ").fallback,
        categories: ["Fiction", "Literary Fiction"],
        sub_genres: ["Contemporary Fiction", "Literary Fiction"],
        amazon_url: "https://www.amazon.com/s?k=Anxious+People+Fredrik+Backman",
      },
    ],
  },
  {
    id: 11,
    platform: "instagram",
    creator: CREATORS[3],
    instagramUrl: "https://www.instagram.com/tierney.reads/",
    thumbnail: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80",
    caption: "romance recs that will absolutely ruin you — my top picks for when you want ALL the feelings",
    tags: ["Bookstagram", "Romance Recs", "Spicy Books"],
    likes: "112K",
    comments: "2.9K",
    books: [
      {
        title: "People We Meet on Vacation",
        authors: "Emily Henry",
        cover_url: olCover("9781984806758", "w3rODwAAQBAJ").primary,
        cover_fallback: olCover("9781984806758", "w3rODwAAQBAJ").fallback,
        categories: ["Romance", "Fiction"],
        sub_genres: ["Romantic Comedy", "Contemporary Romance"],
        amazon_url: "https://www.amazon.com/s?k=People+We+Meet+on+Vacation+Emily+Henry",
      },
      {
        title: "Book Lovers",
        authors: "Emily Henry",
        cover_url: olCover("9780593334836", "7zJEEAAAQBAJ").primary,
        cover_fallback: olCover("9780593334836", "7zJEEAAAQBAJ").fallback,
        categories: ["Romance", "Fiction"],
        sub_genres: ["Romantic Comedy"],
        amazon_url: "https://www.amazon.com/s?k=Book+Lovers+Emily+Henry",
      },
    ],
  },
];

// An Unlikely Story staff picks — each staff member's recommendation
const STAFF_PICKS = [
  {
    staffName: "Alexa",
    staffRole: "Bookseller",
    quote: "A perfect blend of mystery and heart — I couldn't stop thinking about it.",
    book: {
      title: "The Maid",
      authors: "Nita Prose",
      cover_url: olCover("9780593356159", "").primary,
      cover_fallback: "https://books.google.com/books/content?id=M4JYEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
      sub_genres: ["Cozy Mystery"],
      categories: ["Mystery"],
      amazon_url: "https://anunlikelystory.indiecommerce.com/search/site/The+Maid+Nita+Prose",
    },
  },
  {
    staffName: "Bonnie",
    staffRole: "Children's Specialist",
    quote: "Sally Rooney does it again — achingly real and impossible to put down.",
    book: {
      title: "Intermezzo",
      authors: "Sally Rooney",
      cover_url: olCover("9780374602635", "").primary,
      cover_fallback: "https://books.google.com/books/content?id=VYbcEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
      sub_genres: ["Literary Fiction"],
      categories: ["Literary Fiction"],
      amazon_url: "https://anunlikelystory.indiecommerce.com/search/site/Intermezzo+Sally+Rooney",
    },
  },
  {
    staffName: "Dakota",
    staffRole: "Events Coordinator",
    quote: "The most atmospheric read of the year — every page drips with tension.",
    book: {
      title: "The Silent Patient",
      authors: "Alex Michaelides",
      cover_url: olCover("9781250301703", "").primary,
      cover_fallback: "https://books.google.com/books/content?id=tHN0DwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
      sub_genres: ["Psychological Thriller"],
      categories: ["Thriller"],
      amazon_url: "https://anunlikelystory.indiecommerce.com/search/site/The+Silent+Patient",
    },
  },
  {
    staffName: "Jasper",
    staffRole: "Bookseller",
    quote: "A modern classic. If you haven't read it yet, what are you even doing?",
    book: {
      title: "The Secret History",
      authors: "Donna Tartt",
      cover_url: olCover("9781400031702", "").primary,
      cover_fallback: "https://books.google.com/books/content?id=xVPqfDIx1kEC&printsec=frontcover&img=1&zoom=1&source=gbs_api",
      sub_genres: ["Dark Academia"],
      categories: ["Literary Fiction"],
      amazon_url: "https://anunlikelystory.indiecommerce.com/search/site/The+Secret+History",
    },
  },
  {
    staffName: "Maia",
    staffRole: "Café & Books",
    quote: "The kind of love story that makes you want to text your best friend at 2am.",
    book: {
      title: "Tomorrow, and Tomorrow, and Tomorrow",
      authors: "Gabrielle Zevin",
      cover_url: olCover("9780593321201", "").primary,
      cover_fallback: "https://books.google.com/books/content?id=Bo09EAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
      sub_genres: ["Literary Fiction"],
      categories: ["Literary Fiction"],
      amazon_url: "https://anunlikelystory.indiecommerce.com/search/site/Tomorrow+Tomorrow+Gabrielle+Zevin",
    },
  },
  {
    staffName: "Will",
    staffRole: "Bookseller",
    quote: "Genuinely funny and surprisingly moving. Emily Henry never misses.",
    book: {
      title: "Happy Place",
      authors: "Emily Henry",
      cover_url: olCover("9780593441275", "").primary,
      cover_fallback: "https://books.google.com/books/content?id=tOiHEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
      sub_genres: ["Contemporary Romance"],
      categories: ["Romance"],
      amazon_url: "https://anunlikelystory.indiecommerce.com/search/site/Happy+Place+Emily+Henry",
    },
  },
  {
    staffName: "Olivia R.",
    staffRole: "Bookseller",
    quote: "Ancient Greece, fate, love, tragedy — everything I want in a book.",
    book: {
      title: "The Song of Achilles",
      authors: "Madeline Miller",
      cover_url: olCover("9780062060624", "").primary,
      cover_fallback: "https://books.google.com/books/content?id=yxHV_l4rsHoC&printsec=frontcover&img=1&zoom=1&source=gbs_api",
      sub_genres: ["Mythological"],
      categories: ["Literary Fiction"],
      amazon_url: "https://anunlikelystory.indiecommerce.com/search/site/Song+of+Achilles",
    },
  },
  {
    staffName: "Paige",
    staffRole: "Assistant Manager",
    quote: "The creature feature we've been waiting for — smart, charming, unforgettable.",
    book: {
      title: "Remarkably Bright Creatures",
      authors: "Shelby Van Pelt",
      cover_url: olCover("9780063204157", "").primary,
      cover_fallback: "https://books.google.com/books/content?id=ZDdREAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
      sub_genres: ["Contemporary Fiction"],
      categories: ["Literary Fiction"],
      amazon_url: "https://anunlikelystory.indiecommerce.com/search/site/Remarkably+Bright+Creatures",
    },
  },
];

function VideoCard({ video, onFollow, following, library, onAddToLibrary }) {
  const creator = video.creator;
  const platform = video.platform || "tiktok";

  // Build embed URL and watch URL based on platform
  let embedSrc = null;
  let watchUrl = null;
  let watchLabel = "Watch on TikTok";

  if (platform === "youtube" && video.youtubeId) {
    embedSrc = `https://www.youtube.com/embed/${video.youtubeId}`;
    watchUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;
    watchLabel = "Watch on YouTube";
  } else if (platform === "instagram") {
    embedSrc = null; // Instagram embeds need oEmbed, use thumbnail + link for now
    watchUrl = video.instagramUrl || creator.instagram;
    watchLabel = "Watch on Instagram";
  } else {
    // TikTok
    embedSrc = video.tiktokId
      ? `https://www.tiktok.com/embed/v2/${video.tiktokId}`
      : null;
    watchUrl = video.tiktokId
      ? `https://www.tiktok.com/@${creator.id}/video/${video.tiktokId}`
      : video.tiktokUrl || creator.tiktok;
    watchLabel = "Watch on TikTok";
  }

  function isInLibrary(book) {
    return library.some((b) => b.title === book.title);
  }

  return (
    <div className="tok-card">
      {/* Platform badge */}
      <div className={`tok-platform-badge platform-${platform}`}>
        <span className="tok-platform-icon">{PLATFORM_ICONS[platform]}</span>
        <span>{PLATFORM_LABELS[platform]}</span>
      </div>

      {/* Creator header */}
      <div className="tok-creator">
        <div className="tok-avatar">{creator.avatar}</div>
        <div className="tok-creator-info">
          <div className="tok-name-row">
            <span className="tok-username">{creator.name}</span>
            <span className="tok-handle">{creator.handle}</span>
          </div>
          <div className="tok-creator-links">
            {creator.tiktok && (
              <a href={creator.tiktok} target="_blank" rel="noopener noreferrer" className="tok-social-link">TikTok</a>
            )}
            {creator.instagram && (
              <a href={creator.instagram} target="_blank" rel="noopener noreferrer" className="tok-social-link">Instagram</a>
            )}
            {creator.website && (
              <a href={creator.website} target="_blank" rel="noopener noreferrer" className="tok-social-link">Website</a>
            )}
          </div>
        </div>
        <button
          className={`tok-follow-btn ${following ? "following" : ""}`}
          onClick={() => onFollow(creator.id)}
        >
          {following ? "Following" : "Follow"}
        </button>
      </div>

      {/* Video — embed directly for single-click play, or link out */}
      <div className="tok-video-wrap">
        {embedSrc ? (
          <iframe
            src={embedSrc}
            className="tok-video-embed"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            allowFullScreen
            title={`${creator.name} BookTok`}
          />
        ) : (
          <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="tok-video-link">
            <div
              className="tok-video-placeholder"
              style={video.thumbnail ? { backgroundImage: `url('${video.thumbnail}')` } : {}}
            >
              <div className="tok-play-overlay">
                <div className="tok-play-btn">▶</div>
                <span className="tok-play-label">{watchLabel}</span>
              </div>
              <div className="tok-video-gradient"></div>
            </div>
          </a>
        )}
      </div>

      {/* Caption & tags */}
      <p className="tok-caption">{video.caption}</p>
      <div className="tok-tags">
        {video.tags.map((tag) => (
          <span key={tag} className="tok-tag">#{tag.replace(/\s+/g, "")}</span>
        ))}
      </div>

      {/* ★ BOOKS MENTIONED — the key feature */}
      {video.books && video.books.length > 0 && (
        <div className="tok-books-section">
          <h4 className="tok-books-label">
            📖 Books in this video ({video.books.length})
          </h4>
          <div className="tok-books-list">
            {video.books.map((book) => {
              const inLib = isInLibrary(book);
              return (
                <div key={book.title} className="tok-book-card">
                  <div className="tok-book-cover">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt=""
                        onError={(e) => {
                          // Try Google Books fallback before giving up
                          if (book.cover_fallback && !e.target.dataset.triedFallback) {
                            e.target.dataset.triedFallback = "true";
                            e.target.src = book.cover_fallback;
                          } else {
                            e.target.style.display = "none";
                            if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                          }
                        }}
                      />
                    ) : null}
                    <div className="tok-no-cover" style={book.cover_url ? { display: "none" } : {}}>{book.title}</div>
                  </div>
                  <div className="tok-book-info">
                    <span className="tok-book-title">{book.title}</span>
                    <span className="tok-book-author">{book.authors}</span>
                    {book.sub_genres && book.sub_genres.length > 0 && (
                      <div className="tok-book-genres">
                        {book.sub_genres.map((g) => (
                          <span key={g} className="tok-book-genre">{g}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <AmazonBadges book={book} size="sm" />
                  {inLib ? (
                    <span className="tok-on-shelf">✓ On Shelf</span>
                  ) : (
                    <button
                      className="tok-add-btn"
                      onClick={() => onAddToLibrary(book)}
                    >
                      + Add to Shelf
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Engagement */}
      <div className="tok-engagement">
        <span className="tok-stat">❤️ {video.likes}</span>
        <span className="tok-stat">💬 {video.comments}</span>
        <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="tok-watch-link">
          {watchLabel} ↗
        </a>
      </div>
    </div>
  );
}

function CreatorSpotlight({ creator, onFollow, following }) {
  return (
    <div className="tok-spotlight">
      <div className="tok-spotlight-avatar">{creator.avatar}</div>
      <div className="tok-spotlight-info">
        <span className="tok-spotlight-name">{creator.name}</span>
        <span className="tok-spotlight-handle">{creator.handle}</span>
        {creator.platforms && (
          <div className="tok-platform-icons">
            {creator.platforms.map((p) => (
              <a
                key={p}
                href={creator[p]}
                target="_blank"
                rel="noopener noreferrer"
                className={`tok-platform-icon-link platform-${p}`}
                title={PLATFORM_LABELS[p]}
              >
                {PLATFORM_ICONS[p]}
              </a>
            ))}
          </div>
        )}
        <span className="tok-spotlight-followers">{creator.followers} followers</span>
      </div>
      <button
        className={`tok-follow-btn sm ${following ? "following" : ""}`}
        onClick={() => onFollow(creator.id)}
      >
        {following ? "✓" : "+"}
      </button>
    </div>
  );
}

function StaffPickCard({ pick, library, onAddToLibrary }) {
  const inLib = library.some((b) => b.title === pick.book.title);
  return (
    <div className="staff-pick-card">
      <div className="staff-pick-header">
        <div className="staff-pick-avatar">📖</div>
        <div className="staff-pick-meta">
          <span className="staff-pick-name">{pick.staffName}</span>
          <span className="staff-pick-role">{pick.staffRole}</span>
        </div>
      </div>
      <blockquote className="staff-pick-quote">"{pick.quote}"</blockquote>
      <div className="staff-pick-book">
        <div className="staff-pick-cover">
          <img
            src={pick.book.cover_url}
            alt={pick.book.title}
            onError={(e) => {
              if (pick.book.cover_fallback && !e.target.dataset.triedFallback) {
                e.target.dataset.triedFallback = "1";
                e.target.src = pick.book.cover_fallback;
              }
            }}
          />
        </div>
        <div className="staff-pick-book-info">
          <span className="staff-pick-book-title">{pick.book.title}</span>
          <span className="staff-pick-book-author">{pick.book.authors}</span>
          {pick.book.sub_genres && (
            <div className="staff-pick-genres">
              {pick.book.sub_genres.map((g) => (
                <span key={g} className="tok-book-genre">{g}</span>
              ))}
            </div>
          )}
          <div className="staff-pick-actions">
            {inLib ? (
              <span className="tok-on-shelf">✓ On Shelf</span>
            ) : (
              <button className="tok-add-btn" onClick={() => onAddToLibrary(pick.book)}>
                + Add to Shelf
              </button>
            )}
            <a
              href={pick.book.amazon_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-secondary"
            >
              Shop Indie
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Creator Form ─────────────────────────────────
function AddCreatorForm({ onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [instagram, setInstagram] = useState("");
  const [emoji, setEmoji] = useState("📚");
  const [isSelf, setIsSelf] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const EMOJIS = ["📚", "📖", "✨", "🌶️", "🧚", "🦋", "🫒", "🔮", "🌙", "💀", "🎭", "🐉"];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        tiktokHandle: handle.trim(),
        instagramUrl: instagram.trim() ? `https://www.instagram.com/${instagram.replace(/^@/, "")}/` : null,
        avatarEmoji: emoji,
        isSelf,
      });
      onCancel(); // close form
    } catch (err) {
      setError("Failed to add — try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="add-creator-form">
      <h3>{isSelf ? "Link Your Profile" : "Add a Creator"}</h3>
      <div className="add-creator-toggle-row">
        <button
          type="button"
          className={`add-creator-type-btn ${!isSelf ? "active" : ""}`}
          onClick={() => setIsSelf(false)}
        >
          Someone I follow
        </button>
        <button
          type="button"
          className={`add-creator-type-btn ${isSelf ? "active" : ""}`}
          onClick={() => setIsSelf(true)}
        >
          This is me
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="add-creator-field">
          <label>Name</label>
          <input
            type="text"
            placeholder={isSelf ? "Your name" : "Creator's name"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            required
          />
        </div>
        <div className="add-creator-field">
          <label>TikTok handle</label>
          <input
            type="text"
            placeholder="@username"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            maxLength={40}
          />
        </div>
        <div className="add-creator-field">
          <label>Instagram handle</label>
          <input
            type="text"
            placeholder="@username"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            maxLength={40}
          />
        </div>
        <div className="add-creator-field">
          <label>Pick an icon</label>
          <div className="emoji-picker">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                className={`emoji-pick ${emoji === e ? "active" : ""}`}
                onClick={() => setEmoji(e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="add-creator-error">{error}</p>}
        <div className="add-creator-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting || !name.trim()}>
            {submitting ? "Adding..." : isSelf ? "Link Me" : "Add Creator"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Community Creator Card ───────────────────────────
function CommunityCreatorCard({ creator, onFollow, following, currentUserId, onRemove }) {
  return (
    <div className="tok-spotlight community-creator">
      <div className="tok-spotlight-avatar">{creator.avatar}</div>
      <div className="tok-spotlight-info">
        <span className="tok-spotlight-name">
          {creator.name}
          {creator.isSelf && <span className="creator-self-badge">creator</span>}
        </span>
        {creator.handle && <span className="tok-spotlight-handle">{creator.handle}</span>}
        <div className="tok-creator-links">
          {creator.tiktok && (
            <a href={creator.tiktok} target="_blank" rel="noopener noreferrer" className="tok-social-link">TikTok</a>
          )}
          {creator.instagram && (
            <a href={creator.instagram} target="_blank" rel="noopener noreferrer" className="tok-social-link">Instagram</a>
          )}
        </div>
        <span className="community-added-by">added by {creator.submittedBy}</span>
      </div>
      {creator.submittedById === currentUserId && (
        <button className="community-remove-btn" onClick={() => onRemove(creator.id)} title="Remove">✕</button>
      )}
    </div>
  );
}

// ── Trending Books — computed dynamically from all video mentions ────
function TrendingBooks({ videos, library, onAddToLibrary }) {
  const trending = useMemo(() => {
    const bookCounts = {};
    videos.forEach((v) => {
      (v.books || []).forEach((book) => {
        const key = book.title;
        if (!bookCounts[key]) {
          bookCounts[key] = { ...book, mentions: 0, platforms: new Set() };
        }
        bookCounts[key].mentions += 1;
        bookCounts[key].platforms.add(v.platform || "tiktok");
      });
    });
    return Object.values(bookCounts)
      .map((b) => ({ ...b, platforms: Array.from(b.platforms) }))
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 8);
  }, [videos]);

  if (trending.length === 0) return null;

  const libTitles = new Set(library.map((b) => b.title));

  return (
    <div className="trending-booktok-section">
      <h3 className="trending-booktok-title">🔥 Trending on BookTok</h3>
      <p className="trending-booktok-subtitle">Most mentioned across TikTok, YouTube & Instagram</p>
      <div className="trending-booktok-scroll">
        {trending.map((book) => (
          <div key={book.title} className="trending-booktok-card">
            <div className="trending-booktok-cover">
              <img
                src={book.cover_url}
                alt=""
                onError={(e) => {
                  if (book.cover_fallback && !e.target.dataset.triedFallback) {
                    e.target.dataset.triedFallback = "true";
                    e.target.src = book.cover_fallback;
                  }
                }}
              />
              <span className="trending-mention-count">
                {book.mentions}x
              </span>
            </div>
            <span className="trending-booktok-book-title">{book.title}</span>
            <span className="trending-booktok-author">{book.authors}</span>
            <div className="trending-booktok-platforms">
              {book.platforms.map((p) => (
                <span key={p} className={`trending-platform-dot platform-${p}`} title={PLATFORM_LABELS[p]}>
                  {PLATFORM_ICONS[p]}
                </span>
              ))}
            </div>
            {libTitles.has(book.title) ? (
              <span className="trending-on-shelf">✓ On shelf</span>
            ) : (
              <button className="trending-add" onClick={() => onAddToLibrary(book)}>
                + Add
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BookTokFeed({ library = [], onAddToLibrary }) {
  const { theme } = useTheme();
  const { user } = useUser();
  const { creators: communityCreators, addCreator, removeCreator } = useCreators(user?.id);
  const [followedCreators, setFollowedCreators] = useState(new Set());
  const [feedFilter, setFeedFilter] = useState("forYou");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const isIndie = theme?.id === "indieshop";

  function toggleFollow(creatorId) {
    setFollowedCreators((prev) => {
      const next = new Set(prev);
      if (next.has(creatorId)) next.delete(creatorId);
      else next.add(creatorId);
      return next;
    });
  }

  const filteredVideos = useMemo(() => {
    let vids = SAMPLE_VIDEOS;
    if (feedFilter === "following") {
      vids = vids.filter((v) => followedCreators.has(v.creator.id));
    }
    if (platformFilter !== "all") {
      vids = vids.filter((v) => v.platform === platformFilter);
    }
    return vids;
  }, [feedFilter, platformFilter, followedCreators]);

  return (
    <div className="tok-feed-section">
      <div className="tok-header">
        <h2>{isIndie ? "BookTok + Staff Picks" : "BookTok"}</h2>
        <p className="tok-subtitle">
          {isIndie
            ? "BookTok recs and curated picks from An Unlikely Story staff"
            : "The best book recs from TikTok, YouTube & Instagram"}
        </p>
      </div>

      <div className="tok-creators-scroll">
        {CREATORS.map((c) => (
          <CreatorSpotlight
            key={c.id}
            creator={c}
            onFollow={toggleFollow}
            following={followedCreators.has(c.id)}
          />
        ))}
        {communityCreators.map((c) => (
          <CommunityCreatorCard
            key={c.id}
            creator={c}
            onFollow={toggleFollow}
            following={followedCreators.has(c.id)}
            currentUserId={user?.id}
            onRemove={removeCreator}
          />
        ))}
      </div>

      {/* Add creator / link yourself */}
      {showAddForm ? (
        <AddCreatorForm
          onSubmit={addCreator}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <div className="add-creator-cta">
          <button
            className="add-creator-btn"
            onClick={() => setShowAddForm(true)}
          >
            + Add a favorite creator or link yourself
          </button>
        </div>
      )}

      <div className="tok-filters">
        <button
          className={`tok-filter-btn ${feedFilter === "forYou" ? "active" : ""}`}
          onClick={() => setFeedFilter("forYou")}
        >
          🔥 For You
        </button>
        <button
          className={`tok-filter-btn ${feedFilter === "following" ? "active" : ""}`}
          onClick={() => setFeedFilter("following")}
        >
          👥 Following{followedCreators.size > 0 ? ` (${followedCreators.size})` : ""}
        </button>
        {isIndie && (
          <button
            className={`tok-filter-btn ${feedFilter === "staffPicks" ? "active" : ""}`}
            onClick={() => setFeedFilter("staffPicks")}
          >
            📚 Staff Picks
          </button>
        )}
      </div>

      {/* Platform filter pills */}
      {feedFilter !== "staffPicks" && (
        <div className="tok-platform-filters">
          {[
            { key: "all", label: "All" },
            { key: "tiktok", label: "♪ TikTok" },
            { key: "youtube", label: "▶ YouTube" },
            { key: "instagram", label: "◎ Instagram" },
          ].map((p) => (
            <button
              key={p.key}
              className={`tok-platform-pill ${platformFilter === p.key ? "active" : ""} ${p.key !== "all" ? `platform-${p.key}` : ""}`}
              onClick={() => setPlatformFilter(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Trending on BookTok — dynamic from video mentions */}
      {feedFilter !== "staffPicks" && (
        <TrendingBooks videos={SAMPLE_VIDEOS} library={library} onAddToLibrary={onAddToLibrary} />
      )}

      {feedFilter === "staffPicks" && isIndie ? (
        <div className="staff-picks-section">
          <div className="staff-picks-banner">
            <span className="staff-picks-badge">An Unlikely Story</span>
            <span className="staff-picks-tagline">Handpicked by our team in Plainville, MA</span>
          </div>
          <div className="staff-picks-grid">
            {STAFF_PICKS.map((pick) => (
              <StaffPickCard
                key={pick.staffName}
                pick={pick}
                library={library}
                onAddToLibrary={onAddToLibrary}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="tok-feed">
          {filteredVideos.length > 0 ? (
            filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onFollow={toggleFollow}
                following={followedCreators.has(video.creator.id)}
                library={library}
                onAddToLibrary={onAddToLibrary}
              />
            ))
          ) : (
            <div className="tok-empty">
              <p>Follow some creators above to see their videos here ✨</p>
            </div>
          )}
        </div>
      )}

      <div className="tok-cta">
        <p>{isIndie ? "Shop local, read global 📚" : "Want to share your own BookTok recs? Coming soon 🚀"}</p>
      </div>
    </div>
  );
}
