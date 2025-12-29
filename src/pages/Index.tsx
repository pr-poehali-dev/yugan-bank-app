import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';

type CardType = 'virtual' | 'plastic';
type CardCategory = 'debit-child' | 'debit-youth' | 'credit' | 'sticker';

interface BankCard {
  id: string;
  name: string;
  category: CardCategory;
  type: CardType;
  number: string;
  balance: number;
  isBlocked: boolean;
}

interface User {
  phone: string;
  firstName: string;
  lastName: string;
  middleName: string;
}

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<'home' | 'cards' | 'transfers' | 'credits' | 'menu' | 'assistant'>('home');
  
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  
  const [cards, setCards] = useState<BankCard[]>([]);
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState<BankCard | null>(null);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [showMenuSheet, setShowMenuSheet] = useState(false);
  
  const [selectedCardCategory, setSelectedCardCategory] = useState<CardCategory>('debit-youth');
  const [selectedCardType, setSelectedCardType] = useState<CardType>('virtual');
  
  const [creditAmount, setCreditAmount] = useState('');
  const [selectedCardForCredit, setSelectedCardForCredit] = useState('');

  const cardCategories = [
    { id: 'debit-child', name: 'Детская дебетовая', icon: 'Baby', color: 'from-pink-400 to-purple-400' },
    { id: 'debit-youth', name: 'Молодёжная', icon: 'Zap', color: 'from-purple-500 to-blue-500' },
    { id: 'credit', name: 'Кредитная', icon: 'CreditCard', color: 'from-blue-500 to-cyan-500' },
    { id: 'sticker', name: 'Стикер', icon: 'Tag', color: 'from-orange-400 to-pink-400' },
  ];

  const handleRegister = () => {
    if (!phone || !firstName || !lastName || !middleName) {
      toast.error('Заполните все поля');
      return;
    }
    setUser({ phone, firstName, lastName, middleName });
    setIsAuthenticated(true);
    toast.success('Добро пожаловать в Юган Банк!');
  };

  const handleCreateCard = () => {
    const newCard: BankCard = {
      id: Date.now().toString(),
      name: cardCategories.find(c => c.id === selectedCardCategory)?.name || '',
      category: selectedCardCategory,
      type: selectedCardType,
      number: `**** **** **** ${Math.floor(1000 + Math.random() * 9000)}`,
      balance: 0,
      isBlocked: false,
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

  const handleRenameCard = (cardId: string, newName: string) => {
    setCards(cards.map(c => c.id === cardId ? { ...c, name: newName } : c));
    toast.success('Название карты изменено');
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

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setCards([]);
    setCurrentTab('home');
    toast.success('Вы вышли из аккаунта');
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
          <div className="p-4 space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-6 text-white shadow-2xl">
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

            <div>
              <h3 className="text-lg font-bold mb-4">Оформить новую карту</h3>
              <div className="grid grid-cols-2 gap-3">
                {cardCategories.map((category) => (
                  <Card
                    key={category.id}
                    className="p-4 cursor-pointer hover:scale-105 transition-transform border-0 shadow-lg bg-white"
                    onClick={() => {
                      setSelectedCardCategory(category.id as CardCategory);
                      setShowCardDialog(true);
                    }}
                  >
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-3`}>
                      <Icon name={category.icon as any} size={24} className="text-white" />
                    </div>
                    <p className="font-semibold text-sm">{category.name}</p>
                  </Card>
                ))}
              </div>
            </div>

            {cards.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-4">Мои карты</h3>
                <div className="space-y-3">
                  {cards.slice(0, 3).map((card) => {
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
                              <p className="text-sm text-muted-foreground">{card.number}</p>
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
              </div>
            )}
          </div>
        )}

        {currentTab === 'cards' && (
          <div className="p-4 space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold">Мои карты</h2>
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
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category?.color} flex items-center justify-center`}>
                            <Icon name={category?.icon as any} size={20} className="text-white" />
                          </div>
                          <div>
                            <p className="font-semibold">{card.name}</p>
                            <p className="text-sm text-muted-foreground">{card.number}</p>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {card.type === 'virtual' ? 'Виртуальная' : 'Пластиковая'}
                            </Badge>
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
        )}

        {currentTab === 'transfers' && (
          <div className="p-4 space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold">Переводы</h2>
            <Card className="p-6 border-0 shadow-lg">
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
          </div>
        )}

        {currentTab === 'credits' && (
          <div className="p-4 space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold">Кредиты</h2>
            <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
              <Icon name="Wallet" size={48} className="mb-4" />
              <h3 className="text-xl font-bold mb-2">Мгновенный кредит</h3>
              <p className="text-blue-100">Получите деньги без процентов прямо сейчас</p>
            </Card>
            <Card className="p-6 border-0 shadow-lg">
              <div className="space-y-4">
                <div>
                  <Label>Сумма кредита</Label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>На карту</Label>
                  <select
                    className="w-full p-2 border rounded-lg"
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
            </Card>
          </div>
        )}

        {currentTab === 'assistant' && (
          <div className="p-4 space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold">Умный ассистент</h2>
            <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <Icon name="Bot" size={48} className="mb-4" />
              <h3 className="text-xl font-bold mb-2">Чем могу помочь?</h3>
              <p className="text-purple-100">Задайте вопрос о переводах, картах или кредитах</p>
            </Card>
            <div className="space-y-3">
              {['Как перевести деньги?', 'Оформить новую карту', 'Заблокировать карту', 'Получить кредит'].map((q) => (
                <Button key={q} variant="outline" className="w-full justify-start h-auto p-4 text-left">
                  <Icon name="MessageCircle" size={20} className="mr-3 flex-shrink-0" />
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}

        {currentTab === 'menu' && (
          <div className="p-4 space-y-4 animate-fade-in">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-6 text-white shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {user?.firstName[0]}{user?.lastName[0]}
                </div>
                <div>
                  <p className="text-2xl font-bold">{user?.firstName} {user?.lastName}</p>
                  <p className="text-purple-100">{user?.phone}</p>
                </div>
              </div>
            </div>

            <Card className="divide-y border-0 shadow-lg">
              <Button variant="ghost" className="w-full justify-start h-auto p-4">
                <Icon name="User" size={20} className="mr-3" />
                <span>Профиль</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start h-auto p-4">
                <Icon name="Settings" size={20} className="mr-3" />
                <span>Настройки</span>
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
              { id: 'credits', icon: 'Wallet', label: 'Кредиты' },
              { id: 'assistant', icon: 'Bot', label: 'Ассистент' },
              { id: 'menu', icon: 'Menu', label: 'Меню' },
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Оформить карту</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Тип карты</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {cardCategories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCardCategory === cat.id ? 'default' : 'outline'}
                    onClick={() => setSelectedCardCategory(cat.id as CardCategory)}
                    className="h-auto py-3"
                  >
                    <Icon name={cat.icon as any} size={20} className="mr-2" />
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

      <Sheet open={!!showCardDetails} onOpenChange={() => setShowCardDetails(null)}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
          {showCardDetails && (
            <>
              <SheetHeader>
                <SheetTitle>Управление картой</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className={`p-6 rounded-2xl bg-gradient-to-br ${cardCategories.find(c => c.id === showCardDetails.category)?.color} text-white`}>
                  <p className="text-sm opacity-80 mb-1">{showCardDetails.name}</p>
                  <p className="text-2xl font-bold mb-4">{showCardDetails.number}</p>
                  <p className="text-3xl font-bold">{showCardDetails.balance.toLocaleString('ru')} ₽</p>
                </div>

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
    </div>
  );
};

export default Index;
