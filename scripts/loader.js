// This is the initial file that runs. It is used to load everything for Scythe

// Register all commands
import "./commands/moderation/kick.js";
import "./commands/other/help.js";
import "./commands/moderation/notify.js";
import "./commands/moderation/op.js";
import "./commands/moderation/ban.js";
import "./commands/moderation/mute.js";
import "./commands/moderation/unmute.js";
import "./commands/other/credits.js";
import "./commands/settings/antigma.js";
import "./commands/settings/antigmc.js";
import "./commands/settings/antigms.js";
import "./commands/settings/modules.js";
import "./commands/settings/npc.js";
import "./commands/settings/invalidsprint.js";
import "./commands/settings/overridecommandblocksenabled.js";
import "./commands/settings/removecommandblocks.js";
import "./commands/settings/worldborder.js";
import "./commands/settings/autoban.js";
import "./commands/utility/tag.js";
import "./commands/utility/ecwipe.js";
import "./commands/utility/freeze.js";
import "./commands/moderation/stats.js";
import "./commands/utility/fullreport.js";
import "./commands/utility/vanish.js";
import "./commands/utility/fly.js";
import "./commands/utility/invsee.js";
import "./commands/utility/cloneinv.js";
import "./commands/other/report.js";
import "./commands/moderation/unban.js";
import "./commands/utility/ui.js";
import "./commands/moderation/resetwarns.js";
import "./commands/other/version.js";
import "./commands/moderation/deop.js";
import "./commands/moderation/globalmute.js";
import "./commands/utility/gma.js";
import "./commands/utility/gmc.js";
import "./commands/utility/gms.js";
import "./commands/utility/gmsp.js";

// Run anticheat core
import "./main.js";