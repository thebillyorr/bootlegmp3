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

    // Hardcoded album info
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
        },
        ririsa: {
            englishName: "2.5 Dimensional",
            japaneseName: "2.5次元の誘惑",
        }
    };

    function formatAlbumName(folder) {
        return { 
            englishName: folder, 
            japaneseName: "" 
        };
    }

    const baseCoverURL = "https://storage.googleapis.com/bootlegmp3bucket/albumCovers/";

    function getCoverUrl(folderName) {
        return `${baseCoverURL}${folderName}.jpeg`;
    }

    const response = await fetch('/api/songs');
    const folders = await response.json();
    console.log(folders);

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

        const albumName = folders[currentAlbumIndex].folder;
        const song = folders[currentAlbumIndex].songs[currentSongIndex + 1];

        const { englishName, japaneseName } = albumInfo[albumName] || formatAlbumName(albumName);
        currentSongDisplay.innerHTML = `<strong>${englishName} ${japaneseName ? `(${japaneseName})` : ""}</strong> - ${song.name}`;

        const currentSongUrl = song.url;
        currentAudioPlayer = new Audio(currentSongUrl);
        currentAudioPlayer.play();
        currentAudioPlayer.addEventListener('ended', playNextSong);
    };

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

    folders.forEach(({ folder, songs }, folderIndex) => {
        const albumDiv = document.createElement('div');
        albumDiv.classList.add('album');

        const albumData = albumInfo[folder] || formatAlbumName(folder);
        albumDiv.textContent = albumData.englishName + (albumData.japaneseName ? ` (${albumData.japaneseName})` : "");

        const albumContentDiv = document.createElement('div');
        albumContentDiv.classList.add('album-content');
        albumContentDiv.style.display = 'none';

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

        const rightSideDiv = document.createElement('div');
        rightSideDiv.classList.add('album-right');

        const songsList = document.createElement('ul');
        songsList.classList.add('songs');

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

        albumContentDiv.appendChild(leftSideDiv);
        albumContentDiv.appendChild(rightSideDiv);

        albumDiv.addEventListener('click', () => {
            albumContentDiv.style.display =
              albumContentDiv.style.display === 'none' ? 'flex' : 'none';
        });

        songsContainer.appendChild(albumDiv);
        songsContainer.appendChild(albumContentDiv);
    });
});
