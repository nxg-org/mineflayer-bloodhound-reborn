import { Bot } from "mineflayer";
import utilPlugin from "@nxg-org/mineflayer-util-plugin"
import customPVP from "@nxg-org/mineflayer-custom-pvp"
import { BloodHound } from "./bloodhound";
import type {Entity} from "prismarine-entity"
import type { Item } from "prismarine-item";
import { AttackingEntity, DamagedEntity } from "./types";

declare module "mineflayer" {
    interface Bot {
        autoCrystal: BloodHound
    }
    interface BotEvents {
        bloodhoundEntityDamaged: (hurt: Entity, info: DamagedEntity) => void;
        bloodhoundEntityAttacks: (attacker: Entity, info: AttackingEntity) => void;
        correlatedAttack: (hurt: Entity, attacker: Entity, weapon: Item | null) => void;
    }
}

export default function inject(bot: Bot) {
    if (!bot.hasPlugin(utilPlugin)) bot.loadPlugin(utilPlugin)
    if (!bot.hasPlugin(customPVP)) bot.loadPlugin(customPVP)
    bot.autoCrystal = new BloodHound(bot);
}

