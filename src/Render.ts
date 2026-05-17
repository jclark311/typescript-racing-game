import { SPRITES, COLORS } from "./utils/constants";
import  { Util } from "./utils/Util";

export default class Render {
    //=========================================================================
    // canvas rendering helpers
    //=========================================================================

    static polygon(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, color: string) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x4, y4);
        ctx.closePath();
        ctx.fill();
    }

    //---------------------------------------------------------------------------

    static segment(ctx: CanvasRenderingContext2D, width: number, lanes: number, x1: number, y1: number, w1: number, x2: number, y2: number, w2: number, fog: any, color: any) {
        var r1 = this.rumbleWidth(w1, lanes),
            r2 = this.rumbleWidth(w2, lanes),
            l1 = this.laneMarkerWidth(w1, lanes),
            l2 = this.laneMarkerWidth(w2, lanes),
            lanew1, lanew2, lanex1, lanex2, lane;
        
        ctx.fillStyle = color.grass;
        ctx.fillRect(0, y2, width, y1 - y2);
        
        this.polygon(ctx, x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, color.rumble);
        this.polygon(ctx, x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, color.rumble);
        this.polygon(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, color.road);
        
        if (color.lane) {
            lanew1 = w1 * 2 / lanes;
            lanew2 = w2 * 2 / lanes;
            lanex1 = x1 - w1 + lanew1;
            lanex2 = x2 - w2 + lanew2;
            for (lane = 1; lane < lanes; lanex1 += lanew1, lanex2 += lanew2, lane++) {
                this.polygon(ctx, lanex1 - l1 / 2, y1, lanex1 + l1 / 2, y1, lanex2 + l2 / 2, y2, lanex2 - l2 / 2, y2, color.lane);
            }
        }
        
        this.fog(ctx, 0, y1, width, y2-y1, fog);
    }

    //---------------------------------------------------------------------------
    static background(ctx: CanvasRenderingContext2D, background: any, width: number, height: number, layer: any, rotation?: number, offset?: number) {
        rotation = rotation || 0;
        offset   = offset   || 0;

        var imageW = layer.w / 2;
        var imageH = layer.h;

        var sourceX = layer.x + Math.floor(layer.w * rotation);
        var sourceY = layer.y
        var sourceW = Math.min(imageW, layer.x + layer.w - sourceX);
        var sourceH = imageH;
        
        var destX = 0;
        var destY = offset;
        var destW = Math.floor(width * (sourceW / imageW));
        var destH = height;

        ctx.drawImage(background, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH);
        if (sourceW < imageW) {
            ctx.drawImage(background, layer.x, sourceY, imageW-sourceW, sourceH, destW - 1, destY, width - destW, destH);
        }
    }

    //---------------------------------------------------------------------------
    static sprite(ctx: CanvasRenderingContext2D, width: number, height: number, resolution: number, roadWidth: number, sprites: HTMLImageElement, sprite: any, scale: number, destX: number, destY: number, offsetX: number, offsetY: number, clipY?: number) {
        //  scale for projection AND relative to roadWidth (for tweakUI)
        var destW  = (sprite.w * scale * width / 2) * (SPRITES.SCALE * roadWidth);
        var destH  = (sprite.h * scale * width / 2) * (SPRITES.SCALE * roadWidth);

        destX = destX + (destW * (offsetX || 0));
        destY = destY + (destH * (offsetY || 0));

        var clipH = clipY ? Math.max(0, destY + destH - clipY) : 0;
        if (clipH < destH) {
            ctx.drawImage(sprites, sprite.x, sprite.y, sprite.w, sprite.h - (sprite.h * clipH / destH), destX, destY, destW, destH - clipH);
        }
    }

    //---------------------------------------------------------------------------
    static player(ctx: CanvasRenderingContext2D, width: number, height: number, resolution: number, roadWidth: number, sprites: HTMLImageElement, speedPercent: number, scale: number, destX: number, destY: number, steer: number, updown: number) {
        var bounce = (1.5 * Math.random() * speedPercent * resolution) * Util.randomChoice([-1, 1]);
        var sprite;
        if (steer < 0) {
            sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_LEFT : SPRITES.PLAYER_LEFT;
        } else if (steer > 0) {
            sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_RIGHT : SPRITES.PLAYER_RIGHT;
        } else {
            sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_STRAIGHT : SPRITES.PLAYER_STRAIGHT;
        }
        this.sprite(ctx, width, height, resolution, roadWidth, sprites, sprite, scale, destX, destY + bounce, -0.5, -1);
    }

    //---------------------------------------------------------------------------
    static fog(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, fog: number) {
        if (fog < 1) {
            ctx.globalAlpha = (1 - fog)
            ctx.fillStyle = COLORS.FOG;
            ctx.fillRect(x, y, width, height);
            ctx.globalAlpha = 1;
        }
    }

    static rumbleWidth(projectedRoadWidth: number, lanes: number) { 
        return projectedRoadWidth / Math.max(6, 2 * lanes); 
    }

    static laneMarkerWidth(projectedRoadWidth: number, lanes: number) { 
        return projectedRoadWidth / Math.max(32, 8 * lanes); 
    }
}