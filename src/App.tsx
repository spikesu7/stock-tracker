import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

const StockTracker = () => {
    interface User {
        id: string;
        username: string;
        password: string;
    }
    
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [stocks, setStocks] = useState<StockData[]>([]);
    const [newStock, setNewStock] = useState({ name: '', cost: '', close: '' });
    const [newUser, setNewUser] = useState({ username: '', password: '' });
    const [loginInfo, setLoginInfo] = useState({ username: '', password: '' });
    const [showRegister, setShowRegister] = useState(false);
    const [editingStock, setEditingStock] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState({ name: '', cost: '', close: '' });

    interface StockData {
        id: string;
        userId: string;
        name: string;
        cost: string;
        close: string;
        date: string;
        returnRate?: number;
        return?: number;
        weight?: string;
        dailyReturn?: string;
        stockCount?: number;
        isSummary?: boolean;
    }

    interface DailyReturnData {
        totalReturn: number;
        count: number;
        stocks: StockData[];
    }

    // 获取用户股票数据
    useEffect(() => {
        const fetchStocks = async () => {
            if (currentUser) {
                const q = query(collection(db, 'stocks'), where('userId', '==', currentUser.id));
                const querySnapshot = await getDocs(q);
                const stocksData = querySnapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    userId: doc.data().userId,
                    name: doc.data().name,
                    cost: doc.data().cost,
                    close: doc.data().close,
                    date: doc.data().date
                } as StockData));
                setStocks(stocksData);
            }
        };
        fetchStocks();
    }, [currentUser]);

    // 用户登录
    const loginUser = async () => {
        const q = query(collection(db, 'users'), 
            where('username', '==', loginInfo.username),
            where('password', '==', loginInfo.password)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const user = querySnapshot.docs[0].data();
            setCurrentUser({ 
                id: querySnapshot.docs[0].id, 
                username: user.username,
                password: user.password
            } as User);
            setLoginInfo({ username: '', password: '' });
        } else {
            alert('用户名或密码错误');
        }
    };

    // 用户注册
    const registerUser = async () => {
        if (newUser.username && newUser.password) {
            const docRef = await addDoc(collection(db, 'users'), {
                username: newUser.username,
                password: newUser.password
            });
            setCurrentUser({ id: docRef.id, ...newUser });
            setNewUser({ username: '', password: '' });
            setShowRegister(false);
        }
    };

    // 添加股票记录
    const addStock = async () => {
        if (newStock.name && newStock.cost && newStock.close) {
            if (!currentUser) return;
            const stockData = {
                ...newStock,
                userId: currentUser.id,
                date: new Date().toISOString().split('T')[0],
            } as StockData;
            const docRef = await addDoc(collection(db, 'stocks'), stockData);
            setStocks([...stocks, { ...stockData, id: docRef.id }]);
            setNewStock({ name: '', cost: '', close: '' });
        }
    };

    // 保存编辑
    const saveEdit = async (stockId: string) => {
        const stockRef = doc(db, 'stocks', stockId);
        await updateDoc(stockRef, editFormData);
        setStocks(stocks.map(stock => 
            stock.id === stockId
                ? { ...stock, ...editFormData }
                : stock
        ));
        setEditingStock(null);
        setEditFormData({ name: '', cost: '', close: '' });
    };

    // 删除股票记录
    const deleteStock = async (stockId: string) => {
        await deleteDoc(doc(db, 'stocks', stockId));
        setStocks(stocks.filter(stock => stock.id !== stockId));
    };

    const logoutUser = () => {
        setCurrentUser(null);
    };

    const cancelEdit = () => {
        setEditingStock(null);
        setEditFormData({ name: '', cost: '', close: '' });
    };

    const startEdit = (stock: StockData) => {
        setEditingStock(stock.id);
        setEditFormData({
            name: stock.name,
            cost: stock.cost,
            close: stock.close
        });
    };

    // 计算收益
    const calculateReturns = (): StockData[] => {
        if (!currentUser) return [];
        
        const dailyReturns: Record<string, DailyReturnData> = stocks.reduce((acc, stock) => {
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
                returnRate: returnRate
            });
            return acc;
        }, {} as Record<string, DailyReturnData>);

        const stocksWithReturns: StockData[] = [];
        Object.entries(dailyReturns).forEach(([date, data]) => {
            const weight = 100 / data.count;
            const dailyTotalReturn = data.stocks.reduce((sum, stock) => {
                return sum + ((stock.returnRate || 0) * (weight / 100));
            }, 0);

            data.stocks.forEach(stock => {
                stocksWithReturns.push({
                    ...stock,
                    return: stock.returnRate || 0,
                    weight: weight.toFixed(2),
                    dailyReturn: dailyTotalReturn.toFixed(2),
                    stockCount: data.count
                });
            });
        });

        return stocksWithReturns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    };

    const userReturns = calculateReturns();

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-center">Stock Tracker</h1>
            
            {!currentUser ? (
                <div className="max-w-md mx-auto space-y-4">
                    <div className="p-8 border rounded-lg bg-white shadow-sm">
                        <h2 className="text-xl font-medium mb-6 text-center text-gray-600">Please login to continue</h2>
                        <div className="space-y-4">
                            <Input
                                placeholder="Username"
                                value={loginInfo.username}
                                onChange={(e) => setLoginInfo({ ...loginInfo, username: e.target.value })}
                                className="w-full"
                            />
                            <Input
                                placeholder="Password"
                                type="password"
                                value={loginInfo.password}
                                onChange={(e) => setLoginInfo({ ...loginInfo, password: e.target.value })}
                                className="w-full"
                            />
                            <Button onClick={loginUser} className="w-full">
                                Login
                            </Button>
                        </div>
                        
                        {!showRegister ? (
                            <div className="mt-4 text-center">
                                <p className="text-sm text-gray-600 mb-2">Don't have an account?</p>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setShowRegister(true)}
                                    className="w-full"
                                >
                                    Register
                                </Button>
                            </div>
                        ) : (
                            <div className="mt-8 pt-6 border-t">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium">Create Account</h3>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => setShowRegister(false)}
                                        className="text-gray-500"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    <Input
                                        placeholder="Username"
                                        value={newUser.username}
                                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Password"
                                        type="password"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    />
                                    <Button onClick={registerUser} className="w-full">
                                        Create Account
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Welcome, {currentUser.username}</h2>
                        <div className="space-x-2">
                            <Button onClick={logoutUser} variant="outline">Logout</Button>
                        </div>
                    </div>

                    <div className="p-6 border rounded-lg bg-white">
                        <h2 className="text-xl font-semibold mb-4">Add Stock</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Input
                                placeholder="Stock Name"
                                value={newStock.name}
                                onChange={(e) => setNewStock({ ...newStock, name: e.target.value })}
                            />
                            <Input
                                placeholder="Cost Price"
                                type="number"
                                value={newStock.cost}
                                onChange={(e) => setNewStock({ ...newStock, cost: e.target.value })}
                            />
                            <Input
                                placeholder="Close Price"
                                type="number"
                                value={newStock.close}
                                onChange={(e) => setNewStock({ ...newStock, close: e.target.value })}
                            />
                            <Button onClick={addStock}>Add Stock</Button>
                        </div>
                    </div>

                    <div className="p-6 border rounded-lg bg-white">
                        <h2 className="text-xl font-semibold mb-4">Your Stocks</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="p-2 border text-left bg-gray-50">Date</th>
                                        <th className="p-2 border text-left bg-gray-50">Stock Name</th>
                                        <th className="p-2 border text-left bg-gray-50">Cost Price</th>
                                        <th className="p-2 border text-left bg-gray-50">Close Price</th>
                                        <th className="p-2 border text-left bg-gray-50">Return (%)</th>
                                        <th className="p-2 border text-left bg-gray-50">Weight (%)</th>
                                        <th className="p-2 border text-left bg-gray-50">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userReturns.reduce((acc, stock) => {
                                        if (!acc.find(item => item.date === stock.date)) {
                                            acc.push({
                                                ...stock,
                                                id: `summary-${stock.date}`,
                                                isSummary: true
                                            });
                                        }
                                        acc.push(stock);
                                        return acc;
                                    }, [] as StockData[]).map(row => (
                                        row.isSummary ? (
                                            <tr key={row.id} className="bg-gray-100 font-semibold">
                                                <td className="p-2 border">{row.date}</td>
                                                <td className="p-2 border text-right" colSpan={5}>
                                                    Daily Return: {row.dailyReturn}%
                                                </td>
                                                <td className="p-2 border"></td>
                                            </tr>
                                        ) : (
                                            <tr key={row.id} className="hover:bg-gray-50">
                                                <td className="p-2 border">{row.date}</td>
                                                <td className="p-2 border">
                                                    {editingStock === row.id ? (
                                                        <Input
                                                            value={editFormData.name}
                                                            onChange={(e) => setEditFormData({
                                                                ...editFormData,
                                                                name: e.target.value
                                                            })}
                                                            className="w-full"
                                                        />
                                                    ) : (
                                                        row.name
                                                    )}
                                                </td>
                                                <td className="p-2 border">
                                                    {editingStock === row.id ? (
                                                        <Input
                                                            type="number"
                                                            value={editFormData.cost}
                                                            onChange={(e) => setEditFormData({
                                                                ...editFormData,
                                                                cost: e.target.value
                                                            })}
                                                            className="w-full"
                                                        />
                                                    ) : (
                                                        row.cost
                                                    )}
                                                </td>
                                                <td className="p-2 border">
                                                    {editingStock === row.id ? (
                                                        <Input
                                                            type="number"
                                                            value={editFormData.close}
                                                            onChange={(e) => setEditFormData({
                                                                ...editFormData,
                                                                close: e.target.value
                                                            })}
                                                            className="w-full"
                                                        />
                                                    ) : (
                                                        row.close
                                                    )}
                                                </td>
                                                <td className="p-2 border">{(row.return || 0).toFixed(2)}</td>
                                                <td className="p-2 border">{row.weight}%</td>
                                                <td className="p-2 border">
                                                    {editingStock === row.id ? (
                                                        <div className="flex space-x-2">
                                                            <Button 
                                                                size="sm"
                                                                onClick={() => saveEdit(row.id)}
                                                            >
                                                                Save
                                                            </Button>
                                                            <Button 
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={cancelEdit}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button 
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => deleteStock(row.id)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex space-x-2">
                                                            <Button 
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => startEdit(row)}
                                                            >
                                                                Edit
                                                            </Button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="p-6 border rounded-lg bg-white">
                        <h2 className="text-xl font-semibold mb-4">Returns Chart</h2>
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
                                        name="Daily Return"
                                        dot={{ r: 4 }}
                                        connectNulls
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockTracker;
