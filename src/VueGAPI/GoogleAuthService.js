export default class GoogleAuthService {

  constructor () {
    this.authenticated = this.isAuthenticated()
    this.authInstance = null

    this.offlineAccessCode = null
    this.getOfflineAccessCode = this.getOfflineAccessCode.bind(this)
    this.grantOfflineAccess = this.grantOfflineAccess.bind(this)
    this.login = this.login.bind(this)
    this.refreshToken = this.refreshToken.bind(this)
    this.logout = this.logout.bind(this)
    this.isAuthenticated = this.isAuthenticated.bind(this)
    this.isSignedIn = this.isSignedIn.bind(this)
    this.listenUserSignIn = this.listenUserSignIn.bind(this)
  }

  _expiresAt (authResult) {
    return JSON.stringify(authResult.expires_in * 1000 + new Date().getTime())
  }

  _setStorage (authResult, profile = null) {
    localStorage.setItem('gapi.access_token', authResult.access_token)
    localStorage.setItem('gapi.id_token', authResult.id_token)
    localStorage.setItem('gapi.expires_at', this._expiresAt(authResult))

    if (profile) {
      localStorage.setItem('gapi.id', profile.getId())
      localStorage.setItem('gapi.full_name', profile.getName())
      localStorage.setItem('gapi.first_name', profile.getGivenName())
      localStorage.setItem('gapi.last_name', profile.getFamilyName())
      localStorage.setItem('gapi.image_url', profile.getImageUrl())
      localStorage.setItem('gapi.email', profile.getEmail())
    }
  }

  _clearStorage () {
    localStorage.removeItem('gapi.access_token')
    localStorage.removeItem('gapi.id_token')
    localStorage.removeItem('gapi.expires_at')
    localStorage.removeItem('gapi.id')
    localStorage.removeItem('gapi.full_name')
    localStorage.removeItem('gapi.first_name')
    localStorage.removeItem('gapi.last_name')
    localStorage.removeItem('gapi.image_url')
    localStorage.removeItem('gapi.email')
  }

  _setOfflineAccessCode (authResult) {
    if (authResult.code) {
      this.offlineAccessCode = authResult.code
    } else {
      throw new Error('Offline access code missing from result', authResult)
    }
  }

  _setSession (response) {
    const profile = this.authInstance.currentUser.get().getBasicProfile()
    const authResult = response.Zi
    this._setStorage(authResult, profile)
    this.authenticated = true
  }

  getOfflineAccessCode () {
    return this.offlineAccessCode
  }

  grantOfflineAccess (event) {
    if (!this.authInstance) throw new Error('gapi not initialized')
    return this.authInstance.grantOfflineAccess()
      .then(this._setOfflineAccessCode.bind(this))
  }

  login (event) {
    if (!this.authInstance) throw new Error('gapi not initialized')
    const this$1 = this
    return new Promise((res, rej) => {
      this$1.authInstance.signIn()
        .then(function (response) {
          this$1._setSession(response)
          res()
        })
    })
  }

  refreshToken (event) {
    if (!this.authInstance) throw new Error('gapi not initialized')
    const GoogleUser = this.authInstance.currentUser.get()
    GoogleUser.reloadAuthResponse()
      .then((authResult) => {
        this._setStorage(authResult)
      })
  }

  logout (event) {
    if (!this.authInstance) throw new Error('gapi not initialized')
    const this$1 = this
    return new Promise((res, rej) => {
      this$1.authInstance.signOut()
        .then(function () {
          this$1._clearStorage()
          this$1.authenticated = false
          res()
        })
    })
  }

  isAuthenticated () {
    const expiresAt = JSON.parse(localStorage.getItem('gapi.expires_at'))
    return new Date().getTime() < expiresAt
  }

  isSignedIn () {
    if (!this.authInstance) throw new Error('gapi not initialized')
    const GoogleUser = this.authInstance.currentUser.get()
    return GoogleUser.isSignedIn()
  }

  listenUserSignIn (callback) {
    if (!this.authInstance) throw new Error('gapi not initialized')
    this.authInstance.isSignedIn.listen(callback)
    if (this.authInstance.currentUser.get().isSignedIn()){
      return this.getUserData()
    }
    else{
      return false
    }
  }

  getUserData () {
    return {
      id: localStorage.getItem('gapi.id'),
      firstName: localStorage.getItem('gapi.first_name'),
      lastName: localStorage.getItem('gapi.last_name'),
      fullName: localStorage.getItem('gapi.full_name'),
      email: localStorage.getItem('gapi.email'),
      imageUrl: localStorage.getItem('gapi.image_url'),
      expiresAt: localStorage.getItem('gapi.expires_at'),
      accessToken: localStorage.getItem('gapi.access_token'),
      idToken: localStorage.getItem('gapi.id_token')
    }
  }
}
