from django.shortcuts import render_to_response, get_object_or_404
from django.template import RequestContext
from nodes.models import Node, NodeGroup
import requests

def index(request):
    nodes = Node.objects.all().order_by('name')
    render_params = {
        'nodes' : nodes
        }
    return render_to_response(
        'index.html', render_params,
        context_instance=RequestContext(request)
        )

def node(request, node_id):
    node = get_object_or_404(Node, pk=node_id)
    render_params = {
        'node' : node
        }
    return render_to_response(
        'node.html', render_params,
        context_instance=RequestContext(request)
        )


def node_command_raw(request, node_id, command_name):
    node = get_object_or_404(Node, pk=node_id)

    try:
        r = requests.get('http://' + node.address + '/' + command_name)
        response = r.text
    except requests.exceptions.RequestException as e:
        response = 'Error issuing command to node: ' + str(e)

    render_params = {
        'response' : response
        }
    return render_to_response(
        'raw.html', render_params,
        context_instance=RequestContext(request)
        )


def group(request, group_id):
    group = get_object_or_404(NodeGroup, pk=group_id)
    render_params = {
        'group' : group
        }
    return render_to_response(
        'group.html', render_params,
        context_instance=RequestContext(request)
        )
