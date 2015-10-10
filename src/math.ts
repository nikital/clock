function sign (n:number):number
{
    return n >= 0 ? 1 : -1;
}

function floor_to (n:number, to:number):number
{
    return Math.floor (n / to) * to;
}
