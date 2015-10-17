/// <reference path="references.ts" />

class Orbit_camera extends THREE.PerspectiveCamera
{
    private look_at = new THREE.Vector3 ();
    public horizontal = 0;
    public vertical = 0;
    private distance = 5;

    private current_look_at = new THREE.Vector3 ();
    private current_horizontal = 0;
    private current_vertical = 0;
    private current_distance = 5;

    private restrict:THREE.Box3;

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
        this.vertical = mod (this.vertical + Math.PI, Math.PI * 2) - Math.PI;

        if (Math.abs (this.vertical) < Math.PI / 2)
        {
            horizontal = -horizontal;
        }
        this.horizontal += horizontal;
        this.horizontal = mod (this.horizontal + Math.PI, Math.PI * 2) - Math.PI;
    }

    public pan (x:number, y:number)
    {
        var q = orbit_angles_to_quat (this.horizontal, this.vertical);
        var v = new THREE.Vector3 (x, y, 0);
        v.applyQuaternion (q);

        this.look_at.addScaledVector (v, this.distance);
        this.update_restrict ();
    }

    public zoom_camera (distance:number)
    {
        this.distance += distance;
        this.distance = Math.max (1, this.distance);
    }

    public set_look_at (v:THREE.Vector3)
    {
        this.look_at.copy (v);
    }

    public set_zoom (distance:number)
    {
        this.distance = distance;
    }

    public update (dt:number)
    {
        this.update_restrict ();
        var easing = 12;
        this.current_horizontal = lerp_angle (this.horizontal, this.current_horizontal, easing * dt);
        this.current_vertical = lerp_angle (this.vertical, this.current_vertical, easing * dt);
        this.current_distance += (this.distance - this.current_distance) * easing * dt;
        this.current_look_at.lerp (this.look_at, easing * dt);

        var q = orbit_angles_to_quat (this.current_horizontal, this.current_vertical);
        // This code is awesome, approximates camera:
        // var pos = this.look_at.clone ().add (new THREE.Vector3 (0, 0, this.distance));
        var pos = new THREE.Vector3 (0, 0, this.current_distance);
        pos.applyQuaternion (q);
        pos.add (this.current_look_at);

        this.position.copy (pos);
        this.setRotationFromQuaternion (q);
    }

    update_restrict ()
    {
        if (!this.restrict)
        {
            return;
        }

        var q = orbit_angles_to_quat (this.horizontal, this.vertical);

        var restrict_z_factor = new THREE.Vector3 (1, 0, 0)
        restrict_z_factor.applyQuaternion (q);
        var restrict = this.restrict.clone ();
        restrict.min.z *= Math.abs (restrict_z_factor.z);
        restrict.max.z *= Math.abs (restrict_z_factor.z);
        this.look_at.clamp (restrict.min, restrict.max);
    }
}

function orbit_angles_to_quat (horizontal:number, vertical:number):THREE.Quaternion
{
    var e = new THREE.Euler (-vertical, horizontal, 0, 'YXZ');
    var q = new THREE.Quaternion ().setFromEuler (e);
    return q;
}
