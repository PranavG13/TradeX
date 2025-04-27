from rest_framework import serializers
from .models import *
from django.contrib.auth import get_user_model
User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'password')
        extra_kwargs = { 'password': {'write_only':True} }

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
        

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret.pop('password', None)
        return ret
    
class OpenTradeSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.email')
    class Meta:
        model = OpenTrade
        fields = ['id', 'owner', 'symbol', 'quantity', 'buy_price', 'bought_date', 'current_price', 'stoploss', 'takeprofit']

class ClosedTradeSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source = 'owner.email')
    class Meta:
        model = ClosedTrade
        fields = ['id', 'owner', 'symbol', 'quantity', 'buy_price', 'bought_date', 'sell_price', 'sell_date', 'p_and_l']

class UserSerializer(serializers.ModelSerializer):
    open_trades = OpenTradeSerializer(many=True, read_only=True)
    closed_trades = ClosedTradeSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'open_trades', 'closed_trades']