/// <reference path="references.ts" />

class Orbit_camera extends THREE.PerspectiveCamera
{
    public look_at = new THREE.Vector3 ();
    private horizontal = 0;
    private vertical = 0;
    private distance = 5;

    constructor (fov:number, aspect:number)
    {
        super (fov, aspect, 0.1, 1000);
    }

    public rotate (horizontal:number, vertical:number)
    {
        this.vertical += vertical;
        this.vertical = (this.vertical + Math.PI) % (Math.PI * 2) - Math.PI;

        if (Math.abs (this.vertical) < Math.PI / 2)
        {
            horizontal = -horizontal;
        }
        this.horizontal += horizontal;
    }

    public pan (x:number, y:number, z:number)
    {
        var v = new THREE.Vector3 (x, y, z);
        this.look_at.addScaledVector (v, this.distance);
    }

    public zoom_camera (distance:number)
    {
        this.distance += distance;
    }

    public update (dt:number)
    {
        var e = new THREE.Euler (-this.vertical, this.horizontal, 0, 'YXZ');
        var q = new THREE.Quaternion ().setFromEuler (e);

        var pos = this.look_at.clone ().add (new THREE.Vector3 (0, 0, this.distance))
        pos.applyQuaternion (q);

        this.position.copy (pos);
        this.setRotationFromQuaternion (q);
    }
}
