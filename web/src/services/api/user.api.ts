import axiosInstance from './axios.instance'

export const userApi = {
  login: async (email: string, password: string) => {
    return axiosInstance.post('/user/login', { email, password })
  },

  register: async (email: string, password: string) => {
    return axiosInstance.post('/user/register', { email, password })
  },

  getProfile: async () => {
    return axiosInstance.get('/user/profile')
  },
}
