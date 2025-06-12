# WebELAN
(In progress!! Under current development -- do not expect it to work / work well)

A library of functions for handling ELAN files within a browser.

ELAN is a time-aligned transcription platform for linguistic transcription. Much hard work has been put into it by the people at the Max Planck Institute. [https://archive.mpi.nl/tla/elan](https://archive.mpi.nl/tla/elan)

WebELAN is unrelated to & independent from their efforts.

# Used in...
Used in other projects:

- [Transcripter](https://github.com/drdrphd/transcripter)
- [Excerpter](https://github.com/drdrphd/excerpter)

# Development To-do List
The initial intent was to interface with a real-time database platform (like Firebase) to create a multi-user editor for ELAN files (XML-based time-aligned tiered transcript files).

Still working on local viewing and manipulation.

Vizualization and playback are not implemented. (But shouldn't be too hard with HTML webaudio)

Able to read in ELAN files and manipulate them. However currently works by re-traversing the XML on every command. This is slow. Intending to rewrite so that it loads the entire file on drop-in, and then parses into a faster JS format. Tree?

Needs better UX.

Crashes completely on even moderate-sized files. Two possibilities -- the reading of the ELAN file repeatedly is too slow and memory intensive. (See above tree rewrite possibility). Other possibility is that the number of input elements might be causing slowdowns. Planning on trying a rewrite that uses SVG as the visual with manipulable items within it.

Later versions were planned for some 1-to-1 translation from CHamoru-to-English.
