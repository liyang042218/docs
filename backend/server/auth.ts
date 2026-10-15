import type { NextFunction, Response } from 'express'
import jwt from 'jsonwebtoken'
import type { User } from './db.js'

export const JWT_SECRET = process.env.JWT_SECRET || 'docs-site-dev-secret-please-change'

export interface JwtPayload {
  id: string
  username: string
  role: string
}

export interface AuthedRequest {
  headers: Request['headers']
  user?: JwtPayload
}

export function signToken(user: Pick<User, 'id' | 'username' | 'role'>): string {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function authRequired(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: '未登录或登录已过期' })
    return
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET) as JwtPayload
    next()
  } catch {
    res.status(401).json({ message: '登录已过期，请重新登录' })
  }
}
