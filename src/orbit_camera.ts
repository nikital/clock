/// <reference path="references.ts" />

class Orbit_camera extends THREE.PerspectiveCamera
{
    private look_at = new THREE.Vector3 ();
    private horizontal = 0;
    private vertical = 0;
    private distance = 5;

    private restrict:THREE.Box3;
    private pan_to_rotation_ratio:number = 1;

    constructor (fov:number, aspect:number)
    {
        super (fov, aspect, 0.1, 1000);
    }

    public restrict_look_at (b:THREE.Box3)
    {
        this.restrict = b;
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
        this.horizontal = (this.horizontal + Math.PI) % (Math.PI * 2) - Math.PI;
    }

    public pan (x:number, y:number)
    {
        var q = orbit_angles_to_quat (this.horizontal, this.vertical);
        var v = new THREE.Vector3 (x, y, 0);
        v.applyQuaternion (q);

        this.look_at.addScaledVector (v, this.distance);
    }

    public zoom_camera (distance:number)
    {
        this.distance += distance;
    }

    public update (dt:number)
    {
        var q = orbit_angles_to_quat (this.horizontal, this.vertical);
        // This code is awesome, approximates camera:
        // var pos = this.look_at.clone ().add (new THREE.Vector3 (0, 0, this.distance));
        var pos = new THREE.Vector3 (0, 0, this.distance);
        pos.applyQuaternion (q);
        pos.add (this.look_at);

        this.position.copy (pos);
        this.setRotationFromQuaternion (q);
    }
}

function orbit_angles_to_quat (horizontal:number, vertical:number):THREE.Quaternion
{
    var e = new THREE.Euler (-vertical, horizontal, 0, 'YXZ');
    var q = new THREE.Quaternion ().setFromEuler (e);
    return q;
}
