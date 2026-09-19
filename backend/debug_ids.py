import django
import os
import json
os.environ['DJANGO_SETTINGS_MODULE'] = 'zenfix.settings'
django.setup()

from django.test import RequestFactory
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import User
from tasks.models import Task
from tasks.views import TaskViewSet

# Get employee user
employee = User.objects.filter(role='employee', username='employee').first()
if not employee:
    print("Employee user not found!")
    exit(1)

print(f"Employee: {employee.username} (pk={employee.pk}, numeric_id={employee.numeric_id})")

# Find a startable task
task = Task.objects.filter(
    assigned_to=employee, 
    status__in=['pending', 'assigned', 'rejected']
).first()

if not task:
    print("No startable task found!")
    # Reset task 9 to assigned status for testing
    task = Task.objects.filter(assigned_to=employee).first()
    if task and task.status not in ['pending', 'assigned', 'rejected']:
        print(f"Resetting task {task.task_id} from {task.status} to assigned for testing")
        task.status = 'assigned'
        task.save()

if task:
    print(f"Task: {task.task_id} (numeric_id={task.numeric_id}, status={task.status})")
    print(f"Task assigned_to: {task.assigned_to} (pk={task.assigned_to_id})")
    
    # Test the _is_task_assignee method directly
    view = TaskViewSet()
    result = view._is_task_assignee(task, employee)
    print(f"\n_is_task_assignee result: {result}")
    
    # Now simulate an actual API request
    factory = RequestFactory()
    request = factory.post(f'/api/tasks/{task.numeric_id}/start/', 
                           data=json.dumps({}),
                           content_type='application/json')
    request.user = employee
    
    # Call the view
    view = TaskViewSet.as_view({'post': 'start'})
    response = view(request, pk=str(task.numeric_id))
    print(f"\nAPI Response status: {response.status_code}")
    print(f"API Response data: {json.dumps(response.data, indent=2, default=str)[:500]}")
else:
    print("No task found for this employee at all!")
