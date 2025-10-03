import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import { prisma } from '../prisma/index.js';

// Add new expense
export const addExpense = catchAsyncError(async (req, res, next) => {
    const { name, price, month, provider_id } = req.body;
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    if (!name || !price || !month) {
        return next(new ErrorHandler("Name, price, and month are required", 400));
    }

    // Validate price
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
        return next(new ErrorHandler("Price must be a positive number", 400));
    }

    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
        return next(new ErrorHandler("Month must be in YYYY-MM format", 400));
    }

    try {
        const expense = await prisma.expense.create({
            data: {
                name: name.trim(),
                price: priceValue,
                month,
                user_id: userId,
                provider_id: provider_id || null
            }
        });

        res.status(201).json({
            success: true,
            message: 'Expense added successfully',
            expense
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get expenses for a specific month
export const getExpenses = catchAsyncError(async (req, res, next) => {
    const { month, provider_id } = req.query;

    try {
        let whereClause = {};

        // If month is provided, filter by month
        if (month) {
            const monthRegex = /^\d{4}-\d{2}$/;
            if (!monthRegex.test(month)) {
                return next(new ErrorHandler("Month must be in YYYY-MM format", 400));
            }
            whereClause.month = month;
        }

        // If provider_id is provided, filter by provider
        if (provider_id) {
            whereClause.provider_id = parseInt(provider_id);
        }

        const expenses = await prisma.expense.findMany({
            where: whereClause,
            include: {
                provider: {
                    select: {
                        user_id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.price), 0);

        res.status(200).json({
            success: true,
            expenses,
            total: parseFloat(total.toFixed(2))
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});


// Delete expense
export const deleteExpense = catchAsyncError(async (req, res, next) => {
    const { expenseId } = req.params;
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    if (!expenseId) {
        return next(new ErrorHandler("Expense ID is required", 400));
    }

    try {
        // Check if expense exists and belongs to user
        const expense = await prisma.expense.findFirst({
            where: {
                expense_id: parseInt(expenseId),
                user_id: userId
            }
        });

        if (!expense) {
            return next(new ErrorHandler("Expense not found or access denied", 404));
        }

        // Delete the expense
        await prisma.expense.delete({
            where: {
                expense_id: parseInt(expenseId)
            }
        });

        res.status(200).json({
            success: true,
            message: 'Expense deleted successfully'
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get all months with expenses
export const getExpenseMonths = catchAsyncError(async (req, res, next) => {
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    try {
        const months = await prisma.expense.findMany({
            where: {
                user_id: userId
            },
            select: {
                month: true
            },
            distinct: ['month'],
            orderBy: {
                month: 'desc'
            }
        });

        res.status(200).json({
            success: true,
            months: months.map(m => m.month)
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get providers for a biller (providers who have assigned cases to this biller)
export const getBillerProviders = catchAsyncError(async (req, res, next) => {
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    try {
        const providers = await prisma.caseAssignment.findMany({
            where: {
                biller_id: userId
            },
            include: {
                assignedBy: {
                    select: {
                        user_id: true,
                        name: true,
                        email: true
                    }
                }
            },
            distinct: ['assigned_by'],
            orderBy: {
                assignedBy: {
                    name: 'asc'
                }
            }
        });

        const uniqueProviders = providers.map(p => p.assignedBy).filter((provider, index, self) =>
            index === self.findIndex(p => p.user_id === provider.user_id)
        );

        res.status(200).json({
            success: true,
            providers: uniqueProviders
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
}); 