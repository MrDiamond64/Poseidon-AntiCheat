scoreboard players add @s interactusevl 1
tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" §1has failed §7(Misc) §4InteractUse/A. VL= "},{"score":{"name":"@s","objective":"interactusevl"}}]}
