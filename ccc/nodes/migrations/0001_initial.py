# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'Node'
        db.create_table('nodes_node', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=256)),
            ('address', self.gf('django.db.models.fields.CharField')(max_length=256)),
        ))
        db.send_create_signal('nodes', ['Node'])

        # Adding M2M table for field groups on 'Node'
        db.create_table('nodes_node_groups', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('node', models.ForeignKey(orm['nodes.node'], null=False)),
            ('nodegroup', models.ForeignKey(orm['nodes.nodegroup'], null=False))
        ))
        db.create_unique('nodes_node_groups', ['node_id', 'nodegroup_id'])

        # Adding model 'NodeGroup'
        db.create_table('nodes_nodegroup', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=256)),
        ))
        db.send_create_signal('nodes', ['NodeGroup'])


    def backwards(self, orm):
        
        # Deleting model 'Node'
        db.delete_table('nodes_node')

        # Removing M2M table for field groups on 'Node'
        db.delete_table('nodes_node_groups')

        # Deleting model 'NodeGroup'
        db.delete_table('nodes_nodegroup')


    models = {
        'nodes.node': {
            'Meta': {'object_name': 'Node'},
            'address': ('django.db.models.fields.CharField', [], {'max_length': '256'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['nodes.NodeGroup']", 'symmetrical': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256'})
        },
        'nodes.nodegroup': {
            'Meta': {'object_name': 'NodeGroup'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256'})
        }
    }

    complete_apps = ['nodes']
