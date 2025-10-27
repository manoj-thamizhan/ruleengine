# workflows/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkflowViewSet, webhook_trigger
from django.http import JsonResponse
router = DefaultRouter()
router.register(r'rules', WorkflowViewSet, basename='workflow')

urlpatterns = [
    path('', include(router.urls)),
    path('webhook/<int:workflow_id>/', webhook_trigger, name='webhook_trigger'),
    path('echo/<str:input>/', lambda request, input: JsonResponse({'echo': f'Si {input}'}), name='echo'),
]
