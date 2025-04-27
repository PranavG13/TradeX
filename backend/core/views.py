from django.shortcuts import render
from rest_framework import viewsets, permissions, mixins
from .serializers import *
from .models import *
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from django.contrib.auth import get_user_model, authenticate
from knox.models import AuthToken
from core.permissions import IsOwner

User = get_user_model()

class LoginViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']

            user = authenticate(request, email=email, password=password)

            if user:
                _, token=AuthToken.objects.create(user)
                return Response(
                    {
                        "user": self.serializer_class(user).data,
                        "token": token
                    },
                    status=status.HTTP_200_OK
                )
            else:
                return Response({"error":"Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
            
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        

class RegisterViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# an example method to create a api
# the below given viewset enable frontend to request for all user's information
'''
class UserViewset(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

    def list(self, request):
        queryset = User.objects.all()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)
    
'''

class OpenTradeViewSet(viewsets.ModelViewSet):
    queryset = OpenTrade.objects.all()
    serializer_class = OpenTradeSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(methods=['POST'], detail=True)
    def close_trade(self, request, pk=None, *args, **kwargs):
        try:
            open_trade = self.get_object()
            close_price = request.data.get('close_price')

            if close_price is None:
                return Response({'error': 'close_price is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            ClosedTrade.objects.create(
                owner = open_trade.owner,
                symbol = open_trade.symbol,
                quantity = open_trade.quantity,
                buy_price = open_trade.buy_price,
                sell_price = close_price,
                bought_date = open_trade.bought_date
            )

            open_trade.delete()

            return Response({'status': 'Trade Successfully Closed'}, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ClosedTradeViewSet(viewsets.ModelViewSet):
    queryset = ClosedTrade.objects.all()
    serializer_class = ClosedTradeSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    '''provides `list` and `retrieve` actions.'''
    queryset = User.objects.all()
    serializer_class = UserSerializer

        