execute @s[tag=right,scores={right=4..}] ~~~ function checks/alerts/invalidsprintB
execute @s[tag=sneak,m=!c,tag=!flying] ~~~ function checks/alerts/invalidsprintC
# Disabled due to false flags. If you press the W and CTRL button at the same time, the client makes you sprint for some dumb reason
# execute @s[tag=gliding] ~~~ function checks/alerts/invalidsprintD
execute @s[tag=riding,tag=!moving,scores={last_move=4..}] ~~~ function checks/alerts/invalidsprintE