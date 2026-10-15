import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { getDB } from '../db.js'
import { signToken } from '../auth.js'

const router = Router()

/** POST /api/auth/login 管理员登录 */
router.post('/login', (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string }
  if (!username || !password) {
    res.status(400).json({ message: '请输入用户名和密码' })
    return
  }
  const user = getDB().users.find((u) => u.username === username.trim())
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ message: '用户名或密码错误' })
    return
  }
  const token = signToken(user)
  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role }
  })
})

export default router
