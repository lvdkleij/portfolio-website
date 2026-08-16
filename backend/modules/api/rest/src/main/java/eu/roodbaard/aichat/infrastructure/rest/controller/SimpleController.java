package eu.roodbaard.aichat.infrastructure.rest.controller;

import eu.roodbaard.aichat.domain.service.ChatClientService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class SimpleController {

    private final ChatClientService chatClientService;
    public SimpleController(ChatClientService chatClientService) {
        this.chatClientService = chatClientService;

    }
    @GetMapping("/hello")
    public String chat(@RequestParam("message") String message) {
        return chatClientService.chat(message);
    }
}
