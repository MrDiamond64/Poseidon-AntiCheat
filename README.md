# Scythe-AntiCheat
Scythe AntiCheat - an AntiCheat designed for Minecraft Bedrock realms/worlds/servers.


# How To Use?
To install this anticheat to your realm/world you need to install the .mcpack and apply it to your world and it should be fully up and running

To recieve anti-cheat alerts use this command: ```/function notify```

# List of checks detected by Scythe AntiCheat

   AutoClicker -><br />
      (A) = Checks how much left clicks the player sends
      
   BadPackets -><br />
      (1) = Checks if the players yaw/pitch is greater than normal
   
   
   Command Block Exploit -><br />
      (A) = Clears animal buckets/beehives<br />
      (B) = Replaces beehives with air<br />
      (C) = Kill all command block minecarts<br />
      (D) = Kills all NPC's (to disable edit the cbe check)<br />
      (E) = Instant despawn time for command block minecarts<br />
 
  Ender Pearl Glitching -><br />
      (A) => Checks if an ender pearl is inside a climable block.
   
  Fly -><br />
      (A) => Checks if the players y coordinate is the same or greater every second
   
  Illegal Items -><br />
      (A) => Clears illegal items from everybodys inventories.
      
  InteractUse -><br />
      (A) => Checks if a player is using an item white hitting/interacting with items
 
  Jesus -><br />
      (A) => Checks if the player is above water/lava blocks.
 
  KillAura -><br />
      (A) => Spawns a fake entity behind the player and checks if they hit it.
 
  Phase -><br />
      (A) => Detect if someone moves inside a block
 
  Speed -><br />
      (A) = Spawns in an entity and sees how far the player moves away from it.

# Extra Commands.

To recieve anti-cheat alerts use this command: ```/function notify```

To ban a user use: ```/execute <playername> ~~~ function ban```

To freeze a player use: ```/execute <playername> ~~~ function tools/freeze```


To enter Vanish use: ```/function tools/vanish```

To be able to fly in survival mode use: ```/function tools/fly```

To view a players anticheat logs use: ```/execute <playername> ~~~ function tools/stats```

# FAQ

Q1: Does the AntiCheat auto-ban?<br />
A1: No.

Q2: Is it customizable?<br />
A2: Yes but you need to modify the .mcfunction files

# Notes:

When applying the pack to your world make sure it is at the top to ensure all checks work properly.

If your world uses NPC's, please edit the cbe.mcfunction file and do the instructions to make sure they wont be insta-killed.
