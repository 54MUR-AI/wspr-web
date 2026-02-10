// RMG Auth Integration for WSPR
// Receives user credentials from parent RMG site via URL params

export interface RMGUser {
  userId: string
  email: string
}

export class AuthManager {
  private static instance: AuthManager
  private user: RMGUser | null = null

  private constructor() {
    this.initializeFromURL()
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  private initializeFromURL() {
    // Get user credentials from URL params (passed from RMG iframe)
    const urlParams = new URLSearchParams(window.location.search)
    const userId = urlParams.get('userId')
    const email = urlParams.get('email')

    if (userId && email) {
      this.user = { userId, email }
      // Store in sessionStorage for persistence
      sessionStorage.setItem('rmg_user', JSON.stringify(this.user))
      
      // Clean URL to remove sensitive params
      window.history.replaceState({}, '', window.location.pathname)
    } else {
      // Try to restore from sessionStorage
      const stored = sessionStorage.getItem('rmg_user')
      if (stored) {
        this.user = JSON.parse(stored)
      }
    }
  }

  getUser(): RMGUser | null {
    return this.user
  }

  isAuthenticated(): boolean {
    return this.user !== null
  }

  logout() {
    this.user = null
    sessionStorage.removeItem('rmg_user')
  }
}

export const authManager = AuthManager.getInstance()
