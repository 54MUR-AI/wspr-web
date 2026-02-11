// RMG Auth Integration for WSPR
// Receives user credentials from parent RMG site via URL params

export class AuthManager {
  private userId: string | null = null
  private email: string | null = null
  private username: string | null = null

  constructor() {
    this.initFromUrl()
  }

  private initFromUrl() {
    const params = new URLSearchParams(window.location.search)
    this.userId = params.get('userId')
    this.email = params.get('email')
    this.username = params.get('username')
    
    if (this.userId) {
      sessionStorage.setItem('wspr_userId', this.userId)
    }
    if (this.email) {
      sessionStorage.setItem('wspr_email', this.email)
    }
    if (this.username) {
      sessionStorage.setItem('wspr_username', this.username)
    }
  }

  getUser(): { userId: string; email: string; username: string } | null {
    const userId = this.userId || sessionStorage.getItem('wspr_userId')
    const email = this.email || sessionStorage.getItem('wspr_email')
    const username = this.username || sessionStorage.getItem('wspr_username')
    
    if (!userId || !email) {
      return null
    }
    
    return { userId, email, username: username || email.split('@')[0] }
  }

  isAuthenticated(): boolean {
    return this.getUser() !== null
  }

  logout() {
    this.userId = null
    this.email = null
    this.username = null
    sessionStorage.removeItem('wspr_userId')
    sessionStorage.removeItem('wspr_email')
    sessionStorage.removeItem('wspr_username')
  }
}

export const authManager = new AuthManager()
