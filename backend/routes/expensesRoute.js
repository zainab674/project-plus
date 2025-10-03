import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
    addExpense,
    getExpenses,
    deleteExpense,
    getExpenseMonths,
    getBillerProviders
} from '../controllers/expensesController.js';

const router = express.Router();

// 🔹 Add new expense
router.route('/add').post(authMiddleware, addExpense);

// 🔹 Get expenses (with optional month filter)
router.route('/get').get(authMiddleware, getExpenses);

// 🔹 Get all months with expenses
router.route('/months').get(authMiddleware, getExpenseMonths);

// 🔹 Get providers for a biller
router.route('/providers').get(authMiddleware, getBillerProviders);

// 🔹 Delete expense
router.route('/delete/:expenseId').delete(authMiddleware, deleteExpense);

export default router; 