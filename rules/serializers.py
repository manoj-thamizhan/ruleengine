# workflows/serializers.py
from rest_framework import serializers
from .models import Rule

class WorkflowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rule
        fields = ['id', 'name', 'description', 'definition', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
