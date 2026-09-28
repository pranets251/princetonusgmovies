// "dir. Steven Spielberg" under a movie title. Renders nothing when the director is unknown.
export default function DirectorLine({ director, className = "" }: { director?: string | null; className?: string }) {
  if (!director) return null
  return <span className={`block text-neutral-600 ${className}`}>dir. {director}</span>
}
