package com.ishwarya.expenses_tracker.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ishwarya.expenses_tracker.entity.Expense;
import com.ishwarya.expenses_tracker.entity.User;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByUser(User user);
}
