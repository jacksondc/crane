import sys
import threading
import os

respond = None
#add the player directory so we can import our player file from it
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/player')

for line in sys.stdin:
    lineSplit = line.strip().split(' ')

    command = lineSplit[0]
    data = None

    if(len(lineSplit) > 1) :
        data = lineSplit[1]

    if(command == 'filename') :
        fileName = data
        _temp = __import__( fileName, globals(), locals(), ['respond'], 0)
        respond = _temp.respond
        print('filename 200');
    elif(command == 'player') :
        if(respond) :
            print('player 200', respond(data))
        else :
            print('player 400 player-not-initialized')
    else :
        print(command, '400', 'unrecognized-command');