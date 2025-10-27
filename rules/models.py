# workflows/models.py
from django.db import models
from django.conf import settings

class Rule(models.Model):
    name = models.CharField(max_length=255)
    # owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    description = models.TextField(blank=True)
    # stores React Flow nodes/edges + node data
    definition = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.id})"
