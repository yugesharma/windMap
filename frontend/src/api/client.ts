import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (res)=>res,
  (err)=>{
    const status=err?.response?.status
    const msg=err?.response?.data?.message ?? err.message
    throw new Error(`HTTP ${status}:${msg}`)
  }
)

export default apiClient;