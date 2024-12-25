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
    // 1) ALBUM INFO (No more coverUrl)
    // -------------------------------------
    const albumInfo = {
      kanojomokanojo: {
        englishName: "Kanojo mo Kanojo",
        japaneseName: "カノジョも彼女",
      },
      lycorisrecoil: {
        englishName: "Lycoris Recoil",
        japaneseName: "リコリス・リコイル",
      },
      otonarinotenshi: {
        englishName: "The Angel Next Door",
        japaneseName: "お隣の天使様",
      },
      akebichan: {
        englishName: "Akebi-chan no Sailor-fuku",
        japaneseName: "明日ちゃんのセーラー服",
      },
      gotoubun: {
        englishName: "Quintessential Quintuplets",
        japaneseName: "五等分の花嫁",
      },
      tadakoi: {
        englishName: "Tada Never Falls in Love",
        japaneseName: "多田くんは恋をしない",
      },
      fuukoi: {
        englishName: "More than Married",
        japaneseName: "夫婦以上、恋人未満",
      },
      aquatope: {
        englishName: "The Aquatope on White Sand",
        japaneseName: "白い砂のアクアトープ",
      },
      superstar: {
        englishName: "Love Live! Superstar!!",
        japaneseName: "スーパースター!!",
      },
      oneoff: {
        englishName: "One Off",
        japaneseName: "",
      },
      apothecary: {
        englishName: "The Apothecary Diaries",
        japaneseName: "薬屋のひとりごと",
      },
      yorukura: {
        englishName: "Jellyfish Can't Swim in the Night",
        japaneseName: "夜のクラゲは泳げない",
      },
      roshidere: {
        englishName: "Roshidere",
        japaneseName: "時々ボソッとロシア語でデレる隣のアーリャさん",
      },
      makeine: {
        englishName: "Makeine",
        japaneseName: "負けヒロインが多すぎる",
      },
      lovelive: {
        englishName: "Love Live! Extras",
        japaneseName: "ラブライブ!",
      },
      aonohako: {
        englishName: "Blue Box",
        japaneseName: "アオのハコ",
      },
      mamahaha: {
        englishName: "Mamahaha",
        japaneseName: "継母の連れ子が元カノだった",
      }
    };

    // If not found in albumInfo, fallback:
    function formatAlbumName(folder) {
      return { 
        englishName: folder, 
        japaneseName: "" 
      };
    }

    // -------------------------------------
    // 2) HELPER: Compute GCS Cover URL
    // -------------------------------------
    // We'll assume all images are .jpeg. If some are .jpg or .png, adjust accordingly.
    const baseCoverURL = "https://storage.googleapis.com/bootlegmp3bucket/albumCovers/";

    function getCoverUrl(folderName) {
      return `${baseCoverURL}${folderName}.jpeg`;
    }

    // -------------------------------------
    // 3) FETCH SONGS FROM SERVER
    // -------------------------------------
    const response = await fetch('/api/songs');
    const folders = await response.json();
    console.log(folders);

    // -------------------------------------
    // 4) HELPER FUNCTIONS
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
            } else {
                currentSongIndex += 1;
            }
        }
        playSong();
    };

    const playSong = () => {
        if (currentSongIndex < 0 || currentSongIndex >= folders[currentAlbumIndex].songs.length) return;
        if (currentAudioPlayer) {
            currentAudioPlayer.pause();
        }

        // +1 because the first element is metadata
        const albumName = folders[currentAlbumIndex].folder;
        const song = folders[currentAlbumIndex].songs[currentSongIndex + 1];

        // Display what's playing
        const { englishName, japaneseName } = albumInfo[albumName] || formatAlbumName(albumName);
        currentSongDisplay.innerHTML = `<strong>${englishName} ${japaneseName ? `(${japaneseName})` : ""}</strong> - ${song.name}`;

        // Start playing
        const currentSongUrl = song.url;
        currentAudioPlayer = new Audio(currentSongUrl);
        currentAudioPlayer.play();
        currentAudioPlayer.addEventListener('ended', playNextSong);
    };

    // -------------------------------------
    // 5) EVENT LISTENERS FOR SHUFFLE/PLAY/NEXT
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
    // 6) RENDER ALBUMS
    // -------------------------------------
    folders.forEach(({ folder, songs }, folderIndex) => {
        // Create a clickable header for the album
        const albumDiv = document.createElement('div');
        albumDiv.classList.add('album');

        // Display the English + Japanese name in the heading
        const albumData = albumInfo[folder] || formatAlbumName(folder);
        albumDiv.textContent = albumData.englishName + (
          albumData.japaneseName ? ` (${albumData.japaneseName})` : ""
        );

        // Create a hidden container for album details
        const albumContentDiv = document.createElement('div');
        albumContentDiv.classList.add('album-content');
        albumContentDiv.style.display = 'none';

        // LEFT SIDE: cover + metadata
        const leftSideDiv = document.createElement('div');
        leftSideDiv.classList.add('album-left');

        // Dynamically computed cover image
        const coverImg = document.createElement('img');
        coverImg.src = getCoverUrl(folder);
        coverImg.alt = albumData.englishName;
        coverImg.classList.add('album-cover');
        leftSideDiv.appendChild(coverImg);

        // Titles
        const titlesDiv = document.createElement('div');
        titlesDiv.classList.add('album-titles');
        const englishTitle = document.createElement('h4');
        englishTitle.textContent = albumData.englishName || folder;
        const japaneseTitle = document.createElement('p');
        japaneseTitle.textContent = albumData.japaneseName || "";

        titlesDiv.appendChild(englishTitle);
        if (albumData.japaneseName) {
          titlesDiv.appendChild(japaneseTitle);
        }
        leftSideDiv.appendChild(titlesDiv);

        // RIGHT SIDE: songs list
        const rightSideDiv = document.createElement('div');
        rightSideDiv.classList.add('album-right');

        const songsList = document.createElement('ul');
        songsList.classList.add('songs');

        // skip first element in each songs array (metadata)
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

        // Toggle display on albumDiv click
        albumDiv.addEventListener('click', () => {
            albumContentDiv.style.display =
              albumContentDiv.style.display === 'none' ? 'flex' : 'none';
        });

        // Append to container
        songsContainer.appendChild(albumDiv);
        songsContainer.appendChild(albumContentDiv);
    });
});
