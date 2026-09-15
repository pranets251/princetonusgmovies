export interface UpcomingMovie {
  date: string
  title: string
}

export interface RatingMovie {
  key: string
  title: string
}

export const DEFAULT_UPCOMING: UpcomingMovie[] = [
  { date: "Sep 4", title: "After Hours" },
  { date: "Sep 5", title: "Project X (2012)" },
]

export const DEFAULT_RATING_MOVIES: RatingMovie[] = [
  { key: "the-graduate", title: "The Graduate" },
  { key: "500-days-of-summer", title: "500 Days of Summer" },
]

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "movie"
}
