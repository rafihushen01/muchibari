'use server'


export async function addAdmin(email: string, password: string) {
  void email; void password
  return { success: false, message: 'Admin creation is now restricted to the MongoDB admin bootstrap process.' }
}
