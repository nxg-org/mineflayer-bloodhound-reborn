import { createBot } from "mineflayer";
import bloodHound from "./index"
import { promisify } from "util";
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


