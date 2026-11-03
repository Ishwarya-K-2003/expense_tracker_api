package com.ishwarya.expenses_tracker.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.ishwarya.expenses_tracker.dto.ExpenseRequest;
import com.ishwarya.expenses_tracker.entity.Expense;
import com.ishwarya.expenses_tracker.entity.User;
import com.ishwarya.expenses_tracker.exception.ResourceNotFoundException;
import com.ishwarya.expenses_tracker.repository.ExpenseRepository;
import com.ishwarya.expenses_tracker.repository.UserRepository;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public ExpenseService(ExpenseRepository expenseRepository, UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private boolean isAdmin(User user) {
        return "ADMIN".equals(user.getRole());
    }

    private Expense getOwnedExpense(Long id, User user) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));

        boolean isOwner = expense.getUser() != null && expense.getUser().getId().equals(user.getId());
        if (!isAdmin(user) && !isOwner) {
            throw new ResourceNotFoundException("Expense not found with id: " + id);
        }
        return expense;
    }

    public Expense createExpense(ExpenseRequest request, String email) {
        User user = getUser(email);
        Expense expense = new Expense();
        expense.setTitle(request.getTitle());
        expense.setAmount(request.getAmount());
        expense.setCategory(request.getCategory());
        expense.setDate(request.getDate());
        expense.setUser(user);
        return expenseRepository.save(expense);
    }

    public List<Expense> getAllExpenses(String email) {
        User user = getUser(email);
        if (isAdmin(user)) {
            return expenseRepository.findAll();
        }
        return expenseRepository.findByUser(user);
    }

    public Expense getExpenseById(Long id, String email) {
        return getOwnedExpense(id, getUser(email));
    }

    public Expense updateExpense(Long id, ExpenseRequest request, String email) {
        Expense expense = getOwnedExpense(id, getUser(email));
        expense.setTitle(request.getTitle());
        expense.setAmount(request.getAmount());
        expense.setCategory(request.getCategory());
        expense.setDate(request.getDate());
        return expenseRepository.save(expense);
    }

    public void deleteExpense(Long id, String email) {
        Expense expense = getOwnedExpense(id, getUser(email));
        expenseRepository.delete(expense);
    }
}