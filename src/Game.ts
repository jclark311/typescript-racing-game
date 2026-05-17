import Dom from './Dom';
import Stats from './Stats';
import GameEngine from "./GameEngine";
import SpritePool from './SpritePool';
import { Util } from './utils/Util';

export default class Game {
    async loadAssets(background: HTMLImageElement, sprites: HTMLImageElement) {
         await Promise.all([
            new Promise((resolve) => Dom.on(background, 'load', resolve)),
            new Promise((resolve) => Dom.on(sprites, 'load', resolve))
        ]);
    }

    setKeyListener(keys: any) {
        const onKey = (keyCode: number, mode: any) => {
            var n, k;
            for(n = 0 ; n < keys.length ; n++) {
                k = keys[n];
                k.mode = k.mode || 'up';
                if ((k.key == keyCode) || (k.keys && (k.keys.indexOf(keyCode) >= 0))) {
                    if (k.mode == mode) {
                        k.action.call();
                    }
                }
            }
        }

        Dom.on(document, 'keydown', (ev: KeyboardEvent) => { onKey(ev.keyCode, 'down'); console.log("key: ", ev.keyCode) });
        Dom.on(document, 'keyup',   (ev: KeyboardEvent) => { onKey(ev.keyCode, 'up');   });
    }

    stats(parentId: any, id?: any) {
        var result = new Stats();
        result.domElement.id = id || 'stats';
        Dom.get(parentId)!.appendChild(result.domElement);

        var msg = document.createElement('div');
        msg.style.cssText = "border: 2px solid gray; padding: 5px; margin-top: 5px; text-align: left; font-size: 1.15em; text-align: right;";
        msg.innerHTML = "Your canvas performance is ";
        Dom.get(parentId)!.appendChild(msg);

        var value = document.createElement('span');
        value.innerHTML = "...";
        msg.appendChild(value);

        setInterval(() => {
            var fps   = result.current();
            var ok    = (fps > 50) ? 'good'  : (fps < 30) ? 'bad' : 'ok';
            var color = (fps > 50) ? 'green' : (fps < 30) ? 'red' : 'gray';
            value.innerHTML       = ok;
            value.style.color     = color;
            msg.style.borderColor = color;
        }, 5000);
        return result;
    }

    playMusic() {
        const music = new Audio('/music/racer.mp3');
        music.loop = true;
        music.volume = 0.05; // shhhh! annoying music!
        music.muted = true;
        Dom.toggleClassName('mute', 'on', music.muted);
        Dom.on('mute', 'click', () => {
            Dom.storage.muted = music.muted = !music.muted;
            Dom.toggleClassName('mute', 'on', music.muted);
        });

        // Play on the first click anywhere
        document.addEventListener('click', () => {
            music.play();
        }, { once: true });
    }
}