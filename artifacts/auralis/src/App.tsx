import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import {
  Edit3, FileAudio, Heart, ListMusic, Menu, Pause, Play, Plus, Settings,
  Repeat, Search, Shuffle, SkipBack, SkipForward,
  Trash2, Volume2, VolumeX, X, Check
} from 'lucide-react';
import { requestedSongSeeds } from './trackSeeds';

type Song = {
  id: string; title: string; artist: string; album: string; duration: number;
  genre: string; year: string; coverA: string; coverB: string; favorite?: boolean;
  coverUrl?: string; audioUrl?: string;
};
type Playlist = { id: string; name: string; songs: string[]; accent: string };
type LibraryView = 'queue' | 'library';

const defaultSongs: Song[] = requestedSongSeeds;
const initialPlaylists: Playlist[] = [
  { id: 'p1', name: 'All songs', songs: [], accent: '#36d6c3' },
  { id: 'p2', name: 'Favorites', songs: [], accent: '#f2b66d' },
];

const queryClient = new QueryClient();
const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const youtubeVideoId = (url?: string) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1) || null;
    if (parsed.hostname.endsWith('youtube.com')) {
      if (parsed.pathname === '/watch') return parsed.searchParams.get('v');
      if (parsed.pathname.startsWith('/embed/')) return parsed.pathname.split('/')[2] || null;
      if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/')[2] || null;
    }
  } catch {
    return null;
  }
  return null;
};
const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) as T : fallback;
  } catch {
    return fallback;
  }
};
const readSongs = (): Song[] => {
  const stored = readStorage<Song[]>('auralis-songs', []);
  return stored.length ? stored : defaultSongs;
};
const readPlaylists = (): Playlist[] => {
  const stored = readStorage<Playlist[]>(`auralis-playlists`, initialPlaylists);
  const storedSongs = readSongs();
  const validSongIds = new Set(storedSongs.map((song) => song.id));
  const customPlaylists = stored
    .filter((playlist) => playlist.id !== 'p1' && playlist.id !== 'p2')
    .map((playlist) => ({
      ...playlist,
      songs: playlist.songs.filter((songId) => validSongIds.has(songId)),
    }));
  return [
    { ...initialPlaylists[0], songs: storedSongs.map((song) => song.id) },
    { ...initialPlaylists[1], songs: storedSongs.filter((song) => song.favorite).map((song) => song.id) },
    ...customPlaylists,
  ];
};
const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

function Cover({ song, size = 'md', className = '' }: { song?: Song; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  if (!song) return <div className={`cover-art ${className}`} style={{ '--cover-a': '#18343a', '--cover-b': '#2b5e61' } as CSSProperties} />;
  if (song.coverUrl) {
    return <div className={`cover-art ${size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-[min(61vw,382px)] h-[min(61vw,382px)] md:w-[min(43vw,440px)] md:h-[min(43vw,440px)]' : 'w-20 h-20'} ${className}`}>
      <img src={song.coverUrl} alt={`${song.album} cover`} className="absolute inset-0 h-full w-full object-cover" />
    </div>;
  }
  return (
    <div className={`cover-art ${size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-[min(61vw,382px)] h-[min(61vw,382px)] md:w-[min(43vw,440px)] md:h-[min(43vw,440px)]' : 'w-20 h-20'} ${className}`}
      style={{ '--cover-a': song.coverA, '--cover-b': song.coverB } as CSSProperties} data-testid={`cover-${song.id}`}>
      <span className="cover-line" /><span className="cover-mark" />
      <span className="absolute bottom-4 left-4 z-[1] text-[9px] font-mono-custom tracking-[.25em] text-white/70">{song.album.toUpperCase()}</span>
    </div>
  );
}

function PlaylistPicker({ song, playlists, open, onToggle, onOpenChange }: {
  song: Song;
  playlists: Playlist[];
  open: boolean;
  onToggle: (playlistId: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const selected = new Set(playlists.filter((playlist) => playlist.id !== 'p1' && playlist.songs.includes(song.id)).map((playlist) => playlist.id));
  if (song.favorite) selected.add('p2');
  const selectedCount = selected.size;
  return (
    <div className="relative" onPointerDown={(event) => event.stopPropagation()}>
      <button type="button" onClick={() => onOpenChange(!open)} className="rounded-lg border border-white/10 bg-[#0b171a] px-2 py-2 text-[10px] text-white/60 transition hover:border-primary/40 hover:text-white" aria-label={`Change playlists for ${song.title}`} aria-expanded={open} data-testid={`button-song-playlists-${song.id}`}>
        {selectedCount ? `${selectedCount} playlist${selectedCount === 1 ? '' : 's'}` : 'Add to playlist'}
      </button>
      {open && <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-xl border border-white/10 bg-[#0b171a] p-2 shadow-2xl" role="group" aria-label={`Playlists for ${song.title}`}>
        <p className="px-2 pb-2 text-[9px] uppercase tracking-[.14em] text-white/30">Add to playlists</p>
        <div className="flex items-center gap-2 rounded-lg px-2 py-2 text-[11px] text-white/35">
          <Check size={13} className="text-primary" /> All songs
        </div>
        {playlists.filter((playlist) => playlist.id !== 'p1').map((playlist) => {
          const isSelected = selected.has(playlist.id);
          return <button type="button" key={playlist.id} onClick={() => onToggle(playlist.id)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[11px] transition ${isSelected ? 'bg-primary/[.12] text-primary' : 'text-white/60 hover:bg-white/[.06] hover:text-white'}`} aria-pressed={isSelected} data-testid={`button-toggle-playlist-${song.id}-${playlist.id}`}>
            <span className={`flex h-4 w-4 items-center justify-center rounded border ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-white/20'}`}>{isSelected && <Check size={11} />}</span>
            <span className="truncate">{playlist.name}</span>
          </button>;
        })}
      </div>}
    </div>
  );
}

function App() {
  const [playlists, setPlaylists] = useState<Playlist[]>(readPlaylists);
  const [activePlaylist, setActivePlaylist] = useState('p1');
  const [currentId, setCurrentId] = useState('s1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(38);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryView, setLibraryView] = useState<LibraryView>('library');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'recent' | 'title' | 'artist'>('recent');
  const [editMode, setEditMode] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState<string[] | null>(null);
  const [shuffledPlaylistId, setShuffledPlaylistId] = useState<string | null>(null);
  const [lastShuffleOrders, setLastShuffleOrders] = useState<Record<string, string[]>>({});
  const [repeat, setRepeat] = useState(false);
  const [volume, setVolume] = useState(76);
  const [importOpen, setImportOpen] = useState(false);
  const [importName, setImportName] = useState('');
  const [addPlaylistOpen, setAddPlaylistOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Playlist | null>(null);
  const [editSongTarget, setEditSongTarget] = useState<Song | null>(null);
  const [editSongDraft, setEditSongDraft] = useState({ title: '', artist: '', album: '' });
  const [editAudioFile, setEditAudioFile] = useState<File | null>(null);
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [toast, setToast] = useState('');
  const [localSongs, setLocalSongs] = useState<Song[]>(readSongs);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [draggingSongId, setDraggingSongId] = useState<string | null>(null);
  const [dragOverSongId, setDragOverSongId] = useState<string | null>(null);
  const [playlistMenuSongId, setPlaylistMenuSongId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const editAudioRef = useRef<HTMLInputElement>(null);
  const editCoverRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ id: string; pointerId: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const youtubePlayerRef = useRef<HTMLIFrameElement>(null);

  const current = localSongs.find((song) => song.id === currentId) || localSongs[0];
  const active = playlists.find((playlist) => playlist.id === activePlaylist) || playlists[0];
  const baseQueue = useMemo(() => {
    const playlistSongs = active?.songs.map((id) => localSongs.find((song) => song.id === id)).filter(Boolean) as Song[] || localSongs;
    const filtered = playlistSongs.filter((song) => `${song.title} ${song.artist} ${song.album}`.toLowerCase().includes(query.toLowerCase()));
    return [...filtered].sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title) : sort === 'artist' ? a.artist.localeCompare(b.artist) : 0);
  }, [active, localSongs, query, sort]);
  const queue = useMemo(() => {
    if (!shuffle || shuffledPlaylistId !== activePlaylist || !shuffleOrder) return baseQueue;
    const songsById = new Map(baseQueue.map((song) => [song.id, song]));
    return shuffleOrder.map((id) => songsById.get(id)).filter(Boolean) as Song[];
  }, [activePlaylist, baseQueue, shuffle, shuffleOrder, shuffledPlaylistId]);
  const currentIndex = Math.max(0, queue.findIndex((song) => song.id === current?.id));
  const previous = currentIndex > 0 ? queue[currentIndex - 1] : undefined;
  const next = currentIndex < queue.length - 1 ? queue[currentIndex + 1] : undefined;
  const currentYoutubeId = youtubeVideoId(current?.audioUrl);
  const sendYoutubeCommand = (func: string, args: unknown[] = []) => {
    youtubePlayerRef.current?.contentWindow?.postMessage(JSON.stringify({
      event: 'command',
      func,
      args,
    }), '*');
  };

  useEffect(() => { localStorage.setItem('auralis-playlists', JSON.stringify(playlists)); }, [playlists]);
  useEffect(() => { localStorage.setItem('auralis-songs', JSON.stringify(localSongs)); }, [localSongs]);
  useEffect(() => {
    if (!currentYoutubeId) return;
    sendYoutubeCommand(isPlaying ? 'loadVideoById' : 'cueVideoById', [currentYoutubeId]);
  }, [currentYoutubeId]);
  useEffect(() => {
    if (!currentYoutubeId) return;
    sendYoutubeCommand(isPlaying ? 'playVideo' : 'pauseVideo');
  }, [isPlaying, currentYoutubeId]);
  useEffect(() => {
    if (!isPlaying || !current) return;
    const timer = window.setInterval(() => setProgress((value) => {
       if (value >= current.duration) {
         if (repeat) { setCurrentId(current.id); return 0; }
         if (next) { setCurrentId(next.id); return 0; }
         setIsPlaying(false);
         return value;
       }
      return value + 1;
    }), 1000);
    return () => window.clearInterval(timer);
   }, [isPlaying, current, next, repeat]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 2400); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => {
    if (!draggingSongId) return;
    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const distance = Math.hypot(event.movementX, event.movementY);
      if (distance > 0) drag.moved = true;
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-drag-song-id]');
      if (target?.dataset.dragSongId && target.dataset.dragSongId !== draggingSongId) {
        setDragOverSongId(target.dataset.dragSongId);
      }
    };
    const handlePointerUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (drag.moved && dragOverSongId && dragOverSongId !== drag.id) {
        setPlaylists((items) => items.map((item) => {
          if (item.id !== activePlaylist) return item;
          const ordered = [...item.songs];
          const fromIndex = ordered.indexOf(drag.id);
          const toIndex = ordered.indexOf(dragOverSongId);
          if (fromIndex < 0 || toIndex < 0) return item;
          ordered.splice(fromIndex, 1);
          ordered.splice(toIndex, 0, drag.id);
          return { ...item, songs: ordered };
        }));
        setToast('Playlist order saved');
        suppressClickRef.current = true;
        window.setTimeout(() => { suppressClickRef.current = false; }, 120);
      }
      dragRef.current = null;
      setDraggingSongId(null);
      setDragOverSongId(null);
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [activePlaylist, dragOverSongId, draggingSongId]);

  const chooseSong = (song: Song) => { setCurrentId(song.id); setProgress(0); setIsPlaying(true); };
  const openLibraryView = (view: LibraryView) => {
    setLibraryView(view);
    setLibraryOpen(true);
  };
  const selectPlaylist = (playlistId: string) => {
    setActivePlaylist(playlistId);
    setShuffle(false);
    setShuffleOrder(null);
    setShuffledPlaylistId(null);
    setQuery('');
    setSort('recent');
  };
  const createShuffleOrder = (ids: string[], previousOrder?: string[]) => {
    if (ids.length < 2) return [...ids];
    const nextOrder = [...ids];
    for (let index = nextOrder.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [nextOrder[index], nextOrder[swapIndex]] = [nextOrder[swapIndex], nextOrder[index]];
    }
    if (previousOrder && nextOrder.every((id, index) => id === previousOrder[index])) {
      [nextOrder[0], nextOrder[1]] = [nextOrder[1], nextOrder[0]];
    }
    return nextOrder;
  };
  const shuffleAndPlay = () => {
    const playlistIds = active?.songs.filter((id) => localSongs.some((song) => song.id === id)) || localSongs.map((song) => song.id);
    if (!playlistIds.length) {
      setToast('This playlist is empty');
      return;
    }
    const nextOrder = createShuffleOrder(playlistIds, lastShuffleOrders[activePlaylist]);
    setLastShuffleOrders((orders) => ({ ...orders, [activePlaylist]: nextOrder }));
    setShuffleOrder(nextOrder);
    setShuffledPlaylistId(activePlaylist);
    setShuffle(true);
    setQuery('');
    setSort('recent');
    const firstSong = localSongs.find((song) => song.id === nextOrder[0]);
    if (firstSong) chooseSong(firstSong);
    setLibraryView('queue');
    setToast('Shuffled queue ready');
  };
  const toggleShuffle = () => {
    if (shuffle && shuffledPlaylistId === activePlaylist) {
      setShuffle(false);
      setShuffleOrder(null);
      setToast('Playlist order restored');
      return;
    }
    const ids = baseQueue.map((song) => song.id);
    if (!ids.length) return;
    const nextOrder = createShuffleOrder(ids, lastShuffleOrders[activePlaylist]);
    setLastShuffleOrders((orders) => ({ ...orders, [activePlaylist]: nextOrder }));
    setShuffleOrder(nextOrder);
    setShuffledPlaylistId(activePlaylist);
    setShuffle(true);
    const firstSong = localSongs.find((song) => song.id === nextOrder[0]);
    if (firstSong) chooseSong(firstSong);
    setToast('Queue reshuffled');
  };
  const move = (direction: number) => {
    const target = direction < 0 ? previous : next;
    if (target) chooseSong(target);
  };
  const beginSongDrag = (event: ReactPointerEvent<HTMLDivElement>, songId: string) => {
    if (!editMode || Boolean(query) || sort !== 'recent') return;
    if ((event.target as HTMLElement).closest('button, select, input')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { id: songId, pointerId: event.pointerId, moved: false };
    setDraggingSongId(songId);
    setDragOverSongId(songId);
  };
  const toggleFavorite = (songId: string) => {
    setLocalSongs((items) => items.map((song) => song.id === songId ? { ...song, favorite: !song.favorite } : song));
    setPlaylists((items) => items.map((playlist) => playlist.id === 'p2'
      ? { ...playlist, songs: localSongs.find((song) => song.id === songId)?.favorite ? playlist.songs.filter((id) => id !== songId) : [...new Set([...playlist.songs, songId])] } : playlist));
  };
  const createPlaylist = () => {
    const name = newPlaylistName.trim();
    if (!name) return;
    const playlist = { id: `p-${Date.now()}`, name, songs: [], accent: '#36d6c3' };
    setPlaylists((items) => [...items, playlist]); setActivePlaylist(playlist.id); setNewPlaylistName(''); setAddPlaylistOpen(false); setToast('Playlist created');
  };
  const deletePlaylist = () => {
    if (!deleteTarget || deleteTarget.id === 'p1') return;
    const remaining = playlists.filter((item) => item.id !== deleteTarget.id);
    setPlaylists(remaining); setActivePlaylist(remaining[0]?.id || 'p1'); setDeleteTarget(null); setToast('Playlist deleted');
  };
  const removeFromPlaylist = (songId: string) => setPlaylists((items) => items.map((item) => item.id === activePlaylist ? { ...item, songs: item.songs.filter((id) => id !== songId) } : item));
  const toggleSongPlaylist = (songId: string, playlistId: string) => {
    if (playlistId === 'p1') return;
    setPlaylists((items) => items.map((playlist) => {
      if (playlist.id === 'p1') return { ...playlist, songs: playlist.songs.includes(songId) ? playlist.songs : [...playlist.songs, songId] };
      if (playlist.id !== playlistId) return playlist;
      return playlist.songs.includes(songId)
        ? { ...playlist, songs: playlist.songs.filter((id) => id !== songId) }
        : { ...playlist, songs: [...playlist.songs, songId] };
    }));
    if (playlistId === 'p2') {
      const isFavorite = playlists.find((playlist) => playlist.id === 'p2')?.songs.includes(songId) || false;
      setLocalSongs((items) => items.map((song) => song.id === songId ? { ...song, favorite: !isFavorite } : song));
    }
  };
  const openSongEditor = (song: Song) => {
    setEditSongTarget(song);
    setEditSongDraft({ title: song.title, artist: song.artist, album: song.album });
    setEditAudioFile(null);
    setEditCoverFile(null);
  };
  const saveSongEdits = async () => {
    if (!editSongTarget) return;
    const updates: Partial<Song> = {
      title: editSongDraft.title.trim() || editSongTarget.title,
      artist: editSongDraft.artist.trim() || editSongTarget.artist,
      album: editSongDraft.album.trim() || editSongTarget.album,
    };
    if (editAudioFile) updates.audioUrl = await fileToDataUrl(editAudioFile);
    if (editCoverFile) updates.coverUrl = await fileToDataUrl(editCoverFile);
    setLocalSongs((items) => items.map((song) => song.id === editSongTarget.id ? { ...song, ...updates } : song));
    setEditSongTarget(null);
    setEditAudioFile(null);
    setEditCoverFile(null);
    setToast('Song details saved');
  };
  const importAudio = async () => {
    if (!selectedFile) return;
    const id = `local-${Date.now()}`;
    const imported: Song = { id, title: importName.trim() || selectedFile.name.replace(/\.[^.]+$/, ''), artist: 'Local file', album: 'Imported audio', duration: 210, genre: 'Local', year: String(new Date().getFullYear()), coverA: '#24555b', coverB: '#d7a66d', audioUrl: await fileToDataUrl(selectedFile) };
    setLocalSongs((items) => [imported, ...items]);
    setPlaylists((items) => items.map((item) => item.id === 'p1' ? { ...item, songs: [id, ...item.songs] } : item));
    setImportOpen(false); setSelectedFile(null); setImportName(''); setToast('Audio added to your library');
  };

  return (
    <div className="auralis-shell">
      {currentYoutubeId && <iframe
        ref={youtubePlayerRef}
        title="YouTube audio player"
        src={`https://www.youtube-nocookie.com/embed/${currentYoutubeId}?enablejsapi=1&playsinline=1&controls=0&rel=0&modestbranding=1`}
        onLoad={() => {
          sendYoutubeCommand(isPlaying ? 'loadVideoById' : 'cueVideoById', [currentYoutubeId]);
        }}
        allow="autoplay; encrypted-media"
        className="pointer-events-none fixed bottom-0 left-0 h-px w-px opacity-0"
      />}
      <div className="ambient-orb pointer-events-none absolute -top-32 right-[12%] h-[28rem] w-[28rem] rounded-full bg-teal-300/[.08] blur-3xl" />
      <div className="ambient-orb pointer-events-none absolute bottom-[-16rem] left-[-8rem] h-[34rem] w-[34rem] rounded-full bg-amber-300/[.05] blur-3xl" />
      <header className="relative z-10 flex items-center justify-between px-5 py-5 md:px-10 md:py-7">
          <div className="flex items-center gap-3">
           <img src={`${import.meta.env.BASE_URL}auralis-mark.png`} alt="Northstar" className="h-12 w-[min(42vw,150px)] origin-left scale-[1.65] object-contain object-left" />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[.05] text-white/70 transition hover:bg-white/10 hover:text-white" onClick={() => openLibraryView('library')} aria-label="Open menu" data-testid="button-open-library"><Menu size={19} /></button>
        </div>
      </header>

       <main className="relative z-10 mx-auto max-w-[1380px] px-5 pb-32 md:px-10 lg:pb-32 xl:pb-14">
        <section className="min-w-0">
          <div className="mt-0 flex items-end justify-between">
            <div className="rise-in"><p className="mb-3 text-[10px] font-mono-custom uppercase tracking-[.24em] text-primary">Now playing</p></div>
          </div>
          <div className="relative mt-0 flex min-h-[360px] items-center justify-center overflow-visible md:mt-0 md:min-h-[440px]">
            {previous && <button className="group absolute left-10 z-[1] hidden w-[24%] max-w-[210px] -translate-x-10 -rotate-[9deg] items-center justify-center opacity-50 transition hover:rotate-[-7deg] hover:opacity-80 md:flex" onClick={() => move(-1)} aria-label="Previous song" data-testid="button-carousel-previous">
              <Cover song={previous} size="lg" className="scale-[.68] opacity-65 blur-[1px] transition group-hover:scale-[.72]" />
            </button>}
            <button className="absolute left-1/2 top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2 transition duration-500 hover:scale-[1.015]" onClick={() => setIsPlaying(!isPlaying)} aria-label={isPlaying ? 'Pause' : 'Play'} data-testid="button-current-cover">
              <Cover song={current} size="lg" className="shadow-[0_28px_90px_rgba(17,171,161,.24)]" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/10" />
            </button>
            {next && <button className="group absolute right-10 z-[1] hidden w-[24%] max-w-[210px] translate-x-10 rotate-[9deg] items-center justify-center opacity-50 transition hover:rotate-[7deg] hover:opacity-80 md:flex" onClick={() => move(1)} aria-label="Next song" data-testid="button-carousel-next">
              <Cover song={next} size="lg" className="scale-[.68] opacity-65 blur-[1px] transition group-hover:scale-[.72]" />
            </button>}
          </div>
          <div className="mx-auto mt-2 max-w-[600px] text-center md:mt-3">
            <div className="flex items-start justify-center gap-3"><div><h2 className="font-display text-2xl font-semibold tracking-[-.04em] text-white md:text-3xl" data-testid="text-current-title">{current?.title}</h2><p className="mt-1 text-sm text-white/45" data-testid="text-current-artist">{current?.artist} <span className="mx-1 text-white/20">/</span> {current?.album}</p></div><button className={`mt-1 rounded-full p-2 transition ${current?.favorite ? 'text-primary' : 'text-white/30 hover:text-white'}`} onClick={() => current && toggleFavorite(current.id)} aria-label="Favorite song" data-testid="button-favorite"><Heart size={19} fill={current?.favorite ? 'currentColor' : 'none'} /></button></div>
              <div className="mt-3 md:mt-4">
               <div className="group relative"><input aria-label="Seek song" data-testid="input-progress" type="range" min="0" max={current?.duration || 1} value={progress} onChange={(event) => { const seconds = Number(event.target.value); setProgress(seconds); sendYoutubeCommand('seekTo', [seconds, true]); }} className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10" style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${(progress / (current?.duration || 1)) * 100}%, rgba(255,255,255,.1) 0)` }} /><div className="pointer-events-none absolute -top-1 h-3 w-3 rounded-full bg-primary opacity-0 shadow-[0_0_14px_rgba(54,214,195,.9)] transition-opacity group-hover:opacity-100" style={{ left: `calc(${(progress / (current?.duration || 1)) * 100}% - 6px)` }} /></div>
              <div className="mt-2 flex justify-between font-mono-custom text-[10px] text-white/35"><span>{formatTime(progress)}</span><span>{formatTime(current?.duration || 0)}</span></div>
            </div>
             <div className="mt-3 flex items-center justify-center gap-5 md:mt-4 md:gap-8">
               <button className={`transition ${shuffle ? 'text-primary' : 'text-white/40 hover:text-white'}`} onClick={toggleShuffle} aria-label={shuffle ? 'Restore playlist order' : 'Shuffle queue'} data-testid="button-shuffle"><Shuffle size={18} /></button>
              <button className="text-white/65 transition hover:text-white" onClick={() => move(-1)} aria-label="Previous" data-testid="button-previous"><SkipBack size={22} fill="currentColor" /></button>
              <button className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_28px_rgba(54,214,195,.26)] transition hover:scale-105 active:scale-95" onClick={() => setIsPlaying(!isPlaying)} aria-label={isPlaying ? 'Pause' : 'Play'} data-testid="button-play-pause">{isPlaying ? <Pause size={25} fill="currentColor" /> : <Play size={25} fill="currentColor" className="ml-1" />}</button>
              <button className="text-white/65 transition hover:text-white" onClick={() => move(1)} aria-label="Next" data-testid="button-next"><SkipForward size={22} fill="currentColor" /></button>
              <button className={`transition ${repeat ? 'text-primary' : 'text-white/40 hover:text-white'}`} onClick={() => setRepeat(!repeat)} aria-label="Toggle repeat" data-testid="button-repeat"><Repeat size={19} /></button>
            </div>
          </div>
        </section>

      </main>

       <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/[.08] bg-[#101d22]/90 px-5 py-3 backdrop-blur-xl xl:hidden safe-bottom"><div className="mx-auto flex max-w-xl items-center gap-3"><Cover song={current} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-sm text-white">{current?.title}</p><p className="truncate text-xs text-white/40">{current?.artist}</p></div><button onClick={() => setIsPlaying(!isPlaying)} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-label={isPlaying ? 'Pause' : 'Play'} data-testid="button-mobile-play">{isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button></div></div>
      <button className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${libraryOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} onClick={() => setLibraryOpen(false)} aria-label="Close library overlay" data-testid="button-close-overlay" />
        <section className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[470px] flex-col border-l border-white/10 bg-[#071114] shadow-[-18px_0_60px_rgba(0,0,0,.5)] transition-transform duration-500 ${libraryOpen ? 'translate-x-0' : 'translate-x-full'}`}>
         <div className="border-b border-white/[.08] px-6 py-5">
           <div className="flex items-center justify-between"><div><p className="text-[10px] font-mono-custom uppercase tracking-[.2em] text-primary">Your collection</p><h2 className="mt-1 font-display text-2xl font-semibold">{libraryView === 'queue' ? 'Queue' : 'Library'}</h2></div><div className="flex items-center gap-1"><button className="rounded-full p-2 text-white/45 transition hover:bg-white/10 hover:text-primary" onClick={() => setImportOpen(true)} aria-label="Import local audio" data-testid="button-import-audio"><Plus size={18} /></button><button className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white" onClick={() => setLibraryOpen(false)} aria-label="Close library" data-testid="button-close-library"><X size={20} /></button></div></div>
           <div className="mt-4 grid grid-cols-2 rounded-xl border border-white/10 bg-white/[.03] p-1">
             <button onClick={() => setLibraryView('queue')} className={`rounded-lg py-2 text-xs transition ${libraryView === 'queue' ? 'bg-white/[.09] text-white' : 'text-white/40 hover:text-white'}`} data-testid="button-panel-queue">Queue</button>
             <button onClick={() => setLibraryView('library')} className={`rounded-lg py-2 text-xs transition ${libraryView === 'library' ? 'bg-primary text-primary-foreground' : 'text-white/40 hover:text-white'}`} data-testid="button-panel-library">Library</button>
           </div>
         </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
           {libraryView === 'library' && <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your music" className="w-full rounded-xl border border-white/10 bg-white/[.04] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary/60" aria-label="Search music" data-testid="input-search" /></div>}
            {libraryView === 'queue' && <div className="mb-5"><div className="flex items-start justify-between gap-4"><div><p className="font-mono-custom text-[10px] uppercase tracking-[.15em] text-primary">Up next</p><p className="mt-2 text-sm text-white/45">The next songs in your current playlist</p></div><div className="flex shrink-0 gap-2"><button onClick={toggleShuffle} className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs transition ${shuffle ? 'border-primary/40 bg-primary/[.12] text-primary' : 'border-white/10 bg-white/[.04] text-white/55 hover:border-white/20 hover:text-white'}`} aria-label={shuffle ? 'Restore playlist order' : 'Shuffle queue'} data-testid="button-queue-shuffle"><Shuffle size={13} /> Shuffle</button><button onClick={() => setRepeat((value) => !value)} className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs transition ${repeat ? 'border-primary/40 bg-primary/[.12] text-primary' : 'border-white/10 bg-white/[.04] text-white/55 hover:border-white/20 hover:text-white'}`} aria-label={repeat ? 'Turn loop off' : 'Turn loop on'} data-testid="button-queue-loop"><Repeat size={13} /> Loop</button></div></div></div>}
           {libraryView === 'library' && <>
             <div className="mt-6 flex items-center justify-between"><div className="flex gap-1 overflow-x-auto pb-1">{playlists.map((playlist) => <button key={playlist.id} onClick={() => setActivePlaylist(playlist.id)} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs transition ${activePlaylist === playlist.id ? 'bg-primary text-primary-foreground' : 'bg-white/[.05] text-white/55 hover:text-white'}`} data-testid={`button-playlist-${playlist.id}`}>{playlist.name}</button>)}</div><div className="ml-2 flex shrink-0 gap-1"><button onClick={() => setAddPlaylistOpen(true)} className="rounded-full border border-white/10 p-2 text-primary" aria-label="Add playlist" data-testid="button-add-playlist"><Plus size={16} /></button>{editMode && activePlaylist !== 'p1' && <button onClick={() => setDeleteTarget(active)} className="rounded-full border border-white/10 p-2 text-red-300/70 hover:text-red-300" aria-label="Delete playlist" data-testid="button-delete-playlist"><Trash2 size={15} /></button>}</div></div>
              <div className="mt-6 flex items-center justify-between"><span className="font-mono-custom text-[10px] uppercase tracking-[.15em] text-white/35">{queue.length} tracks</span><div className="flex items-center gap-2"><button onClick={shuffleAndPlay} className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/[.08] px-3 py-2 text-xs text-primary transition hover:bg-primary/[.14]" data-testid="button-shuffle-play"><Shuffle size={13} /> Shuffle &amp; Play</button><button onClick={() => { setEditMode((value) => !value); setQuery(''); setSort('recent'); }} className={`flex items-center gap-1 text-xs ${editMode ? 'text-primary' : 'text-white/40'}`} data-testid="button-edit-mode"><Edit3 size={13} /> {editMode ? 'Done' : 'Edit'}</button><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="bg-transparent text-xs text-white/45 outline-none" aria-label="Sort tracks" data-testid="select-sort"><option value="recent" className="bg-[#071114]">Recent</option><option value="title" className="bg-[#071114]">Title</option><option value="artist" className="bg-[#071114]">Artist</option></select></div></div>
             {editMode && <p className="mt-3 text-[10px] text-primary/60">{query || sort !== 'recent' ? 'Use the recent order to rearrange tracks.' : 'Press and hold a track, then drag it into a new position.'}</p>}
           </>}
            <div className="mt-4 space-y-1">{queue.length ? queue.map((song) => <div key={song.id} data-drag-song-id={song.id} onPointerDown={(event) => beginSongDrag(event, song.id)} className={`select-none touch-pan-y group flex items-center gap-3 rounded-xl border-t-2 p-2 transition hover:bg-white/[.04] ${song.id === current?.id ? 'bg-white/[.05]' : ''} ${draggingSongId === song.id ? 'scale-[.98] bg-primary/[.12] shadow-lg' : ''} ${dragOverSongId === song.id && draggingSongId !== song.id ? 'border-primary' : 'border-transparent'}`}><button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => { if (suppressClickRef.current) return; chooseSong(song); setLibraryOpen(false); }} data-testid={`button-library-song-${song.id}`}><Cover song={song} size="sm" /><span className="min-w-0 flex-1"><span className={`block truncate text-sm ${song.id === current?.id ? 'text-primary' : 'text-white/80'}`}>{song.title}</span><span className="mt-0.5 block truncate text-xs text-white/35">{song.artist}</span></span><span className="font-mono-custom text-[10px] text-white/25">{formatTime(song.duration)}</span></button>{editMode && <div className="flex shrink-0 items-center gap-1"><PlaylistPicker song={song} playlists={playlists} open={playlistMenuSongId === song.id} onOpenChange={(open) => setPlaylistMenuSongId(open ? song.id : null)} onToggle={(playlistId) => toggleSongPlaylist(song.id, playlistId)} /><button onClick={() => openSongEditor(song)} className="rounded-lg p-2 text-white/35 transition hover:bg-white/10 hover:text-primary" aria-label={`Edit ${song.title}`} data-testid={`button-edit-song-${song.id}`}><Settings size={15} /></button>{activePlaylist !== 'p1' && <button onClick={() => removeFromPlaylist(song.id)} className="rounded-lg p-2 text-white/30 hover:text-red-300" aria-label={`Remove ${song.title}`} data-testid={`button-remove-song-${song.id}`}><Trash2 size={15} /></button>}</div>}</div>) : <div className="rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center"><ListMusic className="mx-auto text-white/25" size={28} /><p className="mt-3 text-sm text-white/50">Nothing here yet</p><p className="mt-1 text-xs text-white/30">Add tracks to this playlist from your collection.</p></div>}</div>
        </div>
      </section>

       {(importOpen || addPlaylistOpen || deleteTarget || editSongTarget) && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm" data-testid="modal-overlay">
         <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d191c] p-6 shadow-2xl">
          {importOpen && <><div className="flex items-start justify-between"><div><p className="text-[10px] font-mono-custom uppercase tracking-[.18em] text-primary">Local import</p><h3 className="mt-2 font-display text-2xl font-semibold">Bring your own sound</h3></div><button onClick={() => setImportOpen(false)} aria-label="Close import dialog" data-testid="button-close-import"><X size={18} /></button></div><div className="mt-6 rounded-2xl border border-dashed border-white/15 p-5 text-center"><FileAudio className="mx-auto text-primary" size={27} />{selectedFile ? <p className="mt-3 truncate text-sm text-white">{selectedFile.name}</p> : <><p className="mt-3 text-sm text-white/70">Choose an audio file from this device</p><button onClick={() => fileRef.current?.click()} className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/15" data-testid="button-choose-file">Browse files</button></>}<input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} data-testid="input-file" /></div><label className="mt-5 block text-xs text-white/45">Track title<input value={importName} onChange={(event) => setImportName(event.target.value)} placeholder={selectedFile?.name.replace(/\.[^.]+$/, '') || 'Name this track'} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm text-white outline-none focus:border-primary/60" data-testid="input-import-title" /></label><button disabled={!selectedFile} onClick={importAudio} className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-30" data-testid="button-confirm-import">Add to library</button></>}
          {addPlaylistOpen && <><div className="flex items-start justify-between"><div><p className="text-[10px] font-mono-custom uppercase tracking-[.18em] text-primary">New playlist</p><h3 className="mt-2 font-display text-2xl font-semibold">Make a new space</h3></div><button onClick={() => setAddPlaylistOpen(false)} aria-label="Close playlist dialog" data-testid="button-close-playlist"><X size={18} /></button></div><input autoFocus value={newPlaylistName} onChange={(event) => setNewPlaylistName(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && createPlaylist()} placeholder="Playlist name" className="mt-7 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm text-white outline-none focus:border-primary/60" data-testid="input-playlist-name" /><button onClick={createPlaylist} className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground" data-testid="button-confirm-playlist">Create playlist</button></>}
           {editSongTarget && <><div className="flex items-start justify-between"><div><p className="text-[10px] font-mono-custom uppercase tracking-[.18em] text-primary">Song settings</p><h3 className="mt-2 font-display text-2xl font-semibold">Edit track</h3></div><button onClick={() => setEditSongTarget(null)} aria-label="Close song editor" data-testid="button-close-song-editor"><X size={18} /></button></div><div className="mt-6 grid gap-4"><label className="text-xs text-white/45">Track title<input value={editSongDraft.title} onChange={(event) => setEditSongDraft((draft) => ({ ...draft, title: event.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm text-white outline-none focus:border-primary/60" data-testid="input-edit-song-title" /></label><label className="text-xs text-white/45">Artist<input value={editSongDraft.artist} onChange={(event) => setEditSongDraft((draft) => ({ ...draft, artist: event.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm text-white outline-none focus:border-primary/60" data-testid="input-edit-song-artist" /></label><label className="text-xs text-white/45">Album<input value={editSongDraft.album} onChange={(event) => setEditSongDraft((draft) => ({ ...draft, album: event.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm text-white outline-none focus:border-primary/60" data-testid="input-edit-song-album" /></label><div className="grid grid-cols-2 gap-3"><button onClick={() => editAudioRef.current?.click()} className="rounded-xl border border-white/10 bg-white/[.04] px-3 py-3 text-left text-xs text-white/60 hover:border-primary/40" data-testid="button-edit-audio-file"><FileAudio className="mb-2 text-primary" size={17} />{editAudioFile ? editAudioFile.name : editSongTarget.audioUrl ? 'Replace audio file' : 'Add audio file'}</button><button onClick={() => editCoverRef.current?.click()} className="rounded-xl border border-white/10 bg-white/[.04] px-3 py-3 text-left text-xs text-white/60 hover:border-primary/40" data-testid="button-edit-cover-file"><Cover song={editSongTarget} size="sm" className="mb-2" />{editCoverFile ? editCoverFile.name : editSongTarget.coverUrl ? 'Replace album cover' : 'Add album cover'}</button></div><input ref={editAudioRef} type="file" accept="audio/*" className="hidden" onChange={(event) => setEditAudioFile(event.target.files?.[0] || null)} data-testid="input-edit-audio-file" /><input ref={editCoverRef} type="file" accept="image/*" className="hidden" onChange={(event) => setEditCoverFile(event.target.files?.[0] || null)} data-testid="input-edit-cover-file" /></div><button onClick={() => void saveSongEdits()} className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground" data-testid="button-save-song-edits">Save changes</button></>}
           {deleteTarget && <><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-950/80 text-red-300"><Trash2 size={20} /></div><h3 className="mt-5 font-display text-2xl font-semibold">Delete “{deleteTarget.name}”?</h3><p className="mt-2 text-sm leading-6 text-white/45">The playlist will be removed from this device. Your audio files will stay in the library.</p><div className="mt-7 flex gap-3"><button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-white/65" data-testid="button-cancel-delete">Keep it</button><button onClick={deletePlaylist} className="flex-1 rounded-xl bg-red-950 py-3 text-sm font-semibold text-red-100" data-testid="button-confirm-delete">Delete playlist</button></div></>}
        </div>
      </div>}
      {toast && <div className="fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full border border-primary/25 bg-[#15383a] px-4 py-3 text-xs text-primary shadow-xl" role="status" data-testid="status-toast"><Check size={14} /> {toast}</div>}
      <div className="sr-only">{volume === 0 ? <VolumeX /> : <Volume2 />}</div>
    </div>
  );
}

function RootApp() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><App /><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default RootApp;