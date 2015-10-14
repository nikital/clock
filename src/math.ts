function sign (n:number):number
{
    return n >= 0 ? 1 : -1;
}

function floor_to (n:number, to:number):number
{
    return Math.floor (n / to) * to;
}

function mod (n:number, mod:number):number
{
    return (n % mod + mod) % mod;
}

function lerp_angle (target:number, value:number, t:number):number
{
    if (Math.abs (value - target) > Math.PI)
    {
        if (value > target)
            value -= Math.PI * 2;
        else
            value += Math.PI * 2;
    }
    value += (target - value) * t;
    return value;
}
