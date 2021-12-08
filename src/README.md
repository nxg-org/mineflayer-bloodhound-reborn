# Bloodhound Reborn

This plugin detects whenever purposeful damage is dealt between two entities.
Right now, it is somewhat based off the original mineflayer-bloodhound plugin.
However, I believe I will rewrite the logic entirely due to having better support of detecting attacks.


### TODO:
1. Fix ranged attacks. I don't check whether or not the shot hits at all. This is bad.
2. Ditch the awkward check system, instead directly infer causation due to knowing which entity is hit ahead of time (melee).
   1. Done via predicting hit/shot, then awaiting damage from that entity. If ticks elapsed exceeds arrow travel/max ping allowance, entity was not hit.
   2. Otherwise, entity is hit. 
3. Expose more methods. 