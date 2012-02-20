from django.shortcuts import render_to_response, get_object_or_404, redirect
from django.template import RequestContext
from nodes.models import Node, NodeGroup
import requests
import json

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


def run_node_command(node, command_name, command_body=None, raw=False):
    '''
    Run a node command and get the result, optionally as a raw string
    instead of parsed.
    '''

    if command_body:
        command_body = json.dumps(command_body)

    try:
        r = requests.post('http://' + node.address + '/' + command_name, data=command_body)
        response = r.text
    except requests.exceptions.RequestException as e:
        response = 'Error issuing command to node: ' + str(e)

    if not raw:
        response = json.loads(response)

    return response


def node_command_raw(request, node_id, command_name):
    node = get_object_or_404(Node, pk=node_id)

    response = run_node_command(node, command_name, raw=True)

    render_params = {
        'response' : response
        }
    return render_to_response(
        'raw.html', render_params,
        context_instance=RequestContext(request)
        )


def node_objects(request, node_id):
    node = get_object_or_404(Node, pk=node_id)

    response = run_node_command(node, "space.server.objects.list")

    objects = []
    if 'objects' in response:
        objects = response['objects'].keys()

    render_params = {
        'node' : node,
        'objects' : objects
        }
    return render_to_response(
        'objects.html', render_params,
        context_instance=RequestContext(request)
        )

def node_disconnect_object(request, node_id, obj_id):
    node = get_object_or_404(Node, pk=node_id)

    response = run_node_command(node, "space.server.objects.disconnect", { 'object' : obj_id })

    # Use a notification to indicate success after redirect?
    return redirect('ccc-nodes-node-objects', node_id=node_id)

def group(request, group_id):
    group = get_object_or_404(NodeGroup, pk=group_id)
    render_params = {
        'group' : group
        }
    return render_to_response(
        'group.html', render_params,
        context_instance=RequestContext(request)
        )
