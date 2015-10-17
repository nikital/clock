/// <reference path="references.ts" />

class Slider
{
    private value:number;
    private inner:HTMLElement;
    private dragging = false;
    private old_cursor:string;

    constructor (private outer:HTMLElement,
                 private min:number, private max:number,
                 private on_change:(n:number)=>void)
    {
        this.inner = <HTMLElement>outer.getElementsByClassName ("slider-inner")[0];

        outer.addEventListener ("mousedown", this.on_down.bind (this));
        outer.addEventListener ("mousemove", this.on_move.bind (this));
        outer.addEventListener ("mouseup", this.on_up.bind (this));
    }

    public set_value (value:number)
    {
        this.value = Math.max (this.min, Math.min (this.max, value));
        var percent = (this.value - this.min) / (this.max - this.min);
        this.inner.style.width = (percent * 100) + '%';
    }

    on_down (e:MouseEvent)
    {
        if (!(e.buttons & 1))
        {
            return;
        }
        this.outer.setCapture ();
        this.dragging = true;
        this.on_move (e);
    }

    on_move (e:MouseEvent)
    {
        if (!(e.buttons & 1))
        {
            return;
        }
        var percent = (e.pageX - this.outer.offsetLeft) / this.outer.offsetWidth;
        this.set_value (percent * (this.max - this.min) + this.min);
        this.on_change (this.value);
    }

    on_up (e:MouseEvent)
    {
        if (!(e.buttons & 1))
        {
            return;
        }
        this.outer.releaseCapture ();
        this.on_move (e);
        this.dragging = false;
    }
}
