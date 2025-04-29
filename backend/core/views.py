from rest_framework import viewsets, permissions
from .serializers import *
from .models import *
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from django.contrib.auth import get_user_model, authenticate
from knox.models import AuthToken
from core.permissions import IsOwner
import yfinance as yf

User = get_user_model()

class LoginViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            print(f"email: {email}, password: {password}")

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

    # def perform_create(self, serializer):
    #     serializer.save(owner=self.request.user)

    def create(self, request):
        try:
            symbol = request.data.get("symbol")
            if not symbol:
                return Response({"error":"symbol is invalid"},status=status.HTTP_400_BAD_REQUEST)
            
            stock = yf.Ticker(symbol)
            hist = stock.history(period='1d', interval='1m')

            if hist.empty:
                return Response({"error": f"could not find price for symbol {symbol}"}, status=status.HTTP_400_BAD_REQUEST)
            
            current_price = round(hist["Close"].iloc[-1], 2)

            amount_required = current_price * request.data.get('quantity')
            user = request.user
            if user.balance < amount_required:
                return Response({"error": "Insufficient balance, cannot complete trade"}, status=status.HTTP_400_BAD_REQUEST)
            

            
            data = request.data.copy()
            data['buy_price'] = current_price

            serializer = self.serializer_class(data = data)

            if serializer.is_valid():
                serializer.save(owner=request.user)
                user.balance = user.balance - amount_required
                user.amount_invested  = user.amount_invested + amount_required
                user.save()
                return Response({
                    "message":"new trade opened",
                    "trade": serializer.data 
                }, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            print(f'Error : {str(e)}')
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(methods=['POST'], detail=True)
    def close_trade(self, request, pk=None, *args, **kwargs):
        try:
            open_trade = self.get_object()
            symbol = open_trade.symbol
            stock = yf.Ticker(symbol)
            hist = stock.history(period='1d', interval='1m')
            if not hist.empty:
                current_price = round(hist["Close"].iloc[-1], 2)
            else:
                return Response({"error": f"could not find price for symbol {symbol}"}, status=status.HTTP_400_BAD_REQUEST)
            
            user = request.user
            user.user_p_and_l = user.user_p_and_l + ((current_price - open_trade.buy_price) * open_trade.quantity)
            user.balance = user.balance + (current_price * open_trade.quantity)
            user.save()
            
            ClosedTrade.objects.create(
                owner = open_trade.owner,
                symbol = open_trade.symbol,
                quantity = open_trade.quantity,
                buy_price = open_trade.buy_price,
                sell_price = current_price,
                bought_date = open_trade.bought_date
            )

            open_trade.delete()

            return Response({
                'message': 'Trade Successfully Closed',
                'symbol': symbol,
                'sell_price': current_price
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            print(f'error in close trade: {str(e)}')
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
    permission_classes = [permissions.IsAuthenticated]

    '''creates an additional endpoint /users/me to access particular user details'''
    @action(detail=False, methods=['GET'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    '''endpoint to clear balance /users/reset_balance'''
    @action(detail=False, methods=['DELETE'])
    def reset_balance(self, request):
        user = request.user
        try:

            OpenTrade.objects.filter(owner=user).delete()
            ClosedTrade.objects.filter(owner=user).delete()

            user.balance = 100000
            user.amount_invested = 0
            user.user_p_and_l = 0

            user.save()
            return Response({
                "message": "balance reset successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f'error occurred while resetting: {e}')
            return Response({"error" : "error reset balance UNSUCCESSFUL"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


