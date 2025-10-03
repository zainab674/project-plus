"use client"

import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, X, Trash2, Receipt, Calendar, User } from 'lucide-react';
import { addExpenseRequest, getExpensesRequest, deleteExpenseRequest, getBillerProvidersRequest } from '@/lib/http/expenses';
import { toast } from 'react-toastify';

export const ExpensesModal = ({ isOpen, onClose, defaultProviderId = null }) => {
    const [expenses, setExpenses] = useState([]);
    const [newExpenseName, setNewExpenseName] = useState('');
    const [newExpensePrice, setNewExpensePrice] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
    const [selectedProvider, setSelectedProvider] = useState(defaultProviderId || '');
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [addingExpense, setAddingExpense] = useState(false);

    // Update selectedProvider when defaultProviderId changes
    useEffect(() => {
        if (defaultProviderId) {
            setSelectedProvider(defaultProviderId);
        }
    }, [defaultProviderId]);

    // Load expenses when modal opens or month changes
    useEffect(() => {
        if (isOpen) {
            loadProviders();
            loadExpenses();
        }
    }, [isOpen, selectedMonth, selectedProvider]);

    const loadProviders = async () => {
        try {
            const response = await getBillerProvidersRequest();
            setProviders(response.data.providers || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to load providers');
        }
    };

    const loadExpenses = async () => {
        setLoading(true);
        try {
            const response = await getExpensesRequest(selectedMonth, selectedProvider || null);
            console.log("response", response)
            setExpenses(response.data.expenses || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to load expenses');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleAddExpense = async () => {
        if (newExpenseName.trim() && newExpensePrice.trim()) {
            const price = parseFloat(newExpensePrice);
            if (isNaN(price) || price <= 0) {
                toast.error('Please enter a valid price');
                return;
            }

            setAddingExpense(true);
            try {
                const response = await addExpenseRequest({
                    name: newExpenseName.trim(),
                    price: price,
                    month: selectedMonth,
                    provider_id: selectedProvider || null
                });

                toast.success('Expense added successfully');
                setNewExpenseName('');
                setNewExpensePrice('');
                loadExpenses(); // Reload expenses
            } catch (error) {
                toast.error(error?.response?.data?.message || 'Failed to add expense');
            } finally {
                setAddingExpense(false);
            }
        }
    };

    const handleDeleteExpense = async (expenseId) => {
        try {
            await deleteExpenseRequest(expenseId);
            toast.success('Expense deleted successfully');
            loadExpenses(); // Reload expenses
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to delete expense');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddExpense();
        }
    };

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.price), 0);

    // Get month name for display
    const getMonthName = (monthString) => {
        const [year, month] = monthString.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white text-sm rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Monthly Expenses</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-800 hover:text-black"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Month and Provider Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Select Month
                        </h4>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full px-3 py-2 text-gray-900 rounded-md border border-gray-300 focus:border-blue-400 focus:outline-none text-sm"
                        />
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Select Provider
                        </h4>
                        <select
                            value={selectedProvider}
                            onChange={(e) => setSelectedProvider(e.target.value)}
                            className="w-full px-3 py-2 text-gray-900 rounded-md border border-gray-300 focus:border-green-400 focus:outline-none text-sm"
                        >
                            <option value="">All Providers</option>
                            {providers.map((provider) => (
                                <option key={provider.user_id} value={provider.user_id}>
                                    {provider.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Add New Expense Section */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add New Expense for {getMonthName(selectedMonth)}
                    </h4>
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Expense name"
                                    value={newExpenseName}
                                    onChange={(e) => setNewExpenseName(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="w-full px-3 py-2 text-gray-900 rounded-md border border-gray-300 focus:border-orange-400 focus:outline-none text-sm"
                                />
                            </div>
                            <div>
                                <input
                                    type="number"
                                    placeholder="Price ($)"
                                    value={newExpensePrice}
                                    onChange={(e) => setNewExpensePrice(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    step="0.01"
                                    min="0"
                                    className="w-full px-3 py-2 text-gray-900 rounded-md border border-gray-300 focus:border-orange-400 focus:outline-none text-sm"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleAddExpense}
                            disabled={!newExpenseName.trim() || !newExpensePrice.trim() || addingExpense}
                            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                            {addingExpense ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <Plus className="w-4 h-4" />
                            )}
                            {addingExpense ? 'Adding...' : 'Add Expense'}
                        </button>
                    </div>
                </div>

                {/* Monthly Expenses Summary */}
                <div className="bg-orange-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Total Expenses for {getMonthName(selectedMonth)}
                        </h4>
                        <span className="text-lg font-bold text-orange-600">
                            ${totalExpenses?.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Existing Expenses */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                            <p className="text-gray-500 mt-2">Loading expenses...</p>
                        </div>
                    ) : expenses.length > 0 ? (
                        expenses.map((expense) => (
                            <div key={expense.expense_id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Receipt className="w-4 h-4 text-gray-500" />
                                            <h5 className="font-medium text-gray-900">{expense.name}</h5>
                                            {expense.provider && (
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                    {expense.provider.name}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">
                                                {new Date(expense.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="text-lg font-semibold text-green-600">
                                                ${parseFloat(expense.price).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteExpense(expense.expense_id)}
                                        className="ml-3 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-500">No expenses for {getMonthName(selectedMonth)}</p>
                            <p className="text-sm text-gray-400">Add your first expense above</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}; 