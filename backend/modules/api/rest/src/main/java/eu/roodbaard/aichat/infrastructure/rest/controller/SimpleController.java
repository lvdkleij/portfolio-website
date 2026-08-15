package eu.roodbaard.aichat.infrastructure.rest.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class SimpleController {



    @GetMapping("/hello")
    public String chat(@RequestParam("message") String message) {
        return "Hello";
    }
}
