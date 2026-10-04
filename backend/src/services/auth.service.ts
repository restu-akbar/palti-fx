import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthTokenResponse, User, UserPayload } from '../models/user.model';

interface OtpRecord {
  code: string;
  expiresAt: number;
}

// In-memory user store initialized with demo accounts matching PALTI FX design specs
const users: Map<string, User> = new Map([
  [
    'demo-member-1',
    {
      id: 'usr_01',
      memberId: 'PFX-8821',
      email: 'member@paltifx.com',
      name: 'Trader Palti',
      passwordHash: bcrypt.hashSync('Password123!', 8),
      role: 'member',
      status: 'active',
      invitationCode: 'PFX-VIP-2026',
      createdAt: Date.now() - 30 * 24 * 3600 * 1000,
      updatedAt: Date.now(),
    },
  ],
  [
    'demo-pending-1',
    {
      id: 'usr_02',
      memberId: 'PFX-9932',
      email: 'newuser@paltifx.com',
      name: 'Member Baru',
      passwordHash: bcrypt.hashSync('Pending123!', 8),
      role: 'member',
      status: 'pending',
      invitationCode: 'PFX-INVITE-88',
      createdAt: Date.now() - 2 * 24 * 3600 * 1000,
      updatedAt: Date.now(),
    },
  ],
]);

// In-memory OTP store (email/memberId -> OtpRecord)
const otps: Map<string, OtpRecord> = new Map();

export class AuthService {
  static generateToken(user: User): AuthTokenResponse {
    const payload: UserPayload = {
      id: user.id,
      memberId: user.memberId,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: '7d',
    });

    return {
      token,
      expiresIn: config.jwtExpiresIn,
      user: payload,
    };
  }

  static verifyToken(token: string): UserPayload | null {
    try {
      return jwt.verify(token, config.jwtSecret) as UserPayload;
    } catch {
      return null;
    }
  }

  static findById(id: string): User | undefined {
    return Array.from(users.values()).find((u) => u.id === id);
  }

  static findByIdentifier(identifier: string): User | undefined {
    const clean = identifier.trim().toLowerCase();
    return Array.from(users.values()).find(
      (u) => u.email.toLowerCase() === clean || u.memberId.toLowerCase() === clean
    );
  }

  static async login(identifier: string, password: string):Promise<{ tokenData?: AuthTokenResponse; error?: string; status?: string }> {
    const user = this.findByIdentifier(identifier);
    if (!user) {
      return { error: 'Kredensial tidak valid. Periksa ID Member atau Email Anda.' };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return { error: 'Kata sandi tidak sesuai. Silakan coba kembali.' };
    }

    if (user.status === 'pending') {
      return {
        error: 'Akun Anda belum aktif. Silakan lakukan aktivasi akun menggunakan kode undangan.',
        status: 'pending',
      };
    }

    const tokenData = this.generateToken(user);
    return { tokenData };
  }

  static requestPasswordResetOtp(identifier: string): { success: boolean; message: string; otp?: string } {
    const user = this.findByIdentifier(identifier);
    if (!user) {
      return { success: false, message: 'Akun dengan ID / Email tersebut tidak ditemukan.' };
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
    otps.set(user.email.toLowerCase(), { code, expiresAt });

    return {
      success: true,
      message: 'Kode OTP pemulihan kata sandi telah dikirim.',
      otp: config.nodeEnv === 'development' ? code : undefined,
    };
  }

  static verifyPasswordResetOtp(identifier: string, otp: string): boolean {
    const user = this.findByIdentifier(identifier);
    if (!user) return false;

    const record = otps.get(user.email.toLowerCase());
    if (!record) return false;

    if (Date.now() > record.expiresAt) {
      otps.delete(user.email.toLowerCase());
      return false;
    }

    return record.code === otp.trim();
  }

  static async resetPassword(identifier: string, otp: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const isOtpValid = this.verifyPasswordResetOtp(identifier, otp);
    if (!isOtpValid) {
      return { success: false, message: 'Kode OTP salah atau telah kedaluwarsa.' };
    }

    const user = this.findByIdentifier(identifier);
    if (!user) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    user.passwordHash = await bcrypt.hash(newPassword, 8);
    user.updatedAt = Date.now();
    otps.delete(user.email.toLowerCase());

    return { success: true, message: 'Kata sandi berhasil diperbarui. Silakan login kembali.' };
  }

  static async activateAccount(invitationCode: string, name: string, email: string, password: string): Promise<{ tokenData?: AuthTokenResponse; error?: string }> {
    // Check if invitation code is valid
    const cleanCode = invitationCode.trim().toUpperCase();
    if (!cleanCode.startsWith('PFX-')) {
      return { error: 'Kode undangan tidak valid.' };
    }

    const existingUser = this.findByIdentifier(email);
    if (existingUser && existingUser.status === 'active') {
      return { error: 'Email sudah terdaftar dan aktif.' };
    }

    const id = 'usr_' + Date.now().toString(36);
    const memberId = 'PFX-' + Math.floor(1000 + Math.random() * 9000);
    const passwordHash = await bcrypt.hash(password, 8);

    const newUser: User = {
      id,
      memberId,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      passwordHash,
      role: 'member',
      status: 'active',
      invitationCode: cleanCode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    users.set(newUser.id, newUser);
    return { tokenData: this.generateToken(newUser) };
  }
}
