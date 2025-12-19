import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 关键修改：Vercel 部署必须用根路径 '/'，不能用之前的 '/my-diary/'
  base: '/',
})