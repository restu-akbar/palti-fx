export interface MarketSession {
  name: string;
  city: string;
  openWib: number; // Hour in WIB (0-23)
  closeWib: number;
  isOpen: boolean;
}

export interface MarketStatus {
  timeWib: string;
  isWeekend: boolean;
  statusText: string;
  activeSessions: string[];
  isOverlap: boolean;
  sessions: MarketSession[];
}

export class MarketService {
  static getStatus(): MarketStatus {
    const now = new Date();
    // Convert to WIB (UTC+7)
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const utcDay = now.getUTCDay();

    const wibHour = (utcHours + 7) % 24;
    const wibMinutes = utcMinutes;
    const timeWib = `${String(wibHour).padStart(2, '0')}:${String(wibMinutes).padStart(2, '0')} WIB`;

    // Weekend check: Forex closes Friday 21:00 UTC (Saturday 04:00 WIB) and opens Sunday 21:00 UTC (Monday 04:00 WIB)
    const isWeekend =
      (utcDay === 5 && utcHours >= 21) ||
      utcDay === 6 ||
      (utcDay === 0 && utcHours < 21);

    const checkSessionOpen = (openH: number, closeH: number, currentH: number): boolean => {
      if (isWeekend) return false;
      if (openH < closeH) {
        return currentH >= openH && currentH < closeH;
      }
      // Session wraps midnight (e.g. 19:00 - 04:00)
      return currentH >= openH || currentH < closeH;
    };

    const sessions: MarketSession[] = [
      {
        name: 'Sydney',
        city: 'Sydney (AEST)',
        openWib: 4,
        closeWib: 13,
        isOpen: checkSessionOpen(4, 13, wibHour),
      },
      {
        name: 'Tokyo',
        city: 'Tokyo (JST)',
        openWib: 7,
        closeWib: 16,
        isOpen: checkSessionOpen(7, 16, wibHour),
      },
      {
        name: 'London',
        city: 'London (BST/GMT)',
        openWib: 14,
        closeWib: 23,
        isOpen: checkSessionOpen(14, 23, wibHour),
      },
      {
        name: 'New York',
        city: 'New York (EDT/EST)',
        openWib: 19,
        closeWib: 4,
        isOpen: checkSessionOpen(19, 4, wibHour),
      },
    ];

    const activeSessions = sessions.filter((s) => s.isOpen).map((s) => s.name);
    const isOverlap = activeSessions.includes('London') && activeSessions.includes('New York');

    let statusText = 'Pasar tutup';
    if (isWeekend) {
      statusText = 'Pasar tutup · Akhir pekan';
    } else if (isOverlap) {
      statusText = 'Overlap London & New York · Volatilitas tinggi';
    } else if (activeSessions.length > 0) {
      statusText = `Sesi aktif: ${activeSessions.join(' & ')}`;
    }

    return {
      timeWib,
      isWeekend,
      statusText,
      activeSessions,
      isOverlap,
      sessions,
    };
  }
}
