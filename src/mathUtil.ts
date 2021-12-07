import type { Vec3 } from "vec3";

export function entityToEntityYaw(origin: Vec3, destination: Vec3) {
    const xDistance = destination.x - origin.x;
    const zDistance = destination.z - origin.z;
    return Math.atan2(xDistance, zDistance) + Math.PI;
}

export function getTickTimeDelta(first: number, second: number) {
    return Math.abs(secondsToTicks(first) - secondsToTicks(second));
}

export function secondsToTicks(seconds: number) {
    return Math.floor((seconds / 50))
}