## What is WTD Tool?

Dub Editor is a tool for creating/managing clips for Rifftrax the Game and What the Dub.

https://www.youtube.com/watch?v=0uadv6v8-VY&ab_channel=TheTrueKingOfSpace

## Keyboard Shortcuts

| Key        | Function      |
|------------|---------------|
| Arrow Up   | prev sub/clip |
| Arrow Down | next sub/clip |
| Arrow Left | rw 1s         |
| Arrow Right| ffw 1s        |
|      ;     | rw 1 frame    |
|      '     | ffw 1 frame   |
|      \[    | go to in      |
|      \]    | go to out     |
|      i     | set in        |
|      o     | set out       |
|      w     | go up row     |
|      s     | go down row   |
|      e     | edit sub      |
|      t     | edit type     |
|      v     | edit voice    |
|    space   | play/pause    |

## How to Test Development

Make sure to run the following to install all of the dependencies.

    npm i

Then run the following to launch the application.

    npm start

## How to Build

Install and run electron-packager on the root of the project.

    npm package

## Configuring Program Directories

When you first launch the app, it will ask you to configure the game directories for Rifftrax and What the Dub. The directory you want to use is the directory that contains the StreamingAssets folder. In a future release I will have the config page validate that the folder is correct before allowing the user to continue.

## TODO

-   Add ability to edit existing clips.
-   Deletion of subtitles.
-   Recording of riffs for individual clips.

Please feel free to request features :)
