from django.contrib import admin
from nodes.models import Node
from nodes.models import NodeGroup

admin.site.register(Node)
admin.site.register(NodeGroup)
