export interface MovieSummary {
  tmdb_id: number
  title: string
  year: string
  poster_path: string | null
  director: string
  // TMDB plot overview and top-billed actors; carried on matchups for the "About" popup.
  overview?: string
  cast?: string[]
}

// A movie's [Elo, number of matches] for one student, or across everyone.
export type Ratings = Record<string, [number, number]>

export interface RankedMovie extends MovieSummary {
  elo: number
  matches: number
}

export interface RatedMovie {
  key: string
  title: string
  director: string
  poster_path: string | null
  liked: number
  disliked: number
  my_vote: boolean | null
}

export type Matchup = [MovieSummary, MovieSummary]

export interface TmdbSearchResult {
  id: number
  title: string
  release_date: string
  poster_path: string | null
  director?: string
}

export const TOP4_SIZE = 4
export const STARTING_ELO = 1500

export function posterUrl(path: string | null, size: "w185" | "w342" | "w500" = "w342"): string | null {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null
}
