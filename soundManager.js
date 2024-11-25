export let soundManager={
    clips:{},
    context: null,
    gainNode: null,
    loaded: false,
    activeSounds: [],

    init() {
        this.context = new AudioContext();
        this.gainNode = this.context.createGain ? this.context.createGain() : this.context.createGainNode()
        this.gainNode.connect(this.context.destination)
    },
    load(path, callback) {
        if (this.clips[path]) {
            callback(this.clips[path]);
            return;
        }

        let clip = { path: path, buffer: null, loaded: false };
        clip.play = function (volume, loop) {
            soundManager.play(this.path, { looping: loop ? loop : false, volume: volume ? volume : 1 });
        };
        this.clips[path] = clip;

        fetch(path)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch audio: ${response.statusText}`);
                }
                return response.arrayBuffer();
            })
            .then(arrayBuffer => {
                return soundManager.context.decodeAudioData(arrayBuffer);
            })
            .then(buffer => {
                clip.buffer = buffer;
                clip.loaded = true;
                callback(clip);
            });
    },

    loadArray(array) {
        for(let i =0; i < array.length; i++){
            soundManager.load(array[i], function () {
                if (array.length === Object.keys(soundManager.clips).length){
                    for ( let sd in soundManager.clips)
                        if(!soundManager.clips[sd].loaded) return;
                    soundManager.loaded = true;
                }
            });
        }
    },

    play(path, setting) {
        if (!soundManager.loaded) {
            setTimeout(function () {
                soundManager.play(path, setting);
            }, 1000);
            return;
        }

        let looping = false;
        let volume = 1;

        if (setting) {
            if (setting.looping)
                looping = setting.looping;
            if (setting.volume)
                volume = setting.volume;
        }

        let sd = this.clips[path];
        if (sd == null) return false;

        let gainNode = soundManager.context.createGain();
        gainNode.gain.value = volume;
        gainNode.connect(soundManager.context.destination);

        let sound = soundManager.context.createBufferSource();
        sound.buffer = sd.buffer;
        sound.connect(gainNode);
        sound.loop = looping;
        sound.start(0);
        this.activeSounds.push({ sound, gainNode, path });
        return true;
    },

    stop(path) {
        if (!path){

            this.activeSounds.forEach(sound => {console.log(sound.path);this.stop(sound.path);});
        }
        this.activeSounds = this.activeSounds.filter(({ sound, gainNode, path: soundPath }) => {

            if (soundPath === path) {
                sound.stop();
                gainNode.disconnect();
                return false;
            }
            return true;
        });
    },
};