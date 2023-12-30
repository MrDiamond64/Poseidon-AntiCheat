import { findPlayerByName, tellAllStaff } from "../../util.js";
import { registerCommand } from "../handler.js";

registerCommand({
	name: "freeze",
	description: "Toggle a player's ability to move",
	usage: "<player>",
	minArgCount: 1,
	category: "utility",
	execute: (message, args) => {
		const player = message.sender;

		// Find the player requested
		const member = findPlayerByName(args[0]);

		if(!member) return player.sendMessage("§r§6[§aScythe§6]§r Couldn't find that player.");

		member.hasTag("freeze") ? unfreezePlayer(member, player) : freezePlayer(member, player);
	}
});

export function freezePlayer(player, initator) {
	player.addEffect("weakness", 99999, {
		amplifier: 255,
		showParticles: false
	});
	player.triggerEvent("scythe:freeze");
	player.addTag("freeze");
	player.runCommandAsync("inputpermission set @s movement disabled");

	player.sendMessage("§r§6[§aScythe§6]§r You have been frozen by a staff member.");
	tellAllStaff(`§r§6[§aScythe§6]§r ${initator.name} has frozen ${player.name}.`);
}

export function unfreezePlayer(player, initator) {
	player.removeEffect("weakness");
	player.triggerEvent("scythe:unfreeze");
	player.removeTag("freeze");
	player.runCommandAsync("inputpermission set @s movement enabled");

	player.sendMessage("§r§6[§aScythe§6]§r You are no longer frozen.");
	tellAllStaff(`§r§6[§aScythe§6]§r ${initator.name} has unfrozen ${player.name}.`);
}