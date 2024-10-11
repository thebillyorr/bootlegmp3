document.addEventListener('DOMContentLoaded', async () => {
    const songsContainer = document.getElementById('container');
    const playPauseButton = document.getElementById('playPauseButton');
    const shuffleButton = document.getElementById('shuffleButton'); 
    const currentSongDisplay = document.getElementById('currentSongDisplay');
    const nextButton = document.getElementById('nextButton');

    let currentAudioPlayer = null;
    let currentAlbumIndex = -1; 
    let currentSongIndex = -1;
    let currentSongUrl = '';
    let isShuffle = false; 

    const albumMappings = {
    kanojomokanojo: "Kanojo Mo Kanojo (カノジョも彼女)",
    lycorisrecoil: "Lycoris Recoil (リコリス・リコイル)",
    otonarinotenshi: "Angel Next Door (お隣の天使様)",
    akebichan: "Akebi-chan no Sailor-fuku (明日ちゃんのセーラー服)",
    bofuri: "Bofuri",
    gotoubun: "Quintessential Quintuplets (五等分の花嫁)",
    tadakoi: "Tada Never Falls in Love (多田くんは恋をしない)",
    fuukoi: "More than Married (夫婦以上、恋人未満)",
    aquatope: "The Aquatope on White Sand (白い砂のアクアトープ)",
    superstar: "Love Live! Superstar!! (スーパースター!!)",
    oneoff: "One Off",
    apothecary: "The Apothecary Diaries (薬屋のひとりごと)",
    yorukura: "Jellyfish Can't Swim in the Night (夜のクラゲは泳げない)",
    roshidere: "Roshidere (時々ボソッとロシア語でデレる隣のアーリャさん)",
    makeine: "Makeine (負けヒロインが多すぎる)",
    lovelive: "Love Live! Extras (ラブライブ!)"
    };

    // Fetch structured content from the server
    const response = await fetch('/api/songs');
    const folders = await response.json();
    console.log(folders)

    //----------------------------FUNCTIONS----------------------------//

    // Decide what the next song will be
    const playNextSong = () => {
        if (isShuffle) {
            currentSongIndex = Math.floor(Math.random() * (folders[currentAlbumIndex].songs.length - 2));
            currentAlbumIndex = Math.floor(Math.random() * folders.length);
        } else {
            if (currentSongIndex == folders[currentAlbumIndex].songs.length - 2) {  //End of Album
                currentSongIndex = 0;
                if (currentAlbumIndex >= folders.length - 1) {
                    currentAlbumIndex = 0;
                } else currentAlbumIndex += 1;
            } else currentSongIndex += 1;
        }
        playSong();
    };

    // Function to play a song by index from the currently selected folder
    const playSong = () => {
        if (currentSongIndex < 0 || currentSongIndex >= folders[currentAlbumIndex].songs.length) return; // Bounds check for array

        if (currentAudioPlayer) {
            currentAudioPlayer.pause();
        }

        console.log(`trying to play song ${currentSongIndex} from folder ${currentAlbumIndex}`)
        //+1 Because we sliced and each song is shifted down (bc song 0 was just metadata)
        const song = folders[currentAlbumIndex].songs[currentSongIndex + 1]; 
        let albumName = folders[currentAlbumIndex].folder
        currentSongDisplay.innerHTML = `<strong>${albumMappings[albumName]}</strong> - ${song.name}`;
        currentSongUrl = song.url;
        currentAudioPlayer = new Audio(currentSongUrl);
        currentAudioPlayer.play();
        currentAudioPlayer.addEventListener('ended', playNextSong);
    };

    //----------------------------EVENT-LISTENERS----------------------------//

    // Toggle shuffle on and off
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

    //----------------------------RENDER-PAGE----------------------------//

    // Render each folder and its songs as clickable elements
    folders.forEach(({ folder, songs }, folderIndex) => {
        let setupSongIndex = 0;
        console.log(`${folder} has index ${folderIndex}`)
        const folderDiv = document.createElement('div');
        folderDiv.textContent = albumMappings[folder] || folder;
        folderDiv.classList.add('album');

        const songsList = document.createElement('ul'); // Create a <ul> for songs
        songsList.classList.add('songs');
        songsList.style.display = "none"

        //Slice(1) is important. The first element in each songs array is metdata so skip.
        songs.slice(1).forEach(({ name, url }, songIndex) => { 
            console.log(`${name} has index ${songIndex}`)
            const songItem = document.createElement('li');
            songItem.textContent = name;
            songItem.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent the folder click event
                currentAlbumIndex = folderIndex;
                currentSongIndex = songIndex;
                playSong();
            });
            songsList.appendChild(songItem);
        });

        folderDiv.appendChild(songsList); // Append songsDiv within folderDiv
        folderDiv.addEventListener('click', () => {
            if(songsList.style.display === "block") songsList.style.display = "none"
                else songsList.style.display = "block"
        });

        songsContainer.appendChild(folderDiv);
    });

});

