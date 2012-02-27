from django.shortcuts import render_to_response, get_object_or_404, redirect
from django.template import RequestContext
from nodes.models import Node, NodeGroup
import requests
import json

def index(request):
    return redirect('ccc-nodes-index')
