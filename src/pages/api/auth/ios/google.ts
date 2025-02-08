import { NextApiRequest, NextApiResponse } from 'next'
import { OAuth2Client } from 'google-auth-library'
import { DatabaseService } from '@/lib/db/service'
import { generateToken } from '../[...nextauth]'
import { clientPromise } from "@/lib/db/client"
import { ObjectId } from 'mongodb'

const client = new OAuth2Client(process.env.GOOGLE_IOS_CLIENT_ID)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { credential } = req.body

        // Verify the Google ID token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_IOS_CLIENT_ID
        })

        const payload = ticket.getPayload()
        if (!payload?.email) {
            return res.status(401).json({ error: 'Invalid token' })
        }

        // Create or get user
        let user = await DatabaseService.getUserByEmail(payload.email)
        const now = new Date()

        if (!user) {
            const userDoc = {
                email: payload.email,
                name: payload.name || '',
                imageUrl: payload.picture,
                createdAt: now,
                updatedAt: now,
                lastLoginAt: now,
            }
            
            const client = await clientPromise
            const collection = client.db("DB").collection('users')
            const result = await collection.insertOne({
                ...userDoc,
                _id: new ObjectId()
            })
            
            user = await DatabaseService.getUserById(result.insertedId)
            if (!user) throw new Error('Failed to create user')
        } else {
            await DatabaseService.updateUserLastLogin(user._id)
        }

        // Generate token
        const accessToken = generateToken(user._id.toString())
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

        return res.status(200).json({
            user: {
                _id: user._id.toString(),
                email: user.email,
                name: user.name,
                imageUrl: user.imageUrl,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastLoginAt: user.lastLoginAt,
            },
            session: {
                accessToken,
                expiresAt: expiresAt.toISOString()
            }
        })

    } catch (error) {
        console.error('Authentication error:', error)
        return res.status(500).json({ error: 'Authentication failed' })
    }
}
