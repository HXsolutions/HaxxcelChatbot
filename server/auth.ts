import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import session from "express-session";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
import type { Express, RequestHandler } from "express";
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Use PostgreSQL store again now that connection is stable
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'dev-fallback-secret-' + Math.random().toString(36),
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export class AuthService {
  // Hash password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // Verify password
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  generateToken(user: AuthUser): string {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        isEmailVerified: user.isEmailVerified 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  // Verify JWT token
  verifyToken(token: string): AuthUser | null {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthUser;
    } catch {
      return null;
    }
  }

  // Generate random token for email verification/password reset
  generateRandomToken(): string {
    return randomBytes(32).toString('hex');
  }

  // Register user with email/password
  async register(email: string, password: string, name: string): Promise<{ user: AuthUser; token: string }> {
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);
    const emailVerificationToken = this.generateRandomToken();

    // Create user
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      emailVerificationToken,
      isEmailVerified: false,
    }).returning();

    // Send verification email
    await this.sendVerificationEmail(email, emailVerificationToken);

    const authUser: AuthUser = {
      id: newUser.id,
      email: newUser.email!,
      name: newUser.name!,
      isEmailVerified: newUser.isEmailVerified!,
    };

    const token = this.generateToken(authUser);
    return { user: authUser, token };
  }

  // Login with email/password
  async login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !user.password) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email!,
      name: user.name!,
      isEmailVerified: user.isEmailVerified!,
    };

    const token = this.generateToken(authUser);
    return { user: authUser, token };
  }

  // Google OAuth login
  async googleLogin(idToken: string): Promise<{ user: AuthUser; token: string }> {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new Error('Invalid Google token');
      }

      // Check if user exists
      let [user] = await db.select().from(users).where(eq(users.email, payload.email)).limit(1);

      if (!user) {
        // Create new user
        [user] = await db.insert(users).values({
          email: payload.email,
          name: payload.name || payload.email,
          googleId: payload.sub,
          isEmailVerified: true,
          profileImageUrl: payload.picture,
        }).returning();
      } else if (!user.googleId) {
        // Link existing account with Google
        [user] = await db.update(users)
          .set({ 
            googleId: payload.sub,
            isEmailVerified: true,
            profileImageUrl: payload.picture 
          })
          .where(eq(users.id, user.id))
          .returning();
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email!,
        name: user.name!,
        isEmailVerified: user.isEmailVerified!,
      };

      const token = this.generateToken(authUser);
      return { user: authUser, token };
    } catch (error) {
      throw new Error('Google authentication failed');
    }
  }

  // Send verification email
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your email - Haxxcel Chatbot Platform',
      html: `
        <h2>Welcome to Haxxcel Chatbot Platform!</h2>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
        <p>Or copy and paste this link in your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't throw error as user registration should still succeed
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      throw new Error('No user found with this email address');
    }

    const resetToken = this.generateRandomToken();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // Update user with reset token
    await db.update(users)
      .set({
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      })
      .where(eq(users.id, user.id));

    const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset - Haxxcel Chatbot Platform',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p>Or copy and paste this link in your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const [user] = await db.select().from(users)
      .where(eq(users.passwordResetToken, token))
      .limit(1);

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await db.update(users)
      .set({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      })
      .where(eq(users.id, user.id));
  }

  // Verify email
  async verifyEmail(token: string): Promise<void> {
    const [user] = await db.select().from(users)
      .where(eq(users.emailVerificationToken, token))
      .limit(1);

    if (!user) {
      throw new Error('Invalid verification token');
    }

    await db.update(users)
      .set({
        isEmailVerified: true,
        emailVerificationToken: null,
      })
      .where(eq(users.id, user.id));
  }
}

export const authService = new AuthService();

// Authentication middleware
export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || (req.session as any)?.token;
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Handle demo token
    if (token === 'demo-jwt-token') {
      req.user = {
        id: 'demo-user-id',
        email: 'demo@haxxcel.com',
        name: 'Demo User',
        isEmailVerified: true
      };
      return next();
    }

    const user = authService.verifyToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
}