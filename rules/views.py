# workflows/views.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Rule
from .serializers import WorkflowSerializer
from .runner import run_workflow_sync

class WorkflowViewSet(viewsets.ModelViewSet):
    queryset = Rule.objects.all().order_by('-id')
    serializer_class = WorkflowSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name','id']
    # permission_classes = [IsAuthenticated]

    # def perform_create(self, serializer):
    #     serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def run(self, request, pk=None):
        workflow = self.get_object()
        trigger_payload = request.data.get('trigger', None)
        # synchronous run (for play)
        result = run_workflow_sync(workflow.definition, trigger_payload, workflow_id=workflow.id)
        return Response(result, status=status.HTTP_200_OK if result.get('status')=='success' else status.HTTP_400_BAD_REQUEST)

# webhook public endpoint example (AllowAny or token protected in prod)
@api_view(['POST'])
@permission_classes([AllowAny])
def webhook_trigger(request, workflow_id):
    try:
        wf = Rule.objects.get(pk=workflow_id)
    except Rule.DoesNotExist:
        return Response({'error': 'workflow not found'}, status=404)
    # For simplicity, pass trigger payload and run entire workflow
    trigger_payload = {'payload': request.data}
    result = run_workflow_sync(wf.definition, trigger_payload, workflow_id=workflow_id)
    return Response(result, status=200 if result.get('status')=='success' else 400)
