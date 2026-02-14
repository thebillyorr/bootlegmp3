// script.js
document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const albumListEl = document.getElementById('album-list');
    const detailViewEl = document.getElementById('detail-view');
    const albumContentEl = document.getElementById('album-content');
    const currentSongDisplay = document.getElementById('currentSongDisplay');
    
    // Controls
    const playPauseButton = document.getElementById('playPauseButton');
    const shuffleButton = document.getElementById('shuffleButton');
    const nextButton = document.getElementById('nextButton');
    const progressBar = document.getElementById('progressBar');
    const progressContainer = document.getElementById('progressContainer');
    const mobileBackBtn = document.getElementById('mobile-back-btn');

    // State
    let currentAudioPlayer = new Audio(); // Initialize mostly empty audio object
    let currentAlbumIndex = -1;
    let currentSongIndex = -1;
    let isShuffle = false;
    let folders = []; // Will hold fetched data

    // Hardcoded album info (Same as before)
    const albumInfo = {
        kanojomokanojo: { englishName: "Kanojo mo Kanojo", japaneseName: "カノジョも彼女" },
        lycorisrecoil: { englishName: "Lycoris Recoil", japaneseName: "リコリス・リコイル" },
        otonarinotenshi: { englishName: "The Angel Next Door", japaneseName: "お隣の天使様" },
        akebichan: { englishName: "Akebi-chan no Sailor-fuku", japaneseName: "明日ちゃんのセーラー服" },
        gotoubun: { englishName: "Quintessential Quintuplets", japaneseName: "五等分の花嫁" },
        tadakoi: { englishName: "Tada Never Falls in Love", japaneseName: "多田くんは恋をしない" },
        fuukoi: { englishName: "More than Married", japaneseName: "夫婦以上、恋人未満" },
        aquatope: { englishName: "The Aquatope on White Sand", japaneseName: "白い砂のアクアトープ" },
        superstar: { englishName: "Love Live! Superstar!!", japaneseName: "スーパースター!!" },
        oneoff: { englishName: "One Off", japaneseName: "" },
        apothecary: { englishName: "The Apothecary Diaries", japaneseName: "薬屋のひとりごと" },
        yorukura: { englishName: "Jellyfish Can't Swim in the Night", japaneseName: "夜のクラゲは泳げない" },
        roshidere: { englishName: "Roshidere", japaneseName: "ロシデレ" },
        makeine: { englishName: "Makeine", japaneseName: "負けヒロインが多すぎる" },
        lovelive: { englishName: "Love Live! Extras", japaneseName: "ラブライブ!" },
        aonohako: { englishName: "Blue Box", japaneseName: "アオのハコ" },
        mamahaha: { englishName: "Mamahaha", japaneseName: "継母の連れ子が元カノだった" },
        ririsa: { englishName: "2.5 Dimensional", japaneseName: "2.5 次元の誘惑" },
        amagami: { englishName: "Tying the Knot", japaneseName: "甘神さんちの縁結び" },
        hyakkano: { englishName: "Hyakkano", japaneseName: "100カノ" },
        medalist: { englishName: "Medalist", japaneseName: "メダリスト" },
        kaoruhana: { englishName: "Fragrant Flower", japaneseName: "薫る花は凛と咲く" }
    };

    const baseCoverURL = "https://storage.googleapis.com/bootlegmp3bucket/albumCovers/";

    // Helpers
    function getDisplayInfo(folderName) {
        return albumInfo[folderName] || { englishName: folderName, japaneseName: "" };
    }

    function getCoverUrl(folderName) {
        return `${baseCoverURL}${folderName}.jpeg`;
    }

    function updateProgressBar() {
        if (currentAudioPlayer.duration) {
            const percentage = (currentAudioPlayer.currentTime / currentAudioPlayer.duration) * 100;
            progressBar.style.width = `${percentage}%`;
        }
    }

    function renderLibrary() {
        albumListEl.innerHTML = ''; // clear
        folders.forEach((folderData, index) => {
            const { folder } = folderData;
            const info = getDisplayInfo(folder);
            
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${info.englishName.toUpperCase()}</span>
                <span class="subtitle">${info.japaneseName}</span>
            `;
            li.addEventListener('click', () => {
                // Highlight active item
                document.querySelectorAll('#album-list li').forEach(el => el.classList.remove('active'));
                li.classList.add('active');
                
                openAlbumDetail(index);
            });
            albumListEl.appendChild(li);
        });
    }

    function openAlbumDetail(index) {
        const folderData = folders[index];
        const { folder, songs } = folderData;
        const info = getDisplayInfo(folder);
        
        // Show detail view (essential for mobile to slide in)
        detailViewEl.classList.add('open');
        detailViewEl.hidden = false;

        // Render Header
        albumContentEl.innerHTML = `
            <div class="album-header-large">
                <img src="${getCoverUrl(folder)}" alt="Cover" class="album-cover-stamp" onerror="this.style.display='none'">
                <div class="album-info-text">
                    <h2>${info.englishName}</h2>
                    <p>${info.japaneseName}</p>
                    <p>${songs.length - 1} TRACKS</p>
                </div>
            </div>
            <div class="tracklist" id="tracklist-container"></div>
        `;

        const tracklistContainer = document.getElementById('tracklist-container');

        // Render Tracks (Skipping first item if it's the folder itself, based on original logic)
        // Original logic used slice(1), assuming index 0 is folder metadata or empty
        songs.slice(1).forEach((song, songIndex) => {
            const row = document.createElement('div');
            row.className = 'track-item';
            
            // Pad number with leading zero
            const trackNum = (songIndex + 1).toString().padStart(2, '0');
            
            row.innerHTML = `
                <div class="track-number">${trackNum}</div>
                <div class="track-name">${song.name}</div>
            `;
            
            row.addEventListener('click', () => {
                currentAlbumIndex = index;
                currentSongIndex = songIndex; // The slice(1) offset logic is handled in playSong
                playSong();
            });
            
            tracklistContainer.appendChild(row);
        });
    }

    // Player Logic
    const playSong = () => {
        if (currentAlbumIndex === -1) return;
        
        // Validate index
        const album = folders[currentAlbumIndex];
        // Note: sliced logic. Actual array index = currentSongIndex + 1
        // because we skipped the first item in the UI list
        const actualIndex = currentSongIndex + 1;
        
        if (actualIndex >= album.songs.length) return;
        
        const songPtr = album.songs[actualIndex];
        const info = getDisplayInfo(album.folder);

        // Update Text
        currentSongDisplay.textContent = `${info.englishName.toUpperCase()} - ${songPtr.name}`;
        playPauseButton.textContent = "[PAUSE]";

        // Audio Source
        currentAudioPlayer.src = songPtr.url;
        currentAudioPlayer.play();
        
        // Setup listeners for this new source
        currentAudioPlayer.ontimeupdate = updateProgressBar;
        currentAudioPlayer.onended = playNextSong;
    };

    const playNextSong = () => {
        if (!folders.length) return;

        if (isShuffle) {
            // Random Album
            currentAlbumIndex = Math.floor(Math.random() * folders.length);
            // Random Song in that album (account for +1 offset)
            const albumLen = folders[currentAlbumIndex].songs.length;
            currentSongIndex = Math.floor(Math.random() * (albumLen - 1)); 
        } else {
            // Linear
            const albumLen = folders[currentAlbumIndex].songs.length;
            // currentSongIndex corresponds to the UI list index (0-based relative to slice)
            // The real array length is albumLen. 
            // The UI list has (albumLen - 1) items.
            // If we are at the last song:
            if (currentSongIndex >= albumLen - 2) {
                // Next album
                currentSongIndex = 0;
                if (currentAlbumIndex >= folders.length - 1) {
                    currentAlbumIndex = 0; // Loop back to start
                } else {
                    currentAlbumIndex++;
                }
            } else {
                currentSongIndex++;
            }
        }
        playSong();
    };

    // Event Listeners
    playPauseButton.addEventListener('click', () => {
        if (currentAudioPlayer.paused && currentAudioPlayer.src) {
            currentAudioPlayer.play();
            playPauseButton.textContent = "[PAUSE]";
        } else if (currentAudioPlayer.src) {
            currentAudioPlayer.pause();
            playPauseButton.textContent = "[PLAY]";
        }
    });

    shuffleButton.addEventListener('click', () => {
        isShuffle = !isShuffle;
        shuffleButton.textContent = `[SHUFFLE: ${isShuffle ? 'ON' : 'OFF'}]`;
    });

    nextButton.addEventListener('click', playNextSong);

    // Progress Bar Seek
    progressContainer.addEventListener('click', (e) => {
        if (!currentAudioPlayer.src) return;
        const rect = progressContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const percentage = clickX / width;
        currentAudioPlayer.currentTime = percentage * currentAudioPlayer.duration;
    });

    // Mobile Navigation
    mobileBackBtn.addEventListener('click', () => {
        detailViewEl.classList.remove('open');
        // setTimeout(() => detailViewEl.hidden = true, 300); // Optional wait for transition
    });

    // Initial Load
    try {
        const response = await fetch('/api/songs');
        folders = await response.json();
        renderLibrary();
    } catch (err) {
        console.error("Failed to load library", err);
        albumListEl.innerHTML = "<li>ERROR LOADING LIBRARY</li>";
    }
});