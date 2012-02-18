from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns(
    '',

    url(r'^$', 'nodes.views.index', name='ccc-nodes-index'),

    url(r'^node/(?P<node_id>\d+)/$', 'nodes.views.node', name='ccc-nodes-node-index'),

    # Raw command to the node. Just requests the command_name and returns the raw result
    url(r'^node/(?P<node_id>\d+)/command/raw/(?P<command_name>(\w|\.)+)$', 'nodes.views.node_command_raw', name='ccc-nodes-node-command-raw'),

    url(r'^group/(?P<group_id>\d+)/$', 'nodes.views.group', name='ccc-nodes-group-index'),

)
