"""
Auto-genre tagging — maps Google Books categories + description keywords
to specific sub-genres that readers actually care about.
"""

import re
from typing import List, Optional

# Each rule: (sub-genre, category_patterns, keyword_patterns)
# category_patterns match against Google Books categories (case-insensitive)
# keyword_patterns match against title + description text (case-insensitive)
# A match on EITHER category or keywords triggers the tag;
# keyword matches also consider description for better accuracy.

GENRE_RULES = [
    # ── Romance ──────────────────────────────────────────────
    ("Contemporary Romance", [r"romance"], [r"modern.{0,20}(love|romance|dating|relationship)", r"small.town.romance", r"beach.read"]),
    ("Historical Romance", [r"romance.*histor|histor.*romance"], [r"regency|duke|duchess|victorian.{0,20}(love|romance)|highland|laird"]),
    ("Romantic Comedy", [r"romance.*humor|humor.*romance"], [r"rom.?com|romantic.comedy|hilarious.{0,20}(love|romance)|fake.dating|enemies.to.lovers"]),
    ("Dark Romance", [r"romance.*dark|dark.*romance"], [r"dark.romance|captive|mafia.romance|villain.{0,20}(love|romance)|anti.hero"]),
    ("Paranormal Romance", [r"paranormal.*romance|romance.*paranormal"], [r"vampire.{0,20}(love|romance)|werewolf.{0,20}(love|romance)|fated.mate|shifter"]),
    ("Romantasy", [r"romance.*fantasy|fantasy.*romance"], [r"romantasy|fantasy.romance|fae.{0,20}(love|romance|court)|mate.bond"]),
    ("Second Chance", [], [r"second.chance|rekindled|ex.{0,5}(boyfriend|girlfriend|husband|wife|lover)"]),

    # ── Fantasy ──────────────────────────────────────────────
    ("Epic Fantasy", [r"epic.*fantasy|fantasy.*epic"], [r"epic.fantasy|chosen.one|quest|prophecy|kingdom|throne|sword.{0,10}(sorcery|magic)"]),
    ("Dark Fantasy", [r"dark.*fantasy|fantasy.*dark"], [r"dark.fantasy|grimdark|blood.magic|necromancer"]),
    ("Urban Fantasy", [r"urban.*fantasy|fantasy.*urban"], [r"urban.fantasy|city.{0,10}magic|hidden.world|supernatural.{0,10}(city|urban)"]),
    ("Cozy Fantasy", [], [r"cozy.fantasy|cottagecore|gentle.magic|wholesome.{0,10}fantasy"]),
    ("Grimdark", [], [r"grimdark|brutal.{0,10}(world|war|magic)|morally.grey"]),
    ("Fairy Tale Retelling", [r"fairy.tale"], [r"retelling|reimagin|fairy.tale|once.upon|sleeping.beauty|cinderella|red.riding"]),
    ("Mythological", [r"myth"], [r"mytholog|greek.god|olymp|norse|ancient.god|demigod|pantheon"]),

    # ── Science Fiction ───────────────────────────────────────
    ("Dystopian", [r"dystop"], [r"dystopi|totalitarian|surveillance.state|oppressive.regime|rebellion|resistance"]),
    ("Space Opera", [r"space"], [r"space.opera|galactic|starship|interstellar|space.fleet|alien.{0,10}(war|empire)"]),
    ("Cyberpunk", [r"cyberpunk"], [r"cyberpunk|hacker|neon|neural|augmented|virtual.reality|android"]),
    ("Time Travel", [], [r"time.travel|time.loop|temporal|chrono|paradox"]),
    ("Hard Sci-Fi", [r"science.fiction"], [r"hard.sci|quantum|terrafor|astrophys|orbital"]),
    ("Post-Apocalyptic", [r"apocalyp"], [r"post.apocalyp|after.the.fall|wasteland|survivor|collapse.of.civilization"]),
    ("Climate Fiction", [], [r"cli.fi|climate.fiction|global.warming|rising.seas|eco.catastrophe"]),

    # ── Mystery ───────────────────────────────────────────────
    ("Cozy Mystery", [r"mystery.*cozy|cozy.*mystery"], [r"cozy.mystery|small.town.{0,10}murder|amateur.detective|bak(ery|ing).{0,10}murder|cat.{0,10}mystery"]),
    ("Police Procedural", [r"mystery.*police|police.*procedural"], [r"detective|police.{0,10}(procedural|investigation)|homicide|precinct"]),
    ("Noir", [r"noir"], [r"noir|hard.?boiled|seedy|underworld|femme.fatale"]),
    ("Whodunit", [r"mystery"], [r"whodunit|locked.room|suspect|murder.mystery|clue"]),
    ("Amateur Sleuth", [], [r"amateur.sleuth|amateur.detective|nosy.neighbor|accidental.detective"]),
    ("Historical Mystery", [r"mystery.*histor|histor.*mystery"], [r"historical.mystery|medieval.{0,10}murder|victorian.{0,10}(mystery|detective)"]),

    # ── Thriller ──────────────────────────────────────────────
    ("Psychological Thriller", [r"psycholog.*thriller|thriller.*psycholog"], [r"psychological.thriller|unreliable.narrator|gasligh|obsessi|mind.game|twisted"]),
    ("Legal Thriller", [r"legal.*thriller|thriller.*legal"], [r"legal.thriller|courtroom|lawyer|attorney|trial|verdict|law.firm"]),
    ("Medical Thriller", [r"medical.*thriller|thriller.*medical"], [r"medical.thriller|hospital|surgeon|virus|epidemic|pandemic|outbreak"]),
    ("Domestic Thriller", [], [r"domestic.thriller|marriage.{0,10}(secret|lie)|suburban.{0,10}(dark|secret)|neighbor.{0,10}(secret|danger|watch)"]),
    ("Espionage", [r"spy|espionage"], [r"espionage|spy|intelligence.agent|cia|mi[56]|undercover|double.agent"]),
    ("Techno-Thriller", [r"techno.*thriller"], [r"techno.thriller|cyber.{0,10}(attack|threat|war)|artificial.intelligence.{0,10}(threat|danger)"]),

    # ── Horror ────────────────────────────────────────────────
    ("Gothic Horror", [r"gothic"], [r"gothic|crumbling.mansion|dark.manor|brooding|eerie.estate"]),
    ("Cosmic Horror", [r"lovecraft|cosmic"], [r"cosmic.horror|lovecraft|elder.god|unknowable|eldritch|void"]),
    ("Haunted House", [], [r"haunted.house|haunting|ghost.{0,10}(story|house|manor)|poltergeist|possession"]),
    ("Folk Horror", [], [r"folk.horror|pagan|ritual|wicker|rural.{0,10}(horror|terror|cult)"]),
    ("Body Horror", [], [r"body.horror|transformation|mutation|flesh|parasite"]),
    ("Supernatural", [r"supernatural|occult"], [r"supernatural|demon|exorcis|witch|occult|séance|curse"]),

    # ── Fiction (general) ────────────────────────────────────
    ("Literary Fiction", [r"literary.fiction|literary"], [r"literary.fiction|prize.{0,10}(winning|nominated)|pulitzer|booker|national.book"]),
    ("Historical Fiction", [r"historical.fiction|histor"], [r"historical.fiction|set.in.the.\d{2,4}|world.war|civil.war|ancient.rome|medieval"]),
    ("Contemporary Fiction", [r"contemporary.*fiction|general.*fiction"], [r"contemporary.fiction|modern.life|present.day"]),
    ("Magical Realism", [r"magical.realism"], [r"magical.realism|magic.{0,10}(woven|thread|real)|surreal|enchant"]),
    ("Satire", [r"satire|humor"], [r"satire|satirical|darkly.comic|absurd|lampoon"]),
    ("Southern Gothic", [], [r"southern.gothic|bayou|deep.south|swamp|southern.{0,10}(dark|decay|grotesque)"]),
    ("Domestic Fiction", [r"domestic.fiction|family"], [r"domestic.fiction|family.drama|family.secret|generational|mother.{0,10}daughter|sibling"]),

    # ── Nonfiction ────────────────────────────────────────────
    ("Memoir", [r"memoir|autobiography|biography.*personal"], [r"memoir|my.story|my.life|personal.essay|growing.up|i.was|i.grew|looking.back"]),
    ("Biography", [r"biography"], [r"biography|life.of|story.of.{0,10}(life|journey)|definitive.account"]),
    ("True Crime", [r"true.crime"], [r"true.crime|serial.killer|cold.case|murder.{0,10}(investigation|case)|forensic"]),
    ("Self-Help", [r"self.help|personal.development"], [r"self.help|personal.growth|habit|mindset|productivity|how.to.(live|succeed|thrive)"]),
    ("History", [r"history(?!.*fiction)"], [r"(?<!fiction.)history|historical.account|chronicle|century|era|civilization"]),
    ("Science", [r"science(?!.*fiction)"], [r"(?<!fiction.)science|scientific|research|discovery|experiment|physics|biology|chemistry"]),
    ("Psychology", [r"psychology"], [r"psychology|behavioral|cognitive|therapy|mental.health|brain|neuroscience"]),
    ("Business", [r"business|economics"], [r"business|startup|entrepreneur|leadership|management|strategy|innovation"]),
    ("Essays", [r"essay"], [r"essays|collected.writing|personal.essay"]),
    ("Philosophy", [r"philosophy"], [r"philosophy|philosophical|meaning.of.life|ethics|moral|existential"]),

    # ── Young Adult ───────────────────────────────────────────
    ("YA Fantasy", [r"young.adult.*fantasy|juvenile.*fantasy"], [r"ya.fantasy|young.adult.fantasy|teen.{0,10}(magic|quest)"]),
    ("YA Romance", [r"young.adult.*romance|juvenile.*romance"], [r"ya.romance|teen.romance|first.love|high.school.{0,10}(love|crush)"]),
    ("YA Dystopian", [r"young.adult.*dystop|juvenile.*dystop"], [r"ya.dystop|teen.{0,10}(rebellion|resistance|survival)"]),
    ("YA Contemporary", [r"young.adult.*fiction|juvenile.*fiction"], [r"ya.contemporary|coming.of.age|teen.life|high.school.drama"]),
    ("Coming of Age", [r"coming.of.age|bildungsroman"], [r"coming.of.age|growing.up|adolescen|transition.to.adult"]),
    ("YA Thriller", [r"young.adult.*thriller|juvenile.*thriller"], [r"ya.thriller|teen.{0,10}(thriller|suspense|danger)"]),

    # ── Other ─────────────────────────────────────────────────
    ("Poetry", [r"poetry|poems"], [r"poetry|poems|verse|stanza|haiku"]),
    ("Graphic Novel", [r"graphic.novel|comic"], [r"graphic.novel|illustrated|manga|comic"]),
    ("Short Stories", [r"short.stor"], [r"short.stor|collection|anthology|stories"]),
    ("Classic", [r"classic"], [r"classic.literature|timeless|canon|masterpiece"]),
]


def auto_tag_genres(
    categories: List[str],
    title: str = "",
    description: Optional[str] = None,
) -> List[str]:
    """
    Automatically assign sub-genres based on Google Books categories,
    the book title, and description.

    Returns a list of 1-3 most relevant sub-genre tags.
    """
    cat_text = " ".join(categories).lower()
    search_text = f"{title} {description or ''}".lower()

    scored: dict[str, float] = {}

    for sub_genre, cat_patterns, kw_patterns in GENRE_RULES:
        score = 0.0

        # Check category matches (stronger signal)
        for pat in cat_patterns:
            if re.search(pat, cat_text, re.IGNORECASE):
                score += 2.0
                break

        # Check keyword matches in title + description
        for pat in kw_patterns:
            if re.search(pat, search_text, re.IGNORECASE):
                score += 1.0
                break  # Only count once per rule

        if score > 0:
            scored[sub_genre] = score

    if not scored:
        # Fallback: try to match broad categories to parent genres
        return _fallback_from_categories(categories)

    # Sort by score descending, take top 1-3
    ranked = sorted(scored.items(), key=lambda x: -x[1])

    # Take the top genre, plus any others within 1 point of the best
    best_score = ranked[0][1]
    results = [g for g, s in ranked if s >= best_score - 1.0]

    return results[:3]


def _fallback_from_categories(categories: List[str]) -> List[str]:
    """If no specific sub-genre matched, map broad Google Books categories."""
    fallback_map = {
        "fiction": "Contemporary Fiction",
        "romance": "Contemporary Romance",
        "fantasy": "Epic Fantasy",
        "science fiction": "Hard Sci-Fi",
        "mystery": "Whodunit",
        "thriller": "Psychological Thriller",
        "horror": "Supernatural",
        "biography": "Biography",
        "autobiography": "Memoir",
        "self-help": "Self-Help",
        "history": "History",
        "science": "Science",
        "psychology": "Psychology",
        "business": "Business",
        "poetry": "Poetry",
        "comics": "Graphic Novel",
        "young adult": "YA Contemporary",
        "juvenile": "YA Contemporary",
    }

    results = []
    for cat in categories:
        cat_lower = cat.lower()
        for key, genre in fallback_map.items():
            if key in cat_lower and genre not in results:
                results.append(genre)
                break

    return results[:2]
