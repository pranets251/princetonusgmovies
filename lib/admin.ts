// The site's single admin (Pranet Swain, NetID ps3514). Usernames are derived from the
// Princeton email, so checking the email is equivalent to checking the old username.
export const ADMIN_EMAIL = "ps3514@princeton.edu"

export function isAdminEmail(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL
}
