export interface UpcomingMovie {
  date: string
  title: string
}

export interface RatingMovie {
  key: string
  title: string
  tmdb_id?: number
}

export const DEFAULT_UPCOMING: UpcomingMovie[] = [
  { date: "Sep 4", title: "After Hours" },
  { date: "Sep 5", title: "Project X (2012)" },
]

export const DEFAULT_RATING_MOVIES: RatingMovie[] = [
  { key: "the-graduate", title: "The Graduate" },
  { key: "500-days-of-summer", title: "500 Days of Summer" },
]
