export const Util = {
    timestamp() {
        return new Date().getTime();
    },
    toInt(obj: any, def?: any): number {
        if (obj !== null) {
            var x = parseInt(obj, 10);
            if (!isNaN(x)) return x;
        }
        return Util.toInt(def, 0);
    },
    toFloat(obj: any, def: any): number {
        if (obj !== null) {
            var x = parseFloat(obj);
            if (!isNaN(x)) return x;
        }
        return Util.toFloat(def, 0.0);
    },
    limit(value: number, min: number, max: number) {
        return Math.max(min, Math.min(value, max));
    },
    randomInt(min: number, max: number) {
        return Math.round(Util.interpolate(min, max, Math.random()));
    },
    randomChoice(options: any[]) { 
        return options[Util.randomInt(0, options.length-1)];
    },
    percentRemaining(n: number, total: number) {
        return (n%total)/total;
    },
    accelerate(v: number, accel: number, dt: number) { 
        return v + (accel * dt);
    },
    interpolate(a: number, b: number, percent: number) { 
        return a + (b-a) * percent;
    },
    easeIn(a: number, b: number, percent: number) {
        return a + (b-a)*Math.pow(percent,2);
    },
    easeOut(a: number, b: number, percent: number) {
        return a + (b-a)*(1-Math.pow(1-percent,2));
    },
    easeInOut(a: number, b: number, percent: number) {
        return a + (b-a)*((-Math.cos(percent*Math.PI)/2) + 0.5);
    },
    exponentialFog(distance: number, density: number) {
        return 1 / (Math.pow(Math.E, (distance * distance * density)));
    },

    increase(start: number, increment: number, max: number) {
        // with looping
        var result = start + increment;
        while (result >= max)
            result -= max;
        while (result < 0)
            result += max;
        return result;
    },

    project(p: any, cameraX: number, cameraY: number, cameraZ: number, cameraDepth: number, width: number, height: number, roadWidth: number) {
        p.camera.x     = (p.world.x || 0) - cameraX;
        p.camera.y     = (p.world.y || 0) - cameraY;
        p.camera.z     = (p.world.z || 0) - cameraZ;
        p.screen.scale = cameraDepth/p.camera.z;
        p.screen.x     = Math.round((width/2)  + (p.screen.scale * p.camera.x  * width/2));
        p.screen.y     = Math.round((height/2) - (p.screen.scale * p.camera.y  * height/2));
        p.screen.w     = Math.round(             (p.screen.scale * roadWidth   * width/2));
    },

    overlap(x1: number, w1: number, x2: number, w2: number, percent: number) {
        var half = (percent || 1)/2;
        var min1 = x1 - (w1*half);
        var max1 = x1 + (w1*half);
        var min2 = x2 - (w2*half);
        var max2 = x2 + (w2*half);
        return ! ((max1 < min2) || (min1 > max2));
    }
}