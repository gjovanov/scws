import { apiClient } from '../http-client'
import * as qs from 'qs'

class UserService {
  #endpoint = 'users'
  me() {
    const url = `/${this.#endpoint}/me`
    return apiClient.get(url)
  }

  login(payload) {
    const url = `/${this.#endpoint}/login`
    return apiClient.post(url, payload)
  }

  logout() {
    const url = `/${this.#endpoint}/logout`
    return apiClient.post(url)
  }

  register(payload) {
    const url = `/${this.#endpoint}/register`
    return apiClient.post(url, payload)
  }

  get(id) {
    const url = `/${this.#endpoint}/get/${id}`
    return apiClient.get(url)
  }

  getAll(params) {
    const querystring = qs.stringify(params, { encode: false })
    const url = `/${this.#endpoint}/get-all?${querystring}`
    return apiClient.get(url)
  }

  update(id, payload) {
    const url = `/${this.#endpoint}/update/${id}`
    return apiClient.patch(url, payload)
  }

  delete(id) {
    const url = `/${this.#endpoint}/delete/${id}`
    return apiClient.delete(url)
  }
}

export const userService = new UserService()
