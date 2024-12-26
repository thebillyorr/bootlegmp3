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

    // 1) Fetch album titles from GCS
    let albumInfo = {};
    try {
        const metaResponse = await fetch('https://storage.googleapis.com/bootlegmp3bucket/albumTitles.json');
        albumInfo = await metaResponse.json();
        console.log('Fetched albumInfo:', albumInfo);
    } catch (err) {
        console.error('Failed to load album metadata:', err);
    }

    // Fallback if album isn't found in albumInfo
    function formatAlbumName(folder) {
      return { 
        englishName: folder,
        japaneseName: ""
      };
    }

    // 2) Helper: Compute the cover URL (assuming .jpeg)
    const baseCoverURL = "https://storage.googleapis.com/bootlegmp3bucket/albumCovers/";
    function getCoverUrl(folderName) {
      return `${baseCoverURL}${folderName}.jpeg`;
    }

    // 3) Fetch songs from the server
    const response = await fetch('/api/songs');
    const folders = await response.json();
    console.log('Fetched folders:', folders);

    // 4) Playback-related helper functions
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

        const { englishName, japaneseName } = albumInfo[albumName] || formatAlbumName(albumName);
        currentSongDisplay.innerHTML = `<strong>${englishName} ${japaneseName ? `(${japaneseName})` : ""}</strong> - ${song.name}`;

        const currentSongUrl = song.url;
        currentAudioPlayer = new Audio(currentSongUrl);
        currentAudioPlayer.play();
        currentAudioPlayer.addEventListener('ended', playNextSong);
    };

    // 5) Event listeners for shuffle, play/pause, next
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

    // 6) Render each album
    folders.forEach(({ folder, songs }, folderIndex) => {
        const albumDiv = document.createElement('div');
        albumDiv.classList.add('album');

        // Use albumInfo or fallback
        const albumData = albumInfo[folder] || formatAlbumName(folder);
        albumDiv.textContent = albumData.englishName + (albumData.japaneseName ? ` (${albumData.japaneseName})` : "");

        // Hidden content container
        const albumContentDiv = document.createElement('div');
        albumContentDiv.classList.add('album-content');
        albumContentDiv.style.display = 'none';

        // Left side: cover + titles
        const leftSideDiv = document.createElement('div');
        leftSideDiv.classList.add('album-left');

        const coverImg = document.createElement('img');
        coverImg.src = getCoverUrl(folder);
        coverImg.alt = albumData.englishName;
        coverImg.classList.add('album-cover');
        leftSideDiv.appendChild(coverImg);

        const titlesDiv = document.createElement('div');
        titlesDiv.classList.add('album-titles');
        const englishTitle = document.createElement('h4');
        englishTitle.textContent = albumData.englishName || folder;
        const japaneseTitle = document.createElement('p');
        japaneseTitle.textContent = albumData.japaneseName || "";

        titlesDiv.appendChild(englishTitle);
        if (albumData.japaneseName) titlesDiv.appendChild(japaneseTitle);
        leftSideDiv.appendChild(titlesDiv);

        // Right side: songs list
        const rightSideDiv = document.createElement('div');
        rightSideDiv.classList.add('album-right');

        const songsList = document.createElement('ul');
        songsList.classList.add('songs');

        // skip the first element in songs (metadata)
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

        // Toggle details on albumDiv click
        albumDiv.addEventListener('click', () => {
            albumContentDiv.style.display = (albumContentDiv.style.display === 'none') ? 'flex' : 'none';
        });

        songsContainer.appendChild(albumDiv);
        songsContainer.appendChild(albumContentDiv);
    });
});
