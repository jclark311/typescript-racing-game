export default class Dom {
    static storage = window.localStorage || {};

    static get(id: any): any {
        return (id instanceof HTMLElement || id instanceof HTMLDocument) ? id : document.getElementById(id);
    }

    static set(id: string, html: string) {
        const el = this.get(id);
        if (el && el instanceof HTMLElement) {
            el.innerHTML = html;
        }
    }

    static on(ele: any, type: string, fn: Function, capture?: boolean) {
        if (ele) {
            const el = this.get(ele);
            if (el) {
                el.addEventListener(type, fn as EventListener, capture);
            }
        }
    }

    static un(ele: string, type: string, fn: Function, capture?: boolean) {
        const el = this.get(ele);
        if (el) {
            el.removeEventListener(type, fn as EventListener, capture);
        }
    }

    static show(ele: string, type?: string) {
        const el = this.get(ele);
        if (el && el instanceof HTMLElement) {
            el.style.display = type || 'block';
        }
    }

    static blur(ev: Event) {
        (ev.target as HTMLElement).blur();
    }

    static addClassName(ele: string, name: string) {
        const el = this.get(ele);
        if (el && el instanceof HTMLElement) {
            el.classList.add(name);
        }
    }

    static removeClassName(ele: string, name: string) {
        const el = this.get(ele);
        if (el && el instanceof HTMLElement) {
            el.classList.remove(name);
        }
    }

    static toggleClassName(ele: string, name: string, on?: boolean) {
        const el = this.get(ele);
        var classes = el.className.split(' ');
        var n = classes.indexOf(name);
        on = (typeof on == 'undefined') ? (n < 0) : on;
        if (on && (n < 0))
            classes.push(name);
        else if (!on && (n >= 0))
            classes.splice(n, 1);
        el.className = classes.join(' ');
    }

}