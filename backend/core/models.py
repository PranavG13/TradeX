from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is a required field')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using = self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractUser):
    email = models.EmailField(max_length=200, unique=True)
    username = models.CharField(max_length=200, null=True, blank=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = [] # any required field other than username and password

    # ADD Additional fields for user Profiling

class OpenTrade(models.Model):
    owner = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='open_trades')
    symbol = models.CharField(max_length=10)
    quantity = models.PositiveIntegerField(default=1, blank=True)
    buy_price = models.FloatField()
    bought_date = models.DateTimeField(auto_now_add=True)
    current_price = models.FloatField(blank=True, null=True)
    stoploss = models.FloatField(default=None, blank=True, null=True)
    takeprofit = models.FloatField(default=None, blank=True, null=True)

    class Meta:
        ordering = ['bought_date']

class ClosedTrade(models.Model):
    owner = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='closed_trades')
    symbol = models.CharField(max_length=10)
    quantity = models.PositiveIntegerField(default=1, blank=True)
    buy_price = models.FloatField()
    bought_date = models.DateTimeField(blank=True, null=True)
    sell_price = models.FloatField()
    sell_date = models.DateTimeField(auto_now_add=True)
    p_and_l = models.FloatField(blank=True, null=True, editable=False)

    def save(self,*args, **kwargs):
        '''Calculating p&l on trade manually'''
        try:
            self.p_and_l = self.buy_price - self.sell_price
        except ValueError:
            self.p_and_l = 0
        return super().save(*args, **kwargs)

    class Meta:
        ordering = ['sell_date']


