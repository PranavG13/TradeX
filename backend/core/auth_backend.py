from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

User = get_user_model()

class EmailAuthBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        '''
        Django calls authenticate() with username and password by default.
        Django is passing username=some_email since
        mapped email to username field (USERNAME_FIELD = 'email'), but internally Django still passes username=<entered email>

        '''
        try: 
            user = User.objects.get(email=username)
            if user.check_password(password) and self.user_can_authenticate(user):
                return user
            
        except User.DoesNotExist:
            return None
        
    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None