export function isOwner(email: string | null | undefined): boolean {
  return !!email && email === process.env.OWNER_EMAIL;
}
