# Gets all Scythe statistics on a user

# make sure if the player doesnt have any violations it shows as vl: 0
scoreboard objectives add autototemvl dummy
scoreboard objectives add anglevl dummy
scoreboard objectives add interactusevl dummy
scoreboard objectives add reachvl dummy

scoreboard players add @s anglevl 0
scoreboard players add @s leftclickvl 0
scoreboard players add @s interactusevl 0
scoreboard players add @s cbevl 0
scoreboard players add @s epearlGlitch 0
scoreboard players add @s flyvl 0
scoreboard players add @s gamemodevl 0
scoreboard players add @s illegalitemsvl 0
scoreboard players add @s jesusvl 0
scoreboard players add @s killauravl 0
scoreboard players add @s phasevl 0
scoreboard players add @s autototemvl 0
scoreboard players add @s spammervl 0
scoreboard players add @s namespoofvl 0
scoreboard players add @s crashervl 0
scoreboard players add @s reachvl 0

tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r Getting all Scythe Logs from: "},{"selector":"@s"}]}
execute @s[m=c] ~~~ tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" is in Creative Mode"}]}
execute @s[m=s] ~~~ tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" is in Survival Mode"}]}
execute @s[m=a] ~~~ tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" is in Adventure Mode"}]}
tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" is currently at X= "},{"score":{"name":"@s","objective":"xPos"}},{"text":", Y= "},{"score":{"name":"@s","objective":"yPos"}},{"text":", Z= "},{"score":{"name":"@s","objective":"zPos"}}]}
tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" has "},{"score":{"name":"@s","objective":"killauravl"}},{"text":" KillAura Violations"}]}
# tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" has "},{"score":{"name":"@s","objective":"speedvl"}},{"text":" Speed Violations"}]}
tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" has "},{"score":{"name":"@s","objective":"phasevl"}},{"text":" Phase Violations"}]}
tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" has "},{"score":{"name":"@s","objective":"flyvl"}},{"text":" Fly Violations"}]}
tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" has "},{"score":{"name":"@s","objective":"illegalitemsvl"}},{"text":" Illegal Items Violations"}]}
tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" has "},{"score":{"name":"@s","objective":"jesusvl"}},{"text":" Jesus Violations"}]}
tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" has "},{"score":{"name":"@s","objective":"anglevl"}},{"text":" Angle Violations"}]}
tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" has "},{"score":{"name":"@s","objective":"epearlGlitch"}},{"text":" Ender Pearl Violations"}]}
tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" has "},{"score":{"name":"@s","objective":"leftclickvl"}},{"text":" AutoClicker Violations"}]}
tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" has "},{"score":{"name":"@s","objective":"interactusevl"}},{"text":" InteractUse Violations"}]}
tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" has "},{"score":{"name":"@s","objective":"cbevl"}},{"text":" Command Block Exploit Violations"}]}
tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" has "},{"score":{"name":"@s","objective":"gamemodevl"}},{"text":" Gamemode Change Violations"}]}
tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" has "},{"score":{"name":"@s","objective":"autototemvl"}},{"text":" AutoTotem Violations"}]}
tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" has "},{"score":{"name":"@s","objective":"spammervl"}},{"text":" Spammer Violations"}]}
tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" has "},{"score":{"name":"@s","objective":"namespoofvl"}},{"text":" NameSpoof Violations"}]}
tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" has "},{"score":{"name":"@s","objective":"crashervl"}},{"text":" Crasher Violations"}]}
tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" has "},{"score":{"name":"@s","objective":"reachvl"}},{"text":" Reach Violations"}]}
execute @s[tag=freeze] ~~~ tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" is currently frozen by a staff member"}]}
execute @s[tag=vanish] ~~~ tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" is currently in vanish"}]}
execute @s[tag=flying] ~~~ tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" has fly mode enabled"}]}
