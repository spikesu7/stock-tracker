import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

export default function StockTracker() {
  const [users, setUsers] = useState([
    { id: 1, username: 'test', password: 'test' }
  ]);
  const [currentUser, setCurrentUser] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [selectedDate, setSelectedDate] = useState('all');
  const [newUser, setNewUser] = useState({ username: '', password: '' });
  const [newStock, setNewStock] = useState({ name: '', cost: '', close: '' });
  const [loginInfo, setLoginInfo] = useState({ username: '', password: '' });
  const [showRegister, setShowRegister] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', cost: '', close: '' });

  const loginUser = () => {
    const user = users.find(u => u.username === loginInfo.username && u.password === loginInfo.password);
    if (user) {
      setCurrentUser(user);
      setLoginInfo({ username: '', password: '' });
    } else {
      alert('用户名或密码错误');
    }
  };

  const registerUser = () => {
    if (newUser.username && newUser.password) {
      setUsers([...users, { ...newUser, id: Date.now() }]);
      setNewUser({ username: '', password: '' });
      setShowRegister(false);
      alert('注册成功！');
    }
  };

  const logoutUser = () => setCurrentUser(null);

  const addStock = () => {
    if (newStock.name && newStock.cost && newStock.close) {
      const stockData = {
        ...newStock,
        id: Date.now(),
        userId: currentUser.id,
        date: new Date().toISOString().split('T')[0]
      };
      setStocks([...stocks, stockData]);
      setNewStock({ name: '', cost: '', close: '' });
    }
  };

  const startEdit = (stock) => {
    setEditingStock(stock.id);
    setEditFormData({
      name: stock.name,
      cost: stock.cost,
      close: stock.close
    });
  };

  const saveEdit = (stockId) => {
    setStocks(stocks.map(stock =>
      stock.id === stockId ? { ...stock, ...editFormData } : stock
    ));
    setEditingStock(null);
  };

  const deleteStock = (stockId) => {
    setStocks(stocks.filter(stock => stock.id !== stockId));
  };

  const calculateReturns = () => {
    if (!currentUser) return [];
    const userStocks = stocks.filter(s => s.userId === currentUser.id);
    
    const dailyReturns = userStocks.reduce((acc, stock) => {
      if (!acc[stock.date]) {
        acc[stock.date] = {
          totalReturn: 0,
          count: 0,
          stocks: []
        };
      }
      const returnRate = ((parseFloat(stock.close) - parseFloat(stock.cost)) / parseFloat(stock.cost)) * 100;
      acc[stock.date].totalReturn += returnRate;
      acc[stock.date].count += 1;
      acc[stock.date].stocks.push({
        ...stock,
        returnRate
      });
      return acc;
    }, {});

    const stocksWithReturns = [];
    Object.entries(dailyReturns).forEach(([date, data]) => {
      const weight = 100 / data.count;
      const dailyTotalReturn = data.stocks.reduce((sum, stock) => {
        return sum + (stock.returnRate * (weight / 100));
      }, 0);

      data.stocks.forEach(stock => {
        stocksWithReturns.push({
          ...stock,
          return: stock.returnRate,
          weight: weight.toFixed(2),
          dailyReturn: dailyTotalReturn.toFixed(2),
          stockCount: data.count
        });
      });
    });

    return stocksWithReturns.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const userReturns = calculateReturns();
  const uniqueDates = [...new Set(userReturns.map(stock => stock.date))].sort();
  const filteredReturns = selectedDate === 'all' 
    ? userReturns 
    : userReturns.filter(stock => stock.date === selectedDate);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto p-6">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4 text-center">重生之-股神归来</h1>
          <div className="space-y-4">
            <Input
              placeholder="用户名"
              value={loginInfo.username}
              onChange={e => setLoginInfo({ ...loginInfo, username: e.target.value })}
            />
            <Input
              type="password"
              placeholder="密码"
              value={loginInfo.password}
              onChange={e => setLoginInfo({ ...loginInfo, password: e.target.value })}
            />
            <Button className="w-full" onClick={loginUser}>登录</Button>
            {!showRegister && (
              <Button variant="outline" className="w-full" onClick={() => setShowRegister(true)}>
                注册新账户
              </Button>
            )}
          </div>

          {showRegister && (
            <div className="mt-6 pt-6 border-t space-y-4">
              <h2 className="text-xl font-semibold">注册新账户</h2>
              <Input
                placeholder="用户名"
                value={newUser.username}
                onChange={e => setNewUser({ ...newUser, username: e.target.value })}
              />
              <Input
                type="password"
                placeholder="密码"
                value={newUser.password}
                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
              />
              <div className="flex space-x-2">
                <Button onClick={registerUser}>创建账户</Button>
                <Button variant="outline" onClick={() => setShowRegister(false)}>取消</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">欢迎回来，{currentUser.username}</h1>
        <Button variant="outline" onClick={logoutUser}>退出登录</Button>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">添加股票</h2>
        <div className="grid grid-cols-4 gap-4">
          <Input
            placeholder="股票名称"
            value={newStock.name}
            onChange={e => setNewStock({ ...newStock, name: e.target.value })}
          />
          <Input
            type="number"
            placeholder="成本价"
            value={newStock.cost}
            onChange={e => setNewStock({ ...newStock, cost: e.target.value })}
          />
          <Input
            type="number"
            placeholder="收盘价"
            value={newStock.close}
            onChange={e => setNewStock({ ...newStock, close: e.target.value })}
          />
          <Button onClick={addStock}>添加</Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">股票记录</h2>
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="选择日期" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有日期</SelectItem>
              {uniqueDates.map(date => (
                <SelectItem key={date} value={date}>{date}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 border text-left bg-gray-50">日期</th>
                <th className="p-2 border text-left bg-gray-50">股票名称</th>
                <th className="p-2 border text-left bg-gray-50">成本价</th>
                <th className="p-2 border text-left bg-gray-50">收盘价</th>
                <th className="p-2 border text-left bg-gray-50">收益率 (%)</th>
                <th className="p-2 border text-left bg-gray-50">权重 (%)</th>
                <th className="p-2 border text-left bg-gray-50">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.reduce((acc, stock) => {
                if (!acc.find(item => item.date === stock.date)) {
                  acc.push({
                    id: `summary-${stock.date}`,
                    date: stock.date,
                    isSummary: true,
                    dailyReturn: stock.dailyReturn
                  });
                }
                acc.push(stock);
                return acc;
              }, []).map(row => (
                row.isSummary ? (
                  <tr key={row.id} className="bg-gray-100 font-semibold">
                    <td className="p-2 border">{row.date}</td>
                    <td className="p-2 border text-center" colSpan={5}>
                      当日收益率：{row.dailyReturn}%
                    </td>
                    <td className="p-2 border"></td>
                  </tr>
                ) : (
                  <tr key={row.id}>
                    <td className="p-2 border">{row.date}</td>
                    <td className="p-2 border">{row.name}</td>
                    <td className="p-2 border">{row.cost}</td>
                    <td className="p-2 border">{row.close}</td>
                    <td className="p-2 border">{row.return?.toFixed(2)}%</td>
                    <td className="p-2 border">{row.weight}%</td>
                    <td className="p-2 border">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => startEdit(row)}>
                          编辑
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteStock(row.id)}>
                          删除
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">收益曲线</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={userReturns.filter((v, i, a) => 
              a.findIndex(t => t.date === v.date) === i
            )}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => value + '%'} />
              <Line 
                type="monotone" 
                dataKey="dailyReturn" 
                stroke="#8884d8" 
                name="日收益率"
                dot={{ r: 4 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
