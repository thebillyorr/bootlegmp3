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
    const currentAudioPlayer = new Audio();
    let currentAlbumIndex = -1;
    let currentSongIndex = -1;
    let isShuffle = false;
    let albums = []; // [{ folder, cover, tracks: [{ name, path }] }]
    let playToken = 0; // guards against out-of-order async play requests

    // Hardcoded album display info (English / Japanese names)
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

    // Helpers
    function getDisplayInfo(folderName) {
        return albumInfo[folderName] || { englishName: folderName, japaneseName: "" };
    }

    function updateProgressBar() {
        if (currentAudioPlayer.duration) {
            const percentage = (currentAudioPlayer.currentTime / currentAudioPlayer.duration) * 100;
            progressBar.style.width = `${percentage}%`;
        }
    }

    async function fetchTrackUrl(path) {
        const res = await fetch(`/api/track?path=${encodeURIComponent(path)}`);
        if (!res.ok) throw new Error('Failed to sign track');
        const { url } = await res.json();
        return url;
    }

    function renderLibrary() {
        albumListEl.innerHTML = '';
        albums.forEach((album, index) => {
            const info = getDisplayInfo(album.folder);

            const li = document.createElement('li');
            li.innerHTML = `
                <span>${info.englishName.toUpperCase()}</span>
                <span class="subtitle">${info.japaneseName}</span>
            `;
            li.addEventListener('click', () => {
                document.querySelectorAll('#album-list li').forEach(el => el.classList.remove('active'));
                li.classList.add('active');
                openAlbumDetail(index);
            });
            albumListEl.appendChild(li);
        });
    }

    function openAlbumDetail(index) {
        const album = albums[index];
        const info = getDisplayInfo(album.folder);

        detailViewEl.classList.add('open');
        detailViewEl.hidden = false;

        albumContentEl.innerHTML = `
            <div class="album-header-large">
                <img src="${album.cover}" alt="Cover" class="album-cover-stamp" onerror="this.style.display='none'">
                <div class="album-info-text">
                    <h2>${info.englishName}</h2>
                    <p>${info.japaneseName}</p>
                    <p>${album.tracks.length} TRACKS</p>
                </div>
            </div>
            <div class="tracklist" id="tracklist-container"></div>
        `;

        const tracklistContainer = document.getElementById('tracklist-container');

        album.tracks.forEach((song, songIndex) => {
            const row = document.createElement('div');
            row.className = 'track-item';
            const trackNum = (songIndex + 1).toString().padStart(2, '0');
            row.innerHTML = `
                <div class="track-number">${trackNum}</div>
                <div class="track-name">${song.name}</div>
            `;
            row.addEventListener('click', () => {
                currentAlbumIndex = index;
                currentSongIndex = songIndex;
                playSong();
            });
            tracklistContainer.appendChild(row);
        });
    }

    // Player Logic — signs the URL on demand, right before playing.
    const playSong = async () => {
        if (currentAlbumIndex === -1) return;
        const album = albums[currentAlbumIndex];
        if (!album || currentSongIndex < 0 || currentSongIndex >= album.tracks.length) return;

        const track = album.tracks[currentSongIndex];
        const info = getDisplayInfo(album.folder);

        const token = ++playToken;
        currentSongDisplay.textContent = `${info.englishName.toUpperCase()} - ${track.name}`;

        try {
            const url = await fetchTrackUrl(track.path);
            if (token !== playToken) return; // a newer play request superseded this one

            currentAudioPlayer.src = url;
            await currentAudioPlayer.play();
            // The [PLAY] / [PAUSE] label is driven by the audio element's own
            // 'playing' / 'pause' events (wired once below), so it flips straight
            // from [PLAY] to [PAUSE] when sound actually starts — no [...] state.
        } catch (err) {
            console.error('Playback failed', err);
            if (token === playToken) {
                currentSongDisplay.textContent = "ERROR LOADING TRACK";
            }
        }
    };

    const playNextSong = () => {
        if (!albums.length || currentAlbumIndex === -1) return;
        const trackCount = albums[currentAlbumIndex].tracks.length;

        if (isShuffle) {
            currentAlbumIndex = Math.floor(Math.random() * albums.length);
            const len = albums[currentAlbumIndex].tracks.length;
            currentSongIndex = Math.floor(Math.random() * len);
        } else if (currentSongIndex >= trackCount - 1) {
            // End of album -> first track of the next album (loop at the end)
            currentSongIndex = 0;
            currentAlbumIndex = (currentAlbumIndex + 1) % albums.length;
        } else {
            currentSongIndex++;
        }
        playSong();
    };

    // Event Listeners
    playPauseButton.addEventListener('click', () => {
        if (!currentAudioPlayer.src) return;
        if (currentAudioPlayer.paused) {
            currentAudioPlayer.play();
        } else {
            currentAudioPlayer.pause();
        }
    });

    shuffleButton.addEventListener('click', () => {
        isShuffle = !isShuffle;
        shuffleButton.textContent = `[SHUFFLE: ${isShuffle ? 'ON' : 'OFF'}]`;
    });

    nextButton.addEventListener('click', playNextSong);

    // The play/pause label and progress bar reflect the audio element's real
    // state, which keeps the [PLAY] -> [PAUSE] transition clean and direct.
    currentAudioPlayer.addEventListener('playing', () => { playPauseButton.textContent = "[PAUSE]"; });
    currentAudioPlayer.addEventListener('pause', () => { playPauseButton.textContent = "[PLAY]"; });
    currentAudioPlayer.addEventListener('timeupdate', updateProgressBar);
    currentAudioPlayer.addEventListener('ended', playNextSong);

    progressContainer.addEventListener('click', (e) => {
        if (!currentAudioPlayer.src || !currentAudioPlayer.duration) return;
        const rect = progressContainer.getBoundingClientRect();
        const percentage = (e.clientX - rect.left) / rect.width;
        currentAudioPlayer.currentTime = percentage * currentAudioPlayer.duration;
    });

    mobileBackBtn.addEventListener('click', () => {
        detailViewEl.classList.remove('open');
    });

    // Initial Load
    try {
        const response = await fetch('/api/albums');
        albums = await response.json();
        renderLibrary();
    } catch (err) {
        console.error("Failed to load library", err);
        albumListEl.innerHTML = "<li>ERROR LOADING LIBRARY</li>";
    }
});
