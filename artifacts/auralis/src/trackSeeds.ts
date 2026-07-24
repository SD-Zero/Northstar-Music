export type TrackSeed = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  genre: string;
  year: string;
  coverA: string;
  coverB: string;
};

const requestedTracks = `
Three Days Grace - Last to Know
Three Days Grace - The Good Life
Three Days Grace - Break
Versus Me · James Arthur Milbrandt · Lee Alan Milbrandt · Joshua Alan Johnson · Dustin Hansen - Terrified
I Prevail - Breaking Down
I Prevail - Paranoid
I Prevail - Hurricane
I Prevail · Delaney Jane - Every Time You Leave
I Prevail - I Don't Belong Here
I Prevail - Let Me Be Sad
Three Days Grace - Pain
Three Days Grace - Animal I Have Become
Three Days Grace - Riot
Three Days Grace - Over and Over
Three Days Grace - Get Out Alive
Solence - Paralyzed
Solence - Direction
Solence - All of the Pain Must Go
Memphis May Fire - Make Believe
Memphis May Fire - Somebody
Memphis May Fire - The Fight Within
Memphis May Fire - Your Turn
Falling In Reverse - Voices In My Head
Falling in Reverse (feat Saraya): Bad Guy (Radio Edit)
CANTERVICE - Doomsday
Red - Breathe Into Me
Wage War - Circle The Drain
Asking Alexandria - Into The Fire
System Of A Down - Chop Suey!
Thriller Records · The Word Alive · Bad Omens - One Of Us
Three Days Grace - Mayday
All Time Low - Sleepwalking
SCATTERBRAIN - FAST LANE
Social Repose - After Dark
The Plague - Danger
Citizen Soldier - I Hate Myself
Saint Asonia - Devastate
I Prevail - Scars
I Prevail - Stuck In Your Head
Sleep Theory - Numb
Theory Of A Deadman - Rx (Medicate)
All Time Low · blackbear - Monsters (feat. blackbear)
I Prevail - My Heart I Surrender
I Prevail - Blank Space
Memphis May Fire - Grenade
Set It Off - Creating Monsters
Memphis May Fire - Paralyzed
Smash Into Pieces · Benjamin Jennebo · Chris Adam Sörbye Hedman · Philip Strand - Afterglow
THE DEFECT - RUN | Lyrics
ALESTI · Rory Rodriguez - Take the Pain Away (feat. Rory Rodriguez)
ALESTI · Anxxiety · Anxxiety - Dissipate (feat. Anxxiety)
ALESTI · James DeBerg · James DeBerg · Joey Sturgis - Paralyzed (feat. James DeBerg)
STARSET - Halo
Solence - Better This Way
Solence - Claustrophobia
Solence - Endless
Ty Trehern · Ty Trehern - Fall With Me
Bad Wolves - Zombie
Nate Vickers - A Little Too Late
STARSET - My Demons
Silos · From Ashes to New · Judge & Jury - IF I FALL!
Silos · Judge & Jury - Impossible
elijah - guilty
I Prevail - There’s Fear In Letting Go
I Prevail - Bad Things
I Prevail - Fake
I Prevail - The Negative
I Prevail - Deep End
Thriller Records · If Not For Me - Demons
Citizen Soldier - Pretend My Pain Away
Citizen Soldier - Irreplaceable
Shallowsky · Jon Eberhard · Brian Stephens - Delete Me
Shallowsky · Jon Eberhard · Brian Stephens - Artificial Paradigm
Shallowsky · Jon Eberhard · Brian Stephens - Cryptid
Shallowsky - DRKPLCS
Memphis May Fire - The Other Side
Memphis May Fire - Hell Is Empty
Memphis May Fire - Infection
Skillet - The Resistance
Memphis May Fire - Love Is War
Soul Extract - Innerspace
Smash Into Pieces · Benjamin Jennebo · Chris Adam Sörbye Hedman · Per Bergqvist · Andreas Lindbergh · Linnea Deb · Joy Deb · Jimmy Joker - Six Feet Under
Essenger · Cryoshell - As Above, So Below
STARSET - Satellite
STARSET - DIE FOR YOU
STARSET - Monster
Sleep Theory - Static
Citizen Soldier - Isolate
Illenium x Excision feat. I Prevail - Feel Something (Elusios Edit)
The Plague - Antidote
Andromida · Beyond Unbroken - Break the Cycle
Jeris Johnson - When The Darkness Comes
Evans Blue - Beyond The Stars
Citizen Soldier - Strong for Somebody Else
Citizen Soldier - My Own Miracle
Sleep Theory - Fallout
Wage War - Gravity
The Amity Affliction - Drag the Lake
Skillet - Awake and Alive
Breaking Benjamin - The Diary of Jane (Single Version)
From Ashes to New - Die For You
THE DAY WE LEFT EARTH · Martin Bjerke · Simen Handeland - MELANCHOLIA
NOTHING MORE - IF IT DOESN'T HURT
The Plot In You - FEEL NOTHING (RESET)
Bring Me The Horizon - Blasphemy
Bring Me The Horizon - Follow You
Citizen Soldier - Thank You for Hating Me
Skillet - Psycho In My Head
Ashes Remain · Joshua Smith · Ryan Nalepa · Benjamin Kirk · Jonathan Hively · Robert Tahan · Seth Mosley - On My Own
Ashes Remain · Joshua Smith · Ryan Nalepa · Benjamin Kirk · Jonathan Hively · Robert Tahan · Brian Hitt - End of Me
Falling In Reverse - Trigger Warning
Linkin Park - What I've Done
Bring Me The Horizon- Throne (Audio)
we are empire starset no scream edit endfield
SCATTERBRAIN - BITTER
Muse - Shimmering Scars
`.trim().split('\n');

const coverPairs = [
  ['#214a55', '#62d4c8'],
  ['#3c315f', '#d48aa6'],
  ['#5a3c2d', '#e4a66d'],
  ['#1e4e68', '#7bafd0'],
  ['#394d39', '#d8c56a'],
  ['#522e3e', '#e27e8e'],
];

const parseTrack = (row: string, index: number): TrackSeed => {
  const spacedSeparator = row.indexOf(' - ');
  const compactSeparator = row.indexOf('-');
  const colonSeparator = row.indexOf(':');
  const separator = spacedSeparator >= 0 ? spacedSeparator : compactSeparator >= 0 ? compactSeparator : colonSeparator;
  const artist = separator > 0 ? row.slice(0, separator).trim() : 'Unknown artist';
  const title = separator > 0 ? row.slice(separator + (spacedSeparator === separator ? 3 : colonSeparator === separator ? 1 : 1)).trim() : row.trim();
  const [coverA, coverB] = coverPairs[index % coverPairs.length];

  return {
    id: `requested-${String(index + 1).padStart(3, '0')}`,
    title,
    artist,
    album: 'Placeholder album',
    duration: 210 + (index % 105),
    genre: 'Imported list',
    year: '2026',
    coverA,
    coverB,
  };
};

export const requestedSongSeeds = requestedTracks.map(parseTrack);