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

    error = None
    try:
        r = requests.post('http://' + node.address + '/' + command_name, data=command_body)
        response = r.text
    except requests.exceptions.RequestException as e:
        error = str(e)
        return None, error

    if not raw:
        # Try to parse, but fallback to original value if we can't
        try:
            response = json.loads(response)
        except ValueError:
            pass

    return response, error


def failed_command(request, message):
    '''Returns an error page'''

    render_params = {
        'message' : message
        }
    return render_to_response(
        'command_error.html', render_params,
        context_instance=RequestContext(request)
        )


def node_command_raw(request, node_id, command_name):
    node = get_object_or_404(Node, pk=node_id)

    response, error = run_node_command(node, command_name, raw=True)
    if not response: return failed_command(request, error)

    # Reformat if we get back json
    try:
        resp_json = json.loads(response)
        response = json.dumps(resp_json, indent=2)
    except ValueError:
        pass

    render_params = {
        'response' : response
        }
    return render_to_response(
        'raw.html', render_params,
        context_instance=RequestContext(request)
        )


def node_list_commands(request, node_id):
    '''Get a list of commands that this node supports and display them
    with links to execute them and get the raw result. Note that
    commands that require additional data will just fail with these
    links.
    '''
    node = get_object_or_404(Node, pk=node_id)

    response, error = run_node_command(node, 'meta.commands')
    if not response: return failed_command(request, error)

    commands = []
    if 'commands' in response:
        commands = [c for c in response['commands']]
        commands.sort()

    render_params = {
        'commands' : commands,
        'node' : node
        }
    return render_to_response(
        'commands.html', render_params,
        context_instance=RequestContext(request)
        )


def node_objects(request, node_id):
    node = get_object_or_404(Node, pk=node_id)

    response, error = run_node_command(node, "space.server.objects.list")
    if not response: return failed_command(request, error)

    objects = []
    if 'objects' in response:
        objects = response['objects']

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

    response, error = run_node_command(node, "space.server.objects.disconnect", { 'object' : obj_id })
    if not response: return failed_command(request, error)

    # Use a notification to indicate success after redirect?
    return redirect('ccc-nodes-node-objects', node_id=node_id)



def node_transfer_requests(request, node_id):
    node = get_object_or_404(Node, pk=node_id)

    response, error = run_node_command(node, "transfer.mediator.requests.list")
    if not response: return failed_command(request, error)

    requests = []
    if 'requests' in response:
        requests = response['requests']

    render_params = {
        'node' : node,
        'requests' : requests
        }
    return render_to_response(
        'transfer_requests.html', render_params,
        context_instance=RequestContext(request)
        )


def node_debug(request, node_id):
    '''
    List various debug info collected from the node.
    '''
    node = get_object_or_404(Node, pk=node_id)

    context_stats, error = run_node_command(node, "context.report-all-stats")
    if not response: return failed_command(request, error)

    render_params = {
        'node' : node,
        'context_stats' : context_stats
        }
    return render_to_response(
        'debug.html', render_params,
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
