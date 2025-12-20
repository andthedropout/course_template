import json
import logging
from django.http import JsonResponse, HttpResponse
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.contrib.auth.models import User
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.utils.decorators import method_decorator
from django.views import View
from django.middleware.csrf import get_token
from django.views.decorators.http import require_http_methods
from django.db import IntegrityError

logger = logging.getLogger(__name__)

@method_decorator(csrf_protect, name='dispatch')
class LoginView(View):
    http_method_names = ['post']  # Explicitly declare allowed methods
    
    def post(self, request):
        logger.info(f"Login attempt received from {request.META.get('REMOTE_ADDR')}")
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            logger.info(f"Login attempt for username: {username}")
        except json.JSONDecodeError:
            logger.error("Invalid JSON in login request")
            return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)

        if username is None or password is None:
            logger.error("Missing username or password in login request")
            return JsonResponse({'success': False, 'error': 'Username and password are required'}, status=400)

        user = authenticate(request, username=username, password=password)
        if user is not None:
            django_login(request, user)
            logger.info(f"User {username} logged in successfully")
            
            # Check if user is in Site Managers group
            is_site_manager = user.groups.filter(name='Site Managers').exists()
            
            return JsonResponse({
                'success': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_staff': user.is_staff,
                    'is_site_manager': is_site_manager
                }
            })
        else:
            logger.warning(f"Failed login attempt for username: {username}")
            return JsonResponse({'success': False, 'error': 'Invalid credentials'}, status=401)
    
    # Handle other methods explicitly
    def get(self, request):
        return JsonResponse({'success': False, 'error': 'Please use POST to login'}, status=405)

@method_decorator(csrf_protect, name='dispatch')
class SignupView(View):
    http_method_names = ['post']  # Explicitly declare allowed methods
    
    def post(self, request):
        logger.info(f"Signup attempt received from {request.META.get('REMOTE_ADDR')}")
        try:
            data = json.loads(request.body)
            first_name = data.get('first_name', '').strip()
            last_name = data.get('last_name', '').strip()
            email = data.get('email', '').strip().lower()
            password = data.get('password', '')
            
            logger.info(f"Signup attempt for email: {email}")
        except json.JSONDecodeError:
            logger.error("Invalid JSON in signup request")
            return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)

        # Validate required fields
        if not all([first_name, last_name, email, password]):
            logger.error("Missing required fields in signup request")
            return JsonResponse({'success': False, 'error': 'All fields are required'}, status=400)

        # Validate email format
        if '@' not in email or '.' not in email:
            logger.error(f"Invalid email format: {email}")
            return JsonResponse({'success': False, 'error': 'Invalid email format'}, status=400)

        # Validate password length
        if len(password) < 8:
            logger.error("Password too short")
            return JsonResponse({'success': False, 'error': 'Password must be at least 8 characters'}, status=400)

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            logger.warning(f"Signup attempt with existing email: {email}")
            return JsonResponse({'success': False, 'error': 'Email already registered'}, status=400)

        # Create username from email (use email as username)
        username = email

        try:
            # Create the user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            
            logger.info(f"User created successfully: {email}")
            
            # Automatically log in the user after signup
            django_login(request, user)
            
            # Check if user is in Site Managers group
            is_site_manager = user.groups.filter(name='Site Managers').exists()
            
            return JsonResponse({
                'success': True,
                'message': 'Account created successfully',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_staff': user.is_staff,
                    'is_site_manager': is_site_manager
                }
            })
            
        except IntegrityError:
            logger.error(f"IntegrityError creating user: {email}")
            return JsonResponse({'success': False, 'error': 'Email already registered'}, status=400)
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            return JsonResponse({'success': False, 'error': 'Account creation failed'}, status=500)
    
    # Handle other methods explicitly
    def get(self, request):
        return JsonResponse({'success': False, 'error': 'Please use POST to signup'}, status=405)

@method_decorator(require_POST, name='dispatch')
@method_decorator(csrf_protect, name='dispatch')
class LogoutView(View):
    def post(self, request):
        django_logout(request)
        return JsonResponse({'success': True, 'message': 'Logged out successfully'})

class AuthStatusView(View):
    def get(self, request):
        """Check authentication status"""
        if request.user.is_authenticated:
            # Check if user is in Site Managers group
            is_site_manager = request.user.groups.filter(name='Site Managers').exists()
            
            return JsonResponse({
                'authenticated': True,
                'user': {
                    'id': request.user.id,
                    'username': request.user.username,
                    'email': request.user.email,
                    'first_name': request.user.first_name,
                    'last_name': request.user.last_name,
                    'is_staff': request.user.is_staff,
                    'is_site_manager': is_site_manager
                }
            })
        
        return JsonResponse({'authenticated': False})

@ensure_csrf_cookie
def get_csrf_token(request):
    """
    A view to ensure the CSRF cookie is set and returned.
    The frontend can make a GET request to this endpoint before making POST requests.
    """
    # Explicitly get the token to ensure it's set in the cookie
    token = get_token(request)
    
    # For debugging purposes
    cookie_header = request.META.get('HTTP_COOKIE', '')
    
    response = JsonResponse({
        'status': 'success',
        'message': 'CSRF cookie set',
        'csrfToken': token,  # Add the actual token to the response
        'debug': {
            'cookie_header': cookie_header,
            'csrf_cookie_set': bool(token),
        }
    })
    
    # Add debug headers (visible in browser network inspector)
    response['X-CSRF-Cookie-Debug'] = 'set'
    
    return response 