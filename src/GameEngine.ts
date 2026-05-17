import Game from "./Game";
import Stats from "./Stats";
import Dom from "./Dom";
import Render from "./Render";
import { Util } from "./utils/Util";

export default class GameEngine {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    game!: Game;
    private isLoaded: boolean = false;
    private lastTime = 0;
    isRunning: boolean = false;
    
    background: HTMLImageElement;

    sprites: HTMLImageElement;
    fps: number;
    step: number;
    stats: Stats;
    fpsEl: HTMLElement;
    msg: HTMLDivElement;
    value: HTMLSpanElement;
    segments: any[];                      // array of road segments
    width: number;                    // logical canvas width
    height: any;                     // logical canvas height
    resolution: any;                    // scaling factor to provide resolution independence (computed)
    roadWidth: number;                    // actually half the roads width, easier math if the road spans from -roadWidth to +roadWidth
    segmentLength: number;                     // length of a single segment
    rumbleLength  : number;                       // number of segments per red/white rumble strip
    trackLength   : any;                    // z length of entire track (computed)
    lanes         : number;                       // number of lanes
    fieldOfView   : number;                     // angle (degrees) for field of view
    cameraHeight  : number;                    // z height of camera
    cameraDepth   : any;                    // z distance camera is from screen (computed)
    drawDistance  : number;                     // number of segments to draw
    playerX       : number;                       // player x offset from center of road (-1 to 1 to stay independent of roadWidth)
    playerZ       : any;                    // player relative z distance from camera (computed)
    fogDensity    : number;                       // exponential fog density
    position      : number;                       // current camera Z position (add playerZ to get player's absolute Z position)
    speed         : number;                       // current speed
    maxSpeed: number;      // top speed (ensure we can't move more than 1 segment in a single frame to make collision detection easier)
    accel: number;             // acceleration rate - tuned until it 'felt' right
    breaking: number;               // deceleration rate when braking
    decel: number;             // 'natural' deceleration rate when neither accelerating, nor braking
    offRoadDecel: number;             // off road deceleration is somewhere in between
    offRoadLimit: number;             // limit when off road deceleration no longer applies (e.g. you can always go at least this speed even when off road)

    keyLeft: boolean;
    keyRight: boolean;
    keyFaster: boolean;
    keySlower: boolean;

    KEY: any;
    COLORS: any;

    BACKGROUND: any;

    SPRITES: any;

    constructor() {
        this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
        this.ctx.imageSmoothingEnabled = false;
        
        this.fps = 60;                      // how many 'update' frames per second
        this.step = 1 / this.fps;                   // how long is each frame (in seconds)

        this.stats = new Stats();

        this.fpsEl = document.getElementById('fps') as any;
        this.msg = document.createElement('div');
        this.value = document.createElement('span');

        this.segments = [] as any[];                      // array of road segments
        this.width = 1024;                    // logical canvas width
        this.height = 768;                     // logical canvas height
        this.resolution    = null as any;                    // scaling factor to provide resolution independence (computed)
        this.roadWidth     = 2000;                    // actually half the roads width, easier math if the road spans from -roadWidth to +roadWidth
        this.segmentLength = 200;                     // length of a single segment
        this.rumbleLength  = 3;                       // number of segments per red/white rumble strip
        this.trackLength   = null as any;                    // z length of entire track (computed)
        this.lanes         = 3;                       // number of lanes
        this.fieldOfView   = 100;                     // angle (degrees) for field of view
        this.cameraHeight  = 1000;                    // z height of camera
        this.cameraDepth   = null as any;                    // z distance camera is from screen (computed)
        this.drawDistance  = 300;                     // number of segments to draw
        this.playerX       = 0;                       // player x offset from center of road (-1 to 1 to stay independent of roadWidth)
        this.playerZ       = null as any;                    // player relative z distance from camera (computed)
        this.fogDensity    = 5;                       // exponential fog density
        this.position      = 0;                       // current camera Z position (add playerZ to get player's absolute Z position)
        this.speed         = 0;                       // current speed
        this.maxSpeed      = this.segmentLength / this.step;      // top speed (ensure we can't move more than 1 segment in a single frame to make collision detection easier)
        this.accel         =  this.maxSpeed / 5;             // acceleration rate - tuned until it 'felt' right
        this.breaking      = -this.maxSpeed;               // deceleration rate when braking
        this.decel         = -this.maxSpeed / 5;             // 'natural' deceleration rate when neither accelerating, nor braking
        this.offRoadDecel  = -this.maxSpeed / 2;             // off road deceleration is somewhere in between
        this.offRoadLimit  =  this.maxSpeed / 4;             // limit when off road deceleration no longer applies (e.g. you can always go at least this speed even when off road)

        this.keyLeft       = false;
        this.keyRight      = false;
        this.keyFaster     = false;
        this.keySlower     = false;

        this.KEY = {
            LEFT:  37,
            UP:    38,
            RIGHT: 39,
            DOWN:  40,
            A:     65,
            D:     68,
            S:     83,
            W:     87
        };

        this.COLORS = {
            SKY:  '#72D7EE',
            TREE: '#005108',
            FOG:  '#005108',
            LIGHT:  { road: '#6B6B6B', grass: '#10AA10', rumble: '#555555', lane: '#CCCCCC'  },
            DARK:   { road: '#696969', grass: '#009A00', rumble: '#BBBBBB'                   },
            START:  { road: 'white',   grass: 'white',   rumble: 'white'                     },
            FINISH: { road: 'black',   grass: 'black',   rumble: 'black'                     }
        };

        this.BACKGROUND = {
            HILLS: { x:   5, y:   5, w: 1280, h: 480 },
            SKY:   { x:   5, y: 495, w: 1280, h: 480 },
            TREES: { x:   5, y: 985, w: 1280, h: 480 }
        };

        this.SPRITES = {
            PALM_TREE:              { x:    5, y:    5, w:  215, h:  540 },
            BILLBOARD08:            { x:  230, y:    5, w:  385, h:  265 },
            TREE1:                  { x:  625, y:    5, w:  360, h:  360 },
            DEAD_TREE1:             { x:    5, y:  555, w:  135, h:  332 },
            BILLBOARD09:            { x:  150, y:  555, w:  328, h:  282 },
            BOULDER3:               { x:  230, y:  280, w:  320, h:  220 },
            COLUMN:                 { x:  995, y:    5, w:  200, h:  315 },
            BILLBOARD01:            { x:  625, y:  375, w:  300, h:  170 },
            BILLBOARD06:            { x:  488, y:  555, w:  298, h:  190 },
            BILLBOARD05:            { x:    5, y:  897, w:  298, h:  190 },
            BILLBOARD07:            { x:  313, y:  897, w:  298, h:  190 },
            BOULDER2:               { x:  621, y:  897, w:  298, h:  140 },
            TREE2:                  { x: 1205, y:    5, w:  282, h:  295 },
            BILLBOARD04:            { x: 1205, y:  310, w:  268, h:  170 },
            DEAD_TREE2:             { x: 1205, y:  490, w:  150, h:  260 },
            BOULDER1:               { x: 1205, y:  760, w:  168, h:  248 },
            BUSH1:                  { x:    5, y: 1097, w:  240, h:  155 },
            CACTUS:                 { x:  929, y:  897, w:  235, h:  118 },
            BUSH2:                  { x:  255, y: 1097, w:  232, h:  152 },
            BILLBOARD03:            { x:    5, y: 1262, w:  230, h:  220 },
            BILLBOARD02:            { x:  245, y: 1262, w:  215, h:  220 },
            STUMP:                  { x:  995, y:  330, w:  195, h:  140 },
            SEMI:                   { x: 1365, y:  490, w:  122, h:  144 },
            TRUCK:                  { x: 1365, y:  644, w:  100, h:   78 },
            CAR03:                  { x: 1383, y:  760, w:   88, h:   55 },
            CAR02:                  { x: 1383, y:  825, w:   80, h:   59 },
            CAR04:                  { x: 1383, y:  894, w:   80, h:   57 },
            CAR01:                  { x: 1205, y: 1018, w:   80, h:   56 },
            PLAYER_UPHILL_LEFT:     { x: 1383, y:  961, w:   80, h:   45 },
            PLAYER_UPHILL_STRAIGHT: { x: 1295, y: 1018, w:   80, h:   45 },
            PLAYER_UPHILL_RIGHT:    { x: 1385, y: 1018, w:   80, h:   45 },
            PLAYER_LEFT:            { x:  995, y:  480, w:   80, h:   41 },
            PLAYER_STRAIGHT:        { x: 1085, y:  480, w:   80, h:   41 },
            PLAYER_RIGHT:           { x:  995, y:  531, w:   80, h:   41 },
            SCALE: 0,
            BILLBOARDS: [] as any[],
            PLANTS: [] as any[],
            CARS: [] as any[]
        };

        this.SPRITES.SCALE = 0.3 * (1/this.SPRITES.PLAYER_STRAIGHT.w) // the reference sprite width should be 1/3rd the (half-)roadWidth

        this.SPRITES.BILLBOARDS = [this.SPRITES.BILLBOARD01, this.SPRITES.BILLBOARD02, this.SPRITES.BILLBOARD03, this.SPRITES.BILLBOARD04, this.SPRITES.BILLBOARD05, this.SPRITES.BILLBOARD06, this.SPRITES.BILLBOARD07, this.SPRITES.BILLBOARD08, this.SPRITES.BILLBOARD09];
        this.SPRITES.PLANTS = [this.SPRITES.TREE1, this.SPRITES.TREE2, this.SPRITES.DEAD_TREE1, this.SPRITES.DEAD_TREE2, this.SPRITES.PALM_TREE, this.SPRITES.BUSH1, this.SPRITES.BUSH2, this.SPRITES.CACTUS, this.SPRITES.STUMP, this.SPRITES.BOULDER1, this.SPRITES.BOULDER2, this.SPRITES.BOULDER3];
        this.SPRITES.CARS = [this.SPRITES.CAR01, this.SPRITES.CAR02, this.SPRITES.CAR03, this.SPRITES.CAR04, this.SPRITES.SEMI, this.SPRITES.TRUCK];

        
        
        this.background = new Image();
        this.background.src = '/images/background.png';

        this.sprites = new Image();
        this.sprites.src = '/images/sprites.png';
    }

    

    findSegment(z: number) {
        return this.segments[Math.floor(z / this.segmentLength) % this.segments.length];
    }

    resetRoad() {
        this.segments = [];
        for(var n = 0 ; n < 500 ; n++) { // arbitrary road length
            this.segments.push({
                index: n,
                p1: { world: { z: n * this.segmentLength }, camera: {}, screen: {} },
                p2: { world: { z: (n+1) * this.segmentLength }, camera: {}, screen: {} },
                color: Math.floor(n / this.rumbleLength) % 2 ? this.COLORS.DARK : this.COLORS.LIGHT
            });
        }

        this.trackLength = this.segments.length * this.segmentLength;
    }

    reset(options?: any) {
        options       = options || {};
        this.canvas.width  = this.width  = Util.toInt(options.width,          this.width);
        this.canvas.height = this.height = Util.toInt(options.height,         this.height);
        this.lanes                  = Util.toInt(options.lanes,          this.lanes);
        this.roadWidth              = Util.toInt(options.roadWidth,      this.roadWidth);
        this.cameraHeight           = Util.toInt(options.cameraHeight,   this.cameraHeight);
        this.drawDistance           = Util.toInt(options.drawDistance,   this.drawDistance);
        this.fogDensity             = Util.toInt(options.fogDensity,     this.fogDensity);
        this.fieldOfView            = Util.toInt(options.fieldOfView,    this.fieldOfView);
        this.segmentLength          = Util.toInt(options.segmentLength,  this.segmentLength);
        this.rumbleLength           = Util.toInt(options.rumbleLength,   this.rumbleLength);
        this.cameraDepth            = 1 / Math.tan((this.fieldOfView/2) * Math.PI/180);
        this.playerZ                = (this.cameraHeight * this.cameraDepth);
        this.resolution             = this.height/480;
        this.refreshTweakUI();

        if ((this.segments.length==0) || (options.segmentLength) || (options.rumbleLength)) {
            this.resetRoad(); // only rebuild road when necessary
        }
    }

    refreshTweakUI() {
        Dom.get('lanes').selectedIndex = this.lanes - 1;
        Dom.get('currentRoadWidth').innerHTML      = Dom.get('roadWidth').value      = this.roadWidth;
        Dom.get('currentCameraHeight').innerHTML   = Dom.get('cameraHeight').value   = this.cameraHeight;
        Dom.get('currentDrawDistance').innerHTML   = Dom.get('drawDistance').value   = this.drawDistance;
        Dom.get('currentFieldOfView').innerHTML    = Dom.get('fieldOfView').value    = this.fieldOfView;
        Dom.get('currentFogDensity').innerHTML     = Dom.get('fogDensity').value     = this.fogDensity;
    }

    public async start(): Promise<void> {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastTime = performance.now();

        // Display a loading screen or spinner while loading
        this.ctx.fillText('Loading assets...', 10, 10);
       
        try {
            this.fpsEl?.appendChild(this.stats.domElement);
            this.msg.style.cssText = "border: 2px solid gray; padding: 5px; margin-top: 5px; text-align: left; font-size: 1.15em; text-align: right;";
            this.msg.innerHTML = "Your canvas performance is ";
            this.fpsEl?.appendChild(this.msg);

            this.value.innerHTML = "...";
            this.msg.appendChild(this.value);

            setInterval(() => {
                var fps   = this.stats.current();
                var ok    = (fps > 50) ? 'good'  : (fps < 30) ? 'bad' : 'ok';
                var color = (fps > 50) ? 'green' : (fps < 30) ? 'red' : 'gray';
                this.value.innerHTML       = ok;
                this.value.style.color     = color;
                this.msg.style.borderColor = color;
            }, 5000);

            this.resetRoad()
            this.render()
            const keys = [
                    { keys: [this.KEY.LEFT,  this.KEY.A], mode: 'down', action: () => { this.keyLeft   = true;  } },
                    { keys: [this.KEY.RIGHT, this.KEY.D], mode: 'down', action: () => { this.keyRight  = true;  } },
                    { keys: [this.KEY.UP,    this.KEY.W], mode: 'down', action: () => { this.keyFaster = true;  } },
                    { keys: [this.KEY.DOWN,  this.KEY.S], mode: 'down', action: () => { this.keySlower = true;  } },
                    { keys: [this.KEY.LEFT,  this.KEY.A], mode: 'up',   action: () => { this.keyLeft   = false; } },
                    { keys: [this.KEY.RIGHT, this.KEY.D], mode: 'up',   action: () => { this.keyRight  = false; } },
                    { keys: [this.KEY.UP,    this.KEY.W], mode: 'up',   action: () => { this.keyFaster = false; } },
                    { keys: [this.KEY.DOWN,  this.KEY.S], mode: 'up',   action: () => { this.keySlower = false; } }
            ]
            this.game = new Game();
            await this.game.loadAssets(this.background, this.sprites);
            this.game.setKeyListener(keys);
            this.reset();

            //=========================================================================
            // TWEAK UI HANDLERS
            //=========================================================================

            Dom.on('resolution', 'change', (ev:  any) => {
                var w, h, ratio;
                switch(ev.target.options[ev.target.selectedIndex].value) {
                    case 'fine':   w = 1280; h = 960;  ratio=w/this.width; break;
                    case 'high':   w = 1024; h = 768;  ratio=w/this.width; break;
                    case 'medium': w = 640;  h = 480;  ratio=w/this.width; break;
                    case 'low':    w = 480;  h = 360;  ratio=w/this.width; break;
                }
                this.reset({ width: w, height: h })
                Dom.blur(ev);
            });

            Dom.on('lanes',          'change', (ev: any) => { Dom.blur(ev); this.reset({ lanes:         ev.target.options[ev.target.selectedIndex].value }); });
            Dom.on('roadWidth',      'change', (ev: any) => { Dom.blur(ev); this.reset({ roadWidth:     Util.limit(Util.toInt(ev.target.value), Util.toInt(ev.target.getAttribute('min')), Util.toInt(ev.target.getAttribute('max'))) }); });
            Dom.on('cameraHeight',   'change', (ev: any) => { Dom.blur(ev); this.reset({ cameraHeight:  Util.limit(Util.toInt(ev.target.value), Util.toInt(ev.target.getAttribute('min')), Util.toInt(ev.target.getAttribute('max'))) }); });
            Dom.on('drawDistance',   'change', (ev: any) => { Dom.blur(ev); this.reset({ drawDistance:  Util.limit(Util.toInt(ev.target.value), Util.toInt(ev.target.getAttribute('min')), Util.toInt(ev.target.getAttribute('max'))) }); });
            Dom.on('fieldOfView',    'change', (ev: any) => { Dom.blur(ev); this.reset({ fieldOfView:   Util.limit(Util.toInt(ev.target.value), Util.toInt(ev.target.getAttribute('min')), Util.toInt(ev.target.getAttribute('max'))) }); });
            Dom.on('fogDensity',     'change', (ev: any) => { Dom.blur(ev); this.reset({ fogDensity:    Util.limit(Util.toInt(ev.target.value), Util.toInt(ev.target.getAttribute('min')), Util.toInt(ev.target.getAttribute('max'))) }); });
            this.isLoaded = true;

            
            requestAnimationFrame(this.gameLoop);
            
        } catch (error) {
            console.error("Game failed to start due to asset loading error:", error);
        }
    }

    /**
     * Stops the game loop
     */
    public stop(): void {
        this.isRunning = false;
    }

    private gameLoop = async (currentTime: number): Promise<void> => {
        if (!this.isRunning) return;

        const deltaTime = (currentTime - this.lastTime) / 1000; // seconds
        this.lastTime = currentTime;
        await this.update(deltaTime);
        await this.render();
        requestAnimationFrame(this.gameLoop);
    }

    private async update(deltaTime: number): Promise<void> {
        this.position = Util.increase(this.position, deltaTime * this.speed, this.trackLength);

        var dx = deltaTime * 2 * (this.speed/this.maxSpeed); // at top speed, should be able to cross from left to right (-1 to 1) in 1 second

        if (this.keyLeft)
            this.playerX = this.playerX - dx;
        else if (this.keyRight)
            this.playerX = this.playerX + dx;

        if (this.keyFaster)
            this.speed = Util.accelerate(this.speed, this.accel, deltaTime);
        else if (this.keySlower)
            this.speed = Util.accelerate(this.speed, this.breaking, deltaTime);
        else
            this.speed = Util.accelerate(this.speed, this.decel, deltaTime);

        if (((this.playerX < -1) || (this.playerX > 1)) && (this.speed > this.offRoadLimit))
            this.speed = Util.accelerate(this.speed, this.offRoadDecel, deltaTime);

        this.playerX = Util.limit(this.playerX, -2, 2);     // dont ever let player go too far out of bounds
        this.speed   = Util.limit(this.speed, 0, this.maxSpeed); // or exceed maxSpeed
    }

    private async render(): Promise<void> {
        // Clear canvas
        var baseSegment = this.findSegment(this.position);
        var maxy        = this.height;

        this.ctx.clearRect(0, 0, this.width, this.height);

        Render.background(this.ctx, this.background, this.width, this.height, this.BACKGROUND.SKY);
        Render.background(this.ctx, this.background, this.width, this.height, this.BACKGROUND.HILLS);
        Render.background(this.ctx, this.background, this.width, this.height, this.BACKGROUND.TREES);

        var n, segment;

        for (n = 0 ; n < this.drawDistance ; n++) {
            segment        = this.segments[(baseSegment.index + n) % this.segments.length];
            segment.looped = segment.index < baseSegment.index;
            segment.fog    = Util.exponentialFog(n / this.drawDistance, this.fogDensity);

            Util.project(segment.p1, (this.playerX * this.roadWidth), this.cameraHeight, this.position - (segment.looped ? this.trackLength : 0), this.cameraDepth, this.width, this.height, this.roadWidth);
            Util.project(segment.p2, (this.playerX * this.roadWidth), this.cameraHeight, this.position - (segment.looped ? this.trackLength : 0), this.cameraDepth, this.width, this.height, this.roadWidth);

            if ((segment.p1.camera.z <= this.cameraDepth) || // behind us
                (segment.p2.screen.y >= maxy))          // clip by (already rendered) segment
                continue;

            Render.segment(
                this.ctx, 
                this.width, 
                this.lanes,
                segment.p1.screen.x,
                segment.p1.screen.y,
                segment.p1.screen.w,
                segment.p2.screen.x,
                segment.p2.screen.y,
                segment.p2.screen.w,
                segment.fog,
                segment.color
            );

            maxy = segment.p2.screen.y;
        }

        Render.player(
            this.ctx, 
            this.width, 
            this.height, 
            this.resolution, 
            this.roadWidth, 
            this.sprites, 
            this.speed/this.maxSpeed,
            this.cameraDepth/this.playerZ,
            this.width/2,
            this.height,
            this.speed * (this.keyLeft ? -1 : this.keyRight ? 1 : 0),
            0
        );
            
    }
}