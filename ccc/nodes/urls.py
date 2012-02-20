from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns(
    '',

    url(r'^$', 'nodes.views.index', name='ccc-nodes-index'),

    url(r'^node/(?P<node_id>\d+)/$', 'nodes.views.node', name='ccc-nodes-node-index'),

    # Raw command to the node. Just requests the command_name and returns the raw result
    url(r'^node/(?P<node_id>\d+)/command/raw/(?P<command_name>(\w|\.)+)$', 'nodes.views.node_command_raw', name='ccc-nodes-node-command-raw'),

    # Objects on a given node
    url(r'^node/(?P<node_id>\d+)/objects/$', 'nodes.views.node_objects', name='ccc-nodes-node-objects'),
    url(r'^node/(?P<node_id>\d+)/objects/disconnect/(?P<obj_id>(\d|\w|-)+)$', 'nodes.views.node_disconnect_object', name='ccc-nodes-node-objects-disconnect'),

    url(r'^group/(?P<group_id>\d+)/$', 'nodes.views.group', name='ccc-nodes-group-index'),

)
