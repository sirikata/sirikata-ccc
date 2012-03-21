Installation
============

Dependencies
------------

The site is built on Django and uses a few Django apps. Make sure you
have a recent Python installation. Then, make sure you have pip or are
up to date.  Once you have pip installed (there is usually a system
package, or you can use easy_install), make sure your pip tools are up
to date with

    pip install -U pip distribute

Then, you can have pip install the requirements with:

    pip install -U -r requirements/base.txt

Setup
-----

First, customize the default settings:

    cp ccc/settings.example.py ccc/settings.py
    # Edit ccc/settings.py to your liking.

You should change some of these settings. You can also look in
ccc/basesettings.py for more settings to override.

Once you're satisfied with the settings, you need to sync the
database, setting up all the tables Django will need to run the site:

    python ccc/manage.py syncdb
    python ccc/manage.py migrate nodes

You'll probably be prompted for an admin account. Create it now.

Running
-------

With everything else configured you're ready to run the site. You can
run it under the Django test server with:

    python ccc/manage.py runserver

You can then access the site at localhost:8000.
