export type PlatformType =
  | 'ps1'
  | 'ps2'
  | 'ps3'
  | 'switch'
  | 'snes'
  | 'nes'
  | 'gba'
  | 'gbc'
  | 'gb';

export interface GameItem {
  id: string;
  title: string;
  platform: PlatformType;
  path: string;
  cover_url: string;
  file_size?: string;
  genre?: string;
  year?: string;
  isDemo?: boolean;
}

export const SAMPLE_GAMES: GameItem[] = [
  // Nintendo Switch
  {
    id: 'sample_switch_mario_odyssey',
    title: 'Super Mario Odyssey',
    platform: 'switch',
    path: '',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1m59.jpg',
    genre: 'Platformer / 3D Sandbox',
    year: '2017',
    file_size: '5.7 GB',
    isDemo: true,
  },
  {
    id: 'sample_switch_mariokart8',
    title: 'Mario Kart 8 Deluxe',
    platform: 'switch',
    path: '',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x3t.jpg',
    genre: 'Kart Racing',
    year: '2017',
    file_size: '6.8 GB',
    isDemo: true,
  },

  // Super Nintendo (SNES)
  {
    id: 'sample_snes_smw',
    title: 'Super Mario World',
    platform: 'snes',
    path: '',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x8a.jpg',
    genre: 'Platformer',
    year: '1990',
    file_size: '512 KB',
    isDemo: true,
  },
  {
    id: 'sample_snes_yoshi_island',
    title: "Super Mario World 2: Yoshi's Island",
    platform: 'snes',
    path: '',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x8c.jpg',
    genre: 'Platformer',
    year: '1995',
    file_size: '2 MB',
    isDemo: true,
  },

  // NES (Nintendinho)
  {
    id: 'sample_nes_smb3',
    title: 'Super Mario Bros. 3',
    platform: 'nes',
    path: '',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1y7m.jpg',
    genre: 'Platformer',
    year: '1988',
    file_size: '384 KB',
    isDemo: true,
  },
  {
    id: 'sample_nes_smb1',
    title: 'Super Mario Bros.',
    platform: 'nes',
    path: '',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co22ao.jpg',
    genre: 'Platformer',
    year: '1985',
    file_size: '40 KB',
    isDemo: true,
  },

  // Game Boy Advance (GBA)
  {
    id: 'sample_gba_sma4',
    title: 'Super Mario Advance 4: Super Mario Bros. 3',
    platform: 'gba',
    path: '',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x8e.jpg',
    genre: 'Platformer',
    year: '2003',
    file_size: '4 MB',
    isDemo: true,
  },
  {
    id: 'sample_gba_mksc',
    title: 'Mario Kart: Super Circuit',
    platform: 'gba',
    path: '',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1y5q.jpg',
    genre: 'Kart Racing',
    year: '2001',
    file_size: '4 MB',
    isDemo: true,
  },

  // Game Boy Color (GBC)
  {
    id: 'sample_gbc_smb_deluxe',
    title: 'Super Mario Bros. Deluxe',
    platform: 'gbc',
    path: '',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co23t6.jpg',
    genre: 'Platformer',
    year: '1999',
    file_size: '1 MB',
    isDemo: true,
  },
  {
    id: 'sample_gbc_mario_tennis',
    title: 'Mario Tennis',
    platform: 'gbc',
    path: '',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7i.jpg',
    genre: 'Sports / RPG',
    year: '2000',
    file_size: '2 MB',
    isDemo: true,
  },

  // Game Boy (GB)
  {
    id: 'sample_gb_sml2',
    title: 'Super Mario Land 2: 6 Golden Coins',
    platform: 'gb',
    path: '',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x86.jpg',
    genre: 'Platformer',
    year: '1992',
    file_size: '512 KB',
    isDemo: true,
  },
  {
    id: 'sample_gb_sml1',
    title: 'Super Mario Land',
    platform: 'gb',
    path: '',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x84.jpg',
    genre: 'Platformer',
    year: '1989',
    file_size: '64 KB',
    isDemo: true,
  },

  // PlayStation 1
  {
    id: 'sample_ps1_castlevania',
    title: 'Castlevania: Symphony of the Night',
    platform: 'ps1',
    path: '',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x76.jpg',
    genre: 'Metroidvania / Action RPG',
    year: '1997',
    file_size: '420 MB',
    isDemo: true,
  },
  {
    id: 'sample_ps1_mgs',
    title: 'Metal Gear Solid',
    platform: 'ps1',
    path: '',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2044.jpg',
    genre: 'Stealth Action',
    year: '1998',
    file_size: '680 MB',
    isDemo: true,
  },
  {
    id: 'sample_ps1_crash',
    title: 'Crash Bandicoot 3: Warped',
    platform: 'ps1',
    path: '',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2240.jpg',
    genre: 'Platformer',
    year: '1998',
    file_size: '450 MB',
    isDemo: true,
  },

  // PlayStation 2
  {
    id: 'sample_ps2_gow2',
    title: 'God of War II',
    platform: 'ps2',
    path: '',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r3d.jpg',
    genre: 'Hack and Slash / Action',
    year: '2007',
    file_size: '7.9 GB',
    isDemo: true,
  },
  {
    id: 'sample_ps2_sotc',
    title: 'Shadow of the Colossus',
    platform: 'ps2',
    path: '',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1v8t.jpg',
    genre: 'Action-Adventure',
    year: '2005',
    file_size: '2.5 GB',
    isDemo: true,
  },

  // PlayStation 3
  {
    id: 'sample_ps3_tlou',
    title: 'The Last of Us',
    platform: 'ps3',
    path: '',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7f.jpg',
    genre: 'Action-Adventure / Survival',
    year: '2013',
    file_size: '26 GB',
    isDemo: true,
  },
  {
    id: 'sample_ps3_demons_souls',
    title: "Demon's Souls",
    platform: 'ps3',
    path: '',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1rcv.jpg',
    genre: 'Action RPG',
    year: '2009',
    file_size: '8.2 GB',
    isDemo: true,
  },
];
