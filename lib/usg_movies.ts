// Movies that USG has shown at the campus theater.
// Used to color movie poster borders: yellow = shown, green = not yet shown.
const RAW = [
  "2001: A Space Odyssey","A Complete Unknown","A Different Man","A Real Pain",
  "After the Hunt","Aftersun","Air","All Dirt Roads Taste of Salt",
  "All Quiet on the Western Front","American Fiction","American Psycho","Anora",
  "Another Simple Favor","Ant-Man and the Wasp: Quantumania","Barbie","Barfi",
  "Beetlejuice","Before Sunrise","Belfast","Black Panther: Wakanda Forever",
  "Bodies Bodies Bodies","Booksmart","Bottoms","Bugonia","Call Me By Your Name",
  "Challengers","Chevalier","Civil War","Clueless","Cocaine Bear","Coda",
  "Conclave","Coraline","Crazy Rich Asians","Crazy, Stupid, Love.",
  "Dead Poets Society","Dìdi","Don't Worry Darling","Donnie Darko",
  "Dream Scenario","Drive My Car","Drive-away Dolls","Drop","Dumb Money",
  "Dune: Part Two","Elvis","Eternal Sunshine of the Spotless Mind",
  "Everything Everywhere All At Once","Fantastic Mr Fox","Get Out",
  "Good Will Hunting","Guardians of the Galaxy Vol. 1","Guardians of the Galaxy Vol. 2",
  "Guardians of the Galaxy Vol. 3","Harry Potter and the Prisoner of Azkaban",
  "Highest 2 Lowest","How to Lose a Guy in 10 Days","How to Train Your Dragon",
  "Interstellar","It Was Just an Accident","Jennifer's Body",
  "Judas and the Black Messiah","Jurassic Park","Just Mercy","Knives Out",
  "La La Land","Lady Bird","Last Night In Soho","Love Actually","Love Lies Bleeding",
  "M3GAN","Mamma Mia!","Marty Supreme","Mean Girls","Mickey 17","My Old Ass",
  "Napoleon Dynamite","Nickel Boys","No Hard Feelings","No Other Land","Nope",
  "Nosferatu","Nouvelle Vague","On Becoming a Guinea Fowl","One Battle After Another",
  "Oppenheimer","Oscar Nominated Short Films (2025)","Oscar Nominated Shorts 2024",
  "Oscar Shorts: Animated","Oscar Shorts: Live Action","Parasite","Perfect Blue",
  "Pitch Perfect","Poor Things","Portrait of a Lady on Fire","Pride and Prejudice",
  "Priscilla","Problemista","Promising Young Woman","Project Hail Mary",
  "Puss in Boots: The Last Wish","Ricky Stanicky","Saltburn","Saturday Night",
  "See How They Run","She Said","Shrek","Sing Sing","Sinners","Spider-Man: No Way Home",
  "Spirited Away","Talk to Me","Tár","Taylor Swift: The Eras Tour",
  "Testament of Ann Lee","The Batman","The Big Suck","The Boy and the Heron",
  "The Breakfast Club","The Drama","The Fabelmans","The French Dispatch",
  "The History of Sound","The Holdovers","The Idea of You","The Mastermind",
  "The Penguin Lessons","The Perks of Being a Wallflower","The Polar Express",
  "The Princess Bride","The Secret Agent","The Shining","The Substance",
  "The Truman Show","The Whale","The Wild Robot","The Woman King","Theater Camp",
  "There Will Be Blood","Tick, Tick... Boom!","Till","Top Gun: Maverick","Trap",
  "Twilight","Twister","Twisters","Us","Wake Up Dead Man","WALL-E","We Live in Time",
  "Weapons","When Harry Met Sally","Wicked","Wicked: For Good","Women Talking",
  "Worst Person in the World","Wonder",
]

export const USG_MOVIE_TITLES: Set<string> = new Set(
  RAW.map(t => t.toLowerCase().replace(/[^a-z0-9]/g, ""))
)

export function isUSGMovie(title: string): boolean {
  return USG_MOVIE_TITLES.has(title.toLowerCase().replace(/[^a-z0-9]/g, ""))
}
