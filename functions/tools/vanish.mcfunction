tag @s[tag=vanish] add novanish
tag @s[tag=novanish] remove vanish
event entity @s[tag=novanish] unvanish
effect @s[tag=novanish] clear
tellraw @s[tag=novanish] {"rawtext":[{"text":"§6[§aScythe§6] §rYou are no longer in vanish!"}]}
execute @s[tag=novanish] ~~~ tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" §rIs no longer in Vanish."}]}

tag @s[tag=!novanish] add vanish
event entity @s[tag=vanish,tag=!novanish] vanish
tellraw @s[tag=vanish,tag=!novanish] {"rawtext":[{"text":"§6[§aScythe§6] §rYou are now in vanish!"}]}
execute @s[tag=vanish,tag=!novanish] ~~~ tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" §rIs now in Vanish."}]}

tag @s[tag=novanish] remove novanish
