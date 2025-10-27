# workflows/admin.py
from django.contrib import admin
from .models import Rule

@admin.register(Rule)
class WorkflowAdmin(admin.ModelAdmin):
    list_display = ('id','name','created_at')
    readonly_fields = ('created_at','updated_at')
