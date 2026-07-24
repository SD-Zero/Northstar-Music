import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import {
  AudioLines, ChevronLeft, ChevronRight, Edit3,
  FileAudio, Heart, ListMusic, Menu, Pause, Play, Plus,
  Repeat, Search, Settings2, Shuffle, SkipBack, SkipForward, SlidersHorizontal,
  Trash2, Upload, Volume2, VolumeX, X, Check, LibraryBig
} from 'lucide-react';

type Song = {
  id: string; title: string; artist: string; album: string; duration: number;
  genre: string; year: string; coverA: string; coverB: string; favorite?: boolean;
};
type Playlist = { id: string; name: string; songs: string[]; accent: string };

const songs: Song[] = [
  { id: 's1', title: 'A New Language', artist: 'Kiasmos', album: 'Blurred', duration: 284, genre: 'Neo-classical', year: '2024', coverA: '#0d4f58', coverB: '#7ce0d5', favorite: true },
  { id: 's2', title: 'Narrow Road', artist: 'Daughter', album: 'Stereo Mind', duration: 231, genre: 'Indie electronic', year: '2023', coverA: '#31375f', coverB: '#e39b78' },
  { id: 's3', title: 'In This Together', artist: 'Rival Consoles', album: 'Overflow', duration: 317, genre: 'Electronica', year: '2022', coverA: '#1b5f4f', coverB: '#e9c46a', favorite: true },
  { id: 's4', title: 'Slow Light', artist: 'Julianna Barwick', album: 'Healing Is A Miracle', duration: 256, genre: 'Ambient', year: '2020', coverA: '#392659', coverB: '#b5e2fa' },
  { id: 's5', title: 'Pacific 202', artist: 'Tycho', album: 'Weather', duration: 271, genre: 'Downtempo', year: '2019', coverA: '#164e63', coverB: '#f59e0b' },
  { id: 's6', title: 'The Last Bloom', artist: 'Ólafur Arnalds', album: 'Some Kind of Peace', duration: 198, genre: 'Modern classical', year: '2020', coverA: '#684447', coverB: '#d9a441' },
  { id: 's7', title: 'Open Eye Signal', artist: 'Jon Hopkins', album: 'Immunity', duration: 514, genre: 'Techno', year: '2013', coverA: '#182b49', coverB: '#3dd6d0' },
  { id: 's8', title: 'Night Drive', artist: 'Chromatics', album: 'Kill For Love', duration: 327, genre: 'Dream pop', year: '2012', coverA: '#5c1830', coverB: '#f0a6ca' },
  { id: 's9', title: 'Falling Apart', artist: 'Khruangbin', album: 'Con Todo El Mundo', duration: 242, genre: 'Psychedelic soul', year: '2018', coverA: '#42523b', coverB: '#ef8354' },
];

const initialPlaylists: Playlist[] = [
  { id: 'p1', name: 'All songs', songs: songs.map((s) => s.id), accent: '#36d6c3' },
  { id: 'p2', name: 'Favorites', songs: songs.filter((s) => s.favorite).map((s) => s.id), accent: '#f2b66d' },
  { id: 'p3', name: 'Late night focus', songs: ['s1', 's3', 's4', 's7'], accent: '#c5a4f4' },
  { id: 'p4', name: 'Long drives', songs: ['s2', 's5', 's8', 's9'], accent: '#e48a9a' },
];

const queryClient = new QueryClient();
const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const readStorage = <T,>(key: string, fallback: T): T => {
  try { const stored = localStorage.getItem(key); return stored ? JSON.parse(stored) as T : fallback; } catch { return fallback; }
};

function Cover({ song, size = 'md', className = '' }: { song?: Song; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  if (!song) return <div className={`cover-art ${className}`} style={{ '--cover-a': '#18343a', '--cover-b': '#2b5e61' } as CSSProperties} />;
  return (
    <div className={`cover-art ${size === 'sm' ? 'w-12 h-12 rounded-xl' : size === 'lg' ? 'w-[min(61vw,382px)] h-[min(61vw,382px)] md:w-[min(43vw,440px)] md:h-[min(43vw,440px)] rounded-[2rem]' : 'w-20 h-20 rounded-2xl'} ${className}`}
      style={{ '--cover-a': song.coverA, '--cover-b': song.coverB } as CSSProperties} data-testid={`cover-${song.id}`}>
      <span className="cover-line" /><span className="cover-mark" />
      <span className="absolute bottom-4 left-4 z-[1] text-[9px] font-mono-custom tracking-[.25em] text-white/70">{song.album.toUpperCase()}</span>
    </div>
  );
}

function App() {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => readStorage('auralis-playlists', initialPlaylists));
  const [activePlaylist, setActivePlaylist] = useState('p1');
  const [currentId, setCurrentId] = useState('s1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(38);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'recent' | 'title' | 'artist'>('recent');
  const [editMode, setEditMode] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [volume, setVolume] = useState(76);
  const [importOpen, setImportOpen] = useState(false);
  const [importName, setImportName] = useState('');
  const [addPlaylistOpen, setAddPlaylistOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Playlist | null>(null);
  const [toast, setToast] = useState('');
  const [localSongs, setLocalSongs] = useState<Song[]>(() => readStorage('auralis-songs', songs));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const current = localSongs.find((song) => song.id === currentId) || localSongs[0];
  const active = playlists.find((playlist) => playlist.id === activePlaylist) || playlists[0];
  const queue = useMemo(() => {
    const playlistSongs = active?.songs.map((id) => localSongs.find((song) => song.id === id)).filter(Boolean) as Song[] || localSongs;
    const filtered = playlistSongs.filter((song) => `${song.title} ${song.artist} ${song.album}`.toLowerCase().includes(query.toLowerCase()));
    return [...filtered].sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title) : sort === 'artist' ? a.artist.localeCompare(b.artist) : 0);
  }, [active, localSongs, query, sort]);
  const currentIndex = Math.max(0, queue.findIndex((song) => song.id === current?.id));
  const previous = queue[(currentIndex - 1 + queue.length) % queue.length];
  const next = queue[(currentIndex + 1) % queue.length];

  useEffect(() => { localStorage.setItem('auralis-playlists', JSON.stringify(playlists)); }, [playlists]);
  useEffect(() => { localStorage.setItem('auralis-songs', JSON.stringify(localSongs)); }, [localSongs]);
  useEffect(() => {
    if (!isPlaying || !current) return;
    const timer = window.setInterval(() => setProgress((value) => {
      if (value >= current.duration) { setCurrentId(next?.id || current.id); return 0; }
      return value + 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [isPlaying, current, next]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 2400); return () => window.clearTimeout(timer); }, [toast]);

  const chooseSong = (song: Song) => { setCurrentId(song.id); setProgress(0); setIsPlaying(true); };
  const move = (direction: number) => {
    const target = queue[(currentIndex + direction + queue.length) % queue.length];
    if (target) chooseSong(target);
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
  const importAudio = () => {
    if (!selectedFile) return;
    const id = `local-${Date.now()}`;
    const imported: Song = { id, title: importName.trim() || selectedFile.name.replace(/\.[^.]+$/, ''), artist: 'Local file', album: 'Imported audio', duration: 210, genre: 'Local', year: String(new Date().getFullYear()), coverA: '#24555b', coverB: '#d7a66d' };
    setLocalSongs((items) => [imported, ...items]);
    setPlaylists((items) => items.map((item) => item.id === 'p1' ? { ...item, songs: [id, ...item.songs] } : item));
    setImportOpen(false); setSelectedFile(null); setImportName(''); setToast('Audio added to your library');
  };

  return (
    <div className="auralis-shell">
      <div className="ambient-orb pointer-events-none absolute -top-32 right-[12%] h-[28rem] w-[28rem] rounded-full bg-teal-300/[.08] blur-3xl" />
      <div className="ambient-orb pointer-events-none absolute bottom-[-16rem] left-[-8rem] h-[34rem] w-[34rem] rounded-full bg-amber-300/[.05] blur-3xl" />
      <header className="relative z-10 flex items-center justify-between px-5 py-5 md:px-10 md:py-7">
        <div className="flex items-center gap-3">
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[.05] text-white/70 transition hover:bg-white/10 md:hidden" onClick={() => setLibraryOpen(true)} aria-label="Open library" data-testid="button-open-library"><Menu size={19} /></button>
          <div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground"><AudioLines size={18} /></div><span className="font-display text-lg font-semibold tracking-tight">auralis</span></div>
          <span className="hidden border-l border-white/10 pl-4 text-[10px] font-mono-custom tracking-[.18em] text-white/35 md:inline">PRIVATE PLAYER / 01</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[.03] px-3 py-2 text-[10px] font-mono-custom text-white/45 md:flex"><span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_rgba(54,214,195,.8)]" /> LOCAL MODE</span>
          <button className="flex h-10 w-10 items-center justify-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white" aria-label="Settings" data-testid="button-settings"><Settings2 size={18} /></button>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-[1380px] grid-cols-1 gap-8 px-5 pb-32 md:px-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16 lg:pb-14">
        <section className="min-w-0">
          <div className="mt-4 flex items-end justify-between md:mt-10">
            <div className="rise-in"><p className="mb-3 text-[10px] font-mono-custom uppercase tracking-[.24em] text-primary">Now playing</p><h1 className="font-display text-4xl font-semibold tracking-[-.06em] text-white md:text-6xl">A little<br /><span className="text-white/35">space to listen.</span></h1></div>
            <div className="hidden text-right md:block"><p className="font-mono-custom text-[10px] uppercase tracking-[.18em] text-white/35">Collection / {active?.name}</p><p className="mt-2 text-sm text-white/60">{queue.length} tracks · offline ready</p></div>
          </div>
          <div className="relative mt-10 flex min-h-[430px] items-center justify-center overflow-visible md:mt-14 md:min-h-[500px]">
            <button className="group absolute left-0 z-[1] hidden w-[24%] max-w-[210px] -translate-x-2 items-center justify-center opacity-50 transition hover:opacity-80 md:flex" onClick={() => move(-1)} aria-label="Previous song" data-testid="button-carousel-previous">
              <Cover song={previous} size="lg" className="scale-[.68] opacity-65 blur-[1px] transition group-hover:scale-[.72]" />
              <span className="absolute bottom-2 max-w-[90%] truncate text-xs text-white/60">{previous?.title}</span>
            </button>
            <button className="absolute left-1/2 top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2 transition duration-500 hover:scale-[1.015]" onClick={() => setIsPlaying(!isPlaying)} aria-label={isPlaying ? 'Pause' : 'Play'} data-testid="button-current-cover">
              <Cover song={current} size="lg" className="shadow-[0_28px_90px_rgba(17,171,161,.24)]" />
              <span className="absolute inset-0 flex items-center justify-center rounded-[2rem] bg-black/0 transition group-hover:bg-black/10" />
            </button>
            <button className="group absolute right-0 z-[1] hidden w-[24%] max-w-[210px] translate-x-2 items-center justify-center opacity-50 transition hover:opacity-80 md:flex" onClick={() => move(1)} aria-label="Next song" data-testid="button-carousel-next">
              <Cover song={next} size="lg" className="scale-[.68] opacity-65 blur-[1px] transition group-hover:scale-[.72]" />
              <span className="absolute bottom-2 max-w-[90%] truncate text-xs text-white/60">{next?.title}</span>
            </button>
            <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 gap-2 md:hidden"><button onClick={() => move(-1)} className="rounded-full border border-white/10 p-2 text-white/50" aria-label="Previous song" data-testid="button-mobile-previous"><ChevronLeft size={16} /></button><button onClick={() => move(1)} className="rounded-full border border-white/10 p-2 text-white/50" aria-label="Next song" data-testid="button-mobile-next"><ChevronRight size={16} /></button></div>
          </div>
          <div className="mx-auto mt-9 max-w-[600px] text-center md:mt-11">
            <div className="flex items-start justify-center gap-3"><div><h2 className="font-display text-2xl font-semibold tracking-[-.04em] text-white md:text-3xl" data-testid="text-current-title">{current?.title}</h2><p className="mt-1 text-sm text-white/45" data-testid="text-current-artist">{current?.artist} <span className="mx-1 text-white/20">/</span> {current?.album}</p></div><button className={`mt-1 rounded-full p-2 transition ${current?.favorite ? 'text-primary' : 'text-white/30 hover:text-white'}`} onClick={() => current && toggleFavorite(current.id)} aria-label="Favorite song" data-testid="button-favorite"><Heart size={19} fill={current?.favorite ? 'currentColor' : 'none'} /></button></div>
            <div className="mt-8">
              <div className="group relative"><input aria-label="Seek song" data-testid="input-progress" type="range" min="0" max={current?.duration || 1} value={progress} onChange={(event) => setProgress(Number(event.target.value))} className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10" style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${(progress / (current?.duration || 1)) * 100}%, rgba(255,255,255,.1) 0)` }} /><div className="pointer-events-none absolute -top-1 h-3 w-3 rounded-full bg-primary opacity-0 shadow-[0_0_14px_rgba(54,214,195,.9)] transition-opacity group-hover:opacity-100" style={{ left: `calc(${(progress / (current?.duration || 1)) * 100}% - 6px)` }} /></div>
              <div className="mt-2 flex justify-between font-mono-custom text-[10px] text-white/35"><span>{formatTime(progress)}</span><span>{formatTime(current?.duration || 0)}</span></div>
            </div>
            <div className="mt-6 flex items-center justify-center gap-5 md:gap-8">
              <button className={`transition ${shuffle ? 'text-primary' : 'text-white/40 hover:text-white'}`} onClick={() => setShuffle(!shuffle)} aria-label="Toggle shuffle" data-testid="button-shuffle"><Shuffle size={18} /></button>
              <button className="text-white/65 transition hover:text-white" onClick={() => move(-1)} aria-label="Previous" data-testid="button-previous"><SkipBack size={22} fill="currentColor" /></button>
              <button className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_28px_rgba(54,214,195,.26)] transition hover:scale-105 active:scale-95" onClick={() => setIsPlaying(!isPlaying)} aria-label={isPlaying ? 'Pause' : 'Play'} data-testid="button-play-pause">{isPlaying ? <Pause size={25} fill="currentColor" /> : <Play size={25} fill="currentColor" className="ml-1" />}</button>
              <button className="text-white/65 transition hover:text-white" onClick={() => move(1)} aria-label="Next" data-testid="button-next"><SkipForward size={22} fill="currentColor" /></button>
              <button className={`transition ${repeat ? 'text-primary' : 'text-white/40 hover:text-white'}`} onClick={() => setRepeat(!repeat)} aria-label="Toggle repeat" data-testid="button-repeat"><Repeat size={19} /></button>
            </div>
          </div>
        </section>

        <aside className="hidden border-l border-white/[.07] pl-8 lg:block">
          <div className="sticky top-7 pt-24">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-mono-custom uppercase tracking-[.2em] text-primary">Up next</p><h3 className="mt-2 font-display text-xl font-semibold text-white">The queue</h3></div><button className="rounded-xl border border-white/10 p-2 text-white/45 transition hover:text-white" onClick={() => setLibraryOpen(true)} aria-label="Open library" data-testid="button-sidebar-library"><LibraryBig size={17} /></button></div>
            <div className="mt-8 space-y-1">{queue.slice(0, 5).map((song, index) => <button key={song.id} onClick={() => chooseSong(song)} className={`group flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-white/[.05] ${song.id === current?.id ? 'bg-white/[.06]' : ''}`} data-testid={`button-queue-${song.id}`}><span className="w-4 text-center font-mono-custom text-[10px] text-white/25">{song.id === current?.id ? <span className="wave-bars flex h-4 items-center justify-center gap-[2px]"><span className="h-3" /><span className="h-2" /><span className="h-4" /><span className="h-2.5" /></span> : String(index + 1).padStart(2, '0')}</span><Cover song={song} size="sm" /><span className="min-w-0 flex-1"><span className={`block truncate text-sm ${song.id === current?.id ? 'text-primary' : 'text-white/80'}`}>{song.title}</span><span className="mt-0.5 block truncate text-xs text-white/35">{song.artist}</span></span><span className="font-mono-custom text-[10px] text-white/25">{formatTime(song.duration)}</span></button>)}</div>
            <div className="mt-10 rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><div className="flex items-center justify-between text-white/40"><Volume2 size={16} /><span className="font-mono-custom text-[10px]">{volume}%</span></div><input aria-label="Volume" data-testid="input-volume" className="mt-3 h-1 w-full" type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} /></div>
          </div>
        </aside>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/[.08] bg-[#101d22]/90 px-5 py-3 backdrop-blur-xl lg:hidden safe-bottom"><div className="mx-auto flex max-w-xl items-center gap-3"><Cover song={current} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-sm text-white">{current?.title}</p><p className="truncate text-xs text-white/40">{current?.artist}</p></div><button onClick={() => setIsPlaying(!isPlaying)} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-label={isPlaying ? 'Pause' : 'Play'} data-testid="button-mobile-play">{isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button></div></div>
      <button className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${libraryOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} onClick={() => setLibraryOpen(false)} aria-label="Close library overlay" data-testid="button-close-overlay" />
      <section className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[470px] flex-col border-l border-white/10 bg-[#122126] shadow-[-18px_0_60px_rgba(0,0,0,.35)] transition-transform duration-500 ${libraryOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-white/[.08] px-6 py-6"><div><p className="text-[10px] font-mono-custom uppercase tracking-[.2em] text-primary">Your collection</p><h2 className="mt-1 font-display text-2xl font-semibold">Library</h2></div><button className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white" onClick={() => setLibraryOpen(false)} aria-label="Close library" data-testid="button-close-library"><X size={20} /></button></div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your music" className="w-full rounded-xl border border-white/10 bg-white/[.04] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary/60" aria-label="Search music" data-testid="input-search" /></div>
          <div className="mt-6 flex items-center justify-between"><div className="flex gap-1 overflow-x-auto pb-1">{playlists.map((playlist) => <button key={playlist.id} onClick={() => setActivePlaylist(playlist.id)} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs transition ${activePlaylist === playlist.id ? 'bg-primary text-primary-foreground' : 'bg-white/[.05] text-white/55 hover:text-white'}`} data-testid={`button-playlist-${playlist.id}`}>{playlist.name}</button>)}</div><div className="ml-2 flex shrink-0 gap-1"><button onClick={() => setAddPlaylistOpen(true)} className="rounded-full border border-white/10 p-2 text-primary" aria-label="Add playlist" data-testid="button-add-playlist"><Plus size={16} /></button>{editMode && activePlaylist !== 'p1' && <button onClick={() => setDeleteTarget(active)} className="rounded-full border border-white/10 p-2 text-red-300/70 hover:text-red-300" aria-label="Delete playlist" data-testid="button-delete-playlist"><Trash2 size={15} /></button>}</div></div>
          <div className="mt-6 flex items-center justify-between"><span className="font-mono-custom text-[10px] uppercase tracking-[.15em] text-white/35">{queue.length} tracks</span><div className="flex items-center gap-2"><button onClick={() => setEditMode(!editMode)} className={`flex items-center gap-1 text-xs ${editMode ? 'text-primary' : 'text-white/40'}`} data-testid="button-edit-mode"><Edit3 size={13} /> {editMode ? 'Done' : 'Edit'}</button><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="bg-transparent text-xs text-white/45 outline-none" aria-label="Sort tracks" data-testid="select-sort"><option value="recent" className="bg-[#122126]">Recent</option><option value="title" className="bg-[#122126]">Title</option><option value="artist" className="bg-[#122126]">Artist</option></select></div></div>
          <div className="mt-4 space-y-1">{queue.length ? queue.map((song) => <div key={song.id} className={`group flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/[.04] ${song.id === current?.id ? 'bg-white/[.05]' : ''}`}><button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => { chooseSong(song); setLibraryOpen(false); }} data-testid={`button-library-song-${song.id}`}><Cover song={song} size="sm" /><span className="min-w-0 flex-1"><span className={`block truncate text-sm ${song.id === current?.id ? 'text-primary' : 'text-white/80'}`}>{song.title}</span><span className="mt-0.5 block truncate text-xs text-white/35">{song.artist}</span></span><span className="font-mono-custom text-[10px] text-white/25">{formatTime(song.duration)}</span></button>{editMode && activePlaylist !== 'p1' && <button onClick={() => removeFromPlaylist(song.id)} className="rounded-lg p-2 text-white/30 hover:text-red-300" aria-label={`Remove ${song.title}`} data-testid={`button-remove-song-${song.id}`}><Trash2 size={15} /></button>}</div>) : <div className="rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center"><ListMusic className="mx-auto text-white/25" size={28} /><p className="mt-3 text-sm text-white/50">Nothing here yet</p><p className="mt-1 text-xs text-white/30">Add tracks to this playlist from your collection.</p></div>}</div>
        </div>
        <div className="border-t border-white/[.08] px-6 py-5"><button onClick={() => setImportOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/[.06] py-3 text-sm text-primary transition hover:bg-primary/10" data-testid="button-import-audio"><Upload size={16} /> Import local audio</button><p className="mt-2 text-center text-[10px] text-white/25">Files stay on this device. Nothing is uploaded.</p></div>
      </section>

      {(importOpen || addPlaylistOpen || deleteTarget) && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm" data-testid="modal-overlay">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#172a2f] p-6 shadow-2xl">
          {importOpen && <><div className="flex items-start justify-between"><div><p className="text-[10px] font-mono-custom uppercase tracking-[.18em] text-primary">Local import</p><h3 className="mt-2 font-display text-2xl font-semibold">Bring your own sound</h3></div><button onClick={() => setImportOpen(false)} aria-label="Close import dialog" data-testid="button-close-import"><X size={18} /></button></div><div className="mt-6 rounded-2xl border border-dashed border-white/15 p-5 text-center"><FileAudio className="mx-auto text-primary" size={27} />{selectedFile ? <p className="mt-3 truncate text-sm text-white">{selectedFile.name}</p> : <><p className="mt-3 text-sm text-white/70">Choose an audio file from this device</p><button onClick={() => fileRef.current?.click()} className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/15" data-testid="button-choose-file">Browse files</button></>}<input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} data-testid="input-file" /></div><label className="mt-5 block text-xs text-white/45">Track title<input value={importName} onChange={(event) => setImportName(event.target.value)} placeholder={selectedFile?.name.replace(/\.[^.]+$/, '') || 'Name this track'} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm text-white outline-none focus:border-primary/60" data-testid="input-import-title" /></label><button disabled={!selectedFile} onClick={importAudio} className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-30" data-testid="button-confirm-import">Add to library</button></>}
          {addPlaylistOpen && <><div className="flex items-start justify-between"><div><p className="text-[10px] font-mono-custom uppercase tracking-[.18em] text-primary">New playlist</p><h3 className="mt-2 font-display text-2xl font-semibold">Make a new space</h3></div><button onClick={() => setAddPlaylistOpen(false)} aria-label="Close playlist dialog" data-testid="button-close-playlist"><X size={18} /></button></div><input autoFocus value={newPlaylistName} onChange={(event) => setNewPlaylistName(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && createPlaylist()} placeholder="Playlist name" className="mt-7 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm text-white outline-none focus:border-primary/60" data-testid="input-playlist-name" /><button onClick={createPlaylist} className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground" data-testid="button-confirm-playlist">Create playlist</button></>}
          {deleteTarget && <><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-400/10 text-red-300"><Trash2 size={20} /></div><h3 className="mt-5 font-display text-2xl font-semibold">Delete “{deleteTarget.name}”?</h3><p className="mt-2 text-sm leading-6 text-white/45">The playlist will be removed from this device. Your audio files will stay in the library.</p><div className="mt-7 flex gap-3"><button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-white/65" data-testid="button-cancel-delete">Keep it</button><button onClick={deletePlaylist} className="flex-1 rounded-xl bg-red-400/90 py-3 text-sm font-semibold text-[#201417]" data-testid="button-confirm-delete">Delete playlist</button></div></>}
        </div>
      </div>}
      {toast && <div className="fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full border border-primary/25 bg-[#15383a] px-4 py-3 text-xs text-primary shadow-xl" role="status" data-testid="status-toast"><Check size={14} /> {toast}</div>}
      <div className="fixed bottom-7 left-7 z-20 hidden items-center gap-3 text-white/30 lg:flex"><SlidersHorizontal size={14} /><span className="font-mono-custom text-[9px] uppercase tracking-[.15em]">Immersive mode</span></div>
      <button onClick={() => setLibraryOpen(true)} className="fixed bottom-7 right-8 z-20 hidden items-center gap-2 rounded-full border border-white/10 bg-white/[.05] px-4 py-3 text-xs text-white/60 backdrop-blur-md transition hover:bg-white/10 hover:text-white lg:flex" data-testid="button-open-library-desktop"><ListMusic size={15} /> Library</button>
      <div className="sr-only">{volume === 0 ? <VolumeX /> : <Volume2 />}</div>
    </div>
  );
}

function RootApp() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><App /><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default RootApp;