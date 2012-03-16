from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns(
    '',

    url(r'^$', 'nodes.views.index', name='ccc-nodes-index'),

    url(r'^node/(?P<node_id>\d+)/$', 'nodes.views.node', name='ccc-nodes-node-index'),

    # Raw command to the node. Just requests the command_name and returns the raw result
    url(r'^node/(?P<node_id>\d+)/command/raw/(?P<command_name>(\w|\.|\-)+)$', 'nodes.views.node_command_raw', name='ccc-nodes-node-command-raw'),

    # Meta page: list of commands + raw access
    url(r'^node/(?P<node_id>\d+)/command/meta/$', 'nodes.views.node_list_commands', name='ccc-nodes-node-command-list-commands'),


    # Objects on a given node
    url(r'^node/(?P<node_id>\d+)/objects/$', 'nodes.views.node_objects', name='ccc-nodes-node-objects'),
    url(r'^node/(?P<node_id>\d+)/objects/disconnect/(?P<obj_id>(\d|\w|-)+)$', 'nodes.views.node_disconnect_object', name='ccc-nodes-node-objects-disconnect'),
    # Transfer requests
    url(r'^node/(?P<node_id>\d+)/transfer/requests$', 'nodes.views.node_transfer_requests', name='ccc-nodes-node-transfer-requests'),

    # Proximity
    url(r'^node/(?P<node_id>\d+)/prox/$', 'nodes.views.node_prox_overview', name='ccc-nodes-node-prox-overview'),
    url(r'^node/(?P<node_id>\d+)/prox/(?P<handler_name>(\w|\.|-)+)/$', 'nodes.views.node_prox_handler', name='ccc-nodes-node-prox-handler'),
    url(r'^node/(?P<node_id>\d+)/prox/(?P<handler_name>(\w|\.|-)+)/nodes$', 'nodes.views.node_prox_handler_nodes', name='ccc-nodes-node-prox-handler-nodes'),
    url(r'^node/(?P<node_id>\d+)/prox/(?P<handler_name>(\w|\.|-)+)/rebuild/$', 'nodes.views.node_prox_handler_rebuild', name='ccc-nodes-node-prox-handler-rebuild'),

    url(r'^node/(?P<node_id>\d+)/debug/$', 'nodes.views.node_debug', name='ccc-nodes-node-debug'),

    url(r'^group/(?P<group_id>\d+)/$', 'nodes.views.group', name='ccc-nodes-group-index'),

)
