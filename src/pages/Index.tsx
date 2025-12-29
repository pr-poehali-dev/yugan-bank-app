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
type CardCategory = 'debit-child' | 'debit-youth' | 'credit' | 'sticker' | 'premium' | 'super-credit';
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

interface Family {
  id: string;
  code: string;
  members: string[];
  owner: string;
}

const playSound = (type: 'success' | 'error' | 'click' | 'notification') => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  const sounds = {
    success: { freq: 800, duration: 0.15, type: 'sine' as OscillatorType },
    error: { freq: 300, duration: 0.2, type: 'sawtooth' as OscillatorType },
    click: { freq: 600, duration: 0.05, type: 'square' as OscillatorType },
    notification: { freq: 1000, duration: 0.1, type: 'sine' as OscillatorType }
  };
  
  const sound = sounds[type];
  oscillator.type = sound.type;
  oscillator.frequency.setValueAtTime(sound.freq, audioContext.currentTime);
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + sound.duration);
};

const generateFamilyCode = (): string => {
  const russianWords = ['РУЛЕТКА', 'ПОБЕДА', 'ЗВЕЗДА', 'КОСМОС', 'ОГОНЬ', 'МОЛНИЯ', 'РАДУГА', 'СОКОЛ'];
  const word = russianWords[Math.floor(Math.random() * russianWords.length)];
  const numbers = Math.floor(1000 + Math.random() * 9000);
  return `${word}${numbers}`;
};

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
  const [family, setFamily] = useState<Family | null>(null);
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState<BankCard | null>(null);
  const [showCardLimits, setShowCardLimits] = useState<BankCard | null>(null);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [showPremiumCardChoice, setShowPremiumCardChoice] = useState(false);
  const [showFamilyDialog, setShowFamilyDialog] = useState(false);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  
  const [selectedCardCategory, setSelectedCardCategory] = useState<CardCategory>('debit-youth');
  const [selectedCardType, setSelectedCardType] = useState<CardType>('virtual');
  
  const [creditAmount, setCreditAmount] = useState('');
  const [selectedCardForCredit, setSelectedCardForCredit] = useState('');
  
  const [familyCodeInput, setFamilyCodeInput] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);

  const paymentSystems: PaymentSystem[] = ['Visa', 'MasterCard', 'МИР', 'МИР-2', 'UnionPay', 'Visa Plus'];

  const cardCategories = [
    { id: 'debit-child', name: 'Детская', icon: 'Baby', color: 'from-pink-400 to-purple-400', premiumOnly: false },
    { id: 'debit-youth', name: 'Молодёжная', icon: 'Zap', color: 'from-purple-500 to-blue-500', premiumOnly: false },
    { id: 'credit', name: 'Кредитная', icon: 'CreditCard', color: 'from-blue-500 to-cyan-500', premiumOnly: false },
    { id: 'sticker', name: 'Стикер', icon: 'Tag', color: 'from-orange-400 to-pink-400', premiumOnly: false },
    { id: 'premium', name: 'Премиум', icon: 'Crown', color: 'from-yellow-400 to-orange-500', premiumOnly: false },
    { id: 'super-credit', name: 'Супер-кредит', icon: 'Sparkles', color: 'from-violet-600 to-purple-600', premiumOnly: true },
  ];

  const handleRegister = () => {
    if (!phone || !firstName || !lastName || !middleName) {
      playSound('error');
      toast.error('Заполните все поля');
      return;
    }
    
    playSound('success');
    
    const newUser: User = {
      phone,
      firstName,
      lastName,
      middleName,
      isPremium: false
    };
    
    setUser(newUser);
    
    const starterCard: BankCard = {
      id: Date.now().toString(),
      name: 'Стартовая карта',
      category: 'debit-youth',
      type: 'virtual',
      number: generateCardNumber('Visa'),
      balance: 0,
      isBlocked: false,
      paymentSystem: 'Visa',
      cvv: String(Math.floor(100 + Math.random() * 900)),
      expiryDate: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${new Date().getFullYear() % 100 + 3}`,
      dailyLimit: 50000,
      monthlyLimit: 200000
    };
    
    setCards([starterCard]);
    setIsAuthenticated(true);
    toast.success('Добро пожаловать в Юган Банк!');
  };

  const handleCreateCard = () => {
    const maxCards = user?.isPremium ? 10 : 3;
    
    if (cards.length >= maxCards) {
      playSound('error');
      if (!user?.isPremium) {
        toast.error(`Оформите премиум-подписку для создания более ${maxCards} карт`);
        setShowPremiumDialog(true);
      } else {
        toast.error(`Максимум ${maxCards} карт`);
      }
      return;
    }
    
    if (selectedCardCategory === 'super-credit' && !user?.isPremium) {
      playSound('error');
      toast.error('Супер-кредит карта доступна только с премиум-подпиской');
      setShowPremiumDialog(true);
      return;
    }
    
    playSound('success');
    
    const randomSystem = paymentSystems[Math.floor(Math.random() * paymentSystems.length)];
    
    const newCard: BankCard = {
      id: Date.now().toString(),
      name: cardCategories.find(c => c.id === selectedCardCategory)?.name || '',
      category: selectedCardCategory,
      type: selectedCardType,
      number: generateCardNumber(randomSystem),
      balance: selectedCardCategory === 'super-credit' ? 50000 : 0,
      isBlocked: false,
      paymentSystem: randomSystem,
      cvv: String(Math.floor(100 + Math.random() * 900)),
      expiryDate: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${new Date().getFullYear() % 100 + 3}`,
      dailyLimit: selectedCardCategory === 'super-credit' ? 500000 : 50000,
      monthlyLimit: selectedCardCategory === 'super-credit' ? 2000000 : 200000
    };
    
    setCards([...cards, newCard]);
    setShowCardDialog(false);
    toast.success(`Карта ${newCard.name} создана`);
  };

  const handleBlockCard = (cardId: string) => {
    playSound('click');
    setCards(cards.map(c => c.id === cardId ? { ...c, isBlocked: !c.isBlocked } : c));
    const card = cards.find(c => c.id === cardId);
    toast.success(card?.isBlocked ? 'Карта разблокирована' : 'Карта заблокирована');
  };

  const handleDeleteCard = (cardId: string) => {
    playSound('notification');
    setCards(cards.filter(c => c.id !== cardId));
    setShowCardDetails(null);
    toast.success('Карта удалена');
  };

  const handleApplyCredit = () => {
    if (!creditAmount || !selectedCardForCredit) {
      playSound('error');
      toast.error('Заполните все поля');
      return;
    }
    
    const amount = parseFloat(creditAmount);
    const maxCredit = user?.isPremium ? Infinity : 100000;
    
    if (amount > maxCredit && !user?.isPremium) {
      playSound('error');
      toast.error(`Оформите премиум для кредита без ограничений. Текущий лимит: ${maxCredit.toLocaleString('ru')} ₽`);
      return;
    }
    
    playSound('success');
    
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
    playSound('success');
    setShowPremiumDialog(false);
    setShowPremiumCardChoice(true);
  };

  const handleChoosePremiumCard = (type: 'standard' | 'premium') => {
    if (user) {
      setUser({ ...user, isPremium: true });
      
      const cardConfig = type === 'standard' 
        ? { name: 'Обычная карта', balance: 5000, color: 'from-blue-500 to-cyan-500' }
        : { name: 'Премиум карта', balance: 1000, color: 'from-yellow-400 to-orange-500' };
      
      const bonusCard: BankCard = {
        id: Date.now().toString(),
        name: cardConfig.name,
        category: type === 'premium' ? 'premium' : 'credit',
        type: 'virtual',
        number: generateCardNumber('Visa'),
        balance: cardConfig.balance,
        isBlocked: false,
        paymentSystem: 'Visa',
        cvv: String(Math.floor(100 + Math.random() * 900)),
        expiryDate: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${new Date().getFullYear() % 100 + 3}`,
        dailyLimit: 100000,
        monthlyLimit: 500000
      };
      
      setCards([...cards, bonusCard]);
      setShowPremiumCardChoice(false);
      playSound('notification');
      toast.success(`Премиум активирован! ${cardConfig.name} с балансом ${cardConfig.balance.toLocaleString('ru')} ₽ добавлена 🎉`);
    }
  };

  const handleCreateFamily = () => {
    if (!user) return;
    
    const code = generateFamilyCode();
    const newFamily: Family = {
      id: Date.now().toString(),
      code,
      members: [user.phone],
      owner: user.phone
    };
    
    setFamily(newFamily);
    playSound('success');
    toast.success(`Семья создана! Код: ${code}`);
  };

  const handleJoinFamily = () => {
    if (!familyCodeInput) {
      playSound('error');
      toast.error('Введите код семьи');
      return;
    }
    
    if (!user) return;
    
    const newFamily: Family = {
      id: Date.now().toString(),
      code: familyCodeInput,
      members: [user.phone],
      owner: familyCodeInput
    };
    
    setFamily(newFamily);
    setFamilyCodeInput('');
    playSound('success');
    toast.success('Вы присоединились к семье!');
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    playSound('click');
    toast.success(`${label} скопирован`);
  };

  const handleLogout = () => {
    playSound('notification');
    setIsAuthenticated(false);
    setUser(null);
    setCards([]);
    setFamily(null);
    setCurrentTab('home');
    toast.success('Вы вышли из аккаунта');
  };

  const handleUpdateCardLimits = (cardId: string, dailyLimit: number, monthlyLimit: number) => {
    playSound('success');
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
        <Card className="w-full max-w-md p-8 shadow-2xl border-0 bg-white/90 backdrop-blur-xl animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl animate-scale-in">
              <Icon name="Wallet" size={48} className="text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-3 animate-fade-in">
              Юган Банк
            </h1>
            <p className="text-muted-foreground text-lg">Современный банкинг для вас</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone" className="text-base">Номер телефона</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+7 (___) ___-__-__"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 h-12"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-base">Фамилия</Label>
              <Input
                id="lastName"
                placeholder="Иванов"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-2 h-12"
              />
            </div>
            <div>
              <Label htmlFor="firstName" className="text-base">Имя</Label>
              <Input
                id="firstName"
                placeholder="Иван"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-2 h-12"
              />
            </div>
            <div>
              <Label htmlFor="middleName" className="text-base">Отчество</Label>
              <Input
                id="middleName"
                placeholder="Иванович"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="mt-2 h-12"
              />
            </div>
            <Button 
              onClick={handleRegister} 
              className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white font-bold py-7 text-lg shadow-2xl mt-6"
            >
              <Icon name="Fingerprint" size={24} className="mr-3" />
              Зарегистрироваться
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 pb-24">
      <div className="max-w-md mx-auto">
        {currentTab === 'home' && (
          <div className="p-4 space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16"></div>
              
              {user?.isPremium && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-yellow-400 text-black border-0 font-bold px-3 py-1">
                    <Icon name="Crown" size={16} className="mr-1" />
                    Premium
                  </Badge>
                </div>
              )}
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-purple-100 text-sm mb-1">Добро пожаловать</p>
                    <h2 className="text-3xl font-bold">{user?.firstName}</h2>
                  </div>
                  <Icon name="Sparkles" size={36} className="animate-pulse" />
                </div>
                <div className="mt-8">
                  <p className="text-purple-100 text-sm mb-2">Общий баланс</p>
                  <p className="text-5xl font-bold">
                    {cards.reduce((sum, c) => sum + c.balance, 0).toLocaleString('ru')} ₽
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Card 
                className="p-4 text-center cursor-pointer hover:scale-105 hover:shadow-2xl transition-all border-0 shadow-lg bg-white"
                onClick={() => { playSound('click'); setCurrentTab('transfers'); }}
              >
                <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Icon name="Send" size={28} className="text-white" />
                </div>
                <p className="text-xs font-bold">Перевод</p>
              </Card>
              
              <Card 
                className="p-4 text-center cursor-pointer hover:scale-105 hover:shadow-2xl transition-all border-0 shadow-lg bg-white"
                onClick={() => { playSound('click'); setShowCreditDialog(true); }}
              >
                <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Icon name="Wallet" size={28} className="text-white" />
                </div>
                <p className="text-xs font-bold">Кредит</p>
              </Card>
              
              <Card 
                className="p-4 text-center cursor-pointer hover:scale-105 hover:shadow-2xl transition-all border-0 shadow-lg bg-white"
                onClick={() => { playSound('click'); setCurrentTab('assistant'); }}
              >
                <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Icon name="Bot" size={28} className="text-white" />
                </div>
                <p className="text-xs font-bold">Ассистент</p>
              </Card>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Мои карты</h3>
                <Button 
                  size="sm" 
                  onClick={() => { playSound('click'); setShowCardDialog(true); }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg"
                >
                  <Icon name="Plus" size={18} className="mr-1" />
                  Новая
                </Button>
              </div>
              
              {cards.length === 0 ? (
                <Card className="p-8 text-center border-0 shadow-lg">
                  <Icon name="CreditCard" size={56} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4 text-lg">У вас нет карт</p>
                  <Button onClick={() => setShowCardDialog(true)} className="bg-gradient-to-r from-purple-500 to-pink-500">
                    Оформить карту
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {cards.slice(0, 3).map((card) => {
                    const category = cardCategories.find(c => c.id === card.category);
                    return (
                      <Card
                        key={card.id}
                        className="p-5 cursor-pointer hover:scale-102 hover:shadow-2xl transition-all border-0 shadow-lg bg-white"
                        onClick={() => { playSound('click'); setShowCardDetails(card); }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category?.color} flex items-center justify-center shadow-lg`}>
                              <Icon name={category?.icon as any} size={24} className="text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-base">{card.name}</p>
                              <p className="text-xs text-muted-foreground">{card.number}</p>
                              <Badge variant="outline" className="text-xs mt-1">{card.paymentSystem}</Badge>
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
                  {cards.length > 3 && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => { playSound('click'); setCurrentTab('cards'); }}
                    >
                      Показать все карты ({cards.length})
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'cards' && (
          <div className="p-4 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Мои карты</h2>
              <Button 
                onClick={() => { playSound('click'); setShowCardDialog(true); }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg"
              >
                <Icon name="Plus" size={20} className="mr-2" />
                Оформить
              </Button>
            </div>
            
            <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <p className="text-sm font-semibold">
                Карт: {cards.length} из {user?.isPremium ? '10' : '3'}
                {!user?.isPremium && (
                  <span 
                    className="text-purple-600 cursor-pointer ml-2 underline" 
                    onClick={() => { playSound('click'); setShowPremiumDialog(true); }}
                  >
                    Увеличить лимит
                  </span>
                )}
              </p>
            </Card>
            
            {cards.length === 0 ? (
              <Card className="p-10 text-center border-0 shadow-xl">
                <Icon name="CreditCard" size={64} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-6 text-lg">У вас пока нет карт</p>
                <Button onClick={() => setShowCardDialog(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
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
                      className="p-5 cursor-pointer hover:scale-102 hover:shadow-2xl transition-all border-0 shadow-lg"
                      onClick={() => { playSound('click'); setShowCardDetails(card); }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${category?.color} flex items-center justify-center shadow-lg`}>
                            <Icon name={category?.icon as any} size={28} className="text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-lg">{card.name}</p>
                            <p className="text-sm text-muted-foreground mb-1">{card.number}</p>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">{card.paymentSystem}</Badge>
                              <Badge variant="outline" className="text-xs">
                                {card.type === 'virtual' ? 'Виртуальная' : 'Пластиковая'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-2xl">{card.balance.toLocaleString('ru')} ₽</p>
                          {card.isBlocked && (
                            <Badge variant="destructive" className="text-xs mt-2">Заблокирована</Badge>
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
          <div className="p-4 space-y-5 animate-fade-in">
            <h2 className="text-3xl font-bold">Переводы</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-5 text-center cursor-pointer hover:scale-105 hover:shadow-xl transition-all border-0 shadow-lg">
                <Icon name="User" size={40} className="mx-auto mb-3 text-purple-600" />
                <p className="text-sm font-bold">По номеру телефона</p>
              </Card>
              <Card className="p-5 text-center cursor-pointer hover:scale-105 hover:shadow-xl transition-all border-0 shadow-lg">
                <Icon name="CreditCard" size={40} className="mx-auto mb-3 text-blue-600" />
                <p className="text-sm font-bold">По номеру карты</p>
              </Card>
            </div>
            
            <Card className="p-6 border-0 shadow-xl">
              <h3 className="font-bold text-lg mb-5">Перевод</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-base">Номер телефона или карты</Label>
                  <Input placeholder="+7 (___) ___-__-__" className="mt-2 h-12" />
                </div>
                <div>
                  <Label className="text-base">Сумма</Label>
                  <Input type="number" placeholder="0" className="mt-2 h-12" />
                </div>
                <div>
                  <Label className="text-base">С карты</Label>
                  <select className="w-full p-3 border rounded-lg mt-2 h-12">
                    <option>Выберите карту</option>
                    {cards.map(c => (
                      <option key={c.id} value={c.id}>{c.name} - {c.number}</option>
                    ))}
                  </select>
                </div>
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 h-12 text-base font-bold shadow-lg">
                  <Icon name="Send" size={20} className="mr-2" />
                  Перевести
                </Button>
              </div>
            </Card>
            
            <div>
              <h3 className="font-bold text-lg mb-3">Оплата услуг</h3>
              <div className="grid grid-cols-3 gap-3">
                {['МТС', 'Билайн', 'Мегафон', 'Теле2', 'Дом.ру', 'Ростелеком'].map(service => (
                  <Card key={service} className="p-4 text-center cursor-pointer hover:scale-105 hover:shadow-lg transition-all border-0 shadow-md">
                    <p className="text-sm font-bold">{service}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'assistant' && (
          <div className="p-4 space-y-5 animate-fade-in">
            <h2 className="text-3xl font-bold">Банк-Бонг</h2>
            <Card className="p-8 border-0 shadow-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white">
              <Icon name="Bot" size={64} className="mb-4 animate-pulse" />
              <h3 className="text-2xl font-bold mb-3">Чем могу помочь?</h3>
              <p className="text-purple-100 text-lg">Ваш личный голосовой помощник по банковским операциям</p>
            </Card>
            
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-xl">
                <Icon name="Phone" size={32} />
                <span className="text-sm font-bold">Позвонить</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-xl">
                <Icon name="MessageCircle" size={32} />
                <span className="text-sm font-bold">Написать</span>
              </Button>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm font-bold text-muted-foreground">Быстрые вопросы:</p>
              {['Как перевести деньги?', 'Оформить новую карту', 'Заблокировать карту', 'Получить кредит', 'Настроить лимиты'].map((q) => (
                <Button key={q} variant="outline" className="w-full justify-start h-auto p-5 text-left shadow-md hover:shadow-lg">
                  <Icon name="MessageCircle" size={22} className="mr-3 flex-shrink-0" />
                  <span className="font-medium">{q}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {currentTab === 'more' && (
          <div className="p-4 space-y-5 animate-fade-in">
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              
              {user?.isPremium && (
                <Badge className="absolute top-4 right-4 bg-yellow-400 text-black border-0 font-bold px-3 py-1">
                  <Icon name="Crown" size={18} className="mr-1" />
                  Premium
                </Badge>
              )}
              
              <div className="relative z-10 flex items-center gap-5">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                  {user?.firstName[0]}{user?.lastName[0]}
                </div>
                <div>
                  <p className="text-3xl font-bold mb-1">{user?.firstName} {user?.lastName}</p>
                  <p className="text-purple-100 text-lg">{user?.phone}</p>
                </div>
              </div>
            </div>

            {!user?.isPremium && (
              <Card 
                className="p-6 border-0 shadow-2xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white cursor-pointer hover:scale-102 hover:shadow-3xl transition-all"
                onClick={() => { playSound('click'); setShowPremiumDialog(true); }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-3">
                      <Icon name="Crown" size={32} />
                      Премиум Юган
                    </h3>
                    <p className="text-base opacity-95">До 10 карт, безлимитные кредиты и больше</p>
                  </div>
                  <Icon name="ChevronRight" size={32} />
                </div>
              </Card>
            )}

            <Card className="divide-y border-0 shadow-xl">
              <Button variant="ghost" className="w-full justify-start h-auto p-5 text-base">
                <Icon name="User" size={24} className="mr-4" />
                <span className="font-semibold">Управление аккаунтом</span>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start h-auto p-5 text-base"
                onClick={() => { playSound('click'); setShowFamilyDialog(true); }}
              >
                <Icon name="Users" size={24} className="mr-4" />
                <div className="flex items-center justify-between flex-1">
                  <span className="font-semibold">Семья</span>
                  {family && (
                    <Badge variant="outline" className="ml-2">
                      {family.code}
                    </Badge>
                  )}
                </div>
              </Button>
              <Button variant="ghost" className="w-full justify-start h-auto p-5 text-base">
                <Icon name="Settings" size={24} className="mr-4" />
                <span className="font-semibold">Настройки</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start h-auto p-5 text-base">
                <Icon name="Bot" size={24} className="mr-4" />
                <span className="font-semibold">Настройки ассистента</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start h-auto p-5 text-base">
                <Icon name="Zap" size={24} className="mr-4" />
                <span className="font-semibold">Умные услуги</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start h-auto p-5 text-base">
                <Icon name="MessageCircle" size={24} className="mr-4" />
                <span className="font-semibold">Поддержка</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start h-auto p-5 text-base">
                <Icon name="Baby" size={24} className="mr-4" />
                <span className="font-semibold">Детский режим</span>
              </Button>
              <Button variant="ghost" onClick={handleLogout} className="w-full justify-start h-auto p-5 text-destructive text-base">
                <Icon name="LogOut" size={24} className="mr-4" />
                <span className="font-semibold">Выход</span>
              </Button>
            </Card>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t shadow-2xl">
          <div className="max-w-md mx-auto flex justify-around py-3">
            {[
              { id: 'home', icon: 'Home', label: 'Главная' },
              { id: 'cards', icon: 'CreditCard', label: 'Карты' },
              { id: 'transfers', icon: 'Send', label: 'Переводы' },
              { id: 'assistant', icon: 'Bot', label: 'Ассистент' },
              { id: 'more', icon: 'Menu', label: 'Ещё' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { playSound('click'); setCurrentTab(tab.id as any); }}
                className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition-all ${
                  currentTab === tab.id
                    ? 'text-purple-600 bg-purple-50 scale-105'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Icon name={tab.icon as any} size={24} />
                <span className="text-xs font-bold">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={showCardDialog} onOpenChange={setShowCardDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Оформить карту</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <Label className="text-base font-semibold mb-3 block">Тип карты</Label>
              <div className="grid grid-cols-2 gap-3">
                {cardCategories.map((cat) => {
                  const isLocked = cat.premiumOnly && !user?.isPremium;
                  return (
                    <Button
                      key={cat.id}
                      variant={selectedCardCategory === cat.id ? 'default' : 'outline'}
                      onClick={() => {
                        if (isLocked) {
                          playSound('error');
                          toast.error('Доступно только с премиум-подпиской');
                          setShowPremiumDialog(true);
                        } else {
                          playSound('click');
                          setSelectedCardCategory(cat.id as CardCategory);
                        }
                      }}
                      className={`h-auto py-4 text-sm relative ${isLocked ? 'opacity-60' : ''}`}
                      disabled={isLocked && selectedCardCategory !== cat.id}
                    >
                      {isLocked && <Icon name="Lock" size={16} className="absolute top-2 right-2" />}
                      <Icon name={cat.icon as any} size={20} className="mr-2" />
                      {cat.name}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label className="text-base font-semibold mb-3 block">Формат</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={selectedCardType === 'virtual' ? 'default' : 'outline'}
                  onClick={() => { playSound('click'); setSelectedCardType('virtual'); }}
                  className="h-auto py-4"
                >
                  <Icon name="Smartphone" size={22} className="mr-2" />
                  Виртуальная
                </Button>
                <Button
                  variant={selectedCardType === 'plastic' ? 'default' : 'outline'}
                  onClick={() => { playSound('click'); setSelectedCardType('plastic'); }}
                  className="h-auto py-4"
                >
                  <Icon name="CreditCard" size={22} className="mr-2" />
                  Пластиковая
                </Button>
              </div>
            </div>
            <Button onClick={handleCreateCard} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 h-12 text-base font-bold shadow-lg">
              Оформить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={!!showCardDetails} onOpenChange={() => { setShowCardDetails(null); setIsFlipped(false); }}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
          {showCardDetails && (
            <>
              <SheetHeader>
                <SheetTitle className="text-2xl">Управление картой</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="perspective-1000">
                  <div 
                    className={`relative w-full h-56 transition-transform duration-700 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div 
                      className={`absolute w-full h-full p-6 rounded-3xl bg-gradient-to-br ${cardCategories.find(c => c.id === showCardDetails.category)?.color} text-white shadow-2xl`}
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="flex justify-between items-start mb-10">
                        <p className="text-base opacity-90 font-semibold">{showCardDetails.name}</p>
                        <Badge className="bg-white/25 text-white border-0 font-bold">{showCardDetails.paymentSystem}</Badge>
                      </div>
                      <p className="text-3xl font-bold mb-8 tracking-wider">{showCardDetails.number}</p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs opacity-80 mb-1">Баланс</p>
                          <p className="text-4xl font-bold">{showCardDetails.balance.toLocaleString('ru')} ₽</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs opacity-80 mb-1">Действует до</p>
                          <p className="text-base font-bold">{showCardDetails.expiryDate}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={`absolute w-full h-full p-6 rounded-3xl bg-gradient-to-br ${cardCategories.find(c => c.id === showCardDetails.category)?.color} text-white shadow-2xl [transform:rotateY(180deg)]`}
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="h-14 bg-black/60 -mx-6 mt-6 mb-10"></div>
                      <div className="space-y-5">
                        <div>
                          <p className="text-xs opacity-80 mb-2">CVV</p>
                          <p className="text-3xl font-bold tracking-widest">{showCardDetails.cvv}</p>
                        </div>
                        <div>
                          <p className="text-xs opacity-80 mb-2">Номер карты</p>
                          <p className="text-base font-semibold">{showCardDetails.number}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full h-12 font-semibold"
                  onClick={() => { playSound('click'); setIsFlipped(!isFlipped); }}
                >
                  <Icon name="RefreshCw" size={20} className="mr-2" />
                  {isFlipped ? 'Показать лицевую сторону' : 'Перевернуть карту'}
                </Button>

                <div className="grid grid-cols-3 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-12"
                    onClick={() => handleCopyToClipboard(showCardDetails.number.replace(/\s/g, ''), 'Номер карты')}
                  >
                    <Icon name="Copy" size={18} className="mr-2" />
                    Номер
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12"
                    onClick={() => handleCopyToClipboard(showCardDetails.cvv, 'CVV')}
                  >
                    <Icon name="Copy" size={18} className="mr-2" />
                    CVV
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12"
                    onClick={() => handleCopyToClipboard(showCardDetails.expiryDate, 'Срок')}
                  >
                    <Icon name="Copy" size={18} className="mr-2" />
                    Срок
                  </Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                    <div className="flex items-center gap-3">
                      <Icon name={showCardDetails.isBlocked ? 'Lock' : 'Unlock'} size={22} />
                      <span className="font-semibold">{showCardDetails.isBlocked ? 'Разблокировать' : 'Заблокировать'} карту</span>
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
                      playSound('click');
                      setShowCardLimits(showCardDetails);
                      setShowCardDetails(null);
                    }}
                  >
                    <Icon name="Settings" size={22} className="mr-3" />
                    <span className="font-semibold">Настроить лимиты</span>
                  </Button>

                  <Button variant="outline" className="w-full justify-start h-auto p-4">
                    <Icon name="Edit" size={22} className="mr-3" />
                    <span className="font-semibold">Переименовать</span>
                  </Button>

                  <Button variant="outline" className="w-full justify-start h-auto p-4">
                    <Icon name="History" size={22} className="mr-3" />
                    <span className="font-semibold">История операций</span>
                  </Button>

                  <Separator />

                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteCard(showCardDetails.id)}
                    className="w-full justify-start h-auto p-4"
                  >
                    <Icon name="Trash2" size={22} className="mr-3" />
                    <span className="font-semibold">Удалить карту</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={!!showCardLimits} onOpenChange={() => setShowCardLimits(null)}>
        <SheetContent side="bottom" className="h-[75vh] rounded-t-3xl">
          {showCardLimits && (
            <>
              <SheetHeader>
                <SheetTitle className="text-2xl">Настройка лимитов</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-8">
                <Card className="p-5 bg-purple-50 border-purple-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon name="Info" size={22} className="text-purple-600" />
                    <p className="font-bold text-purple-900">Лимиты помогают контролировать расходы</p>
                  </div>
                  <p className="text-sm text-purple-700">Установите максимальную сумму трат в день и месяц</p>
                </Card>

                <div className="space-y-8">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-lg font-bold">Дневной лимит</Label>
                      <span className="text-2xl font-bold text-purple-600">
                        {showCardLimits.dailyLimit.toLocaleString('ru')} ₽
                      </span>
                    </div>
                    <Slider
                      value={[showCardLimits.dailyLimit]}
                      onValueChange={(value) => {
                        playSound('click');
                        const updated = { ...showCardLimits, dailyLimit: value[0] };
                        setShowCardLimits(updated);
                      }}
                      max={500000}
                      step={5000}
                      className="mb-3"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground font-semibold">
                      <span>0 ₽</span>
                      <span>500 000 ₽</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-lg font-bold">Месячный лимит</Label>
                      <span className="text-2xl font-bold text-purple-600">
                        {showCardLimits.monthlyLimit.toLocaleString('ru')} ₽
                      </span>
                    </div>
                    <Slider
                      value={[showCardLimits.monthlyLimit]}
                      onValueChange={(value) => {
                        playSound('click');
                        const updated = { ...showCardLimits, monthlyLimit: value[0] };
                        setShowCardLimits(updated);
                      }}
                      max={2000000}
                      step={10000}
                      className="mb-3"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground font-semibold">
                      <span>0 ₽</span>
                      <span>2 000 000 ₽</span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 h-14 text-lg font-bold shadow-lg"
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
            <DialogTitle className="text-2xl">Оформить кредит</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {!user?.isPremium && (
              <Card className="p-5 bg-yellow-50 border-yellow-200">
                <p className="text-sm text-yellow-900 font-semibold">
                  <Icon name="Info" size={18} className="inline mr-2" />
                  Лимит кредита: 100 000 ₽. 
                  <span className="text-purple-600 cursor-pointer ml-2 underline" onClick={() => { setShowCreditDialog(false); setShowPremiumDialog(true); }}>
                    Оформите премиум
                  </span> для безлимитных кредитов
                </p>
              </Card>
            )}
            
            <div>
              <Label className="text-base font-semibold">Сумма кредита</Label>
              <Input
                type="number"
                placeholder="10000"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="mt-2 h-12"
              />
              {!user?.isPremium && (
                <p className="text-sm text-muted-foreground mt-2 font-medium">Максимум: 100 000 ₽</p>
              )}
            </div>
            <div>
              <Label className="text-base font-semibold">На карту</Label>
              <select
                className="w-full p-3 border rounded-lg mt-2 h-12"
                value={selectedCardForCredit}
                onChange={(e) => setSelectedCardForCredit(e.target.value)}
              >
                <option value="">Выберите карту</option>
                {cards.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.number}</option>
                ))}
              </select>
            </div>
            <Button onClick={handleApplyCredit} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 h-12 text-base font-bold shadow-lg">
              <Icon name="CheckCircle" size={22} className="mr-2" />
              Получить кредит
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-3xl">
              <Icon name="Crown" size={36} className="text-yellow-500" />
              Премиум Юган
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="p-8 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-3xl shadow-2xl">
              <h3 className="text-4xl font-bold mb-3">Безлимитные возможности</h3>
              <p className="opacity-95 text-lg">Получите максимум от банковских услуг</p>
            </div>
            
            <div className="space-y-4">
              {[
                'До 10 банковских карт одновременно',
                'Безлимитные кредиты без ограничений',
                'Супер-кредитная карта с 50 000 ₽',
                'Расширенные настройки лимитов карт',
                'Приоритетная поддержка 24/7',
                'Эксклюзивные предложения и кэшбек',
                'Семейный банкинг с полным доступом'
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Icon name="CheckCircle" size={22} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-base font-medium">{feature}</p>
                </div>
              ))}
            </div>
            
            <Button 
              onClick={handleActivatePremium}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-7 text-xl shadow-2xl"
            >
              <Icon name="Crown" size={28} className="mr-3" />
              Активировать премиум
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPremiumCardChoice} onOpenChange={setShowPremiumCardChoice}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Выберите бонусную карту</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">Премиум-подписка активирована! Выберите карту в подарок:</p>
            
            <Card 
              className="p-6 cursor-pointer hover:scale-102 hover:shadow-2xl transition-all border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50"
              onClick={() => handleChoosePremiumCard('standard')}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-2xl font-bold">Обычная карта</h3>
                <Icon name="CreditCard" size={32} className="text-blue-600" />
              </div>
              <p className="text-4xl font-bold text-blue-600 mb-2">5 000 ₽</p>
              <p className="text-sm text-muted-foreground">Больше денег для старта</p>
            </Card>
            
            <Card 
              className="p-6 cursor-pointer hover:scale-102 hover:shadow-2xl transition-all border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50"
              onClick={() => handleChoosePremiumCard('premium')}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-2xl font-bold">Премиум карта</h3>
                <Icon name="Crown" size={32} className="text-yellow-600" />
              </div>
              <p className="text-4xl font-bold text-yellow-600 mb-2">1 000 ₽</p>
              <p className="text-sm text-muted-foreground">Золотая премиум карта с эксклюзивным дизайном</p>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFamilyDialog} onOpenChange={setShowFamilyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Семья</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <Card className="p-5 bg-purple-50 border-purple-200">
              <p className="text-sm text-purple-900 font-semibold">
                <Icon name="Users" size={18} className="inline mr-2" />
                Создайте семью или присоединитесь к существующей для совместного управления финансами
              </p>
            </Card>
            
            {!family ? (
              <>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Создать новую семью</Label>
                  <Button 
                    onClick={handleCreateFamily}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 h-12 text-base font-bold shadow-lg"
                  >
                    <Icon name="UserPlus" size={22} className="mr-2" />
                    Создать семью
                  </Button>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="text-base font-semibold mb-3 block">Присоединиться к семье</Label>
                  <Input
                    placeholder="Введите код семьи (например: РУЛЕТКА5107)"
                    value={familyCodeInput}
                    onChange={(e) => setFamilyCodeInput(e.target.value.toUpperCase())}
                    className="mt-2 h-12 font-mono text-center text-lg"
                  />
                  <Button 
                    onClick={handleJoinFamily}
                    className="w-full mt-3 bg-gradient-to-r from-blue-500 to-cyan-500 h-12 text-base font-bold shadow-lg"
                  >
                    <Icon name="Users" size={22} className="mr-2" />
                    Присоединиться
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold">Моя семья</h3>
                    <Icon name="Users" size={32} />
                  </div>
                  <div className="bg-white/20 rounded-xl p-4 mb-4">
                    <p className="text-sm opacity-80 mb-1">Код семьи</p>
                    <p className="text-3xl font-bold font-mono tracking-wider">{family.code}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                    onClick={() => handleCopyToClipboard(family.code, 'Код семьи')}
                  >
                    <Icon name="Copy" size={20} className="mr-2" />
                    Скопировать код
                  </Button>
                </Card>
                
                <div>
                  <p className="text-sm font-semibold mb-3">Члены семьи ({family.members.length})</p>
                  {family.members.map((member, i) => (
                    <Card key={i} className="p-4 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{member}</p>
                          {member === family.owner && (
                            <Badge variant="outline" className="text-xs mt-1">Владелец</Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
