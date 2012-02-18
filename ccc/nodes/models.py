from django.db import models

class Node(models.Model):
    '''
    A Sirikata node that can be communicated with and monitored.
    '''

    name = models.CharField(max_length=256)
    '''User-friendly name for this node'''
    address = models.CharField(max_length=256)
    '''
    Network address to reach this node at. This can be a hostname or
    IP with an optional port.
    '''

    groups = models.ManyToManyField('NodeGroup')
    '''Groups this node belongs to.'''


    def __unicode__(self):
        return self.name


class NodeGroup(models.Model):
    '''
    A group of Nodes. This allows you to group Nodes into categories
    such as "Deployment X" and "Deployment X Space Servers"
    '''

    name = models.CharField(max_length=256)
    '''User-friendly name for this node group'''

    def __unicode__(self):
        return self.name
