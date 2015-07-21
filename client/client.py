import sys
import threading
import os

respond = None

for line in sys.stdin:
    lineSplit = line.strip().split(' ')

    messageId = lineSplit[0]
    command = lineSplit[1]
    data = None

    if(len(lineSplit) > 2) :
        data = ' '.join(lineSplit[2:])

    if(command == 'filename') :
        filePath = data + '.py'
        directoryPath = os.path.dirname(filePath)
        fileName = os.path.splitext(os.path.basename(filePath))[0]

        #add the player directory so we can import our player file from it
        sys.path.append(directoryPath)

        player = __import__(fileName , globals(), locals(), ['respond'], 0)
        respond = player.respond
        print(messageId, '200');
    elif(command == 'player') :
        if(respond) :
            print(messageId, '200', respond(data))
        else :
            print(messageId, '400', 'player-not-initialized')
    else :
        print(messageId, '400', 'unrecognized-command', command);