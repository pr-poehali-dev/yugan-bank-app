import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';

type CardType = 'virtual' | 'plastic';
type CardCategory = 'debit-child' | 'debit-youth' | 'credit' | 'sticker' | 'premium';
type PaymentSystem = 'Visa' | 'MasterCard' | 'МИР' | 'МИР-2' | 'UnionPay' | 'Visa Plus';

interface BankCard {
  id: string;
  name: string;
  category: CardCategory;
  type: CardType;
  number: string;
  balance: number;
  isBlocked: boolean;
  paymentSystem: PaymentSystem;
  cvv: string;
  expiryDate: string;
  dailyLimit: number;
  monthlyLimit: number;
}

interface User {
  phone: string;
  firstName: string;
  lastName: string;
  middleName: string;
  isPremium: boolean;
}

interface Friend {
  id: string;
  name: string;
  phone: string;
}

const generateCardNumber = (system: PaymentSystem): string => {
  const prefixes: { [key in PaymentSystem]: string } = {
    'Visa': '4',
    'MasterCard': '5',
    'МИР': '220',
    'МИР-2': '221',
    'UnionPay': '62',
    'Visa Plus': '4'
  };
  
  const prefix = prefixes[system];
  let cardNumber = prefix;
  
  while (cardNumber.length < 15) {
    cardNumber += Math.floor(Math.random() * 10);
  }
  
  let sum = 0;
  let isEven = true;
  
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i]);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  cardNumber += checkDigit;
  
  return cardNumber.replace(/(.{4})/g, '$1 ').trim();
};

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<'home' | 'cards' | 'transfers' | 'assistant' | 'more'>('home');
  
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  
  const [cards, setCards] = useState<BankCard[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState<BankCard | null>(null);
  const [showCardLimits, setShowCardLimits] = useState<BankCard | null>(null);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [showFriendsDialog, setShowFriendsDialog] = useState(false);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  
  const [selectedCardCategory, setSelectedCardCategory] = useState<CardCategory>('debit-youth');
  const [selectedCardType, setSelectedCardType] = useState<CardType>('virtual');
  
  const [creditAmount, setCreditAmount] = useState('');
  const [selectedCardForCredit, setSelectedCardForCredit] = useState('');
  
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendPhone, setNewFriendPhone] = useState('');
  
  const [isFlipped, setIsFlipped] = useState(false);

  const paymentSystems: PaymentSystem[] = ['Visa', 'MasterCard', 'МИР', 'МИР-2', 'UnionPay', 'Visa Plus'];

  const cardCategories = [
    { id: 'debit-child', name: 'Детская дебетовая', icon: 'Baby', color: 'from-pink-400 to-purple-400' },
    { id: 'debit-youth', name: 'Молодёжная', icon: 'Zap', color: 'from-purple-500 to-blue-500' },
    { id: 'credit', name: 'Кредитная', icon: 'CreditCard', color: 'from-blue-500 to-cyan-500' },
    { id: 'sticker', name: 'Стикер', icon: 'Tag', color: 'from-orange-400 to-pink-400' },
    { id: 'premium', name: 'Премиум', icon: 'Crown', color: 'from-yellow-400 to-orange-500' },
  ];

  const handleRegister = () => {
    if (!phone || !firstName || !lastName || !middleName) {
      toast.error('Заполните все поля');
      return;
    }
    
    const newUser: User = {
      phone,
      firstName,
      lastName,
      middleName,
      isPremium: false
    };
    
    setUser(newUser);
    
    const premiumCard: BankCard = {
      id: Date.now().toString(),
      name: 'Премиум карта',
      category: 'premium',
      type: 'virtual',
      number: generateCardNumber('Visa'),
      balance: 1000,
      isBlocked: false,
      paymentSystem: 'Visa',
      cvv: String(Math.floor(100 + Math.random() * 900)),
      expiryDate: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${new Date().getFullYear() % 100 + 3}`,
      dailyLimit: 100000,
      monthlyLimit: 500000
    };
    
    setCards([premiumCard]);
    setIsAuthenticated(true);
    toast.success('Добро пожаловать в Юган Банк! На вашу премиум-карту зачислено 1000 ₽');
  };

  const handleCreateCard = () => {
    const maxCards = user?.isPremium ? 10 : 3;
    
    if (cards.length >= maxCards) {
      if (!user?.isPremium) {
        toast.error(`Оформите премиум-подписку для создания более ${maxCards} карт`);
        setShowPremiumDialog(true);
      } else {
        toast.error(`Максимум ${maxCards} карт`);
      }
      return;
    }
    
    const randomSystem = paymentSystems[Math.floor(Math.random() * paymentSystems.length)];
    
    const newCard: BankCard = {
      id: Date.now().toString(),
      name: cardCategories.find(c => c.id === selectedCardCategory)?.name || '',
      category: selectedCardCategory,
      type: selectedCardType,
      number: generateCardNumber(randomSystem),
      balance: 0,
      isBlocked: false,
      paymentSystem: randomSystem,
      cvv: String(Math.floor(100 + Math.random() * 900)),
      expiryDate: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${new Date().getFullYear() % 100 + 3}`,
      dailyLimit: 50000,
      monthlyLimit: 200000
    };
    
    setCards([...cards, newCard]);
    setShowCardDialog(false);
    toast.success(`Карта ${newCard.name} создана`);
  };

  const handleBlockCard = (cardId: string) => {
    setCards(cards.map(c => c.id === cardId ? { ...c, isBlocked: !c.isBlocked } : c));
    const card = cards.find(c => c.id === cardId);
    toast.success(card?.isBlocked ? 'Карта разблокирована' : 'Карта заблокирована');
  };

  const handleDeleteCard = (cardId: string) => {
    setCards(cards.filter(c => c.id !== cardId));
    setShowCardDetails(null);
    toast.success('Карта удалена');
  };

  const handleApplyCredit = () => {
    if (!creditAmount || !selectedCardForCredit) {
      toast.error('Заполните все поля');
      return;
    }
    
    const amount = parseFloat(creditAmount);
    const maxCredit = user?.isPremium ? Infinity : 100000;
    
    if (amount > maxCredit && !user?.isPremium) {
      toast.error(`Оформите премиум для кредита без ограничений. Текущий лимит: ${maxCredit.toLocaleString('ru')} ₽`);
      return;
    }
    
    setCards(cards.map(c => 
      c.id === selectedCardForCredit 
        ? { ...c, balance: c.balance + amount }
        : c
    ));
    setShowCreditDialog(false);
    setCreditAmount('');
    setSelectedCardForCredit('');
    toast.success(`Кредит ${amount.toLocaleString('ru')} ₽ одобрен`);
  };

  const handleActivatePremium = () => {
    if (user) {
      setUser({ ...user, isPremium: true });
      toast.success('Премиум-подписка активирована! 🎉');
      setShowPremiumDialog(false);
    }
  };

  const handleAddFriend = () => {
    if (!newFriendName || !newFriendPhone) {
      toast.error('Заполните все поля');
      return;
    }
    
    const newFriend: Friend = {
      id: Date.now().toString(),
      name: newFriendName,
      phone: newFriendPhone
    };
    
    setFriends([...friends, newFriend]);
    setNewFriendName('');
    setNewFriendPhone('');
    toast.success(`${newFriendName} добавлен в друзья`);
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} скопирован`);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setCards([]);
    setFriends([]);
    setCurrentTab('home');
    toast.success('Вы вышли из аккаунта');
  };

  const handleUpdateCardLimits = (cardId: string, dailyLimit: number, monthlyLimit: number) => {
    setCards(cards.map(c => 
      c.id === cardId 
        ? { ...c, dailyLimit, monthlyLimit }
        : c
    ));
    toast.success('Лимиты обновлены');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-lg">
              <Icon name="Wallet" size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Юган Банк
            </h1>
            <p className="text-muted-foreground">Современный банкинг для вас</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Номер телефона</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+7 (___) ___-__-__"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Фамилия</Label>
              <Input
                id="lastName"
                placeholder="Иванов"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="firstName">Имя</Label>
              <Input
                id="firstName"
                placeholder="Иван"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="middleName">Отчество</Label>
              <Input
                id="middleName"
                placeholder="Иванович"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleRegister} 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-6 shadow-lg"
            >
              <Icon name="Fingerprint" size={20} className="mr-2" />
              Зарегистрироваться
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 pb-20">
      <div className="max-w-md mx-auto">
        {currentTab === 'home' && (
          <div className="p-4 space-y-6">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
              {user?.isPremium && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-yellow-400 text-black border-0">
                    <Icon name="Crown" size={14} className="mr-1" />
                    Premium
                  </Badge>
                </div>
              )}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-purple-100 text-sm">Добро пожаловать</p>
                  <h2 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h2>
                </div>
                <Icon name="Sparkles" size={32} />
              </div>
              <div className="mt-6">
                <p className="text-purple-100 text-sm">Общий баланс</p>
                <p className="text-4xl font-bold mt-1">
                  {cards.reduce((sum, c) => sum + c.balance, 0).toLocaleString('ru')} ₽
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Card 
                className="p-4 text-center cursor-pointer hover:shadow-lg transition-all border-0 shadow-md"
                onClick={() => setCurrentTab('transfers')}
              >
                <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <Icon name="Send" size={24} className="text-white" />
                </div>
                <p className="text-xs font-semibold">Перевод</p>
              </Card>
              
              <Card 
                className="p-4 text-center cursor-pointer hover:shadow-lg transition-all border-0 shadow-md"
                onClick={() => setShowCreditDialog(true)}
              >
                <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                  <Icon name="Wallet" size={24} className="text-white" />
                </div>
                <p className="text-xs font-semibold">Кредит</p>
              </Card>
              
              <Card 
                className="p-4 text-center cursor-pointer hover:shadow-lg transition-all border-0 shadow-md"
                onClick={() => setCurrentTab('assistant')}
              >
                <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <Icon name="Bot" size={24} className="text-white" />
                </div>
                <p className="text-xs font-semibold">Ассистент</p>
              </Card>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Мои карты</h3>
                <Button 
                  size="sm" 
                  onClick={() => setShowCardDialog(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  <Icon name="Plus" size={16} className="mr-1" />
                  Новая
                </Button>
              </div>
              
              {cards.length === 0 ? (
                <Card className="p-6 text-center border-0 shadow-lg">
                  <Icon name="CreditCard" size={48} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">У вас нет карт</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {cards.map((card) => {
                    const category = cardCategories.find(c => c.id === card.category);
                    return (
                      <Card
                        key={card.id}
                        className="p-4 cursor-pointer hover:shadow-xl transition-all border-0 shadow-lg bg-white"
                        onClick={() => setShowCardDetails(card)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category?.color} flex items-center justify-center`}>
                              <Icon name={category?.icon as any} size={20} className="text-white" />
                            </div>
                            <div>
                              <p className="font-semibold">{card.name}</p>
                              <p className="text-xs text-muted-foreground">{card.number}</p>
                              <Badge variant="outline" className="text-xs mt-1">{card.paymentSystem}</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{card.balance.toLocaleString('ru')} ₽</p>
                            {card.isBlocked && (
                              <Badge variant="destructive" className="text-xs">Заблокирована</Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'cards' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Мои карты</h2>
              <Button 
                onClick={() => setShowCardDialog(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500"
              >
                <Icon name="Plus" size={20} className="mr-2" />
                Оформить
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Карт: {cards.length} из {user?.isPremium ? '10' : '3'}
              {!user?.isPremium && <span className="text-purple-600 cursor-pointer ml-2" onClick={() => setShowPremiumDialog(true)}>Увеличить лимит</span>}
            </p>
            
            {cards.length === 0 ? (
              <Card className="p-8 text-center border-0 shadow-lg">
                <Icon name="CreditCard" size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">У вас пока нет карт</p>
                <Button onClick={() => setShowCardDialog(true)} className="bg-gradient-to-r from-purple-500 to-pink-500">
                  Оформить карту
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {cards.map((card) => {
                  const category = cardCategories.find(c => c.id === card.category);
                  return (
                    <Card
                      key={card.id}
                      className="p-4 cursor-pointer hover:shadow-xl transition-all border-0 shadow-lg"
                      onClick={() => setShowCardDetails(card)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category?.color} flex items-center justify-center`}>
                            <Icon name={category?.icon as any} size={24} className="text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{card.name}</p>
                            <p className="text-sm text-muted-foreground">{card.number}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{card.paymentSystem}</Badge>
                              <Badge variant="outline" className="text-xs">
                                {card.type === 'virtual' ? 'Виртуальная' : 'Пластиковая'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl">{card.balance.toLocaleString('ru')} ₽</p>
                          {card.isBlocked && (
                            <Badge variant="destructive" className="text-xs mt-1">Заблокирована</Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {currentTab === 'transfers' && (
          <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold">Переводы</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 text-center cursor-pointer hover:shadow-lg transition-all">
                <Icon name="User" size={32} className="mx-auto mb-2 text-purple-600" />
                <p className="text-sm font-semibold">По номеру телефона</p>
              </Card>
              <Card className="p-4 text-center cursor-pointer hover:shadow-lg transition-all">
                <Icon name="CreditCard" size={32} className="mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-semibold">По номеру карты</p>
              </Card>
            </div>
            
            <Card className="p-6 border-0 shadow-lg">
              <h3 className="font-bold mb-4">Перевод</h3>
              <div className="space-y-4">
                <div>
                  <Label>Номер телефона или карты</Label>
                  <Input placeholder="+7 (___) ___-__-__" className="mt-1" />
                </div>
                <div>
                  <Label>Сумма</Label>
                  <Input type="number" placeholder="0" className="mt-1" />
                </div>
                <div>
                  <Label>С карты</Label>
                  <select className="w-full p-2 border rounded-lg">
                    <option>Выберите карту</option>
                    {cards.map(c => (
                      <option key={c.id} value={c.id}>{c.name} - {c.number}</option>
                    ))}
                  </select>
                </div>
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
                  <Icon name="Send" size={20} className="mr-2" />
                  Перевести
                </Button>
              </div>
            </Card>
            
            <div>
              <h3 className="font-bold mb-3">Оплата услуг</h3>
              <div className="grid grid-cols-3 gap-3">
                {['МТС', 'Билайн', 'Мегафон', 'Теле2', 'Дом.ру', 'Ростелеком'].map(service => (
                  <Card key={service} className="p-3 text-center cursor-pointer hover:shadow-lg transition-all">
                    <p className="text-xs font-semibold">{service}</p>
                  </Card>
                ))}
              </div>
            </div>
            
            {friends.length > 0 && (
              <div>
                <h3 className="font-bold mb-3">Быстрый перевод друзьям</h3>
                <div className="space-y-2">
                  {friends.map(friend => (
                    <Card key={friend.id} className="p-3 flex items-center justify-between cursor-pointer hover:shadow-lg transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {friend.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{friend.name}</p>
                          <p className="text-xs text-muted-foreground">{friend.phone}</p>
                        </div>
                      </div>
                      <Icon name="Send" size={20} className="text-purple-600" />
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentTab === 'assistant' && (
          <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold">Банк-Бонг</h2>
            <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <Icon name="Bot" size={48} className="mb-4" />
              <h3 className="text-xl font-bold mb-2">Чем могу помочь?</h3>
              <p className="text-purple-100">Ваш личный голосовой помощник по банковским операциям</p>
            </Card>
            
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Icon name="Phone" size={24} />
                <span className="text-xs">Позвонить</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Icon name="MessageCircle" size={24} />
                <span className="text-xs">Написать</span>
              </Button>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground">Быстрые вопросы:</p>
              {['Как перевести деньги?', 'Оформить новую карту', 'Заблокировать карту', 'Получить кредит', 'Настроить лимиты'].map((q) => (
                <Button key={q} variant="outline" className="w-full justify-start h-auto p-4 text-left">
                  <Icon name="MessageCircle" size={20} className="mr-3 flex-shrink-0" />
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}

        {currentTab === 'more' && (
          <div className="p-4 space-y-4">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-6 text-white shadow-2xl relative">
              {user?.isPremium && (
                <Badge className="absolute top-4 right-4 bg-yellow-400 text-black border-0">
                  <Icon name="Crown" size={14} className="mr-1" />
                  Premium
                </Badge>
              )}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {user?.firstName[0]}{user?.lastName[0]}
                </div>
                <div>
                  <p className="text-2xl font-bold">{user?.firstName} {user?.lastName}</p>
                  <p className="text-purple-100">{user?.phone}</p>
                </div>
              </div>
            </div>

            {!user?.isPremium && (
              <Card 
                className="p-6 border-0 shadow-lg bg-gradient-to-br from-yellow-400 to-orange-500 text-white cursor-pointer hover:shadow-2xl transition-all"
                onClick={() => setShowPremiumDialog(true)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                      <Icon name="Crown" size={24} />
                      Премиум Юган
                    </h3>
                    <p className="text-sm opacity-90">До 10 карт, безлимитные кредиты и больше</p>
                  </div>
                  <Icon name="ChevronRight" size={24} />
                </div>
              </Card>
            )}

            <Card className="divide-y border-0 shadow-lg">
              <Button variant="ghost" className="w-full justify-start h-auto p-4">
                <Icon name="User" size={20} className="mr-3" />
                <span>Управление аккаунтом</span>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start h-auto p-4"
                onClick={() => setShowFriendsDialog(true)}
              >
                <Icon name="Users" size={20} className="mr-3" />
                <span>Друзья и семья</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start h-auto p-4">
                <Icon name="Settings" size={20} className="mr-3" />
                <span>Настройки</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start h-auto p-4">
                <Icon name="Bot" size={20} className="mr-3" />
                <span>Настройки ассистента</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start h-auto p-4">
                <Icon name="Zap" size={20} className="mr-3" />
                <span>Умные услуги</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start h-auto p-4">
                <Icon name="MessageCircle" size={20} className="mr-3" />
                <span>Поддержка</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start h-auto p-4">
                <Icon name="Baby" size={20} className="mr-3" />
                <span>Детский режим</span>
              </Button>
              <Button variant="ghost" onClick={handleLogout} className="w-full justify-start h-auto p-4 text-destructive">
                <Icon name="LogOut" size={20} className="mr-3" />
                <span>Выход</span>
              </Button>
            </Card>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t shadow-2xl">
          <div className="max-w-md mx-auto flex justify-around py-2">
            {[
              { id: 'home', icon: 'Home', label: 'Главная' },
              { id: 'cards', icon: 'CreditCard', label: 'Карты' },
              { id: 'transfers', icon: 'Send', label: 'Переводы' },
              { id: 'assistant', icon: 'Bot', label: 'Ассистент' },
              { id: 'more', icon: 'Menu', label: 'Ещё' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as any)}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${
                  currentTab === tab.id
                    ? 'text-purple-600 bg-purple-50'
                    : 'text-gray-500'
                }`}
              >
                <Icon name={tab.icon as any} size={22} />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={showCardDialog} onOpenChange={setShowCardDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Оформить карту</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Тип карты</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {cardCategories.filter(c => c.id !== 'premium').map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCardCategory === cat.id ? 'default' : 'outline'}
                    onClick={() => setSelectedCardCategory(cat.id as CardCategory)}
                    className="h-auto py-3 text-xs"
                  >
                    <Icon name={cat.icon as any} size={18} className="mr-2" />
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Формат</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant={selectedCardType === 'virtual' ? 'default' : 'outline'}
                  onClick={() => setSelectedCardType('virtual')}
                >
                  <Icon name="Smartphone" size={20} className="mr-2" />
                  Виртуальная
                </Button>
                <Button
                  variant={selectedCardType === 'plastic' ? 'default' : 'outline'}
                  onClick={() => setSelectedCardType('plastic')}
                >
                  <Icon name="CreditCard" size={20} className="mr-2" />
                  Пластиковая
                </Button>
              </div>
            </div>
            <Button onClick={handleCreateCard} className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
              Оформить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={!!showCardDetails} onOpenChange={() => { setShowCardDetails(null); setIsFlipped(false); }}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          {showCardDetails && (
            <>
              <SheetHeader>
                <SheetTitle>Управление картой</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="perspective-1000">
                  <div 
                    className={`relative w-full h-52 transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div 
                      className={`absolute w-full h-full p-6 rounded-2xl bg-gradient-to-br ${cardCategories.find(c => c.id === showCardDetails.category)?.color} text-white shadow-2xl backface-hidden`}
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="flex justify-between items-start mb-8">
                        <p className="text-sm opacity-80">{showCardDetails.name}</p>
                        <Badge className="bg-white/20 text-white border-0">{showCardDetails.paymentSystem}</Badge>
                      </div>
                      <p className="text-2xl font-bold mb-6 tracking-wider">{showCardDetails.number}</p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs opacity-70 mb-1">Баланс</p>
                          <p className="text-3xl font-bold">{showCardDetails.balance.toLocaleString('ru')} ₽</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs opacity-70">Действует до</p>
                          <p className="text-sm font-semibold">{showCardDetails.expiryDate}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={`absolute w-full h-full p-6 rounded-2xl bg-gradient-to-br ${cardCategories.find(c => c.id === showCardDetails.category)?.color} text-white shadow-2xl backface-hidden rotate-y-180`}
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <div className="h-12 bg-black/50 -mx-6 mt-4 mb-8"></div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs opacity-70 mb-1">CVV</p>
                          <p className="text-2xl font-bold tracking-wider">{showCardDetails.cvv}</p>
                        </div>
                        <div>
                          <p className="text-xs opacity-70 mb-1">Номер карты</p>
                          <p className="text-sm">{showCardDetails.number}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <Icon name="RefreshCw" size={20} className="mr-2" />
                  {isFlipped ? 'Показать лицевую сторону' : 'Перевернуть карту'}
                </Button>

                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCopyToClipboard(showCardDetails.number.replace(/\s/g, ''), 'Номер карты')}
                  >
                    <Icon name="Copy" size={16} className="mr-1" />
                    Номер
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCopyToClipboard(showCardDetails.cvv, 'CVV')}
                  >
                    <Icon name="Copy" size={16} className="mr-1" />
                    CVV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCopyToClipboard(showCardDetails.expiryDate, 'Срок')}
                  >
                    <Icon name="Copy" size={16} className="mr-1" />
                    Срок
                  </Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                    <div className="flex items-center gap-3">
                      <Icon name={showCardDetails.isBlocked ? 'Lock' : 'Unlock'} size={20} />
                      <span className="font-medium">{showCardDetails.isBlocked ? 'Разблокировать' : 'Заблокировать'} карту</span>
                    </div>
                    <Switch
                      checked={showCardDetails.isBlocked}
                      onCheckedChange={() => handleBlockCard(showCardDetails.id)}
                    />
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto p-4"
                    onClick={() => {
                      setShowCardLimits(showCardDetails);
                      setShowCardDetails(null);
                    }}
                  >
                    <Icon name="Settings" size={20} className="mr-3" />
                    Настроить лимиты
                  </Button>

                  <Button variant="outline" className="w-full justify-start h-auto p-4">
                    <Icon name="Edit" size={20} className="mr-3" />
                    Переименовать
                  </Button>

                  <Button variant="outline" className="w-full justify-start h-auto p-4">
                    <Icon name="History" size={20} className="mr-3" />
                    История операций
                  </Button>

                  <Separator />

                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteCard(showCardDetails.id)}
                    className="w-full justify-start h-auto p-4"
                  >
                    <Icon name="Trash2" size={20} className="mr-3" />
                    Удалить карту
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={!!showCardLimits} onOpenChange={() => setShowCardLimits(null)}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          {showCardLimits && (
            <>
              <SheetHeader>
                <SheetTitle>Настройка лимитов</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-8">
                <Card className="p-4 bg-purple-50 border-purple-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon name="Info" size={20} className="text-purple-600" />
                    <p className="font-semibold text-purple-900">Лимиты помогают контролировать расходы</p>
                  </div>
                  <p className="text-sm text-purple-700">Установите максимальную сумму трат в день и месяц</p>
                </Card>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-base font-semibold">Дневной лимит</Label>
                      <span className="text-lg font-bold text-purple-600">
                        {showCardLimits.dailyLimit.toLocaleString('ru')} ₽
                      </span>
                    </div>
                    <Slider
                      value={[showCardLimits.dailyLimit]}
                      onValueChange={(value) => {
                        const updated = { ...showCardLimits, dailyLimit: value[0] };
                        setShowCardLimits(updated);
                      }}
                      max={200000}
                      step={5000}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0 ₽</span>
                      <span>200 000 ₽</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-base font-semibold">Месячный лимит</Label>
                      <span className="text-lg font-bold text-purple-600">
                        {showCardLimits.monthlyLimit.toLocaleString('ru')} ₽
                      </span>
                    </div>
                    <Slider
                      value={[showCardLimits.monthlyLimit]}
                      onValueChange={(value) => {
                        const updated = { ...showCardLimits, monthlyLimit: value[0] };
                        setShowCardLimits(updated);
                      }}
                      max={1000000}
                      step={10000}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0 ₽</span>
                      <span>1 000 000 ₽</span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                  onClick={() => {
                    handleUpdateCardLimits(showCardLimits.id, showCardLimits.dailyLimit, showCardLimits.monthlyLimit);
                    setShowCardLimits(null);
                  }}
                >
                  Сохранить лимиты
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Оформить кредит</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!user?.isPremium && (
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <Icon name="Info" size={16} className="inline mr-1" />
                  Лимит кредита: 100 000 ₽. 
                  <span className="text-purple-600 cursor-pointer ml-1" onClick={() => { setShowCreditDialog(false); setShowPremiumDialog(true); }}>
                    Оформите премиум
                  </span> для безлимитных кредитов
                </p>
              </Card>
            )}
            
            <div>
              <Label>Сумма кредита</Label>
              <Input
                type="number"
                placeholder="10000"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="mt-1"
              />
              {!user?.isPremium && (
                <p className="text-xs text-muted-foreground mt-1">Максимум: 100 000 ₽</p>
              )}
            </div>
            <div>
              <Label>На карту</Label>
              <select
                className="w-full p-2 border rounded-lg mt-1"
                value={selectedCardForCredit}
                onChange={(e) => setSelectedCardForCredit(e.target.value)}
              >
                <option value="">Выберите карту</option>
                {cards.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.number}</option>
                ))}
              </select>
            </div>
            <Button onClick={handleApplyCredit} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500">
              <Icon name="CheckCircle" size={20} className="mr-2" />
              Получить кредит
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Icon name="Crown" size={28} className="text-yellow-500" />
              Премиум Юган
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-2xl">
              <h3 className="text-3xl font-bold mb-2">Безлимитные возможности</h3>
              <p className="opacity-90">Получите максимум от банковских услуг</p>
            </div>
            
            <div className="space-y-3">
              {[
                'До 10 банковских карт одновременно',
                'Безлимитные кредиты без ограничений',
                'Расширенные настройки лимитов карт',
                'Приоритетная поддержка 24/7',
                'Эксклюзивные предложения и кэшбек',
                'Семейный банкинг с полным доступом'
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Icon name="CheckCircle" size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{feature}</p>
                </div>
              ))}
            </div>
            
            <Button 
              onClick={handleActivatePremium}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-6 text-lg"
            >
              <Icon name="Crown" size={24} className="mr-2" />
              Активировать премиум
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFriendsDialog} onOpenChange={setShowFriendsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Друзья и семья</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Card className="p-4 bg-purple-50 border-purple-200">
              <p className="text-sm text-purple-900">
                <Icon name="Users" size={16} className="inline mr-1" />
                Добавьте друзей для быстрых переводов и создания семейного банкинга
              </p>
            </Card>
            
            <div className="space-y-3">
              <div>
                <Label>Имя</Label>
                <Input
                  placeholder="Иван Иванов"
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Номер телефона</Label>
                <Input
                  type="tel"
                  placeholder="+7 (___) ___-__-__"
                  value={newFriendPhone}
                  onChange={(e) => setNewFriendPhone(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleAddFriend} className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
                <Icon name="UserPlus" size={20} className="mr-2" />
                Добавить друга
              </Button>
            </div>
            
            {friends.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Мои друзья ({friends.length})</p>
                  {friends.map(friend => (
                    <Card key={friend.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {friend.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{friend.name}</p>
                          <p className="text-xs text-muted-foreground">{friend.phone}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Icon name="Trash2" size={16} className="text-destructive" />
                      </Button>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
