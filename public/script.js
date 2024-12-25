// script.js
document.addEventListener('DOMContentLoaded', async () => {
    const songsContainer = document.getElementById('container');
    const playPauseButton = document.getElementById('playPauseButton');
    const shuffleButton = document.getElementById('shuffleButton'); 
    const currentSongDisplay = document.getElementById('currentSongDisplay');
    const nextButton = document.getElementById('nextButton');

    let currentAudioPlayer = null;
    let currentAlbumIndex = -1;
    let currentSongIndex = -1;
    let isShuffle = false;

    // -------------------------------------
    // 1) ALBUM INFO: COVER, EN & JP NAMES
    // -------------------------------------
    const albumInfo = {
  kanojomokanojo: {
    englishName: "Kanojo mo Kanojo",
    japaneseName: "カノジョも彼女",
    coverUrl: "./covers/kanojomokanojo.jpg",
  },
  lycorisrecoil: {
    englishName: "Lycoris Recoil",
    japaneseName: "リコリス・リコイル",
    coverUrl: "./covers/lycorisrecoil.jpeg",
  },
  otonarinotenshi: {
    englishName: "The Angel Next Door",
    japaneseName: "お隣の天使様",
    coverUrl: "./covers/otonarinotenshi.png",
  },
  akebichan: {
    englishName: "Akebi-chan no Sailor-fuku",
    japaneseName: "明日ちゃんのセーラー服",
    coverUrl: "./covers/akebichan.jpg",
  },
  gotoubun: {
    englishName: "Quintessential Quintuplets",
    japaneseName: "五等分の花嫁",
    coverUrl: "./covers/gotoubun.jpg",
  },
  tadakoi: {
    englishName: "Tada Never Falls in Love",
    japaneseName: "多田くんは恋をしない",
    coverUrl: "./covers/tadakoi.jpg",
  },
  fuukoi: {
    englishName: "More than Married",
    japaneseName: "夫婦以上、恋人未満",
    coverUrl: "./covers/fuukoi.jpg",
  },
  aquatope: {
    englishName: "The Aquatope on White Sand",
    japaneseName: "白い砂のアクアトープ",
    coverUrl: "./covers/aquatope.jpg",
  },
  superstar: {
    englishName: "Love Live! Superstar!!",
    japaneseName: "スーパースター!!",
    coverUrl: "./covers/superstar.jpg",
  },
  oneoff: {
    englishName: "One Off",
    japaneseName: "",
    coverUrl: "https://placehold.co/100x100?text=One+Off",
  },
  apothecary: {
    englishName: "The Apothecary Diaries",
    japaneseName: "薬屋のひとりごと",
    coverUrl: "./covers/apothecary.jpg",
  },
  yorukura: {
    englishName: "Jellyfish Can't Swim in the Night",
    japaneseName: "夜のクラゲは泳げない",
    coverUrl: "./covers/yorukura.jpeg",
  },
  roshidere: {
    englishName: "Roshidere",
    japaneseName: "時々ボソッとロシア語でデレる隣のアーリャさん",
    coverUrl: "./covers/roshidere.jpeg",
  },
  makeine: {
    englishName: "Makeine",
    japaneseName: "負けヒロインが多すぎる",
    coverUrl: "./covers/makeine.jpg",
  },
  lovelive: {
    englishName: "Love Live! Extras",
    japaneseName: "ラブライブ!",
    coverUrl: "./covers/lovelive.jpg",
  },
  aonohako: {
    englishName: "Blue Box",
    japaneseName: "アオのハコ",
    coverUrl: "./covers/aonohako.jpg",
  },
   mamahaha: {
    englishName: "Mamahaha",
    japaneseName: "継母の連れ子が元カノだった",
    coverUrl: "./covers/mamahaha.jpeg",
  }

};

    // Used if album key not found in albumInfo
    function formatAlbumName(folder) {
      // Just return the folder string if we have no info
      return { 
        englishName: folder, 
        japaneseName: "", 
        coverUrl: "https://placehold.co/100x100?text=No+Cover"
      };
    }

    // -------------------------------------
    // 2) FETCH SONGS FROM SERVER
    // -------------------------------------
    const response = await fetch('/api/songs');
    const folders = await response.json();
    console.log(folders);

    // -------------------------------------
    // 3) HELPER FUNCTIONS
    // -------------------------------------
    const playNextSong = () => {
        if (isShuffle) {
            currentSongIndex = Math.floor(Math.random() * (folders[currentAlbumIndex].songs.length - 2));
            currentAlbumIndex = Math.floor(Math.random() * folders.length);
        } else {
            if (currentSongIndex === folders[currentAlbumIndex].songs.length - 2) {  
                currentSongIndex = 0;
                if (currentAlbumIndex >= folders.length - 1) {
                    currentAlbumIndex = 0;
                } else currentAlbumIndex += 1;
            } else currentSongIndex += 1;
        }
        playSong();
    };

    const playSong = () => {
        if (currentSongIndex < 0 || currentSongIndex >= folders[currentAlbumIndex].songs.length) return;
        if (currentAudioPlayer) {
            currentAudioPlayer.pause();
        }

        // +1 because the first element is your metadata
        const albumName = folders[currentAlbumIndex].folder;
        const song = folders[currentAlbumIndex].songs[currentSongIndex + 1];

        // Show what's playing
        const { englishName, japaneseName } = albumInfo[albumName] || formatAlbumName(albumName);
        currentSongDisplay.innerHTML = `<strong>${englishName} ${japaneseName ? `(${japaneseName})` : ""}</strong> - ${song.name}`;

        // Start playing
        const currentSongUrl = song.url;
        currentAudioPlayer = new Audio(currentSongUrl);
        currentAudioPlayer.play();
        currentAudioPlayer.addEventListener('ended', playNextSong);
    };

    // -------------------------------------
    // 4) EVENT LISTENERS FOR SHUFFLE/PLAY/NEXT
    // -------------------------------------
    shuffleButton.addEventListener('click', () => {
        isShuffle = !isShuffle;
        shuffleButton.textContent = `Shuffle: ${isShuffle ? 'On' : 'Off'}`;
    });

    playPauseButton.addEventListener('click', () => {
        if (currentAudioPlayer && !currentAudioPlayer.paused) {
            currentAudioPlayer.pause();
        } else if (currentAudioPlayer && currentAudioPlayer.paused) {
            currentAudioPlayer.play();
        }
    });

    nextButton.addEventListener('click', playNextSong);

    // -------------------------------------
    // 5) RENDER ALBUMS
    // -------------------------------------
    folders.forEach(({ folder, songs }, folderIndex) => {
        // Create a clickable header for the album
        const albumDiv = document.createElement('div');
        albumDiv.classList.add('album');

        // We'll display the English name (and JP name in parentheses) for the heading
        const albumData = albumInfo[folder] || formatAlbumName(folder);
        albumDiv.textContent = albumData.englishName + (albumData.japaneseName ? ` (${albumData.japaneseName})` : "");

        // Create the hidden content container
        const albumContentDiv = document.createElement('div');
        albumContentDiv.classList.add('album-content');
        albumContentDiv.style.display = 'none'; // hidden by default

        // LEFT SIDE: cover + english name + jp name
        const leftSideDiv = document.createElement('div');
        leftSideDiv.classList.add('album-left');

        // Cover image
        const coverImg = document.createElement('img');
        coverImg.src = albumData.coverUrl;
        coverImg.alt = albumData.englishName;
        coverImg.classList.add('album-cover');
        leftSideDiv.appendChild(coverImg);

        // Titles container
        const titlesDiv = document.createElement('div');
        titlesDiv.classList.add('album-titles');
        // English name
        const englishTitle = document.createElement('h4');
        englishTitle.textContent = albumData.englishName || folder;
        // Japanese name
        const japaneseTitle = document.createElement('p');
        japaneseTitle.textContent = albumData.japaneseName || "";
        
        titlesDiv.appendChild(englishTitle);
        if (albumData.japaneseName) {
          titlesDiv.appendChild(japaneseTitle);
        }
        leftSideDiv.appendChild(titlesDiv);

        // RIGHT SIDE: songs
        const rightSideDiv = document.createElement('div');
        rightSideDiv.classList.add('album-right');

        const songsList = document.createElement('ul');
        songsList.classList.add('songs');

        // skip the first element
        songs.slice(1).forEach(({ name }, songIndex) => {
            const songItem = document.createElement('li');
            songItem.textContent = name;
            songItem.addEventListener('click', (e) => {
                e.stopPropagation();
                currentAlbumIndex = folderIndex;
                currentSongIndex = songIndex;
                playSong();
            });
            songsList.appendChild(songItem);
        });
        rightSideDiv.appendChild(songsList);

        // Combine left + right
        albumContentDiv.appendChild(leftSideDiv);
        albumContentDiv.appendChild(rightSideDiv);

        // Toggle the details on albumDiv click
        albumDiv.addEventListener('click', () => {
            if (albumContentDiv.style.display === 'none') {
                albumContentDiv.style.display = 'flex';
            } else {
                albumContentDiv.style.display = 'none';
            }
        });

        // Append to the container
        songsContainer.appendChild(albumDiv);
        songsContainer.appendChild(albumContentDiv);
    });
});
