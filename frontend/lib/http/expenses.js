import { api } from '.';

// Add new expense
export const addExpenseRequest = async (expenseData) => {
    try {
        const response = await api.post('/expenses/add', expenseData);
        return response;
    } catch (error) {
        throw error;
    }
};

// Get expenses for a specific month
export const getExpensesRequest = async (month = null, provider_id = null) => {
    try {
        const params = {};
        if (month) params.month = month;
        if (provider_id) params.provider_id = provider_id;
        const response = await api.get('/expenses/get', { params });
        return response;
    } catch (error) {
        throw error;
    }
};

// Get all months with expenses
export const getExpenseMonthsRequest = async () => {
    try {
        const response = await api.get('/expenses/months');
        return response;
    } catch (error) {
        throw error;
    }
};

// Delete expense
export const deleteExpenseRequest = async (expenseId) => {
    try {
        const response = await api.delete(`/expenses/delete/${expenseId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

// Get providers for a biller
export const getBillerProvidersRequest = async () => {
    try {
        const response = await api.get('/expenses/providers');
        return response;
    } catch (error) {
        throw error;
    }
}; 