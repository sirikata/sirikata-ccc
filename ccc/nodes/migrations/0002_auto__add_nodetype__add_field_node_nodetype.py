# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'NodeType'
        db.create_table('nodes_nodetype', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('short', self.gf('django.db.models.fields.CharField')(unique=True, max_length=32)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=256)),
        ))
        db.send_create_signal('nodes', ['NodeType'])

        # Adding field 'Node.nodetype'
        db.add_column('nodes_node', 'nodetype', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['nodes.NodeType'], null=True), keep_default=False)


    def backwards(self, orm):
        
        # Deleting model 'NodeType'
        db.delete_table('nodes_nodetype')

        # Deleting field 'Node.nodetype'
        db.delete_column('nodes_node', 'nodetype_id')


    models = {
        'nodes.node': {
            'Meta': {'object_name': 'Node'},
            'address': ('django.db.models.fields.CharField', [], {'max_length': '256'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['nodes.NodeGroup']", 'symmetrical': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256'}),
            'nodetype': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['nodes.NodeType']", 'null': 'True'})
        },
        'nodes.nodegroup': {
            'Meta': {'object_name': 'NodeGroup'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256'})
        },
        'nodes.nodetype': {
            'Meta': {'object_name': 'NodeType'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '256'}),
            'short': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '32'})
        }
    }

    complete_apps = ['nodes']
