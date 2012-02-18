from basesettings import *

# This is an example of settings that could be overridden. You can
# override more, but these are probably the ones you want to start
# with.

DEBUG = True
TEMPLATE_DEBUG = DEBUG

ADMINS = (
    # ('Your Name', 'your_email@example.com'),
)
MANAGERS = ADMINS

DATABASES['default']['ENGINE'] = 'django.db.backends.sqlite3'
DATABASES['default']['NAME'] = 'sirikata-ccc.db'

# Make this unique, and don't share it with anybody. You MUST change this.
SECRET_KEY = '%5=mrbposk6qmf+y-485r-&urqa(t*hpfkfl1fqmamq8!yuhm-'
