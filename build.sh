#!/bin/bash

jshint js/*.js
# jscs js/app.js
uglifyjs -dc -m toplevel --stats -- js/app.js > a.js
# uglifyjs  --stats -- js/app.js > a.js
# pngcrush -q -rem allb -brute -reduce s.png s
# pngcrush -q -rem allb -brute -reduce h.png h
# pngcrush -q -rem allb -brute -reduce n.png n
zip p1100i.zip index.html a.js c.css s h n
