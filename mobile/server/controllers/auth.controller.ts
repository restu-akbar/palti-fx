import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { AuthService } from '../services/auth.service';
import { errorResponse, successResponse } from '../utils/response';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        return errorResponse(res, 'ID Member / Email dan kata sandi wajib diisi.', 400);
      }

      const result = await AuthService.login(identifier, password);
      if (result.error) {
        const code = result.status === 'pending' ? 403 : 401;
        return errorResponse(res, result.error, code);
      }

      return successResponse(res, 'Login berhasil.', result.tokenData);
    } catch (err: any) {
      return errorResponse(res, err.message || 'Gagal memproses login.', 500);
    }
  }

  static async activate(req: Request, res: Response) {
    try {
      const { invitationCode, name, email, password } = req.body;
      if (!invitationCode || !name || !email || !password) {
        return errorResponse(res, 'Semua data aktivasi (kode undangan, nama, email, sandi) wajib diisi.', 400);
      }

      if (password.length < 8) {
        return errorResponse(res, 'Kata sandi minimal 8 karakter.', 400);
      }

      const result = await AuthService.activateAccount(invitationCode, name, email, password);
      if (result.error) {
        return errorResponse(res, result.error, 400);
      }

      return successResponse(res, 'Aktivasi akun berhasil. Selamat datang di PALTI FX!', result.tokenData, 201);
    } catch (err: any) {
      return errorResponse(res, err.message || 'Gagal memproses aktivasi akun.', 500);
    }
  }

  static async requestOtp(req: Request, res: Response) {
    try {
      const { identifier } = req.body;
      if (!identifier) {
        return errorResponse(res, 'ID Member atau Email wajib diisi.', 400);
      }

      const result = AuthService.requestPasswordResetOtp(identifier);
      if (!result.success) {
        return errorResponse(res, result.message, 404);
      }

      return successResponse(res, result.message, { otp: result.otp });
    } catch (err: any) {
      return errorResponse(res, err.message || 'Gagal mengirim OTP.', 500);
    }
  }

  static async verifyOtp(req: Request, res: Response) {
    try {
      const { identifier, otp } = req.body;
      if (!identifier || !otp) {
        return errorResponse(res, 'Identifier dan kode OTP 6-digit wajib diisi.', 400);
      }

      const isValid = AuthService.verifyPasswordResetOtp(identifier, otp);
      if (!isValid) {
        return errorResponse(res, 'Kode OTP tidak valid atau sudah kedaluwarsa.', 400);
      }

      return successResponse(res, 'OTP berhasil diverifikasi.', { verified: true });
    } catch (err: any) {
      return errorResponse(res, err.message || 'Gagal verifikasi OTP.', 500);
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { identifier, otp, newPassword } = req.body;
      if (!identifier || !otp || !newPassword) {
        return errorResponse(res, 'Semua data pemulihan kata sandi wajib diisi.', 400);
      }

      if (newPassword.length < 8) {
        return errorResponse(res, 'Kata sandi baru minimal 8 karakter.', 400);
      }

      const result = await AuthService.resetPassword(identifier, otp, newPassword);
      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(res, result.message);
    } catch (err: any) {
      return errorResponse(res, err.message || 'Gagal memperbarui kata sandi.', 500);
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response) {
    return successResponse(res, 'Data pengguna berhasil diambil.', { user: req.user });
  }

  static async logout(req: AuthenticatedRequest, res: Response) {
    return successResponse(res, 'Berhasil keluar dari akun.');
  }
}
