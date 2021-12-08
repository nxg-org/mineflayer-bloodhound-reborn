import { createBot } from "mineflayer";
import bloodHound from "./index"
import { promisify } from "util";
import { WeaponType } from "./types";
const sleep = promisify(setTimeout)


const bot = createBot( {
    username: "bh-testing",
    host: process.argv[2] ?? "localhost",
    port: Number(process.argv[3]) ?? 25565
})



bot.loadPlugin(bloodHound)

bot.once("spawn", () => {
    console.log("fuck")
})

bot.on("bloodhoundEvent", (time, event) => {
    console.log(time, event.hurt.damageCaused, event.hurt.entity.name, event.attacker.entity.name, event.attacker.weaponInfo.name, WeaponType[event.attacker.weaponType])
})

