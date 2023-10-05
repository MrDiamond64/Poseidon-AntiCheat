import { registerCommand } from "../handler.js";
import config from "../../data/config.js";

const enabled = "§8[§aENABLED§8]";
const disabled = "§8[§4DISABLED§8]";

registerCommand({
	name: "modules",
	execute: (message) => {
		let msg = "";

		for(const module of Object.keys(config.modules)) {
			msg += `§r§6[§aScythe§6]§r ${module} ${config.modules[module].enabled ? enabled : disabled}\n`;
		}

		for(const misc_module of Object.keys(config.misc_modules)) {
			msg += `§r§6[§aScythe§6]§r ${misc_module} ${config.misc_modules[misc_module].enabled ? enabled : disabled}\n`;
		}

		message.sender.sendMessage(msg);
	}
});