export const BOX_FRAC = 0.25
export const TMDB_ORIGINAL = "https://image.tmdb.org/t/p/original"
export const TMDB_W780 = "https://image.tmdb.org/t/p/w780"

export interface Tagline {
  id: string
  tmdb_id: number
  movie_title: string
  poster_path: string
  user_email: string
  username: string
  x: number
  y: number
  zoom?: number      // legacy — effective box size = BOX_FRAC / zoom
  bwf?: number       // box width as fraction of board width (new format)
  bhf?: number       // box height as fraction of board height (new format)
  fontSize?: number  // manualFontSize / boardHeight at creation time
  creationBoxW?: number
  text: string
  html?: string
  font: string
  color: string
  align?: "left" | "center" | "right"
  vertAlign?: "top" | "center" | "bottom"
  created_at: string
  endorsements: string[]
  endorse_count: number
}

export interface MuralBoard {
  tmdb_id: number
  movie_title: string
  poster_path: string
  created_by: string
  created_at: string
}
