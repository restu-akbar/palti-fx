export type Settings = {
  balance?: string;
  riskPercent?: string;
  leverage?: string;
  lastSymbol?: string;
  /** Sudah melihat layar sambutan */
  welcomed?: boolean;
  /** Status autentikasi login pengguna */
  isLoggedIn?: boolean;
  /** Role akun: member atau admin */
  role?: 'member' | 'admin';
  /** Nama panggilan member (untuk sapaan) */
  name?: string;
  /** Identifier / Email akun yang sedang aktif */
  activeUser?: string;
  /** Pencapaian yang sudah terbuka: id → waktu terbuka (ms) */
  unlocked?: Record<string, number>;
  /** Berapa kali kalkulator Lot Size dibuka */
  lotCalcCount?: number;
};

export type UserScopedSettings = Pick<
  Settings,
  'balance' | 'riskPercent' | 'leverage' | 'lastSymbol' | 'lotCalcCount'
>;
