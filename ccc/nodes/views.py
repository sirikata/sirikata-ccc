from django.shortcuts import render_to_response, get_object_or_404
from nodes.models import Node, NodeGroup
import urllib2

def index(request):
    nodes = Node.objects.all().order_by('name')
    render_params = {
        'nodes' : nodes
        }
    return render_to_response('index.html', render_params)

def node(request, node_id):
    node = get_object_or_404(Node, pk=node_id)
    render_params = {
        'node' : node
        }
    return render_to_response('node.html', render_params)


def node_command_raw(request, node_id, command_name):
    node = get_object_or_404(Node, pk=node_id)

    try:
        url_response = urllib2.urlopen('http://' + node.address + '/' + command_name)
        response = url_response.read()
    except urllib2.URLError:
        response = 'Error when issuing command to node'

    render_params = {
        'response' : response
        }
    return render_to_response('raw.html', render_params)


def group(request, group_id):
    group = get_object_or_404(NodeGroup, pk=group_id)
    render_params = {
        'group' : group
        }
    return render_to_response('group.html', render_params)
