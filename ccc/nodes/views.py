from django.shortcuts import render_to_response, get_object_or_404, redirect
from django.template import RequestContext
from django.http import HttpResponse
from nodes.models import Node, NodeGroup
from django.http import HttpResponse
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
        r = requests.post('http://' + node.address + '/' + command_name, data=command_body, timeout=5)
        response = r.text
    except requests.exceptions.RequestException as e:
        error = str(e)
        return None, error

    if not raw:
        # Try to parse, but fallback to original value if we can't
        try:
            response = json.loads(response)
            if 'error' in response: error = response['error']
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
    if error: return failed_command(request, error)

    # Reformat if we get back json
    try:
        resp_json = json.loads(response)
        response = json.dumps(resp_json, indent=2)
    except ValueError:
        pass

    # Special case formats
    if 'format' in request.GET:
        if request.GET['format'] == 'json':
            return HttpResponse(response, mimetype="application/json")

    # Default is a page with the given info
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
    if error: return failed_command(request, error)

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

    if not node.nodetype:
        return failed_command(request, "Don't know what type of node this is. You need to set it's node type.")
    prefix = node.nodetype.short

    if prefix == 'space': prefix = 'space.server'
    response, error = run_node_command(node, prefix + ".objects.list")
    if error: return failed_command(request, error)

    objects = []
    if 'objects' in response:
        objects = response['objects']

    render_params = {
        'node' : node,
        'objects' : objects,
        'with_presences' : (node.nodetype.short == 'oh')
        }
    return render_to_response(
        'objects.html', render_params,
        context_instance=RequestContext(request)
        )


def node_object_presences(request, node_id, obj_id):
    node = get_object_or_404(Node, pk=node_id)

    if not node.nodetype:
        return failed_command(request, "Don't know what type of node this is. You need to set it's node type.")
    if node.nodetype.short != 'oh':
        return failed_command(request, "Can only list presences of an object on an object host.")

    response, error = run_node_command(node, 'oh.objects.presences', { 'object' : obj_id })
    if error: return failed_command(request, error)

    presences = []
    for (id,pres) in response['presences'].iteritems():
        pres['id'] = id
        presences.append(pres)

    render_params = {
        'node' : node,
        'object' : obj_id,
        'presences' : presences
        }
    return render_to_response(
        'presences.html', render_params,
        context_instance=RequestContext(request)
        )


def node_disconnect_object(request, node_id, obj_id):
    node = get_object_or_404(Node, pk=node_id)

    if not node.nodetype:
        return failed_command(request, "Don't know what type of node this is. You need to set it's node type.")

    cmd = ''
    if node.nodetype.short == 'space':
        cmd = 'space.server.objects.disconnect'
    elif node.nodetype.short == 'oh':
        cmd = 'oh.objects.destroy'

    response, error = run_node_command(node, cmd, { 'object' : obj_id })
    if error: return failed_command(request, error)

    # Use a notification to indicate success after redirect?
    return redirect('ccc-nodes-node-objects', node_id=node_id)



def node_transfer_requests(request, node_id):
    node = get_object_or_404(Node, pk=node_id)

    response, error = run_node_command(node, "transfer.mediator.requests.list")
    if error: return failed_command(request, error)

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


# Proximity
def node_prox_overview(request, node_id):
    node = get_object_or_404(Node, pk=node_id)

    if not node.nodetype:
        return failed_command(request, "Don't know what type of node this is. You need to set it's node type.")
    prefix = node.nodetype.short

    props, error = run_node_command(node, prefix + ".prox.properties")
    if error: return failed_command(request, error)

    handlers, error = run_node_command(node, prefix + ".prox.handlers")
    if error: return failed_command(request, error)
    if not 'handlers' in handlers: failed_command(request, "Couldn't retrieve list of handlers from node.")
    handlers = handlers['handlers']
    # Rework the handlers data into a more usable state for the template
    new_handlers = []
    for querier in handlers:
        for queried in handlers[querier]:
            handler = handlers[querier][queried]
            handler['querier_type'] = querier
            handler['queried_type'] = queried
            new_handlers.append(handler)

    render_params = {
        'node' : node,
        'properties' : props,
        'handlers' : new_handlers
        }
    return render_to_response(
        'prox_overview.html', render_params,
        context_instance=RequestContext(request)
        )

def node_prox_handler(request, node_id, handler_name):
    node = get_object_or_404(Node, pk=node_id)

    render_params = {
        'node' : node,
        'handler' : handler_name
        }
    return render_to_response(
        'prox_handler_vis.html', render_params,
        context_instance=RequestContext(request)
        )

def node_prox_handler_nodes(request, node_id, handler_name):
    '''Get raw nodes data as JSON'''
    node = get_object_or_404(Node, pk=node_id)

    if not node.nodetype:
        return failed_command(request, "Don't know what type of node this is. You need to set it's node type.")
    prefix = node.nodetype.short

    response, error = run_node_command(node, prefix + ".prox.nodes", { 'handler' : handler_name } )
    if error:
        return HttpResponse(json.dumps({"error" : error}, indent=2), mimetype="application/json")
    if not 'nodes' in response:
        return HttpResponse(json.dumps({"error" : "No nodes listed in response"}, indent=2), mimetype="application/json")

    return HttpResponse(json.dumps(response['nodes'], indent=2), mimetype="application/json")



def node_prox_handler_rebuild(request, node_id, handler_name):
    node = get_object_or_404(Node, pk=node_id)

    if not node.nodetype:
        return failed_command(request, "Don't know what type of node this is. You need to set it's node type.")
    prefix = node.nodetype.short

    response, error = run_node_command(node, prefix + ".prox.rebuild", { 'handler' : handler_name } )
    if error: return failed_command(request, error)

    # If there's no error, just redirect to overview page
    return redirect('ccc-nodes-node-prox-overview', node_id=node_id)




def node_download_planner_downloads(request,node_id):
    node = get_object_or_404(Node, pk=node_id)
    response, error = run_node_command(node, "oh.ogre.ddplanner")
    if not response: return failed_command(request, error)

    render_params = {
        'node' : node,
        'newData' : response
        }
    return render_to_response(
        'download_planner.html', render_params,
        context_instance=RequestContext(request)
        )

def node_download_planner_downloads_raw_json(request,node_id):
    node = get_object_or_404(Node, pk=node_id)
    response, error = run_node_command(node, "oh.ogre.ddplanner")
    if not response: return failed_command(request, error)
    return HttpResponse(content =json.dumps(response),mimetype='application/json');



def node_debug(request, node_id):
    '''
    List various debug info collected from the node.
    '''
    node = get_object_or_404(Node, pk=node_id)

    context_stats, error = run_node_command(node, "context.report-all-stats")
    if error: return failed_command(request, error)

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
