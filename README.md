#Node Site Monitor

A simple node server that will check the status of any number of websites and alert any number of users in different ways.

##Why do this??

Well, we wanted a free distributed system for monitoring our websites. We can easily do that with various free node hosting solutions.
The different alert types are free and therefore the entire end-to-end check doesn't cost a thing.

##Install

###NPM

    npm install site-monitor
    
###Manual

You need to download the code and also install the nodemailer library as this is used for e-mail alerts


##Usage

Easy peasy! It will load the config when started and will just keep running. If you want to change the config, you need to restart the application.

    node site-monitor.js

##Check types

The different ways that are checked to see the status of a site

*   Check if host is reachable
*   Check HTTP status code
*   Check for connect timeouts
*   Check to see if text on the page matches what is expected


##Alert types

The different ways of sending alerts to users. Users can have multiple methods, each with different "availability windows"

*   E-mail:
      *   GMail is the only service available at the moment
      *   Other providers/SMTP setup coming soon
*   (future) Twitter DM (free SMS!)
*   (future) Twitter mention
*   (future) Custom POST request
*   Make your own... just extend the base communication class lib/communication/base.js


##Storage types

The different ways to store the site check data and what

*   stdout (console.log)
*   (future) file
*   (future) MySQL
*   (future) MongoDB
*   Make your own... just extend the base communication class lib/storage/base.js


##Setup
This is all done in a simple config file. As long as you match the format in the config.json example it will work fine.
The arrays in the config don't have any soft limits, so the only limits will be in node or hardware. Let us know if you have any issues.
If you want to change the config, you need to restart the application.