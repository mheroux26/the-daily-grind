/**
 * Frontend auto-genre tagger — mirrors backend logic.
 * Maps Google Books categories + title/description keywords to specific sub-genres.
 */

const GENRE_RULES = [
  // [sub-genre, categoryPatterns (regex), keywordPatterns (regex)]
  // Romance
  ["Contemporary Romance", [/romance/i], [/modern.{0,20}(love|romance|dating)/i, /small.town.romance/i]],
  ["Historical Romance", [/romance.*histor|histor.*romance/i], [/regency|duke|duchess|victorian.{0,20}(love|romance)/i]],
  ["Romantic Comedy", [/romance.*humor|humor.*romance/i], [/rom.?com|romantic.comedy|fake.dating|enemies.to.lovers/i]],
  ["Dark Romance", [/romance.*dark|dark.*romance/i], [/dark.romance|captive|mafia.romance|villain/i]],
  ["Paranormal Romance", [/paranormal.*romance/i], [/vampire.{0,20}(love|romance)|werewolf|fated.mate|shifter/i]],
  ["Romantasy", [/romance.*fantasy|fantasy.*romance/i], [/romantasy|fantasy.romance|fae.{0,20}(love|court)/i]],

  // Fantasy
  ["Epic Fantasy", [/epic.*fantasy/i], [/epic.fantasy|chosen.one|quest|prophecy|kingdom|throne/i]],
  ["Dark Fantasy", [/dark.*fantasy/i], [/dark.fantasy|grimdark|blood.magic|necromancer/i]],
  ["Urban Fantasy", [/urban.*fantasy/i], [/urban.fantasy|city.{0,10}magic|hidden.world/i]],
  ["Cozy Fantasy", [], [/cozy.fantasy|cottagecore|gentle.magic/i]],
  ["Fairy Tale Retelling", [/fairy.tale/i], [/retelling|reimagin|fairy.tale|once.upon/i]],
  ["Mythological", [/myth/i], [/mytholog|greek.god|olymp|norse|demigod/i]],

  // Science Fiction
  ["Dystopian", [/dystop/i], [/dystopi|totalitarian|surveillance|rebellion/i]],
  ["Space Opera", [/space/i], [/space.opera|galactic|starship|interstellar/i]],
  ["Cyberpunk", [/cyberpunk/i], [/cyberpunk|hacker|neon|neural|augmented/i]],
  ["Time Travel", [], [/time.travel|time.loop|temporal|paradox/i]],
  ["Post-Apocalyptic", [/apocalyp/i], [/post.apocalyp|wasteland|survivor|collapse/i]],

  // Mystery
  ["Cozy Mystery", [/mystery.*cozy|cozy.*mystery/i], [/cozy.mystery|amateur.detective|bak(ery|ing).{0,10}murder/i]],
  ["Police Procedural", [/mystery.*police|police/i], [/detective|police.{0,10}(procedural|investigation)|homicide/i]],
  ["Noir", [/noir/i], [/noir|hard.?boiled|femme.fatale/i]],
  ["Whodunit", [/mystery/i], [/whodunit|locked.room|murder.mystery/i]],
  ["Historical Mystery", [/mystery.*histor|histor.*mystery/i], [/historical.mystery|medieval.{0,10}murder/i]],

  // Thriller
  ["Psychological Thriller", [/psycholog.*thriller|thriller.*psycholog/i], [/psychological.thriller|unreliable.narrator|gasligh|obsessi|twisted/i]],
  ["Legal Thriller", [/legal.*thriller/i], [/legal.thriller|courtroom|lawyer|attorney|trial/i]],
  ["Medical Thriller", [/medical.*thriller/i], [/medical.thriller|hospital|surgeon|virus|epidemic|pandemic/i]],
  ["Domestic Thriller", [], [/domestic.thriller|marriage.{0,10}(secret|lie)|suburban.{0,10}(dark|secret)/i]],
  ["Espionage", [/spy|espionage/i], [/espionage|spy|intelligence.agent|cia|mi[56]|undercover/i]],

  // Horror
  ["Gothic Horror", [/gothic/i], [/gothic|crumbling.mansion|dark.manor|brooding/i]],
  ["Cosmic Horror", [/lovecraft|cosmic/i], [/cosmic.horror|lovecraft|elder.god|eldritch/i]],
  ["Haunted House", [], [/haunted.house|haunting|ghost.{0,10}(story|house)|poltergeist/i]],
  ["Folk Horror", [], [/folk.horror|pagan|ritual|wicker|rural.{0,10}horror/i]],
  ["Supernatural", [/supernatural|occult/i], [/supernatural|demon|exorcis|witch|occult|curse/i]],

  // Fiction (general)
  ["Literary Fiction", [/literary/i], [/literary.fiction|prize.{0,10}(winning|nominated)|pulitzer|booker/i]],
  ["Historical Fiction", [/historical/i], [/historical.fiction|world.war|civil.war|ancient.rome|medieval/i]],
  ["Contemporary Fiction", [/contemporary.*fiction|general.*fiction/i], [/contemporary.fiction|modern.life/i]],
  ["Magical Realism", [/magical.realism/i], [/magical.realism|surreal|enchant/i]],
  ["Satire", [/satire|humor/i], [/satire|satirical|darkly.comic|absurd/i]],
  ["Domestic Fiction", [/domestic.fiction|family/i], [/family.drama|family.secret|generational|mother.{0,10}daughter/i]],

  // Nonfiction
  ["Memoir", [/memoir|autobiography/i], [/memoir|my.story|my.life|personal.essay|growing.up/i]],
  ["Biography", [/biography/i], [/biography|life.of|story.of.{0,10}life/i]],
  ["True Crime", [/true.crime/i], [/true.crime|serial.killer|cold.case|forensic/i]],
  ["Self-Help", [/self.help|personal.development/i], [/self.help|personal.growth|habit|mindset|productivity/i]],
  ["History", [/\bhistory\b/i], [/historical.account|chronicle|century|civilization/i]],
  ["Psychology", [/psychology/i], [/psychology|behavioral|cognitive|therapy|mental.health|neuroscience/i]],
  ["Business", [/business|economics/i], [/business|startup|entrepreneur|leadership|management/i]],
  ["Philosophy", [/philosophy/i], [/philosophy|philosophical|meaning.of.life|ethics|existential/i]],

  // Young Adult
  ["YA Fantasy", [/young.adult.*fantasy|juvenile.*fantasy/i], [/ya.fantasy|teen.{0,10}magic/i]],
  ["YA Romance", [/young.adult.*romance|juvenile.*romance/i], [/ya.romance|teen.romance|first.love/i]],
  ["YA Dystopian", [/young.adult.*dystop|juvenile.*dystop/i], [/ya.dystop|teen.{0,10}rebellion/i]],
  ["YA Contemporary", [/young.adult.*fiction|juvenile.*fiction/i], [/coming.of.age|teen.life|high.school/i]],
  ["Coming of Age", [/coming.of.age/i], [/coming.of.age|growing.up|adolescen/i]],

  // Other
  ["Poetry", [/poetry|poems/i], [/poetry|poems|verse|stanza/i]],
  ["Graphic Novel", [/graphic.novel|comic/i], [/graphic.novel|illustrated|manga|comic/i]],
  ["Short Stories", [/short.stor/i], [/short.stor|collection|anthology/i]],
];

// Fallback: map broad Google Books categories to a default sub-genre
const FALLBACK_MAP = {
  fiction: "Contemporary Fiction",
  romance: "Contemporary Romance",
  fantasy: "Epic Fantasy",
  "science fiction": "Hard Sci-Fi",
  mystery: "Whodunit",
  thriller: "Psychological Thriller",
  horror: "Supernatural",
  biography: "Biography",
  autobiography: "Memoir",
  "self-help": "Self-Help",
  history: "History",
  science: "Science",
  psychology: "Psychology",
  business: "Business",
  poetry: "Poetry",
  comics: "Graphic Novel",
  "young adult": "YA Contemporary",
  juvenile: "YA Contemporary",
};

export function autoTagGenres(categories = [], title = "", description = "") {
  const catText = categories.join(" ").toLowerCase();
  const searchText = `${title} ${description || ""}`.toLowerCase();
  const scored = {};

  for (const [subGenre, catPatterns, kwPatterns] of GENRE_RULES) {
    let score = 0;

    for (const pat of catPatterns) {
      if (pat.test(catText)) {
        score += 2;
        break;
      }
    }

    for (const pat of kwPatterns) {
      if (pat.test(searchText)) {
        score += 1;
        break;
      }
    }

    if (score > 0) {
      scored[subGenre] = score;
    }
  }

  if (Object.keys(scored).length === 0) {
    // Fallback from broad categories
    const results = [];
    for (const cat of categories) {
      const catLower = cat.toLowerCase();
      for (const [key, genre] of Object.entries(FALLBACK_MAP)) {
        if (catLower.includes(key) && !results.includes(genre)) {
          results.push(genre);
          break;
        }
      }
    }
    return results.slice(0, 2);
  }

  // Sort by score, take top 1-3
  const ranked = Object.entries(scored).sort((a, b) => b[1] - a[1]);
  const bestScore = ranked[0][1];
  return ranked.filter(([, s]) => s >= bestScore - 1).map(([g]) => g).slice(0, 3);
}
