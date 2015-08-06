import sys
import threading
import os
import sys

player = None
respond = None
success = True

try:
    filePath = sys.argv[1] + '.py'
except:
    success = False
    print('err received no filepath argument')

if(success):
    try:
        directoryPath = os.path.dirname(filePath)
        fileName = os.path.splitext(os.path.basename(filePath))[0]

        #add the player directory so we can import our player file from it
        sys.path.append(directoryPath)
    except:
        success = False
        print('err received invalid filepath ' + sys.argv[1])

if(success):
    try:
        player = __import__(fileName, globals(), locals(), ['respond'], 0)
        respond = player.respond
    except:
        success = False
        print('err player had no respond method')

if(success and not callable(player.respond)):
    success = False

if(success):
    for line in sys.stdin:
        lineSplit = line.strip().split(' ')

        messageId = lineSplit[0]
        command = lineSplit[1]
        data = None

        if(len(lineSplit) > 2) :
            data = ' '.join(lineSplit[2:])

        if(command == 'player') :
            if(respond) :
                print(messageId, '0', respond(data))
            else :
                print(messageId, '1', 'player-not-initialized')
        else :
            print(messageId, '1', 'unrecognized-command', command);