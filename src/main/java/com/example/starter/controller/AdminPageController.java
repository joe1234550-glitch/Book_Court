package com.example.starter.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AdminPageController {

    @GetMapping("/admin/courts")
    public String courts() {
        return "forward:/admin-courts.html";
    }

    @GetMapping("/admin/bookings")
    public String bookings() {
        return "forward:/admin-bookings.html";
    }

    @GetMapping("/admin/users")
    public String users() {
        return "forward:/admin-users.html";
    }
}
