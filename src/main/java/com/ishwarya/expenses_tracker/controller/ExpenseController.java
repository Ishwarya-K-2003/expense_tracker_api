package com.ishwarya.expenses_tracker.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ishwarya.expenses_tracker.dto.ExpenseRequest;
import com.ishwarya.expenses_tracker.entity.Expense;
import com.ishwarya.expenses_tracker.service.ExpenseService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping
    public ResponseEntity<Expense> createExpense(@Valid @RequestBody ExpenseRequest request, Principal principal) {
        Expense saved = expenseService.createExpense(request, principal.getName());
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @GetMapping
    public List<Expense> getAllExpenses(Principal principal) {
        return expenseService.getAllExpenses(principal.getName());
    }

    @GetMapping("/{id}")
    public Expense getExpenseById(@PathVariable Long id, Principal principal) {
        return expenseService.getExpenseById(id, principal.getName());
    }

    @PutMapping("/{id}")
    public Expense updateExpense(@PathVariable Long id, @Valid @RequestBody ExpenseRequest request, Principal principal) {
        return expenseService.updateExpense(id, request, principal.getName());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteExpense(@PathVariable Long id, Principal principal) {
        expenseService.deleteExpense(id, principal.getName());
        return ResponseEntity.ok("Expense deleted successfully");
    }
}