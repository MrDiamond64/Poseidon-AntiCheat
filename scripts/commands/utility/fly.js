/* eslint no-var: "off"*/
/* eslint no-redeclare: "off"*/
import * as Minecraft from "mojang-minecraft";

const World = Minecraft.world;
const Commands = Minecraft.Commands;

/**
 * @name fly
 * @param {object} message - Message object
 * @param {array} args - (Optional) Additional arguments provided.
 */
export function fly(message, args) {
    // validate that required params are defined
    if (!message) return console.warn(`${new Date()} | ` + "Error: ${message} isnt defined. Did you forget to pass it? (./commands/utility/fly.js:10)");

    message.cancel = true;

    let player = message.sender;

    // make sure the user has permissions to run the command
    try {
        Commands.run(`testfor @a[name="${player.nameTag}",tag=op]`, World.getDimension("overworld"));
    } catch (error) {
        return Commands.run(`tellraw "${player.nameTag}" {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"text":"You need to be Scythe-Opped to use this command."}]}`, World.getDimension("overworld"));
    }
    
    // try to find the player requested
    if(args.length) for (let pl of World.getPlayers()) if (pl.nameTag.toLowerCase().includes(args[0].toLowerCase().replace("@", "").replace("\"", ""))) var member = pl.nameTag; 
    
    if (!member) var member = player.nameTag;

    Commands.run(`execute "${member}" ~~~ function tools/fly`, World.getDimension("overworld"));
    
    // I find try/catch to be completely unorthodox for this lol
    try {
        Commands.run(`testfor @a[name="${player.nameTag}",tag=flying]`, World.getDimension("overworld"));
        if (player.nameTag === member) {
            return Commands.run(`tellraw @a[tag=op] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"text":"${player.nameTag} has enabled fly mode for themselves."}]}`, World.getDimension("overworld"));
        } else if (player.nameTag != member) {
            return Commands.run(`tellraw @a[tag=op] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"text":"${player.nameTag} has enabled fly mode for ${member}."}]}`, World.getDimension("overworld"));
        } else {
            return;
        }
    } catch {
        if (player.nameTag === member) {
            return Commands.run(`tellraw @a[tag=op] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"text":"${player.nameTag} has disabled fly mode for themselves."}]}`, World.getDimension("overworld"));
        } else if (player.nameTag != member) {
            return Commands.run(`tellraw @a[tag=op] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"text":"${player.nameTag} has disabled fly mode for ${member}."}]}`, World.getDimension("overworld"));
        } else {
            return;
        }
    }
}
